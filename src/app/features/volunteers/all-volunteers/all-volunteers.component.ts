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
import { SewaTrackingModalComponent } from './sewa-tracking-modal/sewa-tracking-modal.component';
import { MoreFiltersModalComponent } from './more-filters-modal/more-filters-modal.component';
import { CreateVolunteerComponent } from './create-volunteer/create-volunteer.component';
import { SidePanelComponent } from '../../../shared/components/side-panel/side-panel.component';
import { DataService } from '../../../data.service';

export interface Volunteer {
  id: number;
  image?: string;
  name: string;
  age?: number;
  relationName: string;
  gender?: string;
  uid?: string;
  badgeNo?: string;
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
  sewaAllocated?: boolean;
  sewaMode?: string;
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
    SewaTrackingModalComponent,
    MoreFiltersModalComponent,
    CreateVolunteerComponent,
    SidePanelComponent
  ],
  selector: 'app-all-volunteers',
  templateUrl: './all-volunteers.component.html',
  styleUrls: ['./all-volunteers.component.scss']
})
export class AllVolunteersComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;
  @ViewChild('createVolunteerComponent') createVolunteerComponent!: CreateVolunteerComponent;

  private dataService = inject(DataService);

  volunteers: Volunteer[] = [];
  allVolunteers: Volunteer[] = [];

  // Loading and error states
  isLoading = true; // Start with true to show loader on initial load
  error: string | null = null;

  // Selection
  selectedVolunteers = new Set<number>();

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
  
  // Create Volunteer Modal
  createVolunteerModalOpen = false;
  
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
    { label: 'All Volunteers', route: '/volunteers' }
  ];

  constructor() {
    this.buildFilterOptions();
  }

  ngOnInit(): void {
    this.loadVolunteers();
  }

  /**
   * Loads volunteers from the API
   */
  loadVolunteers(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>('v1/volunteers').pipe(
      catchError((error) => {
        console.error('Error loading volunteers:', error);
        this.error = error.error?.message || error.message || 'Failed to load volunteers. Please try again.';
        this.isLoading = false;
        return of({ data: [] }); // Return empty array to prevent breaking
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      // Handle different response structures
      const volunteersData = response.data || response.volunteers || response.results || response || [];

      // Map API response to Volunteer interface
      this.allVolunteers = (Array.isArray(volunteersData) ? volunteersData : []).map((item: any) => {
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

        const volunteer: Volunteer & { uuid?: string } = {
          id: item.unique_id || item.id || 0,
          uuid: item.id, // Store UUID for API calls
          image: firstImage,
          name: item.name || '',
          age: item.user_profile?.age || null,
          relationName: relationName || item.user_profile?.relation_name || '',
          gender: item.user_profile?.gender ?
            item.user_profile.gender.charAt(0).toUpperCase() + item.user_profile.gender.slice(1).toLowerCase() : '',
          uid: item.uid || item.user_profile?.uid || '',
          badgeNo: item.badge_no || item.badge_number || '',
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
          sewaAllocated: item.sewa_allocated === true || item.sewa_allocated === 1,
          sewaMode: item.sewa_mode || primarySewa.mode || ''
        };

        return volunteer;
      });

      this.applyFilter();
    });
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
      { id: '4', label: 'Id (DESC)', value: 'id:desc' }
    ];

    // Task branch options will be populated from API data if needed
    this.taskBranchOptions = [];
  }

  get filteredVolunteers(): Volunteer[] {
    return this.volunteers;
  }

  get pagedVolunteers(): Volunteer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.volunteers.slice(start, start + this.pageSize);
  }

  trackById(_: number, v: Volunteer): number {
    return v.id;
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

    // Filter volunteers
    let filtered = this.allVolunteers.filter((v) => {
      // Search in Name, Relation Name, Mobile No., UID, Badge No
      const matchesTerm = !term ||
        v.name.toLowerCase().includes(term) ||
        v.relationName.toLowerCase().includes(term) ||
        v.address.mobileNumber?.includes(term) ||
        (v.uid && v.uid.toLowerCase().includes(term)) ||
        (v.badgeNo && v.badgeNo.toLowerCase().includes(term));

      const matchesGender = !gender || v.gender === gender;

      const taskBranchValue = v.address.taskBranch?.replace('Task branch : ', '') || '';
      const matchesTaskBranch = !taskBranch || taskBranchValue === taskBranch;

      const correspondingBranchValue = v.address.correspondingBranch?.replace('Corresponding branch : ', '') || '';
      const matchesCorrespondingBranch = !correspondingBranch || correspondingBranchValue === correspondingBranch;

      const matchesSewa = !sewa || v.regularSewa?.sewaName?.includes(sewa);

      const matchesSewaInterest = !sewaInterest ||
        (sewaInterest === 'yes' && v.sewaInterest) ||
        (sewaInterest === 'no' && !v.sewaInterest);

      const matchesSewaAllocated = !sewaAllocated ||
        (sewaAllocated === 'yes' && v.sewaAllocated) ||
        (sewaAllocated === 'no' && !v.sewaAllocated);

      const matchesSewaMode = !sewaMode || v.sewaMode === sewaMode;

      return matchesTerm && matchesGender && matchesTaskBranch &&
        matchesCorrespondingBranch && matchesSewa &&
        matchesSewaInterest && matchesSewaAllocated && matchesSewaMode;
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
          default:
            return 0;
        }

        if (aValue < bValue) return orderByValue === 'asc' ? -1 : 1;
        if (aValue > bValue) return orderByValue === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.volunteers = filtered;
    this.totalItems = this.volunteers.length;
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
      this.pagedVolunteers.forEach(v => this.selectedVolunteers.add(v.id));
    } else {
      this.pagedVolunteers.forEach(v => this.selectedVolunteers.delete(v.id));
    }
  }

  toggleSelectVolunteer(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedVolunteers.has(id)) {
      this.selectedVolunteers.delete(id);
    } else {
      this.selectedVolunteers.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedVolunteers.length > 0 &&
      this.pagedVolunteers.every(v => this.selectedVolunteers.has(v.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedVolunteers.filter(v => this.selectedVolunteers.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedVolunteers.length;
  }

  // Action handlers
  getActionOptions(volunteer: Volunteer): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'edit',
        label: 'Edit',
        value: 'edit',
        icon: 'edit'
      },
      {
        id: 'delete',
        label: 'Delete',
        value: 'delete',
        icon: 'delete',
        danger: true
      }
    ];
  }

  onAction(volunteer: Volunteer, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    if (actionId === 'view') {
      this.viewDetails(volunteer);
    } else if (actionId === 'edit') {
      this.editVolunteer(volunteer);
    } else if (actionId === 'delete') {
      this.deleteVolunteer(volunteer);
    }
  }

  viewDetails(volunteer: Volunteer): void {
    console.log('View volunteer:', volunteer);
  }

  editVolunteer(volunteer: Volunteer): void {
    console.log('Edit volunteer:', volunteer);
  }

  deleteVolunteer(volunteer: Volunteer): void {
    if (confirm(`Are you sure you want to delete ${volunteer.name}?`)) {
      // Find the original volunteer data to get UUID if available
      const originalVolunteer = this.allVolunteers.find(v => v.id === volunteer.id);
      const volunteerUuid = (originalVolunteer as any)?.uuid || volunteer.id;

      this.dataService.delete(`v1/volunteers/${volunteerUuid}`).pipe(
        catchError((error) => {
          console.error('Error deleting volunteer:', error);
          alert('Failed to delete volunteer. Please try again.');
          return of(null);
        })
      ).subscribe(() => {
        this.allVolunteers = this.allVolunteers.filter(v => v.id !== volunteer.id);
        this.applyFilter();
      });
    }
  }

  // Toggle Sewa Interest
  toggleSewaInterest(volunteer: Volunteer, event: Event): void {
    event.stopPropagation();
    const newValue = !volunteer.sewaInterest;
    volunteer.sewaInterest = newValue; // Optimistic update

    // Find the original volunteer data to get UUID if available
    const originalVolunteer = this.allVolunteers.find(v => v.id === volunteer.id);
    const volunteerUuid = (originalVolunteer as any)?.uuid || volunteer.id;

    this.dataService.patch(`v1/volunteers/${volunteerUuid}`, { sewa_interest: newValue ? 1 : 0 }).pipe(
      catchError((error) => {
        console.error('Error updating sewa interest:', error);
        volunteer.sewaInterest = !newValue; // Revert on error
        alert('Failed to update sewa interest. Please try again.');
        return of(null);
      })
    ).subscribe();
  }

  // Format address
  formatAddress(address: Volunteer['address']): string {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.pincode) parts.push(address.pincode);
    if (address.cityName) parts.push(address.cityName);
    if (address.correspondingBranch) parts.push(address.correspondingBranch);
    if (address.taskBranch) parts.push(address.taskBranch);
    if (address.mobileNumber) parts.push(address.mobileNumber);
    return parts.join('\n');
  }

  // Export functionality
  exportMenuOpen = false;

  // Sewa Tracking Modal
  sewaTrackingModalOpen = false;
  selectedVolunteerForSewa: Volunteer | null = null;

  getExportOptions(): MenuOption[] {
    return [
      {
        id: 'export',
        label: 'Export selected records',
        value: 'export',
        icon: 'download'
      },
      {
        id: 'print',
        label: 'Print selected records',
        value: 'print',
        icon: 'print'
      }
    ];
  }

  toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  onExportAction(action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    this.exportMenuOpen = false;

    if (actionId === 'export') {
      this.exportSelectedRecords();
    } else if (actionId === 'print') {
      this.printSelectedRecords();
    }
  }

  exportSelectedRecords(): void {
    if (this.selectedVolunteers.size === 0) {
      alert('Please select at least one record to export.');
      return;
    }
    console.log('Export selected records');
  }

  printSelectedRecords(): void {
    if (this.selectedVolunteers.size === 0) {
      alert('Please select at least one record to print.');
      return;
    }
    console.log('Print selected records');
  }

  // Open Sewa Tracking Modal
  openSewaTrackingModal(volunteer: Volunteer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedVolunteerForSewa = volunteer;
    this.sewaTrackingModalOpen = true;
  }

  closeSewaTrackingModal(): void {
    this.sewaTrackingModalOpen = false;
    this.selectedVolunteerForSewa = null;
  }

  getBranchName(): string {
    return this.selectedVolunteerForSewa?.address?.correspondingBranch?.replace('Corresponding branch : ', '') ||
      this.selectedVolunteerForSewa?.address?.taskBranch?.replace('Task branch : ', '') ||
      'NURMAHAL';
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

  // Create Volunteer Modal Methods
  createVolunteerFooterButtons = [
    {
      text: 'Cancel',
      type: 'secondary' as const,
      action: 'cancel'
    },
    {
      text: 'Submit',
      type: 'primary' as const,
      action: 'submit'
    }
  ];

  openCreateVolunteerModal(): void {
    this.createVolunteerModalOpen = true;
  }

  closeCreateVolunteerModal(): void {
    this.createVolunteerModalOpen = false;
  }

  onFooterAction(action: string): void {
    if (action === 'cancel') {
      this.closeCreateVolunteerModal();
    } else if (action === 'submit') {
      // Trigger form submission in create-volunteer component
      if (this.createVolunteerComponent) {
        this.createVolunteerComponent.submitForm();
      }
    }
  }

  onVolunteerCreated(): void {
    this.closeCreateVolunteerModal();
    this.loadVolunteers(); // Reload the volunteers list
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      this.exportMenuOpen = false;
    }
  }
}

