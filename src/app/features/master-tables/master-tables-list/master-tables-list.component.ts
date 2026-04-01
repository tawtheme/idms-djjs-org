import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AddMasterEntryModalComponent, MasterEntryFormData } from './add-master-entry-modal/add-master-entry-modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataService } from '../../../data.service';
import { SearchService, SearchState } from '../../../core/services/search.service';
import { SortService, SortState } from '../../../core/services/sort.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BasePaginatedList } from '../../../shared/pagination/base-paginated-list';
import { IconComponent } from '../../../shared/components/icon/icon.component';

type MasterType =
  | 'skills' | 'banks' | 'degrees' | 'professions' | 'languages' | 'dress_codes'
  | 'castes' | 'newspapers' | 'countries' | 'states' | 'districts' | 'cities'
  | 'ashram_adhaar_areas' | 'weapon_types' | 'technical_qualifications';

interface MasterConfig {
  type: MasterType;
  label: string;
  endpoint: string;
  storeEndpoint: string;
}

export interface MasterRecord {
  id: string;
  name: string;
  createdAt: string;
  status?: string;
  extra1?: string;
  extra2?: string;
}

const EXTRA_FIELD_KEYS = [
  'branch', 'ifsc_code', 'address', 'country', 'state', 'city', 'district',
  'phone_primary', 'phone_secondary', 'remarks'
];

