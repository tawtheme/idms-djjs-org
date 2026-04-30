import { Component, HostListener, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';
import { DataService } from '../../../data.service';

export interface VolunteerCard {
  id: number;
  image?: string;
  name: string;
  relationName?: string;
  fatherName?: string;
  phone?: string;
  mobileNo?: string;
  uid?: string;
  sewa?: string;
  gender?: string;
  unallocationReason?: string;
  enterBy?: string;
  createdAt?: Date;
  address?: {
    taskBranch?: string;
    correspondingBranch?: string;
  };
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PagerComponent,
    DropdownComponent,
    DatepickerComponent,
    EmptyStateComponent,
    IconComponent,
    ImagePreviewDirective
  ],
  selector: 'app-volunteer-cards',
  templateUrl: './volunteer-cards.component.html',
  styleUrls: ['./volunteer-cards.component.scss']
})
export class VolunteerCardsComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;
  private dataService = inject(DataService);
  isLoading = false;
  isExporting = false;

  volunteerCards: VolunteerCard[] = [];
  allVolunteerCards: VolunteerCard[] = [];

  // Selection
  selectedCards = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedSewa: any[] = [];
  sewaOptions: DropdownOption[] = [];
  
  // Filters panel
  filtersExpanded = true;
  taskBranchOptions: DropdownOption[] = [];
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [
    { id: 'both', label: 'In Both', value: 'both' }
  ];
  filterOptionsDropdown: DropdownOption[] = [];

  moreFilters: any = {
    taskBranch: [],
    correspondingBranch: [],
    branchSearchType: [],
    badgeNo: '',
    name: '',
    relationName: '',
    mobileNo: '',
    uid: '',
    options: [],
    startFrom: '',
    endTo: ''
  };

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Volunteer Management', route: '/volunteer-cards' },
    { label: 'Volunteer Cards', route: '/volunteer-cards' }
  ];

  constructor() {
    this.allVolunteerCards = [];

    this.genderOptions = [
      { id: 'MALE', label: 'MALE', value: 'MALE' },
      { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
      { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
    ];

    this.sewaOptions = [];
  }

  ngOnInit(): void {
    this.loadBranches();
    this.loadSewaOptions();
  }

  private loadSewaOptions(): void {
    this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } }).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const sewas = response?.data?.sewas || response?.data || response || [];
      this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
        id: String(s.id),
        label: s.name || s.sewa_name || '',
        value: String(s.id)
      }));
    });
  }

  private loadBranches(): void {
    this.dataService.get<any>('v1/options/branches').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
      const options: DropdownOption[] = (Array.isArray(data) ? data : []).map((branch: any) => ({
        id: String(branch.id),
        label: branch.name || branch.label || branch.title || '',
        value: String(branch.id)
      }));
      this.taskBranchOptions = options;
      this.correspondingBranchOptions = options;
    });
  }

  private buildPayload(): Record<string, string> {
    const firstValue = (arr: any[]): string => {
      const v = arr?.[0];
      if (v == null) return '';
      return typeof v === 'object' ? String(v.value ?? v.id ?? '') : String(v);
    };
    const orderBy = this.sortField ? this.sortDirection : '';
    return {
      branch_id: firstValue(this.moreFilters.taskBranch),
      home_branch: firstValue(this.moreFilters.correspondingBranch),
      branch_type: firstValue(this.moreFilters.branchSearchType),
      sewa_id: firstValue(this.selectedSewa),
      badge_id: (this.moreFilters.badgeNo || '').trim(),
      gender: firstValue(this.selectedGender),
      name: (this.moreFilters.name || '').trim(),
      relation_name: (this.moreFilters.relationName || '').trim(),
      mobile_number: (this.moreFilters.mobileNo || '').trim(),
      unique_id: (this.moreFilters.uid || '').trim(),
      card_option: firstValue(this.moreFilters.options),
      sewa_assigned: '',
      sewa_mode: '',
      sortByColumn: this.sortField || '',
      orderBy,
      per_page: String(this.pageSize),
      page: String(this.currentPage)
    };
  }

  loadCards(): void {
    this.isLoading = true;
    const payload = this.buildPayload();
    this.dataService.post<any>('v1/users/cards', payload).pipe(
      catchError((err) => {
        console.error('Error loading volunteer cards:', err);
        this.isLoading = false;
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response?.data || response?.results || response || [];
      const meta = response?.meta || response?.pagination || null;
      this.volunteerCards = (Array.isArray(data) ? data : []).map((item: any) => this.mapCard(item));
      this.allVolunteerCards = this.volunteerCards;
      this.totalItems = meta ? (meta.total ?? meta.total_count ?? this.volunteerCards.length) : this.volunteerCards.length;
      this.isLoading = false;
    });
  }

  private mapCard(item: any): VolunteerCard {
    const profile = item.user_profile || {};
    return {
      id: item.user_unique_id ?? item.unique_id ?? item.id ?? 0,
      image: item.full_path || item.image_url || item.image || '',
      name: item.user_name || item.name || '',
      relationName: item.relation_name || item.spouse_name || profile.spouse_name || '',
      fatherName: item.father_name || profile.father_name || '',
      phone: item.phone || item.mobile_number || '',
      mobileNo: item.mobile_number || item.phone || '',
      uid: String(item.user_unique_id ?? item.unique_id ?? ''),
      sewa: item.sewa_name || '',
      gender: item.gender || profile.gender || '',
      address: {
        taskBranch: item.working_branch || '',
        correspondingBranch: item.home_branch || ''
      },
      createdAt: item.created_at ? new Date(item.created_at) : undefined
    };
  }

  get pagedCards(): VolunteerCard[] {
    return this.volunteerCards;
  }

  trackById(_: number, card: VolunteerCard): number {
    return card.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  toggleFiltersPanel(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  hasAnyActiveFilter(): boolean {
    return this.selectedGender.length > 0 ||
      this.selectedSewa.length > 0 ||
      this.moreFilters.taskBranch.length > 0 ||
      this.moreFilters.correspondingBranch.length > 0 ||
      this.moreFilters.branchSearchType.length > 0 ||
      !!this.moreFilters.badgeNo ||
      !!this.moreFilters.name ||
      !!this.moreFilters.relationName ||
      !!this.moreFilters.mobileNo ||
      !!this.moreFilters.uid ||
      this.moreFilters.options.length > 0 ||
      !!this.moreFilters.startFrom ||
      !!this.moreFilters.endTo;
  }

  totalActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedGender.length > 0) count++;
    if (this.selectedSewa.length > 0) count++;
    if (this.moreFilters.taskBranch.length > 0) count++;
    if (this.moreFilters.correspondingBranch.length > 0) count++;
    if (this.moreFilters.branchSearchType.length > 0) count++;
    if (this.moreFilters.badgeNo) count++;
    if (this.moreFilters.name) count++;
    if (this.moreFilters.relationName) count++;
    if (this.moreFilters.mobileNo) count++;
    if (this.moreFilters.uid) count++;
    if (this.moreFilters.options.length > 0) count++;
    if (this.moreFilters.startFrom) count++;
    if (this.moreFilters.endTo) count++;
    return count;
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedSewa = [];
    this.moreFilters = {
      taskBranch: [],
      correspondingBranch: [],
      branchSearchType: [],
      badgeNo: '',
      name: '',
      relationName: '',
      mobileNo: '',
      uid: '',
      options: [],
      startFrom: '',
      endTo: ''
    };
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilter();
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadCards();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCards();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
    this.loadCards();
  }

  // Selection handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedCards.forEach(card => this.selectedCards.add(card.id));
    } else {
      this.pagedCards.forEach(card => this.selectedCards.delete(card.id));
    }
  }

  toggleSelectCard(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedCards.has(id)) {
      this.selectedCards.delete(id);
    } else {
      this.selectedCards.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedCards.length > 0 &&
           this.pagedCards.every(card => this.selectedCards.has(card.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedCards.filter(card => this.selectedCards.has(card.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedCards.length;
  }

  // Action handlers
  getActionOptions(card: VolunteerCard): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'edit',
        label: 'Edit',
        value: 'edit',
        icon: 'edit'
      },
      {
        id: 'delete',
        label: 'Delete',
        value: 'delete',
        icon: 'delete',
        danger: true
      }
    ];
  }

  onAction(card: VolunteerCard, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(card);
    } else if (actionId === 'edit') {
      this.editCard(card);
    } else if (actionId === 'delete') {
      this.deleteCard(card);
    }
  }

  viewDetails(card: VolunteerCard): void {
    console.log('View card:', card);
  }

  editCard(card: VolunteerCard): void {
    console.log('Edit card:', card);
  }

  deleteCard(card: VolunteerCard): void {
    if (confirm(`Are you sure you want to delete ${card.name}?`)) {
      this.allVolunteerCards = this.allVolunteerCards.filter(c => c.id !== card.id);
      this.applyFilter();
    }
  }

  private buildExportAllPayload(choice: 'web' | 'email'): Record<string, unknown> {
    const firstValue = (arr: any[]): string => {
      const v = arr?.[0];
      if (v == null) return '';
      return typeof v === 'object' ? String(v.value ?? v.id ?? '') : String(v);
    };
    return {
      exportChoice: choice,
      is_export: '1',
      home_branch: firstValue(this.moreFilters.correspondingBranch),
      branch_id: firstValue(this.moreFilters.taskBranch),
      branch_type: firstValue(this.moreFilters.branchSearchType),
      sewa_id: firstValue(this.selectedSewa),
      badge_id: (this.moreFilters.badgeNo || '').trim(),
      gender: firstValue(this.selectedGender),
      name: (this.moreFilters.name || '').trim(),
      relation_name: (this.moreFilters.relationName || '').trim(),
      former_name: '',
      userStatus: '',
      mobile_number: (this.moreFilters.mobileNo || '').trim(),
      unique_id: (this.moreFilters.uid || '').trim(),
      sewa_interest: '',
      sewa_assigned: '',
      sewa_mode: '',
      sortByColumn: this.sortField || '',
      orderBy: this.sortField ? this.sortDirection : ''
    };
  }

  exportReport(choice: 'web' | 'email' = 'web'): void {
    this.isExporting = true;
    const hasSelection = this.selectedCards.size > 0;
    const url = hasSelection ? 'v1/export/batch/volunteer' : 'v1/export/all/volunteer';
    const payload: Record<string, unknown> = hasSelection
      ? { ids: Array.from(this.selectedCards).map(String), exportChoice: choice }
      : this.buildExportAllPayload(choice);
    this.dataService.post<any>(url, payload, { responseType: 'blob', observe: 'response' }).pipe(
      catchError(async (err) => {
        let message = err?.error?.message || err?.message || 'Failed to export.';
        if (err?.error instanceof Blob) {
          try {
            const text = await err.error.text();
            const json = JSON.parse(text);
            message = json?.message || message;
          } catch { /* ignore */ }
        }
        console.error('Error exporting volunteer cards:', message);
        this.isExporting = false;
        return null;
      })
    ).subscribe((response: any) => {
      this.isExporting = false;
      if (!response) return;
      const body: Blob = response.body;
      if (!body) return;

      if (body.type && body.type.includes('application/json')) {
        body.text().then(text => {
          try {
            const json = JSON.parse(text);
            const url = json.data?.downloadLink || json.data?.download_link || json.data?.url || json.url || json.file_url;
            if (url && choice === 'web') {
              const a = document.createElement('a');
              a.href = url;
              a.target = '_blank';
              a.rel = 'noopener';
              const fileName = url.split('/').pop() || 'export';
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } catch { /* ignore */ }
        });
        return;
      }

      const blob = new Blob([body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date();
      const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      a.download = `volunteer-cards-${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    });
  }
}

