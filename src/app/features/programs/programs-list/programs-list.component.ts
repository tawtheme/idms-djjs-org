import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
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
  status: 'Completed' | 'Running' | 'Upcoming' | 'Scheduled';
  scheduledDays?: number;
  activeStatus: 'Active' | 'Inactive';
  createdAt: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PagerComponent,
    EmptyStateComponent,
    LoadingComponent,
    MenuDropdownComponent,
    DropdownComponent,
    IconComponent,
    ConfirmationDialogComponent
  ],
  selector: 'app-programs-list',
  templateUrl: './programs-list.component.html',
  styleUrls: ['./programs-list.component.scss']
})
export class ProgramsListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);
  private router = inject(Router);

  programs: Program[] = [];
  allPrograms: Program[] = [];

  // Loading and error states
  isLoading = true;
  error: string | null = null;

  // Panel state
  showDeleteConfirm = false;
  deleteProgramTarget: Program | null = null;

  // Selection
  selectedPrograms = new Set<string>();

  // Filters
  searchTerm = '';
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  selectedInitiative: any[] = [];
  initiativeOptions: DropdownOption[] = [];
  selectedProject: any[] = [];
  projectOptions: DropdownOption[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Date select dropdowns
  startDay = '';
  startMonth = '';
  startYear = '';
  endDay = '';
  endMonth = '';
  endYear = '';

  days = Array.from({ length: 31 }, (_, i) => i + 1);
  months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
  ];
  years: number[] = [];

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
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: currentYear - 2000 + 3 }, (_, i) => 2000 + i);
    this.loadBranchOptions();
    this.loadInitiativeOptions();
    this.loadPrograms();
  }

  onDateSelectChange(): void {
    if (this.startDay && this.startMonth && this.startYear) {
      this.startDate = new Date(+this.startYear, +this.startMonth - 1, +this.startDay);
    } else {
      this.startDate = null;
    }
    if (this.endDay && this.endMonth && this.endYear) {
      this.endDate = new Date(+this.endYear, +this.endMonth - 1, +this.endDay, 23, 59, 59);
    } else {
      this.endDate = null;
    }
  }

  /**
   * Load programs from /api/v1/programs using DataService (environment.apiUrl/v1/programs)
   */
  loadPrograms(): void {
    this.isLoading = true;
    this.error = null;

    const params = new URLSearchParams();
    params.set('page', String(this.currentPage));
    params.set('per_page', String(this.pageSize));

    this.dataService.get<any>(`v1/programs?${params.toString()}`).pipe(
      catchError((error) => {
        console.error('Error loading programs:', error);
        this.error = error.error?.message || error.message || 'Failed to load programs. Please try again.';
        this.isLoading = false; // Set loading to false on error
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];
      const meta = response.meta || response.pagination || null;

      this.allPrograms = (Array.isArray(data) ? data : []).map((item: any) => {
        const { status: statusLabel, scheduledDays } = this.computeProgramStatus(item.start_date_time, item.end_date_time);

        return {
          scheduledDays,
          id: String(item.id),
          name: item.name || '',
          programCoordinator: item.user?.name || '',
          initiativeName: item.initiative?.name || '',
          projectName: item.project?.name || '',
          taskBranch: item.branch?.name || '',
          startDateTime: this.formatDisplayDate(item.start_date_time),
          endDateTime: this.formatDisplayDate(item.end_date_time),
          status: statusLabel,
          activeStatus: item.status === 1 ? 'Active' : 'Inactive',
          createdAt: this.formatDisplayDateTime(item.created_at)
        } as Program;
      });

      this.applyFilters();
      if (meta) {
        this.totalItems = meta.total ?? meta.total_count ?? this.totalItems;
        this.currentPage = meta.current_page ?? this.currentPage;
        this.pageSize = meta.per_page ?? this.pageSize;
      } else {
        this.totalItems = this.allPrograms.length;
      }
      this.isLoading = false;
    });
  }

  /**
   * Load branch options from API
   */
  private loadBranchOptions(): void {
    this.dataService.get<any>('v1/options/branches').pipe(
      catchError((err) => {
        console.error('Error loading branches:', err);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response.data || response.results || []);
      this.taskBranchOptions = (Array.isArray(data) ? data : []).map((branch: any) => ({
        id: String(branch.id),
        label: branch.name || branch.label || branch.title || '',
        value: branch.id
      }));
    });
  }

  private loadInitiativeOptions(): void {
    this.dataService.get<any>('v1/options/initiatives').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response || [];
      this.initiativeOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: item.name
      }));
    });
  }

  private loadProjectOptions(branchId: string): void {
    this.projectOptions = [];
    this.selectedProject = [];
    this.dataService.post<any>(`v1/projects/${branchId}`, {}).pipe(
      catchError((err) => {
        console.error('Error loading projects:', err);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response.data || response.results || []);
      this.projectOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name || item.label || item.title || '',
        value: item.id
      }));
    });
  }

  private formatDisplayDate(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private formatDisplayDateTime(value: string | null | undefined): string {
    if (!value) return '';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // Handle "DD/MM/YYYY hh:mm am/pm" backend format
    const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (m) {
      const [, dd, mm, yyyy, hh, min, ap] = m;
      return `${dd.padStart(2, '0')} ${months[parseInt(mm, 10) - 1]} ${yyyy} at ${parseInt(hh, 10)}:${min} ${ap.toLowerCase()}`;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const hours24 = d.getHours();
    const ampm = hours24 >= 12 ? 'pm' : 'am';
    const hours12 = hours24 % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} at ${hours12}:${min} ${ampm}`;
  }

  private computeProgramStatus(
    start: string | null | undefined,
    end: string | null | undefined
  ): { status: Program['status']; scheduledDays?: number } {
    const now = new Date();
    const startDate = start ? new Date(start) : null;
    let endDate = end ? new Date(end) : null;
    if (end && typeof end === 'string' && !end.includes('T') && !end.includes(':')) {
      endDate = new Date(end + 'T23:59:59');
    }

    if (!startDate) return { status: 'Upcoming' };
    if (now < startDate) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntil = Math.ceil((startDay.getTime() - today.getTime()) / msPerDay);
      if (daysUntil > 6) {
        return { status: 'Scheduled', scheduledDays: daysUntil };
      }
      return { status: 'Upcoming' };
    }
    if (endDate && now > endDate) return { status: 'Completed' };
    return { status: 'Running' };
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

    // Task Branch filter
    if (this.selectedTaskBranch && this.selectedTaskBranch.length > 0) {
      const selectedBranchId = this.selectedTaskBranch[0];
      const selectedBranchOption = this.taskBranchOptions.find(opt => opt.value === selectedBranchId);
      const selectedBranchName = selectedBranchOption?.label || '';
      filtered = filtered.filter(program => program.taskBranch === selectedBranchName);
    }

    // Initiative filter
    if (this.selectedInitiative && this.selectedInitiative.length > 0) {
      const selectedInit = this.selectedInitiative[0];
      filtered = filtered.filter(program => program.initiativeName === selectedInit);
    }

    // Project filter
    if (this.selectedProject && this.selectedProject.length > 0) {
      const selectedProj = this.selectedProject[0];
      filtered = filtered.filter(program => program.projectName === selectedProj);
    }

    // Start Date filter
    if (this.startDate) {
      filtered = filtered.filter(program => {
        if (!program.startDateTime) return false;
        const programDate = new Date(program.startDateTime);
        return programDate >= this.startDate!;
      });
    }

    // End Date filter
    if (this.endDate) {
      filtered = filtered.filter(program => {
        if (!program.endDateTime) return false;
        const programDate = new Date(program.endDateTime);
        return programDate <= this.endDate!;
      });
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

  get pagedPrograms(): Program[] {
    return this.programs;
  }

  /**
   * Handle task branch selection change — loads project options for the selected branch
   */
  onTaskBranchChange(): void {
    if (this.selectedTaskBranch && this.selectedTaskBranch.length > 0) {
      this.loadProjectOptions(this.selectedTaskBranch[0]);
    } else {
      this.projectOptions = [];
      this.selectedProject = [];
    }
    this.applyFilters();
  }

  /**
   * Handle date range change
   */
  onDateRangeChange(range: { fromDate: Date | null; toDate: Date | null }): void {
    this.startDate = range.fromDate;
    this.endDate = range.toDate;
    this.applyFilters();
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
    const options: MenuOption[] = [
      { id: '1', label: 'View', value: 'view', icon: 'visibility' }
    ];
    if (program.status !== 'Completed') {
      options.push({ id: '2', label: 'Edit', value: 'edit', icon: 'edit' });
    }
    options.push(
      { id: '3', label: 'Duplicate', value: 'duplicate', icon: 'content_copy' },
      { id: '4', label: 'Delete', value: 'delete', icon: 'delete' }
    );
    return options;
  }

  onAction(program: Program, option: MenuOption) {
    if (!option) return;
    const actionId = typeof option === 'string' ? option : (option.value || option.id);
    
    if (actionId === 'view') {
      this.viewProgram(program);
    } else if (actionId === 'edit') {
      this.editProgram(program);
    } else if (actionId === 'duplicate') {
      this.duplicateProgram(program);
    } else if (actionId === 'delete') {
      this.deleteProgram(program);
    }
  }

  viewProgram(program: Program): void {
    this.router.navigate(['/programs/view', program.id]);
  }

  editProgram(program: Program): void {
    this.router.navigate(['/programs/edit-program', program.id]);
  }

  duplicateProgram(program: Program): void {
    this.router.navigate(['/programs/add-program'], {
      queryParams: { duplicateFrom: program.id }
    });
  }

  deleteProgram(program: Program): void {
    this.deleteProgramTarget = program;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.deleteProgramTarget) return;
    const programId = this.deleteProgramTarget.id;
    this.showDeleteConfirm = false;
    this.deleteProgramTarget = null;

    this.dataService.delete(`v1/programs/${programId}`).pipe(
      catchError((err) => {
        console.error('Error deleting program:', err);
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.loadPrograms();
    });
  }

  onDeleteCancel(): void {
    this.showDeleteConfirm = false;
    this.deleteProgramTarget = null;
  }

  // Pagination
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadPrograms();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadPrograms();
  }

  trackById(index: number, program: Program): string {
    return program.id;
  }

  openAddModal(): void {
    this.router.navigate(['/programs/add-program']);
  }
}
