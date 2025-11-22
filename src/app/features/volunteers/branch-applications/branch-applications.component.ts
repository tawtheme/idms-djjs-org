import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { MoreFiltersModalComponent } from '../all-volunteers/more-filters-modal/more-filters-modal.component';
import { SewaTrackingModalComponent } from '../all-volunteers/sewa-tracking-modal/sewa-tracking-modal.component';

export interface BranchApplication {
  id: number;
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
    MenuDropdownComponent,
    DropdownComponent,
    MoreFiltersModalComponent,
    SewaTrackingModalComponent
  ],
  selector: 'app-branch-applications',
  templateUrl: './branch-applications.component.html',
  styleUrls: ['./branch-applications.component.scss']
})
export class BranchApplicationsComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  applications: BranchApplication[] = [];
  allApplications: BranchApplication[] = [];

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
    // Sample data - replace with actual API call
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Patiala'];
    const genders = ['Male', 'Female', 'Other'];
    
    for (let i = 0; i < 15; i++) {
      const branch = branches[i % branches.length];
      this.allApplications.push({
        id: 30000 + i,
        image: i % 3 === 0 ? undefined : `https://via.placeholder.com/40?text=${String.fromCharCode(65 + i)}`,
        name: `Applicant ${i + 1}`,
        age: 20 + (i * 2),
        relationName: i % 3 === 0 ? 'D/O Sh. Rishi Goyal' : i % 3 === 1 ? 'S/O Sh. Kumar' : 'W/O Sh. Singh',
        gender: genders[i % genders.length],
        address: {
          street: `Street ${i}, City- Test${i}, Teh-Test, Distt-Test,`,
          pincode: `State-${100000 + i}`,
          cityName: `City : Test${i}`,
          correspondingBranch: `Corresponding branch : ${branch}`,
          taskBranch: `Task branch : ${branch}`,
          mobileNumber: `Mobile Number : ${9000000000 + i}`
        },
        regularSewa: {
          tracking: 'Vise Sewa Tracking',
          sewaName: `Sewa Name ${i}`,
          count: 10 + i
        },
        enterBy: i % 2 === 0 ? 'Admin' : 'Manager',
        sewaInterest: i % 2 === 0,
        applicationDate: new Date(2025, 0, 15 + i).toISOString().split('T')[0],
        status: i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Approved' : 'Rejected'
      });
    }

    // Build filter options
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.taskBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' },
      { id: '4', label: 'Amritsar', value: 'Amritsar' },
      { id: '5', label: 'Patiala', value: 'Patiala' }
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

    this.applyFilter();
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
      application.status = 'Approved';
      console.log('Application approved:', application.id);
    }
  }

  rejectApplication(application: BranchApplication): void {
    if (confirm(`Reject application for ${application.name}?`)) {
      application.status = 'Rejected';
      console.log('Application rejected:', application.id);
    }
  }

  // Toggle Sewa Interest
  toggleSewaInterest(application: BranchApplication, event: Event): void {
    event.stopPropagation();
    application.sewaInterest = !application.sewaInterest;
    console.log('Toggled sewa interest for application:', application.id, application.sewaInterest);
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

