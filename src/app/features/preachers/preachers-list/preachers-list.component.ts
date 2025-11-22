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

export interface Preacher {
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
  selector: 'app-preachers-list',
  templateUrl: './preachers-list.component.html',
  styleUrls: ['./preachers-list.component.scss']
})
export class PreachersListComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  preachers: Preacher[] = [];
  allPreachers: Preacher[] = [];

  // Selection
  selectedPreachers = new Set<number>();

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
    { label: 'Preachers List', route: '/preachers/preachers-list' }
  ];

  constructor() {
    // Sample data based on the screenshot
    this.allPreachers = [
      {
        id: 1,
        image: undefined,
        name: 'Admin',
        fatherName: '',
        address: {
          street: 'nurmehal',
          city: 'City: nurmehal',
          state: 'State: punjab',
          correspondingBranch: 'Corresponding branch: Nurmahal',
          taskBranch: 'Task branch: Nurmahal'
        },
        regularSewa: '',
        gender: '',
        sewaInterest: false
      },
      {
        id: 2,
        image: undefined,
        name: 'Preacher',
        fatherName: '',
        address: {
          street: 'nurmehal',
          city: 'City: nurmehal',
          state: 'State: punjab',
          correspondingBranch: 'Corresponding branch: Nurmahal',
          taskBranch: 'Task branch: Nurmahal'
        },
        regularSewa: '',
        gender: '',
        sewaInterest: false
      }
    ];

    // Generate more sample records
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Kapurthala'];
    const genders = ['Male', 'Female', 'Other'];
    const names = ['Preacher', 'Guru', 'Acharya', 'Swami', 'Maharaj'];
    
    for (let i = 2; i < 20; i++) {
      const branch = branches[i % branches.length];
      this.allPreachers.push({
        id: i + 1,
        image: i % 3 === 0 ? undefined : `https://via.placeholder.com/40?text=${String.fromCharCode(65 + i)}`,
        name: `${names[i % names.length]} ${i + 1}`,
        fatherName: i % 2 === 0 ? `Father ${i}` : '',
        address: {
          street: branch.toLowerCase(),
          city: `City: ${branch.toLowerCase()}`,
          state: `State: punjab`,
          correspondingBranch: `Corresponding branch: ${branch}`,
          taskBranch: `Task branch: ${branch}`
        },
        regularSewa: i % 3 === 0 ? 'Regular Sewa' : '',
        gender: genders[i % genders.length],
        sewaInterest: i % 3 === 0 // Some with interest, some without
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

  get filteredPreachers(): Preacher[] {
    return this.preachers;
  }

  get pagedPreachers(): Preacher[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.preachers.slice(start, start + this.pageSize);
  }

  trackById(_: number, p: Preacher): number {
    return p.id;
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

    // Filter preachers
    let filtered = this.allPreachers.filter((p) => {
      const matchesTerm = !term || 
        p.name.toLowerCase().includes(term) ||
        (p.fatherName && p.fatherName.toLowerCase().includes(term)) ||
        (p.address.city && p.address.city.toLowerCase().includes(term));

      const matchesTaskBranch = !taskBranch || 
        (p.address.taskBranch && p.address.taskBranch.includes(taskBranch));
      const matchesGender = !gender || p.gender === gender;
      const matchesCorrespondingBranch = !correspondingBranch || 
        (p.address.correspondingBranch && p.address.correspondingBranch.includes(correspondingBranch));

      return matchesTerm && matchesTaskBranch && matchesGender && matchesCorrespondingBranch;
    });

    this.preachers = filtered;
    this.totalItems = this.preachers.length;
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
      this.pagedPreachers.forEach(p => this.selectedPreachers.add(p.id));
    } else {
      this.pagedPreachers.forEach(p => this.selectedPreachers.delete(p.id));
    }
  }

  toggleSelectPreacher(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedPreachers.has(id)) {
      this.selectedPreachers.delete(id);
    } else {
      this.selectedPreachers.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedPreachers.length > 0 && 
           this.pagedPreachers.every(p => this.selectedPreachers.has(p.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedPreachers.filter(p => this.selectedPreachers.has(p.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedPreachers.length;
  }

  // Action handlers
  getActionOptions(preacher: Preacher): MenuOption[] {
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

  onAction(preacher: Preacher, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(preacher);
    } else if (actionId === 'edit') {
      this.editPreacher(preacher);
    }
  }

  viewDetails(preacher: Preacher): void {
    console.log('View preacher:', preacher);
  }

  editPreacher(preacher: Preacher): void {
    console.log('Edit preacher:', preacher);
  }

  // Toggle Sewa Interest
  toggleSewaInterest(preacher: Preacher, event: Event): void {
    event.stopPropagation();
    preacher.sewaInterest = !preacher.sewaInterest;
    console.log('Toggled sewa interest for preacher:', preacher.id, preacher.sewaInterest);
  }

  // Format address
  formatAddress(address: Preacher['address']): string {
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

