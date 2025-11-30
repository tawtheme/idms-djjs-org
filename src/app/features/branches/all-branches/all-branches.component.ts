import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { AddBranchModalComponent } from './add-branch-modal/add-branch-modal.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
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
    LoadingComponent,
    MenuDropdownComponent,
    AddBranchModalComponent
  ],
  selector: 'app-all-branches',
  templateUrl: './all-branches.component.html',
  styleUrls: ['./all-branches.component.scss']
})
export class AllBranchesComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  branches: Branch[] = [];
  allBranches: Branch[] = [];

  // Loading state
  isLoading = true; // Start with true to show loader on initial load

  // Modal state
  isAddModalOpen = false;

  // Selection
  selectedBranches = new Set<string>();

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
    { label: 'Manage Branches', route: '/branches' },
    { label: 'All Branches', route: '/branches' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadBranches();
  }

  /**
   * Load branches from /api/v1/branches
   */
  private loadBranches(): void {
    this.isLoading = true;
    this.dataService.get<any>('v1/branches').pipe(
      catchError((error) => {
        console.error('Error loading branches:', error);
        this.isLoading = false;
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allBranches = (Array.isArray(data) ? data : []).map((item: any) => {
        let statusLabel = 'Inactive';
        if (item.status === 1 || item.status === true || item.status === 'active') {
          statusLabel = 'Active';
        }

        return {
          id: String(item.id),
          name: item.name || '',
          code: item.code || item.branch_code || '',
          city: item.city || item.branch_city || '',
          type: item.type || item.branch_type || '',
          status: statusLabel,
          createdAt: item.created_at || ''
        } as Branch;
      });

      this.isLoading = false;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allBranches];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(branch =>
        branch.name.toLowerCase().includes(search) ||
        branch.code.toLowerCase().includes(search) ||
        branch.city.toLowerCase().includes(search) ||
        branch.type.toLowerCase().includes(search)
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

    this.branches = filtered;
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
  get pagedBranches(): Branch[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.branches.slice(start, end);
  }

  // Selection
  toggleSelectBranch(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedBranches.has(id)) {
      this.selectedBranches.delete(id);
    } else {
      this.selectedBranches.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedBranches.clear();
    } else {
      this.pagedBranches.forEach(branch => this.selectedBranches.add(branch.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedBranches.length > 0 &&
           this.pagedBranches.every(branch => this.selectedBranches.has(branch.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedBranches.filter(branch => this.selectedBranches.has(branch.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedBranches.length;
  }

  // Actions
  getActionOptions(branch: Branch): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(branch: Branch, option: MenuOption): void {
    console.log('Action:', option.value, 'on branch:', branch);
  }

  // Modal methods
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  onAddBranchSubmit(newBranch: {
    parentBranch: string;
    name: string;
    code: string;
    branchHead: string;
    email: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pincode: string;
    canBeParentBranch: string;
    status: string;
  }): void {
    console.log('New Branch Added:', newBranch);
    // In a real application, you would send this data to your API
    // For now, we'll simulate adding it to the list
    const newId = String(this.allBranches.length + 1);
    const createdAt = new Date().toLocaleString();
    this.allBranches.push({
      id: newId,
      name: newBranch.name,
      code: newBranch.code || '',
      city: newBranch.city,
      type: '', // Type field removed from Branch interface, keeping for compatibility
      status: newBranch.status,
      createdAt: createdAt
    });
    this.applyFilters();
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, branch: Branch): string {
    return branch.id;
  }
}


