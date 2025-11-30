import { Component, HostListener, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { MoreFiltersModalComponent } from '../all-volunteers/more-filters-modal/more-filters-modal.component';
import { SewaTrackingModalComponent } from '../all-volunteers/sewa-tracking-modal/sewa-tracking-modal.component';
import { DataService } from '../../../data.service';

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
    BreadcrumbComponent,
    PagerComponent,
    EmptyStateComponent,
    LoadingComponent,
    MenuDropdownComponent,
    DropdownComponent,
    MoreFiltersModalComponent,
    SewaTrackingModalComponent
  ],
  selector: 'app-branch-applications',
  templateUrl: './branch-applications.component.html',
  styleUrls: ['./branch-applications.component.scss']
})
export class BranchApplicationsComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  applications: BranchApplication[] = [];
  allApplications: BranchApplication[] = [];

  // Loading and error states
  isLoading = true; // Start with true to show loader on initial load
  error: string | null = null;

  // Selection
  selectedApplications = new Set<number>();

  // Filters
  searchTerm = ''; // Name, Relation Name, Mobile No., UID, Badge No
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  sortOrder: any[] = [];
  sortOrderOptions: DropdownOption[] = [];
  
  // More Filters
  moreFiltersModalOpen = false;
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
      { id: '0', label: 'None', value: '' },
      { id: '1', label: 'Name (ASC)', value: 'name:asc' },
      { id: '2', label: 'Name (DESC)', value: 'name:desc' },
      { id: '3', label: 'Id (ASC)', value: 'id:asc' },
      { id: '4', label: 'Id (DESC)', value: 'id:desc' },
      { id: '5', label: 'Application Date (ASC)', value: 'applicationDate:asc' },
      { id: '6', label: 'Application Date (DESC)', value: 'applicationDate:desc' }
    ];

    // Task branch options will be populated from API data if needed
    this.taskBranchOptions = [];
  }

  /**
   * Loads branch applications from the API
   */
  loadBranchApplications(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>('v1/branchApplication').pipe(
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
          enterBy: item.entered_by || item.created_by || '',
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
    this.selectedGender = [];
    this.selectedTaskBranch = [];
    this.sortOrder = [];
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
    const term = this.searchTerm.trim().toLowerCase();
    const gender = this.selectedGender[0] || '';
    const taskBranch = this.selectedTaskBranch[0] || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0] || '';
    const sewa = this.moreFilters.sewa[0] || '';
    const sewaInterest = this.moreFilters.sewaInterest[0] || '';
    const sewaAllocated = this.moreFilters.sewaAllocated[0] || '';
    const sewaMode = this.moreFilters.sewaMode[0] || '';

    // Filter applications
    let filtered = this.allApplications.filter((a) => {
      // Search in Name, Relation Name, Mobile No., UID, Badge No
      const matchesTerm = !term || 
        a.name.toLowerCase().includes(term) ||
        a.relationName.toLowerCase().includes(term) ||
        a.address.mobileNumber?.includes(term);

      const matchesGender = !gender || a.gender === gender;
      
      const taskBranchValue = a.address.taskBranch?.replace('Task branch : ', '') || '';
      const matchesTaskBranch = !taskBranch || taskBranchValue === taskBranch;

      const correspondingBranchValue = a.address.correspondingBranch?.replace('Corresponding branch : ', '') || '';
      const matchesCorrespondingBranch = !correspondingBranch || correspondingBranchValue === correspondingBranch;

      const matchesSewa = !sewa || a.regularSewa?.sewaName?.includes(sewa);

      const matchesSewaInterest = !sewaInterest || 
        (sewaInterest === 'yes' && a.sewaInterest) ||
        (sewaInterest === 'no' && !a.sewaInterest);

      return matchesTerm && matchesGender && matchesTaskBranch && 
             matchesCorrespondingBranch && matchesSewa && matchesSewaInterest;
    });

    // Apply sorting
    const sortOrderValue = this.sortOrder[0]?.value || '';
    
    if (sortOrderValue) {
      const [sortField, orderDirection] = sortOrderValue.split(':');
      const orderByValue = orderDirection || 'asc';

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
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'approve',
        label: 'Approve',
        value: 'approve',
        icon: 'check_circle'
      },
      {
        id: 'reject',
        label: 'Reject',
        value: 'reject',
        icon: 'cancel',
        danger: true
      }
    ];
  }

  onAction(application: BranchApplication, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(application);
    } else if (actionId === 'approve') {
      this.approveApplication(application);
    } else if (actionId === 'reject') {
      this.rejectApplication(application);
    }
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

  // Toggle Sewa Interest
  toggleSewaInterest(application: BranchApplication, event: Event): void {
    event.stopPropagation();
    const newValue = !application.sewaInterest;
    application.sewaInterest = newValue; // Optimistic update
    
    // Find the original application data to get UUID if available
    const originalApplication = this.allApplications.find(a => a.id === application.id);
    const applicationUuid = originalApplication?.uuid || application.id;
    
    this.dataService.patch(`v1/branchApplication/${applicationUuid}`, { sewa_interest: newValue ? 1 : 0 }).pipe(
      catchError((error) => {
        console.error('Error updating sewa interest:', error);
        application.sewaInterest = !newValue; // Revert on error
        alert('Failed to update sewa interest. Please try again.');
        return of(null);
      })
    ).subscribe();
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

  // More Filters Modal
  openMoreFiltersModal(): void {
    this.moreFiltersModalOpen = true;
  }

  closeMoreFiltersModal(): void {
    this.moreFiltersModalOpen = false;
  }

  onMoreFiltersApply(filters: any): void {
    this.moreFilters = filters;
    this.applyFilter();
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

