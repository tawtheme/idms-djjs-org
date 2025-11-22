import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { SewaTrackingModalComponent } from './sewa-tracking-modal/sewa-tracking-modal.component';
import { MoreFiltersModalComponent } from './more-filters-modal/more-filters-modal.component';

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
    MenuDropdownComponent,
    DropdownComponent,
    SewaTrackingModalComponent,
    MoreFiltersModalComponent
  ],
  selector: 'app-all-volunteers',
  templateUrl: './all-volunteers.component.html',
  styleUrls: ['./all-volunteers.component.scss']
})
export class AllVolunteersComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  volunteers: Volunteer[] = [];
  allVolunteers: Volunteer[] = [];

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
    // Sample data - replace with actual API call
    this.allVolunteers = [
      {
        id: 27276,
        image: undefined,
        name: 'Aparna',
        age: 10,
        relationName: 'D/O Sh. Rishi Goyal',
        gender: 'Female',
        uid: 'UID123456',
        badgeNo: 'BADGE001',
        address: {
          street: 'Divya Gram, Vill\\City- Nurmahal, Teh-Nakodar, Distt-Jalandhar,',
          pincode: 'Punjab-144039',
          cityName: 'City : Nurmahal',
          correspondingBranch: 'Corresponding branch : Nurmahal',
          taskBranch: 'Task branch : Nurmahal',
          mobileNumber: 'Mobile Number : 8699095445'
        },
        regularSewa: {
          tracking: 'Vise Sewa Tracking',
          sewaName: 'Jal Sewa Sis(Nurmahal)',
          count: 36
        },
        enterBy: '',
        sewaInterest: true,
        sewaAllocated: true,
        sewaMode: 'regular'
      }
    ];

    // Generate 14 more sample records
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Patiala'];
    const genders = ['Male', 'Female', 'Other'];
    
    for (let i = 1; i < 15; i++) {
      const branch = branches[i % branches.length];
      this.allVolunteers.push({
        id: 27276 + i,
        image: i % 3 === 0 ? undefined : `https://via.placeholder.com/40?text=${String.fromCharCode(65 + i)}`,
        name: `Volunteer ${i + 1}`,
        age: 20 + (i * 2),
        relationName: i % 3 === 0 ? 'D/O Sh. Rishi Goyal' : i % 3 === 1 ? 'S/O Sh. Kumar' : 'W/O Sh. Singh',
        gender: genders[i % genders.length],
        uid: `UID${123456 + i}`,
        badgeNo: `BADGE${String(i).padStart(3, '0')}`,
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
        sewaAllocated: i % 3 !== 0,
        sewaMode: i % 2 === 0 ? 'regular' : 'occasional'
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
      { id: '4', label: 'Id (DESC)', value: 'id:desc' }
    ];

    this.applyFilter();
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
      this.allVolunteers = this.allVolunteers.filter(v => v.id !== volunteer.id);
      this.applyFilter();
    }
  }

  // Toggle Sewa Interest
  toggleSewaInterest(volunteer: Volunteer, event: Event): void {
    event.stopPropagation();
    volunteer.sewaInterest = !volunteer.sewaInterest;
    console.log('Toggled sewa interest for volunteer:', volunteer.id, volunteer.sewaInterest);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      this.exportMenuOpen = false;
    }
  }
}

