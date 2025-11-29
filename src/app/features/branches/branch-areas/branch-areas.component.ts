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

export interface BranchArea {
  id: string;
  branchName: string;
  areaName: string;
  city: string;
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
    MenuDropdownComponent
  ],
  selector: 'app-branch-areas',
  templateUrl: './branch-areas.component.html',
  styleUrls: ['./branch-areas.component.scss']
})
export class BranchAreasComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  branchAreas: BranchArea[] = [];
  allBranchAreas: BranchArea[] = [];

  // Selection
  selectedBranchAreas = new Set<string>();

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
    { label: 'Branch Areas', route: '/branches/areas' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadBranchAreas();
  }

  /**
   * Load branch areas from /api/v1/branches/area
   */
  private loadBranchAreas(): void {
    this.dataService.get<any>('v1/branches/area').pipe(
      catchError((error) => {
        console.error('Error loading branch areas:', error);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allBranchAreas = (Array.isArray(data) ? data : []).map((item: any) => {
        let statusLabel = 'Inactive';
        if (item.status === 1 || item.status === true || item.status === 'active') {
          statusLabel = 'Active';
        }

        return {
          id: String(item.id),
          branchName: item.branch?.name || item.branch_name || '',
          areaName: item.name || item.area_name || '',
          city: item.city || '',
          status: statusLabel,
          createdAt: item.created_at || ''
        } as BranchArea;
      });

      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allBranchAreas];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(area =>
        area.branchName.toLowerCase().includes(search) ||
        area.areaName.toLowerCase().includes(search) ||
        area.city.toLowerCase().includes(search)
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

    this.branchAreas = filtered;
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
  get pagedBranchAreas(): BranchArea[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.branchAreas.slice(start, end);
  }

  // Selection
  toggleSelectBranchArea(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedBranchAreas.has(id)) {
      this.selectedBranchAreas.delete(id);
    } else {
      this.selectedBranchAreas.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedBranchAreas.clear();
    } else {
      this.pagedBranchAreas.forEach(area => this.selectedBranchAreas.add(area.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedBranchAreas.length > 0 &&
           this.pagedBranchAreas.every(area => this.selectedBranchAreas.has(area.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedBranchAreas.filter(area => this.selectedBranchAreas.has(area.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedBranchAreas.length;
  }

  // Actions
  getActionOptions(area: BranchArea): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(area: BranchArea, option: MenuOption): void {
    console.log('Action:', option.value, 'on branch area:', area);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, area: BranchArea): string {
    return area.id;
  }
}