const ID_FIELD_MAPPINGS: Record<string, string> = {
  countryId: 'country_id',
  stateId: 'state_id',
  districtId: 'district_id',
  cityId: 'city_id'
};

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, BreadcrumbComponent, PagerComponent,
    EmptyStateComponent, MenuDropdownComponent, LoadingComponent,
    AddMasterEntryModalComponent, ConfirmationDialogComponent,
    IconComponent
  ],
  selector: 'app-master-tables-list',
  templateUrl: './master-tables-list.component.html',
  styleUrls: ['./master-tables-list.component.scss'],
  providers: [SortService]
})
export class MasterTablesListComponent extends BasePaginatedList implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly searchService = inject(SearchService);
  private readonly sortService = inject(SortService);
  private searchSubscription?: Subscription;
  private sortSubscription?: Subscription;

  readonly masterConfigs: MasterConfig[] = [
    { type: 'skills', label: 'Skills', endpoint: 'v1/skills', storeEndpoint: 'v1/skills/store' },
    { type: 'banks', label: 'Banks', endpoint: 'v1/banks', storeEndpoint: 'v1/banks/store' },
    { type: 'degrees', label: 'Degrees', endpoint: 'v1/degrees', storeEndpoint: 'v1/degrees/store' },
    { type: 'professions', label: 'Professions', endpoint: 'v1/professions', storeEndpoint: 'v1/professions/store' },
    { type: 'languages', label: 'Languages', endpoint: 'v1/languages', storeEndpoint: 'v1/languages/store' },
    { type: 'dress_codes', label: 'Dress Codes', endpoint: 'v1/dress_codes', storeEndpoint: 'v1/dress_codes/store' },
    { type: 'castes', label: 'Castes', endpoint: 'v1/castes', storeEndpoint: 'v1/castes/store' },
    { type: 'newspapers', label: 'Newspapers', endpoint: 'v1/newspapers', storeEndpoint: 'v1/newspapers/store' },
    { type: 'countries', label: 'Countries', endpoint: 'v1/countries', storeEndpoint: 'v1/countries/store' },
    { type: 'states', label: 'States', endpoint: 'v1/states', storeEndpoint: 'v1/states/store' },
    { type: 'districts', label: 'Districts', endpoint: 'v1/districts', storeEndpoint: 'v1/districts/store' },
    { type: 'cities', label: 'Cities', endpoint: 'v1/cities', storeEndpoint: 'v1/cities/store' },
    { type: 'ashram_adhaar_areas', label: 'Ashram Adhaar Areas', endpoint: 'v1/ashram_adhaar_areas', storeEndpoint: 'v1/ashram_adhaar_areas/store' },
    { type: 'weapon_types', label: 'Weapon Types', endpoint: 'v1/weapon_types', storeEndpoint: 'v1/weapon_types/store' },
    { type: 'technical_qualifications', label: 'Technical Qualifications', endpoint: 'v1/technical_qualifications', storeEndpoint: 'v1/technical_qualifications/store' }
  ];

  selectedMasterType: MasterType = 'skills';
  records: MasterRecord[] = [];
  searchTerm = '';

  isAddModalOpen = false;
  isEditMode = false;
  editingInitialData: MasterEntryFormData | null = null;
  isDeleteDialogOpen = false;
  recordToDelete: MasterRecord | null = null;

  get selectedMasterConfig(): MasterConfig {
    return this.masterConfigs.find(m => m.type === this.selectedMasterType)!;
  }

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Master Tables', route: '/master-tables' },
      { label: this.selectedMasterConfig.label, route: '/master-tables' }
    ];
  }

  ngOnInit(): void {
    this.initSearch();
  }

  private initSearch(): void {
    this.cleanupSubscriptions();

    const search$ = this.searchService.createSearch<any>(this.selectedMasterConfig.endpoint, {
      defaultPageSize: this.pageSize,
      debounceTime: 300,
      enableCache: true
    });

    this.searchSubscription = search$.subscribe(state => this.handleSearchUpdate(state));
    this.searchService.search(this.searchTerm);

    this.sortSubscription = this.sortService.sortState$.subscribe(sort => {
      if (sort.field) this.searchService.updateSort(sort.field, sort.direction);
    });
  }

  private handleSearchUpdate(state: SearchState<any>): void {
    this.isLoading = state.loading;
    this.error = state.error;

    let results = state.results.map(item => this.mapToRecord(item));
    this.applyClientSideSort(results);

    this.records = results;
    this.totalItems = state.total;
    this.currentPage = state.currentPage;
  }

  private applyClientSideSort(results: MasterRecord[]): void {
    const currentSort = this.sortService.currentSort;
    if (!currentSort.field || results.length === 0) return;

    results.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (currentSort.field === 'createdAt') {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else {
        aVal = String((a as any)[currentSort.field] || '').toLowerCase();
        bVal = String((b as any)[currentSort.field] || '').toLowerCase();
      }

      if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private cleanupSubscriptions(): void {
    this.searchSubscription?.unsubscribe();
    this.sortSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  onTabSelect(type: MasterType): void {
    if (this.selectedMasterType === type) return;
    this.selectedMasterType = type;
    this.currentPage = 1;
    this.searchTerm = '';
    this.sortService.reset();
    this.initSearch();
  }

  protected override loadPage(page: number = this.currentPage, pageSize: number = this.pageSize): void {
    this.searchService.searchWithParams({ page, perPage: pageSize });
  }

  onSearchInput(): void {
    this.searchService.search(this.searchTerm);
  }

  private mapToRecord(item: any): MasterRecord {
    const rawDate = item.created_at || item.createdAt || item.date || '';
    const record: MasterRecord = {
      id: String(item.id),
      name: item.name || '',
      createdAt: this.parseApiDate(rawDate),
      status: (item.status === 1 || item.status === true || item.status === 'active') ? 'Active' : 'Inactive'
    };

    if (['countries', 'states', 'cities'].includes(this.selectedMasterType)) {
      record.extra1 = item.code || item.iso_code || '';
      record.extra2 = item.parent_name || '';
    } else if (this.selectedMasterType === 'ashram_adhaar_areas') {
      record.extra1 = item.branch_name || '';
      record.extra2 = item.city || '';
    }
    return record;
  }

  /**
   * Normalizes non-standard API date strings (e.g. DD/MM/YYYY) to ISO-like format
   * for reliable parsing by Angular's DatePipe.
   */
  private parseApiDate(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;

    // If it's already an ISO string or similar, return as is
    if (dateStr.includes('T') || dateStr.includes('-')) return dateStr;

    // Handle DD/MM/YYYY format from API
    const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
    if (parts) {
      const [_, day, month, year, rest] = parts;
      // Convert to YYYY-MM-DD which is globally safe for Date constructors
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`;
    }

    return dateStr;
  }

  sortBy(field: string): void {
    this.sortService.toggleSort(field);
  }

  getSortIcon(field: string): string {
    return this.sortService.getSortIcon(field);
  }

  onAction(rec: MasterRecord, option: MenuOption): void {
    const action = option.value || option.id;
    if (action === 'edit') this.editRecord(rec);
    if (action === 'delete') this.deleteRecord(rec);
  }

  private editRecord(rec: MasterRecord): void {
    this.isEditMode = true;
    this.editingInitialData = { id: rec.id, name: rec.name, status: rec.status || 'Active' };
    this.isAddModalOpen = true;

    this.dataService.get<any>(`${this.selectedMasterConfig.endpoint}/${rec.id}`)
      .subscribe(res => {
        const item = res.data ?? res;
        this.editingInitialData = {
          id: String(item.id),
          name: item.name,
          status: (item.status === 1 || item.status === true || item.status === 'active') ? 'Active' : 'Inactive',
          ...this.extractExtraFields(item)
        };
      });
  }

  private extractExtraFields(item: any): Partial<MasterEntryFormData> {
    const data: any = {};
    EXTRA_FIELD_KEYS.forEach(k => { if (item[k]) data[k] = item[k]; });

    Object.entries(ID_FIELD_MAPPINGS).forEach(([dtoKey, apiKey]) => {
      if (item[apiKey]) data[dtoKey] = String(item[apiKey]);
    });
    return data;
  }

  private deleteRecord(rec: MasterRecord): void {
    this.recordToDelete = rec;
    this.isDeleteDialogOpen = true;
  }

  onConfirmDelete(): void {
    if (!this.recordToDelete) return;
    this.isLoading = true;
    this.dataService.delete(`${this.selectedMasterConfig.endpoint}/${this.recordToDelete.id}`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.isDeleteDialogOpen = false;
        this.recordToDelete = null;
      }))
      .subscribe(() => this.loadPage());
  }

  onAddEntrySubmit(data: MasterEntryFormData): void {
    if (!data?.name?.trim()) return;

    const payload = {
      name: data.name.trim(),
      status: data.status === 'Active' ? 1 : 0,
      ...this.preparePayload(data)
    };

    this.isAddModalOpen = false;
    this.isLoading = true;

    const req = this.isEditMode
      ? this.dataService.put(`${this.selectedMasterConfig.endpoint}/${data.id}`, payload)
      : this.dataService.post(this.selectedMasterConfig.storeEndpoint, payload);

    req.pipe(finalize(() => this.isLoading = false)).subscribe(() => this.loadPage());
  }

  private preparePayload(data: any): any {
    const payload: any = {};
    EXTRA_FIELD_KEYS.forEach(k => { if (data[k]) payload[k] = data[k]; });

    Object.entries(ID_FIELD_MAPPINGS).forEach(([dtoKey, apiKey]) => {
      if (data[dtoKey]) payload[apiKey] = data[dtoKey];
    });
    return payload;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingInitialData = null;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isEditMode = false;
    this.editingInitialData = null;
  }

  getActionOptions(rec: MasterRecord): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  get deleteConfirmationMessage(): string {
    return this.recordToDelete
      ? `Are you sure you want to delete "${this.recordToDelete.name}"? This action cannot be undone.`
      : 'Are you sure you want to delete this record?';
  }

  onCancelDelete(): void {
    this.isDeleteDialogOpen = false;
    this.recordToDelete = null;
  }
}
