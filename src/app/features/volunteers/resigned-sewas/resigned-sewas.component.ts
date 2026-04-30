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
import { OptionsService } from '../../../core/services/options.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';

export interface ResignedSewa {
  id: number;
  uuid?: string; // UUID for API calls
  userId?: string;
  image?: string;
  userName: string;
  taskBranch: string;
  correspondingBranch: string;
  sewa: string;
  badgeNo: string;
  reason: string;
  resignedDate: string;
  enterBy?: string;
  sewaNoInterestReason?: string;
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
    ImagePreviewDirective,
    ModalComponent,
    DatepickerComponent
  ],
  selector: 'app-resigned-sewas',
  templateUrl: './resigned-sewas.component.html',
  styleUrls: ['./resigned-sewas.component.scss']
})
export class ResignedSewasComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);
  private optionsService = inject(OptionsService);
  private snackbar = inject(SnackbarService);

  resignedSewas: ResignedSewa[] = [];
  allResignedSewas: ResignedSewa[] = [];

  // Loading and error states
  isLoading = false;
  isExporting = false;
  error: string | null = null;

  // Reinstate modal
  isReinstateModalOpen = false;
  isSubmittingReinstate = false;
  reinstateTarget: ResignedSewa | null = null;
  reinstateForm: { date: Date | null; sewa: any[]; remarks: string } = {
    date: new Date(),
    sewa: [],
    remarks: ''
  };

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
    sewaMode: [],
    badgeNo: '',
    name: '',
    relationName: '',
    mobileNo: '',
    uid: '',
    address: ''
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
    this.loadTaskBranchOptions();
    this.loadSewaOptions();
    this.loadResignedSewas();
  }

  private loadTaskBranchOptions(): void {
    this.optionsService.getBranches().pipe(
      catchError((error) => {
        console.error('Error loading task branch options:', error);
        return of([] as DropdownOption[]);
      })
    ).subscribe(options => {
      this.taskBranchOptions = options;
    });
  }

  private loadSewaOptions(): void {
    this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } }).pipe(
      catchError((error) => {
        console.error('Error loading sewa options:', error);
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const sewas = response?.data?.sewas || response?.data || response || [];
      this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
        id: String(s.id),
        label: s.name || s.sewa_name || '',
        value: String(s.id)
      }));
    });
  }

  /**
   * Builds filter options
   */
  private buildFilterOptions(): void {
    this.genderOptions = [
      { id: 'MALE', label: 'MALE', value: 'MALE' },
      { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
      { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
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
   * Builds query params from current filter state
   */
  private buildSearchParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const taskBranch = this.selectedTaskBranch[0];
    const sewa = this.moreFilters.sewa[0];
    const gender = this.selectedGender[0];

    if (taskBranch !== undefined && taskBranch !== '') params['task_branch_id'] = String(taskBranch);
    if (sewa !== undefined && sewa !== '') params['sewa_id'] = String(sewa);
    if (gender !== undefined && gender !== '') params['gender'] = String(gender);
    if (this.moreFilters.badgeNo) params['badge_no'] = this.moreFilters.badgeNo.trim();
    if (this.moreFilters.name) params['name'] = this.moreFilters.name.trim();
    if (this.moreFilters.relationName) params['relation_name'] = this.moreFilters.relationName.trim();
    if (this.moreFilters.mobileNo) params['mobile_no'] = this.moreFilters.mobileNo.trim();
    if (this.moreFilters.uid) params['uid'] = this.moreFilters.uid.trim();
    if (this.moreFilters.address) params['address'] = this.moreFilters.address.trim();

    return params;
  }

  /**
   * Loads resigned sewas from the API
   */
  loadResignedSewas(): void {
    this.isLoading = true;
    this.error = null;

    const params = this.buildSearchParams();

    this.dataService.get<any>('v1/unassigned-regular-sewas', { params }).pipe(
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
        const user = item.user || {};
        const address = user.user_correspondence_address || {};
        const workingBranch = address.working_branch || {};
        const homeBranch = address.home_branch || {};

        const resignedSewa: ResignedSewa = {
          id: user.unique_id || 0,
          uuid: item.id,
          userId: item.user_id || user.id || '',
          image: user.user_image?.full_path || null,
          userName: user.name || '',
          taskBranch: item.branch?.name || workingBranch.name || '',
          correspondingBranch: homeBranch.name || '',
          sewa: item.sewa?.name || '',
          badgeNo: item.badge_id != null ? String(item.badge_id) : '',
          reason: (item.reason || '').trim(),
          resignedDate: item.updated_at || '',
          enterBy: item.unassigned_by?.name || '',
          sewaNoInterestReason: user.user_profile?.sewa_no_interest_reason || ''
        };

        return resignedSewa;
      });

      // Update filter options from API data
      this.updateFilterOptions();

      this.applyClientFilter();
      this.isLoading = false; // Set loading to false after data is processed
    });
  }

  /**
   * Updates filter options from loaded data
   */
  private updateFilterOptions(): void {
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
    // No-op: filtering is now triggered explicitly via the Search button.
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
      sewaMode: [],
      badgeNo: '',
      name: '',
      relationName: '',
      mobileNo: '',
      uid: '',
      address: ''
    };
    this.loadResignedSewas();
  }

  applyFilter(): void {
    this.loadResignedSewas();
  }

  private applyClientFilter(): void {
    let filtered = [...this.allResignedSewas];

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
    const options: MenuOption[] = [];
    if ((resignedSewa.sewaNoInterestReason || '').trim().toLowerCase() !== 'dead') {
      options.push({
        id: 'reinstate',
        label: 'Reinstate User',
        value: 'reinstate',
        icon: 'refresh'
      });
    }
    return options;
  }

  onAction(resignedSewa: ResignedSewa, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    if (actionId === 'reinstate') {
      this.reinstateUser(resignedSewa);
    }
  }

  exportReport(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    const params: any = { ...this.buildSearchParams(), is_export: 1, export_type: 'excel' };

    this.dataService.get<any>('v1/unassigned-regular-sewas', { params, responseType: 'blob', observe: 'response' }).pipe(
      catchError((error) => {
        console.error('Error exporting resigned sewas:', error);
        this.snackbar.showError(error?.error?.message || 'Failed to export resigned sewas.');
        return of(null);
      }),
      finalize(() => { this.isExporting = false; })
    ).subscribe((response: any) => {
      this.handleExportResponse(response, `resigned-sewas_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  private handleExportResponse(response: any, fallbackName: string): void {
    if (!response) return;
    const body: Blob | undefined = response.body;
    const headers = response.headers;

    if (body && body.type && body.type.includes('application/json')) {
      body.text().then((txt: string) => {
        try {
          const parsed = JSON.parse(txt);
          const url = parsed?.data?.downloadLink
            || parsed?.data?.download_link
            || parsed?.data?.url
            || parsed?.url
            || parsed?.download_url;
          if (url) {
            this.triggerBrowserDownload(url, this.filenameFromUrl(url) || fallbackName);
            this.snackbar.showSuccess(parsed?.message || 'Successfully downloaded.');
          } else {
            this.snackbar.showError(parsed?.message || 'Export response did not include a download link.');
          }
        } catch {
          this.snackbar.showError('Export response was not a downloadable file.');
        }
      });
      return;
    }

    if (!body) return;

    const filename = this.extractFilename(headers?.get?.('content-disposition')) || fallbackName;
    const blob = new Blob([body], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    this.triggerBrowserDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.snackbar.showSuccess('Successfully downloaded.');
  }

  private triggerBrowserDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private filenameFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return last ? decodeURIComponent(last) : null;
    } catch {
      return null;
    }
  }

  private extractFilename(disposition: string | null | undefined): string | null {
    if (!disposition) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return match ? decodeURIComponent(match[1]) : null;
  }

  reinstateUser(resignedSewa: ResignedSewa): void {
    this.reinstateTarget = resignedSewa;
    this.reinstateForm = {
      date: new Date(),
      sewa: [],
      remarks: ''
    };
    this.isReinstateModalOpen = true;
  }

  closeReinstateModal(): void {
    this.isReinstateModalOpen = false;
    this.reinstateTarget = null;
    this.isSubmittingReinstate = false;
  }

  submitReinstate(): void {
    if (this.isSubmittingReinstate || !this.reinstateTarget) return;

    const sewaIds = (this.reinstateForm.sewa || []).map((s: any) => String(s));
    if (sewaIds.length === 0) {
      this.snackbar.showError('Please select at least one sewa.');
      return;
    }

    if (!this.reinstateForm.date) {
      this.snackbar.showError('Please select a date.');
      return;
    }

    this.isSubmittingReinstate = true;
    const payload = {
      reinst_sewa: sewaIds,
      reinstatement_user_id: this.reinstateTarget.userId,
      reinstatement_status_change: 'Active',
      date: this.formatDateIso(this.reinstateForm.date),
      remarks: (this.reinstateForm.remarks || '').trim()
    };

    this.dataService.put<any>('v1/users/reinstatement', payload).pipe(
      catchError((error) => {
        console.error('Error reinstating user:', error);
        this.snackbar.showError(error?.error?.message || 'Failed to reinstate user.');
        return of(null);
      }),
      finalize(() => { this.isSubmittingReinstate = false; })
    ).subscribe((response: any) => {
      if (!response) return;
      this.snackbar.showSuccess(response?.message || 'User reinstated successfully.');
      this.closeReinstateModal();
      this.loadResignedSewas();
    });
  }

  private formatDateIso(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
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
    return Object.values(this.moreFilters).filter((v: any) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      return false;
    }).length;
  }

  hasAnyActiveFilter(): boolean {
    return this.selectedGender.length > 0 ||
      this.selectedTaskBranch.length > 0 ||
      this.hasActiveMoreFilters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      // Handle any click outside logic if needed
    }
  }
}

