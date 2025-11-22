import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';

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
    MenuDropdownComponent
  ],
  selector: 'app-allocate-sewa',
  templateUrl: './allocate-sewa.component.html',
  styleUrls: ['./allocate-sewa.component.scss']
})
export class AllocateSewaComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

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

  // Bulk Actions
  bulkActionOptions: DropdownOption[] = [
    { id: '1', label: 'Select All', value: 'select-all' },
    { id: '2', label: 'Deselect All', value: 'deselect-all' }
  ];

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSizeDropdownOptions: DropdownOption[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sewa', route: '/sewa' },
    { label: 'Allocate Sewa', route: '/sewa/allocate-sewa' }
  ];

  constructor() {
    // Initialize unallocated volunteers sample data
    this.allUnallocatedVolunteers = [
      { id: 1, name: 'Volunteer 1', phone: '1234567890' },
      { id: 2, name: 'Volunteer 2', phone: '2345678901', image: 'https://via.placeholder.com/40' },
      { id: 3, name: 'Volunteer 3', phone: '3456789012' },
      { id: 4, name: 'Volunteer 4', phone: '4567890123', image: 'https://via.placeholder.com/40' },
      { id: 5, name: 'Volunteer 5', phone: '5678901234' }
    ];

    // Initialize allocated volunteers sample data
    this.allAllocatedVolunteers = [
      {
        id: 1,
        badgeNo: '001',
        name: 'Allocated Volunteer 1',
        head: 'Head 1',
        subHead: 'Sub Head 1',
        isRegular: true,
        sewa: 'VIP Langar',
        image: 'https://via.placeholder.com/40'
      },
      {
        id: 2,
        badgeNo: '002',
        name: 'Allocated Volunteer 2',
        head: 'Head 2',
        subHead: 'Sub Head 2',
        isRegular: false,
        sewa: 'SG LANGAR'
      }
    ];

    // Initialize page size dropdown options
    this.pageSizeDropdownOptions = this.pageSizeOptions.map(s => ({
      id: String(s),
      label: `${s} entries`,
      value: s
    }));

    this.applyUnallocatedFilter();
    this.applyAllocatedFilter();
  }

  getUnallocatedPageSizeSelected(): DropdownOption[] {
    return [{
      id: String(this.unallocatedPageSize),
      label: `${this.unallocatedPageSize} entries`,
      value: this.unallocatedPageSize
    }];
  }

  getAllocatedPageSizeSelected(): DropdownOption[] {
    return [{
      id: String(this.allocatedPageSize),
      label: `${this.allocatedPageSize} entries`,
      value: this.allocatedPageSize
    }];
  }

  // Unallocated Volunteers Methods
  get pagedUnallocated(): UnallocatedVolunteer[] {
    const start = (this.unallocatedCurrentPage - 1) * this.unallocatedPageSize;
    return this.unallocatedVolunteers.slice(start, start + this.unallocatedPageSize);
  }

  applyUnallocatedFilter(): void {
    const term = this.unallocatedSearchTerm.trim().toLowerCase();
    let filtered = this.allUnallocatedVolunteers.filter((v) => {
      return !term || 
        v.name.toLowerCase().includes(term) ||
        (v.phone && v.phone.includes(term)) ||
        String(v.id).includes(term);
    });

    // Apply sorting
    if (this.unallocatedSortField) {
      filtered.sort((a, b) => {
        let aVal: any = a[this.unallocatedSortField as keyof UnallocatedVolunteer];
        let bVal: any = b[this.unallocatedSortField as keyof UnallocatedVolunteer];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return this.unallocatedSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.unallocatedSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.unallocatedVolunteers = filtered;
    this.unallocatedTotalItems = this.unallocatedVolunteers.length;
    this.unallocatedCurrentPage = 1;
  }

  sortUnallocated(field: string): void {
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

  toggleSelectUnallocated(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedUnallocated.has(id)) {
      this.selectedUnallocated.delete(id);
    } else {
      this.selectedUnallocated.add(id);
    }
  }

  toggleSelectAllUnallocated(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedUnallocated.forEach(v => this.selectedUnallocated.add(v.id));
    } else {
      this.pagedUnallocated.forEach(v => this.selectedUnallocated.delete(v.id));
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

  onUnallocatedPageChange(page: number): void {
    this.unallocatedCurrentPage = page;
  }

  onUnallocatedPageSizeChange(size: number): void {
    this.unallocatedPageSize = size;
    this.unallocatedCurrentPage = 1;
  }

  allocateVolunteers(): void {
    if (this.selectedUnallocated.size === 0) {
      alert('Please select at least one volunteer to allocate');
      return;
    }
    console.log('Allocating volunteers:', Array.from(this.selectedUnallocated));
    // Move selected volunteers from unallocated to allocated
    const toAllocate = this.allUnallocatedVolunteers.filter(v => this.selectedUnallocated.has(v.id));
    toAllocate.forEach(v => {
      const allocated: AllocatedVolunteer = {
        id: v.id,
        name: v.name,
        image: v.image,
        head: '',
        subHead: '',
        isRegular: false,
        sewa: ''
      };
      this.allAllocatedVolunteers.push(allocated);
      const index = this.allUnallocatedVolunteers.findIndex(uv => uv.id === v.id);
      if (index > -1) {
        this.allUnallocatedVolunteers.splice(index, 1);
      }
    });
    this.selectedUnallocated.clear();
    this.applyUnallocatedFilter();
    this.applyAllocatedFilter();
  }

  // Allocated Volunteers Methods
  get pagedAllocated(): AllocatedVolunteer[] {
    const start = (this.allocatedCurrentPage - 1) * this.allocatedPageSize;
    return this.allocatedVolunteers.slice(start, start + this.allocatedPageSize);
  }

  applyAllocatedFilter(): void {
    const term = this.allocatedSearchTerm.trim().toLowerCase();
    let filtered = this.allAllocatedVolunteers.filter((v) => {
      return !term || 
        v.name.toLowerCase().includes(term) ||
        (v.badgeNo && v.badgeNo.toLowerCase().includes(term)) ||
        (v.sewa && v.sewa.toLowerCase().includes(term)) ||
        String(v.id).includes(term);
    });

    // Apply sorting
    if (this.allocatedSortField) {
      filtered.sort((a, b) => {
        let aVal: any = a[this.allocatedSortField as keyof AllocatedVolunteer];
        let bVal: any = b[this.allocatedSortField as keyof AllocatedVolunteer];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return this.allocatedSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.allocatedSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.allocatedVolunteers = filtered;
    this.allocatedTotalItems = this.allocatedVolunteers.length;
    this.allocatedCurrentPage = 1;
  }

  sortAllocated(field: string): void {
    if (this.allocatedSortField === field) {
      this.allocatedSortDirection = this.allocatedSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.allocatedSortField = field;
      this.allocatedSortDirection = 'asc';
    }
    this.applyAllocatedFilter();
  }

  getAllocatedSortIcon(field: string): string {
    if (this.allocatedSortField !== field) return 'unfold_more';
    return this.allocatedSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleSelectAllocated(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedAllocated.has(id)) {
      this.selectedAllocated.delete(id);
    } else {
      this.selectedAllocated.add(id);
    }
  }

  toggleSelectAllAllocated(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedAllocated.forEach(v => this.selectedAllocated.add(v.id));
    } else {
      this.pagedAllocated.forEach(v => this.selectedAllocated.delete(v.id));
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

  onAllocatedPageChange(page: number): void {
    this.allocatedCurrentPage = page;
  }

  onAllocatedPageSizeChange(size: number): void {
    this.allocatedPageSize = size;
    this.allocatedCurrentPage = 1;
  }

  unassignVolunteers(): void {
    if (this.selectedAllocated.size === 0) {
      alert('Please select at least one volunteer to unassign');
      return;
    }
    console.log('Unassigning volunteers:', Array.from(this.selectedAllocated));
    // Move selected volunteers from allocated to unallocated
    const toUnassign = this.allAllocatedVolunteers.filter(v => this.selectedAllocated.has(v.id));
    toUnassign.forEach(v => {
      const unallocated: UnallocatedVolunteer = {
        id: v.id,
        name: v.name,
        image: v.image,
        phone: ''
      };
      this.allUnallocatedVolunteers.push(unallocated);
      const index = this.allAllocatedVolunteers.findIndex(av => av.id === v.id);
      if (index > -1) {
        this.allAllocatedVolunteers.splice(index, 1);
      }
    });
    this.selectedAllocated.clear();
    this.applyUnallocatedFilter();
    this.applyAllocatedFilter();
  }

  onBulkAction(section: 'unallocated' | 'allocated', action: any): void {
    if (!action) return;
    const actionValue = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionValue === 'select-all') {
      if (section === 'unallocated') {
        this.pagedUnallocated.forEach(v => this.selectedUnallocated.add(v.id));
      } else {
        this.pagedAllocated.forEach(v => this.selectedAllocated.add(v.id));
      }
    } else if (actionValue === 'deselect-all') {
      if (section === 'unallocated') {
        this.pagedUnallocated.forEach(v => this.selectedUnallocated.delete(v.id));
      } else {
        this.pagedAllocated.forEach(v => this.selectedAllocated.delete(v.id));
      }
    }
  }

  trackById(_: number, item: UnallocatedVolunteer | AllocatedVolunteer): number {
    return item.id;
  }

  // Expose Math to template
  Math = Math;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      // Handle any click outside logic if needed
    }
  }
}
