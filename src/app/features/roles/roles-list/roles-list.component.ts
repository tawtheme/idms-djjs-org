import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { AddRoleModalComponent } from './add-role-modal/add-role-modal.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Role {
  id: string;
  name: string;
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
    LoadingComponent,
    MenuDropdownComponent,
    AddRoleModalComponent,
    IconComponent
  ],
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  roles: Role[] = [];
  allRoles: Role[] = [];

  // Loading state
  isLoading = true; // Start with true to show loader on initial load

  // Modal state
  isAddModalOpen = false;

  // Selection
  selectedRoles = new Set<string>();

  // Filters
  searchTerm = '';

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Roles', route: '/roles' },
    { label: 'Roles List', route: '/roles' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadRoles();
  }

  /**
   * Load roles from /api/v1/roles using DataService
   */
  private loadRoles(): void {
    this.isLoading = true;
    this.dataService.get<any>('v1/roles').pipe(
      catchError((error) => {
        console.error('Error loading roles:', error);
        this.isLoading = false;
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allRoles = (Array.isArray(data) ? data : []).map((item: any) => {
        return {
          id: String(item.id),
          name: item.name || '',
          createdAt: item.created_at || ''
        } as Role;
      });

      this.isLoading = false;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allRoles];

    // Search by name
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(search)
      );
    }

    // Sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.sortField];
        const bVal = (b as any)[this.sortField];

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.roles = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  // Sorting helpers
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Paged data
  get pagedRoles(): Role[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.roles.slice(start, end);
  }

  // Selection
  toggleSelectRole(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedRoles.has(id)) {
      this.selectedRoles.delete(id);
    } else {
      this.selectedRoles.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedRoles.clear();
    } else {
      this.pagedRoles.forEach(role => this.selectedRoles.add(role.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedRoles.length > 0 &&
           this.pagedRoles.every(role => this.selectedRoles.has(role.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedRoles.filter(role => this.selectedRoles.has(role.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedRoles.length;
  }

  // Actions
  getActionOptions(role: Role): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(role: Role, option: MenuOption): void {
    console.log('Action:', option.value, 'on role:', role);
    // Implement action logic (navigate, open modal, etc.)
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, role: Role): string {
    return role.id;
  }

  /**
   * Open the add role modal
   */
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  /**
   * Close the add role modal
   */
  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  /**
   * Handle form submission from add role modal
   */
  onAddRoleSubmit(data: { name: string; status: string }): void {
    console.log('Add role:', data);
    // TODO: Implement API call to add role
    // For now, just close the modal
    this.closeAddModal();
  }
}


