import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

export interface Sewa {
  id: number;
  name: string;
  type: string;
  status: string;
  createdAt: string;
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
    DropdownComponent
  ],
  selector: 'app-all-sewa',
  templateUrl: './all-sewa.component.html',
  styleUrls: ['./all-sewa.component.scss']
})
export class AllSewaComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  sewas: Sewa[] = [];
  allSewas: Sewa[] = [];

  // Selection
  selectedSewas = new Set<number>();

  // Filters
  searchTerm = '';
  selectedType: any[] = [];
  typeOptions: DropdownOption[] = [];
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sewa', route: '/sewa' },
    { label: 'All Sewa', route: '/sewa/all-sewa' }
  ];

  constructor() {
    // Sample data based on the screenshot
    this.allSewas = [
      {
        id: 1,
        name: 'VIP Langar',
        type: 'Volunteer',
        status: 'Active',
        createdAt: '11/08/2025 08:52 pm'
      },
      {
        id: 2,
        name: 'SG LANGAR',
        type: 'Volunteer',
        status: 'Active',
        createdAt: '11/08/2025 08:51 pm'
      }
    ];

    // Generate more sample records
    const types = ['Volunteer', 'Regular', 'Special', 'Event'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
    const names = ['Langar', 'Sewa', 'Service', 'Activity', 'Program'];
    
    for (let i = 2; i < 25; i++) {
      const date = new Date(2025, 7, 11 - (i % 10));
      const hours = 8 + (i % 12);
      const minutes = 50 + (i % 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours > 12 ? hours - 12 : hours;
      
      this.allSewas.push({
        id: i + 1,
        name: `${names[i % names.length]} ${i + 1}`,
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        createdAt: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`
      });
    }

    // Build filter options
    this.typeOptions = [
      { id: '1', label: 'Volunteer', value: 'Volunteer' },
      { id: '2', label: 'Regular', value: 'Regular' },
      { id: '3', label: 'Special', value: 'Special' },
      { id: '4', label: 'Event', value: 'Event' }
    ];

    this.statusOptions = [
      { id: '1', label: 'Active', value: 'Active' },
      { id: '2', label: 'Inactive', value: 'Inactive' },
      { id: '3', label: 'Pending', value: 'Pending' },
      { id: '4', label: 'Completed', value: 'Completed' }
    ];

    this.applyFilter();
  }

  get filteredSewas(): Sewa[] {
    return this.sewas;
  }

  get pagedSewas(): Sewa[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sewas.slice(start, start + this.pageSize);
  }

  trackById(_: number, s: Sewa): number {
    return s.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedType = [];
    this.selectedStatus = [];
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const type = this.selectedType[0] || '';
    const status = this.selectedStatus[0] || '';

    // Filter sewas
    let filtered = this.allSewas.filter((s) => {
      const matchesTerm = !term || 
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term);

      const matchesType = !type || s.type === type;
      const matchesStatus = !status || s.status === status;

      return matchesTerm && matchesType && matchesStatus;
    });

    // Apply sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        let aVal: any = a[this.sortField as keyof Sewa];
        let bVal: any = b[this.sortField as keyof Sewa];
        
        if (this.sortField === 'createdAt') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.sewas = filtered;
    this.totalItems = this.sewas.length;
    this.currentPage = 1;
  }

  // Sorting
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
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
      this.pagedSewas.forEach(s => this.selectedSewas.add(s.id));
    } else {
      this.pagedSewas.forEach(s => this.selectedSewas.delete(s.id));
    }
  }

  toggleSelectSewa(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedSewas.has(id)) {
      this.selectedSewas.delete(id);
    } else {
      this.selectedSewas.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedSewas.length > 0 && 
           this.pagedSewas.every(s => this.selectedSewas.has(s.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedSewas.filter(s => this.selectedSewas.has(s.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedSewas.length;
  }

  // Action handlers
  getActionOptions(sewa: Sewa): MenuOption[] {
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
        icon: 'delete'
      }
    ];
  }

  onAction(sewa: Sewa, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(sewa);
    } else if (actionId === 'edit') {
      this.editSewa(sewa);
    } else if (actionId === 'delete') {
      this.deleteSewa(sewa);
    }
  }

  viewDetails(sewa: Sewa): void {
    console.log('View sewa:', sewa);
  }

  editSewa(sewa: Sewa): void {
    console.log('Edit sewa:', sewa);
  }

  deleteSewa(sewa: Sewa): void {
    if (confirm(`Delete ${sewa.name}?`)) {
      const index = this.allSewas.findIndex(s => s.id === sewa.id);
      if (index > -1) {
        this.allSewas.splice(index, 1);
        this.applyFilter();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      // Handle any click outside logic if needed
    }
  }
}

