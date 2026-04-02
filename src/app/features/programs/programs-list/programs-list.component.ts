import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DateRangePickerComponent } from '../../../shared/components/date-range-picker/date-range-picker.component';
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
    LoadingComponent,
    MenuDropdownComponent,
    DropdownComponent,
    DateRangePickerComponent,
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
    this.loadBranchOptions();
    this.loadInitiativeOptions();
    this.loadPrograms();
  }

  /**
   * Load programs from /api/v1/programs using DataService (environment.apiUrl/v1/programs)
   */
  loadPrograms(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>('v1/programs').pipe(
      catchError((error) => {
        console.error('Error loading programs:', error);
        this.error = error.error?.message || error.message || 'Failed to load programs. Please try again.';
        this.isLoading = false; // Set loading to false on error
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
    return [
      { id: '1', label: 'View', value: 'view', icon: 'visibility' },
      { id: '2', label: 'Duplicate', value: 'duplicate', icon: 'content_copy' },
      { id: '3', label: 'Delete', value: 'delete', icon: 'delete' }
    ];
  }

  onAction(program: Program, option: MenuOption) {
    if (!option) return;
    const actionId = typeof option === 'string' ? option : (option.value || option.id);
    
    if (actionId === 'view') {
      this.viewProgram(program);
    } else if (actionId === 'duplicate') {
      this.duplicateProgram(program);
    } else if (actionId === 'delete') {
      this.deleteProgram(program);
    }
  }

  viewProgram(program: Program): void {
    this.router.navigate(['/programs/view', program.id]);
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
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, program: Program): string {
    return program.id;
  }

  openAddModal(): void {
    this.router.navigate(['/programs/add-program']);
  }
}
