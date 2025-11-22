import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

export interface Program {
  id: number;
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
export class ProgramsListComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  programs: Program[] = [];
  allPrograms: Program[] = [];

  // Selection
  selectedPrograms = new Set<number>();

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

  constructor() {
    // Sample data based on the screenshot
    this.allPrograms = [
      {
        id: 1,
        name: 'Kabir copy 2025-10-22 19:07:07',
        programCoordinator: 'Preacher',
        initiativeName: 'Initiative',
        projectName: 'Project',
        taskBranch: 'Nurmahal',
        startDateTime: '22/10/2025 12:00 am',
        endDateTime: '24/10/2025 12:00 am',
        status: 'Completed',
        createdAt: '22/10/2025 07:07 pm'
      },
      {
        id: 2,
        name: 'Bhandara 4 Oct 2025 (Test) copy 2025-10-22 19:29:17',
        programCoordinator: 'Preacher',
        initiativeName: 'Initiative',
        projectName: 'Project',
        taskBranch: 'Nurmahal',
        startDateTime: '22/10/2025 12:00 am',
        endDateTime: '24/10/2025 12:00 am',
        status: 'Completed',
        createdAt: '22/10/2025 07:29 pm'
      }
    ];

    // Generate more sample records
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Kapurthala'];
    const statuses: Program['status'][] = ['Completed', 'Pending', 'In Progress', 'Cancelled'];
    const coordinators = ['Preacher', 'Coordinator 1', 'Coordinator 2'];
    const initiatives = ['Initiative', 'Initiative A', 'Initiative B'];
    const projects = ['Project', 'Project X', 'Project Y'];
    
    for (let i = 2; i < 25; i++) {
      const date = new Date(2025, 9, 22 + (i % 10));
      const startDate = this.formatDate(date);
      const endDate = this.formatDate(new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000));
      const createdAt = this.formatDate(new Date(date.getTime() + 7 * 60 * 60 * 1000), true);
      
      this.allPrograms.push({
        id: i + 1,
        name: `Program ${i + 1} ${startDate} ${createdAt.split(' ')[1]} ${createdAt.split(' ')[2]}`,
        programCoordinator: coordinators[i % coordinators.length],
        initiativeName: initiatives[i % initiatives.length],
        projectName: projects[i % projects.length],
        taskBranch: branches[i % branches.length],
        startDateTime: `${startDate} 12:00 am`,
        endDateTime: `${endDate} 12:00 am`,
        status: statuses[i % statuses.length],
        createdAt: createdAt
      });
    }

    this.applyFilters();
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
  toggleSelectProgram(id: number, event: Event) {
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

  trackById(index: number, program: Program): number {
    return program.id;
  }
}
