import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { AddProgramModalComponent } from './add-program-modal/add-program-modal.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
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
    DatepickerComponent,
    AddProgramModalComponent,
    IconComponent
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

  // Loading and error states
  isLoading = true; // Start with true to show loader on initial load
  error: string | null = null;

  // Modal state
  isAddModalOpen = false;

  // Selection
  selectedPrograms = new Set<string>();

  // Filters
  searchTerm = '';
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
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

      // Update task branch options from API data
      this.updateTaskBranchOptions();

      this.applyFilters();
      this.isLoading = false; // Set loading to false after data is processed
    });
  }

  /**
   * Updates task branch options from loaded programs
   */
  private updateTaskBranchOptions(): void {
    const branches = new Set<string>();
    this.allPrograms.forEach(program => {
      if (program.taskBranch) branches.add(program.taskBranch);
    });

    this.taskBranchOptions = Array.from(branches).sort().map((branch, index) => ({
      id: String(index + 1),
      label: branch,
      value: branch
    }));
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
      const selectedBranch = this.selectedTaskBranch[0];
      filtered = filtered.filter(program => program.taskBranch === selectedBranch);
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
   * Handle task branch selection change
   */
  onTaskBranchChange(): void {
    this.applyFilters();
  }

  /**
   * Handle start date change
   */
  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.applyFilters();
  }

  /**
   * Handle end date change
   */
  onEndDateChange(date: Date | null): void {
    this.endDate = date;
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
    console.log('View program:', program);
    // Implement view logic (e.g., navigate to detail page or open view modal)
  }

  duplicateProgram(program: Program): void {
    console.log('Duplicate program:', program);
    // Implement duplicate logic (e.g., open add modal with pre-filled data)
  }

  deleteProgram(program: Program): void {
    if (confirm(`Delete ${program.name}?`)) {
      const index = this.allPrograms.findIndex(p => p.id === program.id);
      if (index > -1) {
        this.allPrograms.splice(index, 1);
        this.applyFilters();
      }
    }
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

  // Modal methods
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  onAddProgramSubmit(newProgram: { 
    name: string; 
    programCoordinator: string; 
    initiative: string; 
    project: string; 
    branch: string; 
    chooseSewa: string; 
    startDateTime: Date | null; 
    endDateTime: Date | null; 
    status: string; 
    repeats: string; 
    remarks: string 
  }): void {
    console.log('New Program Added:', newProgram);
    // In a real application, you would send this data to your API
    // For now, we'll simulate adding it to the list
    const newId = String(this.allPrograms.length + 1);
    const createdAt = new Date().toISOString();
    
    // Format dates
    const formatDateTime = (date: Date | null): string => {
      if (!date) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours() % 12 || 12).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'pm' : 'am';
      return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    };

    this.allPrograms.push({
      id: newId,
      name: newProgram.name,
      programCoordinator: newProgram.programCoordinator,
      initiativeName: newProgram.initiative,
      projectName: newProgram.project,
      taskBranch: newProgram.branch,
      startDateTime: formatDateTime(newProgram.startDateTime),
      endDateTime: formatDateTime(newProgram.endDateTime),
      status: newProgram.status as Program['status'],
      createdAt: createdAt
    });
    this.applyFilters();
  }
}
