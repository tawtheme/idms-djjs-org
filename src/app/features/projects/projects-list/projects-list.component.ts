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
import { AddProjectModalComponent } from './add-project-modal/add-project-modal.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Project {
  id: string;
  name: string;
  projectHead: string;
  initiativeName: string;
  description: string;
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
    DropdownComponent,
    AddProjectModalComponent,
    IconComponent
  ],
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  projects: Project[] = [];
  allProjects: Project[] = [];

  // Loading state
  isLoading = true; // Start with true to show loader on initial load

  // Modal state
  isAddModalOpen = false;

  // Selection
  selectedProjects = new Set<string>();

  // Filters
  searchTerm = '';
  taskBranch: string = '';

  // Filter dropdown options
  readonly taskBranchOptions: DropdownOption[] = [
    { id: '0', label: 'Task Branch', value: '' }
    // TODO: Load actual branch options from API
  ];

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Projects', route: '/projects' },
    { label: 'Projects List', route: '/projects' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * Load projects from /api/v1/projects using POST (API does not allow GET)
   */
  private loadProjects(): void {
    this.isLoading = true;
    // Backend for /api/v1/projects only supports POST, so use post with an empty payload
    this.dataService.post<any>('v1/projects', {}).pipe(
      catchError((error) => {
        console.error('Error loading projects:', error);
        this.isLoading = false;
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allProjects = (Array.isArray(data) ? data : []).map((item: any) => {
        // Map status numeric/boolean to label
        let statusLabel = 'Inactive';
        if (item.status === 1 || item.status === true || item.status === 'active') {
          statusLabel = 'Active';
        }

        return {
          id: String(item.id),
          name: item.name || '',
          projectHead: item.user?.name || item.project_head || '',
          initiativeName: item.initiative?.name || '',
          description: item.description || '',
          status: statusLabel,
          createdAt: item.created_at || ''
        } as Project;
      });

      this.isLoading = false;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let filtered = [...this.allProjects];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(search) ||
        project.projectHead.toLowerCase().includes(search) ||
        project.initiativeName.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search)
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

    this.projects = filtered;
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
  get pagedProjects(): Project[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.projects.slice(start, end);
  }

  // Selection
  toggleSelectProject(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedProjects.has(id)) {
      this.selectedProjects.delete(id);
    } else {
      this.selectedProjects.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedProjects.clear();
    } else {
      this.pagedProjects.forEach(project => this.selectedProjects.add(project.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedProjects.length > 0 &&
           this.pagedProjects.every(project => this.selectedProjects.has(project.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedProjects.filter(project => this.selectedProjects.has(project.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedProjects.length;
  }

  // Actions
  getActionOptions(project: Project): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(project: Project, option: MenuOption): void {
    console.log('Action:', option.value, 'on project:', project);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, project: Project): string {
    return project.id;
  }

  /**
   * Handle task branch selection change
   */
  onTaskBranchChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.taskBranch = values[0];
    } else {
      this.taskBranch = '';
    }
    this.applyFilters();
  }

  /**
   * Open the add project modal
   */
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  /**
   * Close the add project modal
   */
  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  /**
   * Handle form submission from add project modal
   */
  onAddProjectSubmit(data: { 
    name: string; 
    projectHead: string; 
    initiative: string; 
    description: string; 
    status: string 
  }): void {
    console.log('Add project:', data);
    // TODO: Implement API call to add project
    // For now, just close the modal
    this.closeAddModal();
  }
}


