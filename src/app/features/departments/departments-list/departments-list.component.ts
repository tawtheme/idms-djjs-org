import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Department {
  id: string;
  name: string;
  status: string;
  email: string;
  branchName: string;
  userName: string;
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
    MenuDropdownComponent
  ],
  selector: 'app-departments-list',
  templateUrl: './departments-list.component.html',
  styleUrls: ['./departments-list.component.scss']
})
export class DepartmentsListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  departments: Department[] = [];
  allDepartments: Department[] = [];

  // Selection
  selectedDepartments = new Set<string>();

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
    { label: 'Departments', route: '/departments' },
    { label: 'Departments List', route: '/departments' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  /**
   * Load departments from /api/v1/departments
   */
  private loadDepartments(): void {
    this.dataService.get<any>('v1/departments').pipe(
      catchError((error) => {
        console.error('Error loading departments:', error);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allDepartments = (Array.isArray(data) ? data : []).map((item: any) => {
        const statusLabel = item.status === 1 || item.status === true || item.status === 'active'
          ? 'Active'
          : 'Inactive';

        return {
          id: String(item.id),
          name: item.name || '',
          status: statusLabel,
          email: item.email || '',
          branchName: item.branch_name || '',
          userName: item.user_name || '',
          createdAt: item.created_at || ''
        } as Department;
      });

      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allDepartments];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(search) ||
        dept.email.toLowerCase().includes(search) ||
        dept.branchName.toLowerCase().includes(search) ||
        dept.userName.toLowerCase().includes(search)
      );
    }

    if (this.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.sortField];
        const bVal = (b as any)[this.sortField];

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.departments = filtered;
    this.totalItems = filtered.length;
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
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Paged data
  get pagedDepartments(): Department[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.departments.slice(start, end);
  }

  // Selection
  toggleSelectDepartment(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedDepartments.has(id)) {
      this.selectedDepartments.delete(id);
    } else {
      this.selectedDepartments.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedDepartments.clear();
    } else {
      this.pagedDepartments.forEach(dept => this.selectedDepartments.add(dept.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedDepartments.length > 0 &&
           this.pagedDepartments.every(dept => this.selectedDepartments.has(dept.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedDepartments.filter(dept => this.selectedDepartments.has(dept.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedDepartments.length;
  }

  // Actions
  getActionOptions(dept: Department): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(dept: Department, option: MenuOption): void {
    console.log('Action:', option.value, 'on department:', dept);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, dept: Department): string {
    return dept.id;
  }
}


