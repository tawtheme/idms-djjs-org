import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { MoreFiltersModalComponent } from '../../volunteers/all-volunteers/more-filters-modal/more-filters-modal.component';

export interface DesiringDevotee {
  id: number;
  image?: string;
  name: string;
  fatherName?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    correspondingBranch?: string;
    taskBranch?: string;
  };
  regularSewa?: string;
  gender?: string;
  sewaInterest: boolean;
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
    MoreFiltersModalComponent
  ],
  selector: 'app-desiring-devotees-list',
  templateUrl: './desiring-devotees-list.component.html',
  styleUrls: ['./desiring-devotees-list.component.scss']
})
export class DesiringDevoteesListComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  devotees: DesiringDevotee[] = [];
  allDevotees: DesiringDevotee[] = [];

  // Selection
  selectedDevotees = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  
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
    { label: 'Preachers', route: '/preachers' },
    { label: 'Desiring Devotees List', route: '/preachers/desiring-devotees' }
  ];

  constructor() {
    // Sample data based on the screenshot
    this.allDevotees = [
      {
        id: 1,
        image: undefined,
        name: 'Resident',
        fatherName: '',
        address: {
          correspondingBranch: 'Corresponding branch: Nurmahal',
          taskBranch: 'Task branch: Nurmahal'
        },
        regularSewa: '',
        gender: '',
        sewaInterest: true
      }
    ];

    // Generate more sample records
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Kapurthala'];
    const genders = ['Male', 'Female', 'Other'];
    const names = ['Devotee', 'Sevak', 'Bhakt', 'Sadhak', 'Yogi'];
    
    for (let i = 1; i < 20; i++) {
      const branch = branches[i % branches.length];
      this.allDevotees.push({
        id: i + 1,
        image: i % 3 === 0 ? undefined : `https://via.placeholder.com/40?text=${String.fromCharCode(65 + i)}`,
        name: `${names[i % names.length]} ${i + 1}`,
        fatherName: i % 2 === 0 ? `Father ${i}` : '',
        address: {
          street: `Street ${i}`,
          city: `City: ${branch.toLowerCase()}`,
          state: `State: punjab`,
          correspondingBranch: `Corresponding branch: ${branch}`,
          taskBranch: `Task branch: ${branch}`
        },
        regularSewa: i % 3 === 0 ? 'Regular Sewa' : '',
        gender: genders[i % genders.length],
        sewaInterest: i % 2 === 0
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
      { id: '5', label: 'Kapurthala', value: 'Kapurthala' }
    ];

    this.applyFilter();
  }

  get filteredDevotees(): DesiringDevotee[] {
    return this.devotees;
  }

  get pagedDevotees(): DesiringDevotee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.devotees.slice(start, start + this.pageSize);
  }

  trackById(_: number, d: DesiringDevotee): number {
    return d.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedTaskBranch = [];
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
    const taskBranch = this.selectedTaskBranch[0] || '';
    const gender = this.selectedGender[0] || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0] || '';

    // Filter devotees
    let filtered = this.allDevotees.filter((d) => {
      const matchesTerm = !term || 
        d.name.toLowerCase().includes(term) ||
        (d.fatherName && d.fatherName.toLowerCase().includes(term)) ||
        (d.address.city && d.address.city.toLowerCase().includes(term));

      const matchesTaskBranch = !taskBranch || 
        (d.address.taskBranch && d.address.taskBranch.includes(taskBranch));
      const matchesGender = !gender || d.gender === gender;
      const matchesCorrespondingBranch = !correspondingBranch || 
        (d.address.correspondingBranch && d.address.correspondingBranch.includes(correspondingBranch));

      return matchesTerm && matchesTaskBranch && matchesGender && matchesCorrespondingBranch;
    });

    this.devotees = filtered;
    this.totalItems = this.devotees.length;
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
      this.pagedDevotees.forEach(d => this.selectedDevotees.add(d.id));
    } else {
      this.pagedDevotees.forEach(d => this.selectedDevotees.delete(d.id));
    }
  }

  toggleSelectDevotee(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedDevotees.has(id)) {
      this.selectedDevotees.delete(id);
    } else {
      this.selectedDevotees.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedDevotees.length > 0 && 
           this.pagedDevotees.every(d => this.selectedDevotees.has(d.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedDevotees.filter(d => this.selectedDevotees.has(d.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedDevotees.length;
  }

  // Action handlers
  getActionOptions(devotee: DesiringDevotee): MenuOption[] {
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
      }
    ];
  }

  onAction(devotee: DesiringDevotee, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(devotee);
    } else if (actionId === 'edit') {
      this.editDevotee(devotee);
    }
  }

  viewDetails(devotee: DesiringDevotee): void {
    console.log('View devotee:', devotee);
  }

  editDevotee(devotee: DesiringDevotee): void {
    console.log('Edit devotee:', devotee);
  }

  // Toggle Sewa Interest
  toggleSewaInterest(devotee: DesiringDevotee, event: Event): void {
    event.stopPropagation();
    devotee.sewaInterest = !devotee.sewaInterest;
    console.log('Toggled sewa interest for devotee:', devotee.id, devotee.sewaInterest);
  }

  // Format address
  formatAddress(address: DesiringDevotee['address']): string {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.correspondingBranch) parts.push(address.correspondingBranch);
    if (address.taskBranch) parts.push(address.taskBranch);
    return parts.join(', ') || '-';
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
      // Handle any click outside logic if needed
    }
  }
}
