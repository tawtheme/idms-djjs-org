import { Component, OnInit, inject } from '@angular/core';
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
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BasePaginatedList } from '../../../shared/pagination/base-paginated-list';

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

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, BreadcrumbComponent, PagerComponent,
    EmptyStateComponent, MenuDropdownComponent, LoadingComponent,
    AddMasterEntryModalComponent, ConfirmationDialogComponent
  ],
  selector: 'app-master-tables-list',
  templateUrl: './master-tables-list.component.html',
  styleUrls: ['./master-tables-list.component.scss']
})
export class MasterTablesListComponent extends BasePaginatedList implements OnInit {
  private readonly dataService = inject(DataService);

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
  allRecords: MasterRecord[] = [];
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

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
    this.loadPage();
  }

  onTabSelect(type: MasterType): void {
    if (this.selectedMasterType === type) return;
    this.selectedMasterType = type;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadPage();
  }

  protected override loadPage(page: number = this.currentPage, pageSize: number = this.pageSize): void {
    const cfg = this.selectedMasterConfig;
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>(`${cfg.endpoint}?page=${page}&per_page=${pageSize}`)
      .pipe(
        catchError(err => {
          this.error = err.error?.message || err.message || `Failed to load ${cfg.label}.`;
          return of({ data: [] });
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(res => {
        const data = res.data || res.results || res || [];
        this.allRecords = (Array.isArray(data) ? data : []).map(item => this.mapToRecord(item));
        this.updatePaginationFromMeta(res.meta || {}, page, pageSize);
        this.applyFilters();
      });
  }

  private mapToRecord(item: any): MasterRecord {
    const base: MasterRecord = {
      id: String(item.id),
      name: item.name || '',
      createdAt: item.created_at || '',
      status: item.status === 1 || item.status === true || item.status === 'active' ? 'Active' : 'Inactive'
    };

    if (['countries', 'states', 'cities'].includes(this.selectedMasterType)) {
      base.extra1 = item.code || item.iso_code || '';
      base.extra2 = item.parent_name || '';
    } else if (this.selectedMasterType === 'ashram_adhaar_areas') {
      base.extra1 = item.branch_name || '';
      base.extra2 = item.city || '';
    }
    return base;
  }

  applyFilters(): void {
    let filtered = [...this.allRecords];
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(search) ||
        r.extra1?.toLowerCase().includes(search) ||
        r.extra2?.toLowerCase().includes(search)
      );
    }

    if (this.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.sortField] ?? '';
        const bVal = (b as any)[this.sortField] ?? '';
        return this.sortDirection === 'asc'
          ? (aVal < bVal ? -1 : 1)
          : (aVal > bVal ? -1 : 1);
      });
    }
    this.records = filtered;
  }

  sortBy(field: string): void {
    this.sortDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
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
    const fields: any = {};
    const keys = [
      'branch', 'ifsc_code', 'address', 'country', 'state', 'city', 'district',
      'phone_primary', 'phone_secondary', 'remarks'
    ];
    keys.forEach(k => { if (item[k]) fields[k] = item[k]; });

    if (item.country_id) fields.countryId = String(item.country_id);
    if (item.state_id) fields.stateId = String(item.state_id);
    if (item.district_id) fields.districtId = String(item.district_id);
    if (item.city_id) fields.cityId = String(item.city_id);

    return fields;
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

    const payload: any = {
      name: data.name.trim(),
      status: data.status === 'Active' ? 1 : 0,
      ...this.prepareExtraPayload(data)
    };

    this.isAddModalOpen = false;
    this.isLoading = true;

    const request = this.isEditMode
      ? this.dataService.put(`${this.selectedMasterConfig.endpoint}/${data.id}`, payload)
      : this.dataService.post(this.selectedMasterConfig.storeEndpoint, payload);

    request.pipe(finalize(() => this.isLoading = false))
      .subscribe(() => this.loadPage());
  }

  private prepareExtraPayload(data: MasterEntryFormData): any {
    const payload: any = {};
    const keys = [
      'branch', 'ifsc_code', 'address', 'country', 'state', 'city', 'district',
      'phone_primary', 'phone_secondary', 'remarks'
    ];
    keys.forEach(k => { if ((data as any)[k]) payload[k] = (data as any)[k]; });

    if (data.countryId) payload.country_id = data.countryId;
    if (data.stateId) payload.state_id = data.stateId;
    if (data.districtId) payload.district_id = data.districtId;
    if (data.cityId) payload.city_id = data.cityId;

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
