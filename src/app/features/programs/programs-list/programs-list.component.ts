import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Program {
  id: string;
  name: string;
  programCoordinator: string;
  initiativeName: string;
  projectName: string;
  taskBranch: string;
  startDateTime: string;
  endDateTime: string;
  status: 'Completed' | 'Pending' | 'In Progress' | 'Cancelled';
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
  selector: 'app-programs-list',
  templateUrl: './programs-list.component.html',
  styleUrls: ['./programs-list.component.scss']
})
export class ProgramsListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  programs: Program[] = [];
  allPrograms: Program[] = [];

  // Selection
  selectedPrograms = new Set<string>();

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
    { label: 'Programs', route: '/programs' },
    { label: 'Programs List', route: '/programs/programs-list' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  /**
   * Load programs from /api/v1/programs using DataService (environment.apiUrl/v1/programs)
   */
  private loadPrograms(): void {
    this.dataService.get<any>('v1/programs').pipe(
      catchError((error) => {
        console.error('Error loading programs:', error);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allPrograms = (Array.isArray(data) ? data : []).map((item: any) => {
        // Map numeric status to label
        const statusNumber = item.status;
        let statusLabel: Program['status'] = 'Pending';
        if (statusNumber === 1) {
          statusLabel = 'Completed';
        } else if (statusNumber === 2) {
          statusLabel = 'In Progress';
        } else if (statusNumber === 3) {
          statusLabel = 'Cancelled';
        }

        return {
          id: String(item.id),
          name: item.name || '',
          programCoordinator: item.user?.name || '',
          initiativeName: item.initiative?.name || '',
          projectName: item.project?.name || '',
          taskBranch: item.branch?.name || '',
          startDateTime: item.start_date_time || '',
          endDateTime: item.end_date_time || '',
          status: statusLabel,
          createdAt: item.created_at || ''
        } as Program;
      });

      this.applyFilters();
    });
  }

  formatDate(date: Date, includeTime: boolean = false): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'pm' : 'am';
      const displayHours = date.getHours() % 12 || 12;
      return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
    }
    
    return `${day}/${month}/${year}`;
  }

  applyFilters() {
    let filtered = [...this.allPrograms];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(search) ||
        program.programCoordinator.toLowerCase().includes(search) ||
        program.initiativeName.toLowerCase().includes(search) ||
        program.projectName.toLowerCase().includes(search) ||
        program.taskBranch.toLowerCase().includes(search)
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

    this.programs = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    this.updatePagedData();
  }

  sortBy(field: string) {
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

  updatePagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    // Return sliced data for display
  }

  get pagedPrograms(): Program[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.programs.slice(start, end);
  }

  // Selection
  toggleSelectProgram(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedPrograms.has(id)) {
      this.selectedPrograms.delete(id);
    } else {
      this.selectedPrograms.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedPrograms.clear();
    } else {
      this.pagedPrograms.forEach(program => this.selectedPrograms.add(program.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedPrograms.length > 0 && 
           this.pagedPrograms.every(program => this.selectedPrograms.has(program.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedPrograms.filter(program => this.selectedPrograms.has(program.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedPrograms.length;
  }

  // Actions
  getActionOptions(program: Program): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(program: Program, option: MenuOption) {
    console.log('Action:', option.value, 'on program:', program);
    // Implement action logic
  }

  // Pagination
  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, program: Program): string {
    return program.id;
  }
}
