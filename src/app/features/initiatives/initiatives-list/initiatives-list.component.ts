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

export interface Initiative {
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
    MenuDropdownComponent
  ],
  selector: 'app-initiatives-list',
  templateUrl: './initiatives-list.component.html',
  styleUrls: ['./initiatives-list.component.scss']
})
export class InitiativesListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  initiatives: Initiative[] = [];
  allInitiatives: Initiative[] = [];

  // Selection
  selectedInitiatives = new Set<string>();

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
    { label: 'Initiatives', route: '/initiatives' },
    { label: 'Initiatives List', route: '/initiatives' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadInitiatives();
  }

  /**
   * Load initiatives from /api/v1/initiatives using DataService
   */
  private loadInitiatives(): void {
    this.dataService.get<any>('v1/initiatives').pipe(
      catchError((error) => {
        console.error('Error loading initiatives:', error);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allInitiatives = (Array.isArray(data) ? data : []).map((item: any) => {
        return {
          id: String(item.id),
          name: item.name || '',
          createdAt: item.created_at || ''
        } as Initiative;
      });

      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allInitiatives];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(initiative =>
        initiative.name.toLowerCase().includes(search)
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

    this.initiatives = filtered;
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
  get pagedInitiatives(): Initiative[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.initiatives.slice(start, end);
  }

  // Selection
  toggleSelectInitiative(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedInitiatives.has(id)) {
      this.selectedInitiatives.delete(id);
    } else {
      this.selectedInitiatives.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedInitiatives.clear();
    } else {
      this.pagedInitiatives.forEach(initiative => this.selectedInitiatives.add(initiative.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedInitiatives.length > 0 &&
           this.pagedInitiatives.every(initiative => this.selectedInitiatives.has(initiative.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedInitiatives.filter(initiative => this.selectedInitiatives.has(initiative.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedInitiatives.length;
  }

  // Actions
  getActionOptions(initiative: Initiative): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(initiative: Initiative, option: MenuOption): void {
    console.log('Action:', option.value, 'on initiative:', initiative);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, initiative: Initiative): string {
    return initiative.id;
  }
}


