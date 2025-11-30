import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

export interface UnallocatedVolunteer {
  id: number;
  name: string;
  image?: string;
  phone?: string;
}

export interface AllocatedVolunteer {
  id: number;
  badgeNo?: string;
  name: string;
  image?: string;
  head?: string;
  subHead?: string;
  isRegular: boolean;
  sewa?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    PagerComponent,
    MenuDropdownComponent,
    LoadingComponent,
    EmptyStateComponent
  ],
  selector: 'app-sewa-volunteers',
  templateUrl: './sewa-volunteers.component.html',
  styleUrls: ['./sewa-volunteers.component.scss']
})
export class SewaVolunteersComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  // Filters
  selectedProgram: string[] = ['None'];
  selectedSewa: string[] = [];
  selectedGender: string[] = ['None'];
  selectedSewaAssignment: string[] = ['Unassigned Volunteers'];

  // Filter options
  programOptions: DropdownOption[] = [
    { id: '0', label: 'None', value: 'None' }
    // TODO: Load actual program options from API
  ];

  sewaOptions: DropdownOption[] = [
    // TODO: Load actual sewa options from API
  ];

  genderOptions: DropdownOption[] = [
    { id: '0', label: 'None', value: 'None' },
    { id: '1', label: 'Male', value: 'Male' },
    { id: '2', label: 'Female', value: 'Female' },
    { id: '3', label: 'Other', value: 'Other' }
  ];

  sewaAssignmentOptions: DropdownOption[] = [
    { id: '1', label: 'Unassigned Volunteers', value: 'Unassigned Volunteers' },
    { id: '2', label: 'Assigned Volunteers', value: 'Assigned Volunteers' }
  ];

  // Unallocated Volunteers
  unallocatedVolunteers: UnallocatedVolunteer[] = [];
  allUnallocatedVolunteers: UnallocatedVolunteer[] = [];
  selectedUnallocated = new Set<number>();
  unallocatedSearchTerm = '';
  unallocatedPageSize = 10;
  unallocatedCurrentPage = 1;
  unallocatedTotalItems = 0;
  unallocatedSortField = 'id';
  unallocatedSortDirection: 'asc' | 'desc' = 'asc';
  isLoadingUnallocated = true;
  errorUnallocated: string | null = null;

  // Allocated Volunteers
  allocatedVolunteers: AllocatedVolunteer[] = [];
  allAllocatedVolunteers: AllocatedVolunteer[] = [];
  selectedAllocated = new Set<number>();
  allocatedSearchTerm = '';
  allocatedPageSize = 20;
  allocatedCurrentPage = 1;
  allocatedTotalItems = 0;
  allocatedSortField = '';
  allocatedSortDirection: 'asc' | 'desc' = 'asc';
  isLoadingAllocated = true;
  errorAllocated: string | null = null;

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSizeDropdownOptions: DropdownOption[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs' },
    { label: 'Sewa Volunteers', route: '/programs/sewa-volunteers' }
  ];

  Math = Math;

  constructor() {
    // Initialize empty arrays - data will be loaded from API
    this.allUnallocatedVolunteers = [];
    this.allAllocatedVolunteers = [];

    // Initialize page size dropdown options
    this.pageSizeDropdownOptions = this.pageSizeOptions.map(s => ({
      id: String(s),
      label: `${s} entries`,
      value: s
    }));

    this.applyUnallocatedFilter();
    this.applyAllocatedFilter();
  }

  // Filter change handlers
  onProgramChange(): void {
    this.applyFilters();
  }

  onSewaChange(): void {
    this.applyFilters();
  }

  onGenderChange(): void {
    this.applyFilters();
  }

  onSewaAssignmentChange(): void {
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    this.applyUnallocatedFilter();
    this.applyAllocatedFilter();
  }

  // Unallocated Volunteers Methods
  applyUnallocatedFilter() {
    let filtered = [...this.allUnallocatedVolunteers];

    // Apply search filter
    if (this.unallocatedSearchTerm.trim()) {
      const search = this.unallocatedSearchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.phone?.toLowerCase().includes(search) ||
        v.id.toString().includes(search)
      );
    }

    // Apply program filter
    if (this.selectedProgram.length > 0 && !this.selectedProgram.includes('None')) {
      // TODO: Filter by program when program data is available
    }

    // Apply sewa filter
    if (this.selectedSewa.length > 0) {
      // TODO: Filter by sewa when sewa data is available
    }

    // Apply gender filter
    if (this.selectedGender.length > 0 && !this.selectedGender.includes('None')) {
      // TODO: Filter by gender when gender data is available in unallocated volunteers
    }

    // Apply sewa assignment filter
    if (this.selectedSewaAssignment.length > 0) {
      if (this.selectedSewaAssignment.includes('Unassigned Volunteers')) {
        // Show only unassigned volunteers (already filtered)
      } else if (this.selectedSewaAssignment.includes('Assigned Volunteers')) {
        // Show only assigned volunteers - move to allocated section
        filtered = [];
      }
    }

    if (this.unallocatedSortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.unallocatedSortField];
        const bVal = (b as any)[this.unallocatedSortField];
        if (aVal < bVal) return this.unallocatedSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.unallocatedSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.unallocatedVolunteers = filtered;
    this.unallocatedTotalItems = filtered.length;
    this.unallocatedCurrentPage = 1;
  }

  sortUnallocated(field: string) {
    if (this.unallocatedSortField === field) {
      this.unallocatedSortDirection = this.unallocatedSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.unallocatedSortField = field;
      this.unallocatedSortDirection = 'asc';
    }
    this.applyUnallocatedFilter();
  }

  getUnallocatedSortIcon(field: string): string {
    if (this.unallocatedSortField !== field) return 'unfold_more';
    return this.unallocatedSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  get pagedUnallocated(): UnallocatedVolunteer[] {
    const start = (this.unallocatedCurrentPage - 1) * this.unallocatedPageSize;
    const end = start + this.unallocatedPageSize;
    return this.unallocatedVolunteers.slice(start, end);
  }

  toggleSelectUnallocated(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedUnallocated.has(id)) {
      this.selectedUnallocated.delete(id);
    } else {
      this.selectedUnallocated.add(id);
    }
  }

  toggleSelectAllUnallocated(event: Event) {
    event.stopPropagation();
    if (this.isAllUnallocatedSelected()) {
      this.selectedUnallocated.clear();
    } else {
      this.pagedUnallocated.forEach(v => this.selectedUnallocated.add(v.id));
    }
  }

  isAllUnallocatedSelected(): boolean {
    return this.pagedUnallocated.length > 0 &&
           this.pagedUnallocated.every(v => this.selectedUnallocated.has(v.id));
  }

  isUnallocatedIndeterminate(): boolean {
    const selectedCount = this.pagedUnallocated.filter(v => this.selectedUnallocated.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedUnallocated.length;
  }

  onUnallocatedPageChange(page: number) {
    this.unallocatedCurrentPage = page;
  }

  onUnallocatedPageSizeChange(size: number) {
    this.unallocatedPageSize = size;
    this.unallocatedCurrentPage = 1;
  }

  getUnallocatedPageSizeSelected(): DropdownOption[] {
    return [this.pageSizeDropdownOptions.find(o => o.value === this.unallocatedPageSize)!];
  }

  allocateVolunteers() {
    const selected = Array.from(this.selectedUnallocated);
    console.log('Allocating volunteers:', selected);
    // Implement allocation logic
  }

  // Allocated Volunteers Methods
  applyAllocatedFilter() {
    let filtered = [...this.allAllocatedVolunteers];

    // Apply search filter
    if (this.allocatedSearchTerm.trim()) {
      const search = this.allocatedSearchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.badgeNo?.toLowerCase().includes(search) ||
        v.head?.toLowerCase().includes(search) ||
        v.subHead?.toLowerCase().includes(search) ||
        v.sewa?.toLowerCase().includes(search) ||
        v.id.toString().includes(search)
      );
    }

    // Apply program filter
    if (this.selectedProgram.length > 0 && !this.selectedProgram.includes('None')) {
      // TODO: Filter by program when program data is available
    }

    // Apply sewa filter
    if (this.selectedSewa.length > 0) {
      filtered = filtered.filter(v => 
        v.sewa && this.selectedSewa.some(sewa => 
          v.sewa?.toLowerCase().includes(sewa.toLowerCase())
        )
      );
    }

    // Apply gender filter
    if (this.selectedGender.length > 0 && !this.selectedGender.includes('None')) {
      // TODO: Filter by gender when gender data is available in allocated volunteers
    }

    // Apply sewa assignment filter
    if (this.selectedSewaAssignment.length > 0) {
      if (this.selectedSewaAssignment.includes('Assigned Volunteers')) {
        // Show only assigned volunteers (already filtered)
      } else if (this.selectedSewaAssignment.includes('Unassigned Volunteers')) {
        // Show only unassigned volunteers - move to unallocated section
        filtered = [];
      }
    }

    this.allocatedVolunteers = filtered;
    this.allocatedTotalItems = filtered.length;
    this.allocatedCurrentPage = 1;
  }

  get pagedAllocated(): AllocatedVolunteer[] {
    const start = (this.allocatedCurrentPage - 1) * this.allocatedPageSize;
    const end = start + this.allocatedPageSize;
    return this.allocatedVolunteers.slice(start, end);
  }

  toggleSelectAllocated(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedAllocated.has(id)) {
      this.selectedAllocated.delete(id);
    } else {
      this.selectedAllocated.add(id);
    }
  }

  toggleSelectAllAllocated(event: Event) {
    event.stopPropagation();
    if (this.isAllAllocatedSelected()) {
      this.selectedAllocated.clear();
    } else {
      this.pagedAllocated.forEach(v => this.selectedAllocated.add(v.id));
    }
  }

  isAllAllocatedSelected(): boolean {
    return this.pagedAllocated.length > 0 &&
           this.pagedAllocated.every(v => this.selectedAllocated.has(v.id));
  }

  isAllocatedIndeterminate(): boolean {
    const selectedCount = this.pagedAllocated.filter(v => this.selectedAllocated.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedAllocated.length;
  }

  onAllocatedPageChange(page: number) {
    this.allocatedCurrentPage = page;
  }

  onAllocatedPageSizeChange(size: number) {
    this.allocatedPageSize = size;
    this.allocatedCurrentPage = 1;
  }

  getAllocatedPageSizeSelected(): DropdownOption[] {
    return [this.pageSizeDropdownOptions.find(o => o.value === this.allocatedPageSize)!];
  }

  unassignVolunteers() {
    const selected = Array.from(this.selectedAllocated);
    console.log('Unassigning volunteers:', selected);
    // Implement unassign logic
  }

  trackById(index: number, item: UnallocatedVolunteer | AllocatedVolunteer): number {
    return item.id;
  }
}
