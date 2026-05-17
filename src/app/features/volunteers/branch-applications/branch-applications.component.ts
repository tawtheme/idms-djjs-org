import { Component, HostListener, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { SewaTrackingModalComponent } from '../all-volunteers/sewa-tracking-modal/sewa-tracking-modal.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';
import { SidePanelComponent } from '../../../shared/components/side-panel/side-panel.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface BranchApplication {
  id: number;
  uuid?: string; // UUID for API calls
  image?: string;
  name: string;
  age?: number;
  relationName: string;
  gender?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    cityName?: string;
    correspondingBranch?: string;
    taskBranch?: string;
    mobileNumber?: string;
  };
  regularSewa?: {
    tracking?: string;
    sewaName?: string;
    count?: number;
  };
  enterBy?: string;
  sewaInterest: boolean;
  applicationDate?: string;
  status?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PagerComponent,
    EmptyStateComponent,
    MenuDropdownComponent,
    DropdownComponent,
    SewaTrackingModalComponent,
    IconComponent,
    ImagePreviewDirective,
    SidePanelComponent,
    ModalComponent,
    ConfirmationDialogComponent
  ],
  selector: 'app-branch-applications',
  templateUrl: './branch-applications.component.html',
  styleUrls: ['./branch-applications.component.scss']
})
export class BranchApplicationsComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);
  private router = inject(Router);

  applications: BranchApplication[] = [];
  allApplications: BranchApplication[] = [];

  // Loading and error states
  isLoading = true; // Start with true to show loader on initial load
  error: string | null = null;

  // Selection
  selectedApplications = new Set<number>();

  // Filters
  searchTerm = ''; // (legacy) kept for backwards-compat; UI now uses dedicated fields
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  sortOrder: any[] = [];
  sortOrderOptions: DropdownOption[] = [];
  orderByDirection: any[] = [];
  orderByOptions: DropdownOption[] = [
    { id: 'asc', label: 'Ascending', value: 'asc' },
    { id: 'desc', label: 'Descending', value: 'desc' }
  ];

  // Dedicated text-filter fields (previously merged into searchTerm)
  filterFields = {
    badgeNo: '',
    name: '',
    relationName: '',
    mobileNo: '',
    uid: ''
  };

  // Filter panel toggle (legacy)
  filtersExpanded = false;
  // Side-panel toggle (matches All Volunteers UX)
  showAdvancedFilters = false;

  // Inline filter options
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [];
  sewaOptions: DropdownOption[] = [];
  sewaInterestOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaAllocatedOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaModeOptions: DropdownOption[] = [
    { id: '1', label: 'Regular', value: 'regular' },
    { id: '2', label: 'Occasional', value: 'occasional' }
  ];

  moreFilters: any = {
    correspondingBranch: [],
    branchSearchType: [],
    sewa: [],
    sewaInterest: [],
    sewaAllocated: [],
    sewaMode: []
  };

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Manage Volunteers', route: '/volunteers' },
    { label: 'Branch Applications', route: '/volunteers/branch-applications' }
  ];

  constructor() {
    this.buildFilterOptions();
  }

  ngOnInit(): void {
    this.loadBranchApplications();
  }

  /**
   * Builds filter options
   */
  private buildFilterOptions(): void {
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.sortOrderOptions = [
      { id: 'name', label: 'Name', value: 'name' },
      { id: 'id', label: 'Id', value: 'id' },
      { id: 'applicationDate', label: 'Application Date', value: 'applicationDate' }
    ];

    // Task branch options will be populated from API data if needed
    this.taskBranchOptions = [];

    // Options for expandable filters panel
    this.correspondingBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' }
    ];

    this.branchSearchTypeOptions = [
      { id: '1', label: 'Exact Match', value: 'exact' },
      { id: '2', label: 'Contains', value: 'contains' },
      { id: '3', label: 'Starts With', value: 'startsWith' }
    ];

    this.sewaOptions = [
      { id: '1', label: 'Jal Sewa', value: 'Jal Sewa' },
      { id: '2', label: 'Food Distribution', value: 'Food Distribution' },
      { id: '3', label: 'Medical Camp', value: 'Medical Camp' }
    ];
  }

  /**
   * Loads branch applications from the API
   */
  loadBranchApplications(): void {
    this.isLoading = true;
    this.error = null;

    const params: Record<string, string> = {
      sewa_interest: this.moreFilters.sewaInterest?.[0] ?? 'none',
      sewa_assigned: this.moreFilters.sewaAllocated?.[0] ?? 'none',
      sewa_mode: this.moreFilters.sewaMode?.[0] ?? 'none'
    };

    this.dataService.get<any>('v1/branchApplication', { params }).pipe(
      catchError((error) => {
        console.error('Error loading branch applications:', error);
        this.error = error.error?.message || error.message || 'Failed to load branch applications. Please try again.';
        this.isLoading = false; // Set loading to false on error
        return of({ data: [] }); // Return empty array to prevent breaking
      }),
      finalize(() => {
        // Loading state is managed in catchError and subscribe
      })
    ).subscribe((response) => {
      // Handle different response structures
      const applicationsData = response.data || response.applications || response.results || response || [];
      
      // Map API response to BranchApplication interface
      this.allApplications = (Array.isArray(applicationsData) ? applicationsData : []).map((item: any) => {
        // Get first image from user_images array if available
        const firstImage = item.user_images && item.user_images.length > 0 
          ? item.user_images[0].full_path 
          : null;

        // Extract relation name from user_profile
        const relationOf = item.user_profile?.relation_of || {};
        const relationName = Object.values(relationOf)[0] as string || '';

        // Extract address information
        const userAddress = item.user_address || {};
        const addressArray = Array.isArray(userAddress) ? userAddress : [userAddress];
        const primaryAddress = addressArray[0] || {};

        // Extract sewa information
        const regularSewa = item.regular_sewa || {};
        const sewaArray = Array.isArray(regularSewa) ? regularSewa : [regularSewa];
        const primarySewa = sewaArray[0] || {};

        const application: BranchApplication = {
          id: item.unique_id || item.id || 0,
          uuid: item.id, // Store UUID for API calls
          image: firstImage,
          name: item.name || '',
          age: item.user_profile?.age || null,
          relationName: relationName || item.user_profile?.relation_name || '',
          gender: item.user_profile?.gender ? 
            item.user_profile.gender.charAt(0).toUpperCase() + item.user_profile.gender.slice(1).toLowerCase() : '',
          address: {
            street: primaryAddress.address_1 || primaryAddress.street || '',
            city: primaryAddress.city || '',
            state: primaryAddress.state || '',
            pincode: primaryAddress.pincode || primaryAddress.pin_code || '',
            cityName: primaryAddress.city ? `City : ${primaryAddress.city}` : '',
            correspondingBranch: primaryAddress.corresponding_branch ? 
              `Corresponding branch : ${primaryAddress.corresponding_branch}` : '',
            taskBranch: primaryAddress.task_branch ? 
              `Task branch : ${primaryAddress.task_branch}` : '',
            mobileNumber: item.phone ? `Mobile Number : ${item.phone}` : ''
          },
          regularSewa: primarySewa.tracking || primarySewa.sewa_name || primarySewa.count ? {
            tracking: primarySewa.tracking || '',
            sewaName: primarySewa.sewa_name || primarySewa.name || '',
            count: primarySewa.count || primarySewa.sewa_count || null
          } : undefined,
          enterBy: item.user_created_by?.name || item.entered_by || item.created_by_name || '',
          sewaInterest: item.user_profile?.sewa_interest === 1 || item.sewa_interest === true,
          applicationDate: item.application_date || item.created_at || item.date || '',
          status: item.status || item.application_status || 'Pending'
        };
        
        return application;
      });

      // Update task branch options from API data
      this.updateTaskBranchOptions();

      this.applyFilter();
      this.isLoading = false; // Set loading to false after data is processed
    });
  }

  /**
   * Updates task branch options from loaded applications
   */
  private updateTaskBranchOptions(): void {
    const branches = new Set<string>();
    this.allApplications.forEach(app => {
      const taskBranch = app.address.taskBranch?.replace('Task branch : ', '');
      const correspondingBranch = app.address.correspondingBranch?.replace('Corresponding branch : ', '');
      if (taskBranch) branches.add(taskBranch);
      if (correspondingBranch) branches.add(correspondingBranch);
    });

    this.taskBranchOptions = Array.from(branches).sort().map((branch, index) => ({
      id: String(index + 1),
      label: branch,
      value: branch
    }));
  }

  get filteredApplications(): BranchApplication[] {
    return this.applications;
  }

  get pagedApplications(): BranchApplication[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.applications.slice(start, start + this.pageSize);
  }

  trackById(_: number, a: BranchApplication): number {
    return a.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.filterFields = { badgeNo: '', name: '', relationName: '', mobileNo: '', uid: '' };
    this.selectedGender = [];
    this.selectedTaskBranch = [];
    this.sortOrder = [];
    this.orderByDirection = [];
    this.moreFilters = {
      correspondingBranch: [],
      branchSearchType: [],
      sewa: [],
      sewaInterest: [],
      sewaAllocated: [],
      sewaMode: []
    };
    this.applyFilter();
  }

  applyFilter(): void {
    const name = (this.filterFields.name || '').trim().toLowerCase();
    const relationName = (this.filterFields.relationName || '').trim().toLowerCase();
    const mobileNo = (this.filterFields.mobileNo || '').trim();
    const uid = (this.filterFields.uid || '').trim().toLowerCase();
    const badgeNo = (this.filterFields.badgeNo || '').trim().toLowerCase();

    const gender = this.selectedGender[0] || '';
    const taskBranch = this.selectedTaskBranch[0] || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0] || '';
    const sewa = this.moreFilters.sewa[0] || '';
    const sewaInterest = this.moreFilters.sewaInterest[0] || '';

    // Filter applications
    let filtered = this.allApplications.filter((a) => {
      const matchesName = !name || a.name.toLowerCase().includes(name);
      const matchesRelation = !relationName || a.relationName.toLowerCase().includes(relationName);
      const matchesMobile = !mobileNo || (a.address.mobileNumber || '').includes(mobileNo);
      const matchesUid = !uid || String(a.id).toLowerCase().includes(uid);
      const matchesBadge = !badgeNo || String(a.id).toLowerCase().includes(badgeNo);

      const matchesGender = !gender || a.gender === gender;

      const taskBranchValue = a.address.taskBranch?.replace('Task branch : ', '') || '';
      const matchesTaskBranch = !taskBranch || taskBranchValue === taskBranch;

      const correspondingBranchValue = a.address.correspondingBranch?.replace('Corresponding branch : ', '') || '';
      const matchesCorrespondingBranch = !correspondingBranch || correspondingBranchValue === correspondingBranch;

      const matchesSewa = !sewa || a.regularSewa?.sewaName?.includes(sewa);

      const matchesSewaInterest = !sewaInterest ||
        (sewaInterest === 'yes' && a.sewaInterest) ||
        (sewaInterest === 'no' && !a.sewaInterest);

      return matchesName && matchesRelation && matchesMobile && matchesUid && matchesBadge &&
             matchesGender && matchesTaskBranch && matchesCorrespondingBranch &&
             matchesSewa && matchesSewaInterest;
    });

    // Apply sorting
    const sortField = this.sortOrder[0] || '';
    const orderByValue = this.orderByDirection[0] || 'asc';

    if (sortField) {

      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'applicationDate':
            aValue = a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
            bValue = b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return orderByValue === 'asc' ? -1 : 1;
        if (aValue > bValue) return orderByValue === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.applications = filtered;
    this.totalItems = this.applications.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  // Selection handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedApplications.forEach(a => this.selectedApplications.add(a.id));
    } else {
      this.pagedApplications.forEach(a => this.selectedApplications.delete(a.id));
    }
  }

  toggleSelectApplication(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedApplications.has(id)) {
      this.selectedApplications.delete(id);
    } else {
      this.selectedApplications.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedApplications.length > 0 && 
           this.pagedApplications.every(a => this.selectedApplications.has(a.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedApplications.filter(a => this.selectedApplications.has(a.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedApplications.length;
  }

  // Action handlers
  getActionOptions(application: BranchApplication): MenuOption[] {
    const isApproved = String(application.status || '').toLowerCase() === 'approved';
    const options: MenuOption[] = [
      {
        id: 'application_approval',
        label: isApproved ? 'Revoke Approval' : 'Application Approval',
        value: 'application_approval',
        icon: 'check_circle',
        success: true
      },
      { id: 'view', label: 'View', value: 'view', icon: 'visibility' },
      { id: 'edit', label: 'Edit', value: 'edit', icon: 'edit' },
      { id: 'convert_desiring', label: 'Convert to Desiring Devotee', value: 'convert_desiring', icon: 'swap_horiz' },
      { id: 'change_role', label: 'Change Role', value: 'change_role', icon: 'trending_up' },
      { id: 'change_branch', label: 'Change Branch', value: 'change_branch', icon: 'trending_up' },
      { id: 'generate_password', label: 'Generate Password', value: 'generate_password', icon: 'bolt' }
    ];
    if (!application.sewaInterest) {
      options.push({ id: 'reinstate', label: 'Reinstate User', value: 'reinstate', icon: 'refresh' });
    }
    return options;
  }

  onAction(application: BranchApplication, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    switch (actionId) {
      case 'application_approval': this.applicationApproval(application); break;
      case 'view': this.viewDetails(application); break;
      case 'edit': this.editApplication(application); break;
      case 'convert_desiring': this.convertToDesiringDevotee(application); break;
      case 'change_role': this.changeRole(application); break;
      case 'change_branch': this.changeBranch(application); break;
      case 'generate_password': this.generatePassword(application); break;
      case 'reinstate': this.reinstateUser(application); break;
    }
  }

  // Application Approval confirmation dialog state
  approvalConfirmOpen = false;
  approvalConfirmTarget: BranchApplication | null = null;
  isSubmittingApproval = false;

  applicationApproval(application: BranchApplication): void {
    this.approvalConfirmTarget = application;
    this.approvalConfirmOpen = true;
  }

  get approvalConfirmTitle(): string {
    const isApproved = String(this.approvalConfirmTarget?.status || '').toLowerCase() === 'approved';
    return isApproved ? 'Revoke Approval' : 'Application Approval';
  }

  get approvalConfirmMessage(): string {
    const target = this.approvalConfirmTarget;
    if (!target) return '';
    const isApproved = String(target.status || '').toLowerCase() === 'approved';
    const verb = isApproved ? 'revoke approval for' : 'approve';
    return `Are you sure you want to ${verb} ${target.name}?`;
  }

  onApprovalConfirm(): void {
    const application = this.approvalConfirmTarget;
    if (!application) return;
    const isApproved = String(application.status || '').toLowerCase() === 'approved';
    const needsApproval: '1' | '0' = isApproved ? '0' : '1';

    const originalApplication = this.allApplications.find(a => a.id === application.id);
    const userId = String(originalApplication?.uuid || application.uuid || application.id);

    this.isSubmittingApproval = true;
    this.dataService.put('v1/users/approve_branch_application', {
      needs_approval: needsApproval,
      user_id: userId
    }).pipe(
      catchError((error) => {
        console.error('Error updating approval:', error);
        alert('Failed to update application approval. Please try again.');
        return of(null);
      })
    ).subscribe((response) => {
      this.isSubmittingApproval = false;
      this.approvalConfirmOpen = false;
      this.approvalConfirmTarget = null;
      if (response === null) return;
      application.status = isApproved ? 'Pending' : 'Approved';
      this.loadBranchApplications();
    });
  }

  onApprovalCancel(): void {
    this.approvalConfirmOpen = false;
    this.approvalConfirmTarget = null;
  }

  editApplication(application: BranchApplication): void {
    const uuid = (application as any).uuid || application.id;
    this.router.navigate(['/volunteers', uuid, 'edit'], {
      queryParams: { from: 'branch-application' }
    });
  }

  convertToDesiringDevotee(application: BranchApplication): void {
    console.log('Convert to Desiring Devotee:', application);
  }

  changeRole(application: BranchApplication): void {
    console.log('Change Role:', application);
  }

  changeBranch(application: BranchApplication): void {
    console.log('Change Branch:', application);
  }

  generatePassword(application: BranchApplication): void {
    console.log('Generate Password:', application);
  }

  reinstateUser(application: BranchApplication): void {
    console.log('Reinstate User:', application);
  }

  viewDetails(application: BranchApplication): void {
    console.log('View application:', application);
  }

  approveApplication(application: BranchApplication): void {
    if (confirm(`Approve application for ${application.name}?`)) {
      const originalApplication = this.allApplications.find(a => a.id === application.id);
      const applicationUuid = originalApplication?.uuid || application.id;
      
      this.dataService.patch(`v1/branchApplication/${applicationUuid}`, { status: 'Approved' }).pipe(
        catchError((error) => {
          console.error('Error approving application:', error);
          alert('Failed to approve application. Please try again.');
          return of(null);
        })
      ).subscribe((response) => {
        if (response) {
          application.status = 'Approved';
          // Reload applications to get updated data
          this.loadBranchApplications();
        }
      });
    }
  }

  rejectApplication(application: BranchApplication): void {
    if (confirm(`Reject application for ${application.name}?`)) {
      const originalApplication = this.allApplications.find(a => a.id === application.id);
      const applicationUuid = originalApplication?.uuid || application.id;
      
      this.dataService.patch(`v1/branchApplication/${applicationUuid}`, { status: 'Rejected' }).pipe(
        catchError((error) => {
          console.error('Error rejecting application:', error);
          alert('Failed to reject application. Please try again.');
          return of(null);
        })
      ).subscribe((response) => {
        if (response) {
          application.status = 'Rejected';
          // Reload applications to get updated data
          this.loadBranchApplications();
        }
      });
    }
  }

  // ── Sewa Interest toggle + reason modal ──
  // Sewa Interest reason modal state
  sewaReasonModalOpen = false;
  sewaReasonApplication: BranchApplication | null = null;
  sewaReasonForm = { reason: '', remarks: '' };
  isSubmittingSewaReason = false;
  selectedSewaReason: any[] = [];
  sewaReasonOptions: DropdownOption[] = [
    { id: 'change_sewa', label: 'Change Sewa', value: 'Change Sewa' },
    { id: 'dead', label: 'Dead', value: 'Dead' },
    { id: 'left', label: 'Left', value: 'Left' },
    { id: 'migrated', label: 'Migrated', value: 'Migrated' },
    { id: 'married', label: 'Married', value: 'Married' },
    { id: 'not_regular', label: 'Not Regular', value: 'Not Regular' },
    { id: 'other', label: 'Other', value: 'Other' }
  ];

  toggleSewaInterest(application: BranchApplication, event: Event): void {
    event.stopPropagation();
    // Turning OFF requires a reason — open modal instead of committing.
    if (application.sewaInterest) {
      this.openSewaReasonModal(application);
      return;
    }
    this.commitSewaInterest(application, 1);
  }

  private openSewaReasonModal(application: BranchApplication): void {
    this.sewaReasonApplication = application;
    this.sewaReasonForm = { reason: '', remarks: '' };
    this.selectedSewaReason = [];
    this.sewaReasonModalOpen = true;
  }

  closeSewaReasonModal(): void {
    this.sewaReasonModalOpen = false;
    this.sewaReasonApplication = null;
  }

  onSewaReasonChange(event: string[]): void {
    this.selectedSewaReason = event;
    this.sewaReasonForm.reason = event?.[0] || '';
  }

  submitSewaReason(): void {
    if (!this.sewaReasonApplication) return;
    const application = this.sewaReasonApplication;
    this.isSubmittingSewaReason = true;
    this.commitSewaInterest(application, 0, this.sewaReasonForm.reason, this.sewaReasonForm.remarks, () => {
      this.isSubmittingSewaReason = false;
      this.closeSewaReasonModal();
    });
  }

  private commitSewaInterest(
    application: BranchApplication,
    value: 0 | 1,
    reason: string = '',
    remarks: string = '',
    done?: () => void
  ): void {
    const previous = application.sewaInterest;
    application.sewaInterest = value === 1;

    const originalApplication = this.allApplications.find(a => a.id === application.id);
    const userId = String(originalApplication?.uuid || application.id);

    const payload = {
      user_id: userId,
      sewa_interest: value,
      reason: reason || '',
      remarks: remarks || ''
    };

    this.dataService.put('v1/users/update-sewa-interest', payload).pipe(
      catchError((error) => {
        console.error('Error updating sewa interest:', error);
        application.sewaInterest = previous;
        alert('Failed to update sewa interest. Please try again.');
        return of(null);
      })
    ).subscribe(() => {
      if (done) done();
    });
  }

  // Format address
  formatAddress(address: BranchApplication['address']): string {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.pincode) parts.push(address.pincode);
    if (address.cityName) parts.push(address.cityName);
    if (address.correspondingBranch) parts.push(address.correspondingBranch);
    if (address.taskBranch) parts.push(address.taskBranch);
    if (address.mobileNumber) parts.push(address.mobileNumber);
    return parts.join('\n');
  }

  // Filter panel toggle
  toggleFiltersPanel(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  /** Chips for filters that live in the side panel only — primary-row inputs
   *  are visible directly above, so duplicating them as chips is noise. */
  activeFilterChips(): Array<{ key: string; label: string; value: string }> {
    const chips: Array<{ key: string; label: string; value: string }> = [];
    const labelOf = (opts: DropdownOption[], value: any): string => {
      const v = String(value);
      return opts.find(o => String(o.value) === v)?.label || v;
    };

    if (this.selectedGender.length > 0) {
      chips.push({ key: 'gender', label: 'Gender', value: labelOf(this.genderOptions, this.selectedGender[0]) });
    }
    if (this.filterFields.relationName) {
      chips.push({ key: 'relationName', label: 'Relation Name', value: this.filterFields.relationName });
    }
    if (this.filterFields.mobileNo) {
      chips.push({ key: 'mobileNo', label: 'Mobile No.', value: this.filterFields.mobileNo });
    }
    if (this.filterFields.uid) {
      chips.push({ key: 'uid', label: 'UID', value: this.filterFields.uid });
    }
    if (this.moreFilters.sewaInterest?.length > 0) {
      chips.push({ key: 'sewaInterest', label: 'Sewa Interest', value: labelOf(this.sewaInterestOptions, this.moreFilters.sewaInterest[0]) });
    }
    if (this.moreFilters.sewaAllocated?.length > 0) {
      chips.push({ key: 'sewaAllocated', label: 'Sewa Allocated', value: labelOf(this.sewaAllocatedOptions, this.moreFilters.sewaAllocated[0]) });
    }
    if (this.moreFilters.sewaMode?.length > 0) {
      chips.push({ key: 'sewaMode', label: 'Sewa Mode', value: labelOf(this.sewaModeOptions, this.moreFilters.sewaMode[0]) });
    }
    if (this.sortOrder.length > 0 && this.sortOrder[0]) {
      chips.push({ key: 'sortBy', label: 'Sort By', value: labelOf(this.sortOrderOptions, this.sortOrder[0]) });
    }
    if (this.orderByDirection.length > 0) {
      chips.push({ key: 'orderBy', label: 'Order By', value: labelOf(this.orderByOptions, this.orderByDirection[0]) });
    }
    return chips;
  }

  trackChipByKey(_: number, chip: { key: string }): string {
    return chip.key;
  }

  removeFilterChip(key: string): void {
    switch (key) {
      case 'gender': this.selectedGender = []; break;
      case 'relationName': this.filterFields.relationName = ''; break;
      case 'mobileNo': this.filterFields.mobileNo = ''; break;
      case 'uid': this.filterFields.uid = ''; break;
      case 'sewaInterest': this.moreFilters.sewaInterest = []; break;
      case 'sewaAllocated': this.moreFilters.sewaAllocated = []; break;
      case 'sewaMode': this.moreFilters.sewaMode = []; break;
      case 'sortBy': this.sortOrder = []; break;
      case 'orderBy': this.orderByDirection = []; break;
    }
    this.applyFilter();
  }

  advancedFilterCount(): number {
    return this.activeFilterChips().length;
  }

  reloadPage(): void {
    window.location.reload();
  }

  totalActiveFiltersCount(): number {
    let count = 0;
    if (this.filterFields.badgeNo) count++;
    if (this.filterFields.name) count++;
    if (this.filterFields.relationName) count++;
    if (this.filterFields.mobileNo) count++;
    if (this.filterFields.uid) count++;
    if (this.selectedGender.length > 0) count++;
    if (this.selectedTaskBranch.length > 0) count++;
    if (this.sortOrder.length > 0 && this.sortOrder[0]) count++;
    if (this.orderByDirection.length > 0) count++;
    count += this.activeMoreFiltersCount();
    return count;
  }

  hasActiveMoreFilters(): boolean {
    return this.activeMoreFiltersCount() > 0;
  }

  activeMoreFiltersCount(): number {
    return Object.values(this.moreFilters).filter((v: any) => Array.isArray(v) && v.length > 0).length;
  }

  hasAnyActiveFilter(): boolean {
    const anyTextField = !!(this.filterFields.badgeNo || this.filterFields.name ||
      this.filterFields.relationName || this.filterFields.mobileNo || this.filterFields.uid);
    return !!this.searchTerm || anyTextField ||
      this.selectedGender.length > 0 ||
      this.selectedTaskBranch.length > 0 ||
      this.orderByDirection.length > 0 ||
      (this.sortOrder.length > 0 && !!this.sortOrder[0]) ||
      this.hasActiveMoreFilters();
  }

  // Sewa Tracking Modal
  sewaTrackingModalOpen = false;
  selectedApplicationForSewa: BranchApplication | null = null;

  openSewaTrackingModal(application: BranchApplication, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedApplicationForSewa = application;
    this.sewaTrackingModalOpen = true;
  }

  closeSewaTrackingModal(): void {
    this.sewaTrackingModalOpen = false;
    this.selectedApplicationForSewa = null;
  }

  getBranchName(): string {
    return this.selectedApplicationForSewa?.address?.correspondingBranch?.replace('Corresponding branch : ', '') || 
           this.selectedApplicationForSewa?.address?.taskBranch?.replace('Task branch : ', '') || 
           'NURMAHAL';
  }
}

