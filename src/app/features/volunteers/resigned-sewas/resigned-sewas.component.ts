import { Component, HostListener, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

export interface ResignedSewa {
  id: number;
  uuid?: string; // UUID for API calls
  image?: string;
  userName: string;
  taskBranch: string;
  correspondingBranch: string;
  sewa: string;
  badgeNo: string;
  reason: string;
  resignedDate: string;
  enterBy?: string;
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
    IconComponent,
    ImagePreviewDirective
  ],
  selector: 'app-resigned-sewas',
  templateUrl: './resigned-sewas.component.html',
  styleUrls: ['./resigned-sewas.component.scss']
})
export class ResignedSewasComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  resignedSewas: ResignedSewa[] = [];
  allResignedSewas: ResignedSewa[] = [];

  // Loading and error states
  isLoading = true; // Start with true to show loader on initial load
  error: string | null = null;

  // Selection
  selectedResignedSewas = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  sortOrder: any[] = [];
  sortOrderOptions: DropdownOption[] = [];

  // Filter panel toggle
  filtersExpanded = false;

  // Inline filter options
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [];
  sewaOptions: DropdownOption[] = [];
  sewaInterestOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaAllocatedOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaModeOptions: DropdownOption[] = [
    { id: '1', label: 'Regular', value: 'regular' },
    { id: '2', label: 'Occasional', value: 'occasional' }
  ];

  moreFilters: any = {
    correspondingBranch: [],
    branchSearchType: [],
    sewa: [],
    sewaInterest: [],
    sewaAllocated: [],
    sewaMode: []
  };

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Manage Volunteers', route: '/volunteers' },
    { label: 'Resigned Sewas', route: '/volunteers/resigned-sewas' }
  ];

  constructor() {
    this.buildFilterOptions();
  }

  ngOnInit(): void {
    this.loadResignedSewas();
  }

  /**
   * Builds filter options
   */
  private buildFilterOptions(): void {
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.sortOrderOptions = [
      { id: '0', label: 'None', value: '' },
      { id: '1', label: 'Name (ASC)', value: 'name:asc' },
      { id: '2', label: 'Name (DESC)', value: 'name:desc' },
      { id: '3', label: 'Id (ASC)', value: 'id:asc' },
      { id: '4', label: 'Id (DESC)', value: 'id:desc' }
    ];

    // Task branch options will be populated from API data
    this.taskBranchOptions = [];

    this.correspondingBranchOptions = [];

    this.branchSearchTypeOptions = [
      { id: '1', label: 'Exact Match', value: 'exact' },
      { id: '2', label: 'Contains', value: 'contains' },
      { id: '3', label: 'Starts With', value: 'startsWith' }
    ];

    this.sewaOptions = [];
  }

  /**
   * Loads resigned sewas from the API
   */
  loadResignedSewas(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>('v1/unassigned-regular-sewas').pipe(
      catchError((error) => {
        console.error('Error loading resigned sewas:', error);
        this.error = error.error?.message || error.message || 'Failed to load resigned sewas. Please try again.';
        this.isLoading = false; // Set loading to false on error
        return of({ data: [] }); // Return empty array to prevent breaking
      }),
      finalize(() => {
        // Loading state is managed in catchError and subscribe
      })
    ).subscribe((response) => {
      // Handle different response structures
      const sewasData = response.data || response.sewas || response.results || response || [];
      
      // Map API response to ResignedSewa interface
      this.allResignedSewas = (Array.isArray(sewasData) ? sewasData : []).map((item: any) => {
        // Get first image from user_images array if available
        const firstImage = item.user_images && item.user_images.length > 0 
          ? item.user_images[0].full_path 
          : null;

        // Extract address information
        const userAddress = item.user_address || {};
        const addressArray = Array.isArray(userAddress) ? userAddress : [userAddress];
        const primaryAddress = addressArray[0] || {};

        // Extract sewa information
        const regularSewa = item.regular_sewa || {};
        const sewaArray = Array.isArray(regularSewa) ? regularSewa : [regularSewa];
        const primarySewa = sewaArray[0] || {};

        // Format resigned date
        const resignedDate = item.resigned_date || item.resigned_at || item.created_at || '';
        let formattedDate = '';
        if (resignedDate) {
          try {
            const date = new Date(resignedDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours() % 12 || 12).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = date.getHours() >= 12 ? 'pm' : 'am';
            formattedDate = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
          } catch (e) {
            formattedDate = resignedDate;
          }
        }

        const resignedSewa: ResignedSewa = {
          id: item.unique_id || item.id || 0,
          uuid: item.id, // Store UUID for API calls
          image: firstImage,
          userName: item.name || item.user_name || '',
          taskBranch: primaryAddress.task_branch || item.task_branch || '',
          correspondingBranch: primaryAddress.corresponding_branch || item.corresponding_branch || '',
          sewa: primarySewa.sewa_name || primarySewa.name || item.sewa_name || '',
          badgeNo: item.badge_no || item.badge_number || '',
          reason: item.resignation_reason || item.reason || '',
          resignedDate: formattedDate,
          enterBy: item.entered_by || item.created_by || ''
        };
        
        return resignedSewa;
      });

      // Update filter options from API data
      this.updateFilterOptions();

      this.applyFilter();
      this.isLoading = false; // Set loading to false after data is processed
    });
  }

  /**
   * Updates filter options from loaded data
   */
  private updateFilterOptions(): void {
    // Update task branch options
    const taskBranches = new Set<string>();
    this.allResignedSewas.forEach(sewa => {
      if (sewa.taskBranch) taskBranches.add(sewa.taskBranch);
    });

    this.taskBranchOptions = Array.from(taskBranches).sort().map((branch, index) => ({
      id: String(index + 1),
      label: branch,
      value: branch
    }));

    // Update corresponding branch options
    const correspondingBranches = new Set<string>();
    this.allResignedSewas.forEach(sewa => {
      if (sewa.correspondingBranch) correspondingBranches.add(sewa.correspondingBranch);
    });

    this.correspondingBranchOptions = Array.from(correspondingBranches).sort().map((branch, index) => ({
      id: String(index + 1),
      label: branch,
      value: branch
    }));

    // Update sewa options
    const sewas = new Set<string>();
    this.allResignedSewas.forEach(sewa => {
      if (sewa.sewa) sewas.add(sewa.sewa);
    });

    this.sewaOptions = Array.from(sewas).sort().map((sewa, index) => ({
      id: String(index + 1),
      label: sewa,
      value: sewa
    }));
  }

  get filteredResignedSewas(): ResignedSewa[] {
    return this.resignedSewas;
  }

  get pagedResignedSewas(): ResignedSewa[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.resignedSewas.slice(start, start + this.pageSize);
  }

  trackById(_: number, r: ResignedSewa): number {
    return r.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedTaskBranch = [];
    this.sortOrder = [];
    this.moreFilters = {
      correspondingBranch: [],
      branchSearchType: [],
      sewa: [],
      sewaInterest: [],
      sewaAllocated: [],
      sewaMode: []
    };
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const taskBranch = this.selectedTaskBranch[0] || '';
    const sewa = this.moreFilters.sewa[0] || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0] || '';

    // Filter resigned sewas
    let filtered = this.allResignedSewas.filter((r) => {
      const matchesTerm = !term ||
        r.userName.toLowerCase().includes(term) ||
        r.badgeNo.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term);

      const matchesTaskBranch = !taskBranch || r.taskBranch === taskBranch;
      const matchesSewa = !sewa || r.sewa === sewa;
      const matchesCorrespondingBranch = !correspondingBranch || r.correspondingBranch === correspondingBranch;

      return matchesTerm && matchesTaskBranch && matchesSewa && matchesCorrespondingBranch;
    });

    // Apply sorting
    const sortOrderValue = this.sortOrder[0]?.value || '';

    if (sortOrderValue) {
      const [sortField, orderDirection] = sortOrderValue.split(':');
      const orderByValue = orderDirection || 'asc';

      filtered = [...filtered].sort((a: ResignedSewa, b: ResignedSewa) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.userName.toLowerCase();
            bValue = b.userName.toLowerCase();
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return orderByValue === 'asc' ? -1 : 1;
        if (aValue > bValue) return orderByValue === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.resignedSewas = filtered;
    this.totalItems = this.resignedSewas.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  // Selection handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedResignedSewas.forEach(r => this.selectedResignedSewas.add(r.id));
    } else {
      this.pagedResignedSewas.forEach(r => this.selectedResignedSewas.delete(r.id));
    }
  }

  toggleSelectResignedSewa(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedResignedSewas.has(id)) {
      this.selectedResignedSewas.delete(id);
    } else {
      this.selectedResignedSewas.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedResignedSewas.length > 0 && 
           this.pagedResignedSewas.every(r => this.selectedResignedSewas.has(r.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedResignedSewas.filter(r => this.selectedResignedSewas.has(r.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedResignedSewas.length;
  }

  // Action handlers
  getActionOptions(resignedSewa: ResignedSewa): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'reactivate',
        label: 'Reactivate',
        value: 'reactivate',
        icon: 'refresh'
      }
    ];
  }

  onAction(resignedSewa: ResignedSewa, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(resignedSewa);
    } else if (actionId === 'reactivate') {
      this.reactivateSewa(resignedSewa);
    }
  }

  viewDetails(resignedSewa: ResignedSewa): void {
    console.log('View resigned sewa:', resignedSewa);
  }

  reactivateSewa(resignedSewa: ResignedSewa): void {
    if (confirm(`Reactivate ${resignedSewa.userName}?`)) {
      console.log('Reactivate sewa:', resignedSewa.id);
      // Remove from resigned list and move to active volunteers
    }
  }

  // Filter panel
  toggleFiltersPanel(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  totalActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedGender.length > 0) count++;
    if (this.selectedTaskBranch.length > 0) count++;
    if (this.sortOrder.length > 0 && this.sortOrder[0]?.value) count++;
    count += this.activeMoreFiltersCount();
    return count;
  }

  hasActiveMoreFilters(): boolean {
    return this.activeMoreFiltersCount() > 0;
  }

  activeMoreFiltersCount(): number {
    return Object.values(this.moreFilters).filter((v: any) => Array.isArray(v) && v.length > 0).length;
  }

  hasAnyActiveFilter(): boolean {
    return !!this.searchTerm || this.selectedGender.length > 0 ||
      this.selectedTaskBranch.length > 0 ||
      (this.sortOrder.length > 0 && !!this.sortOrder[0]?.value) ||
      this.hasActiveMoreFilters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      // Handle any click outside logic if needed
    }
  }
}

