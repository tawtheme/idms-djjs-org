import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AddMasterEntryModalComponent } from './add-master-entry-modal/add-master-entry-modal.component';
import { DataService } from '../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BasePaginatedList } from '../../../shared/pagination/base-paginated-list';

// All supported master table types / tabs
type MasterType =
  | 'skills'
  | 'banks'
  | 'degrees'
  | 'professions'
  | 'languages'
  | 'dress_codes'
  | 'castes'
  | 'newspapers'
  | 'countries'
  | 'states'
  | 'districts'
  | 'cities'
  | 'ashram_adhaar_areas'
  | 'weapon_types'
  | 'technical_qualifications';

// Static configuration per master type (labels + API endpoints)
interface MasterConfig {
  type: MasterType;
  label: string;
  endpoint: string | null;
  storeEndpoint: string | null;
}

// Normalized record used by the table UI for all master types
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
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    PagerComponent,
    EmptyStateComponent,
    MenuDropdownComponent,
    LoadingComponent,
    AddMasterEntryModalComponent
  ],
  selector: 'app-master-tables-list',
  templateUrl: './master-tables-list.component.html',
  styleUrls: ['./master-tables-list.component.scss']
})
export class MasterTablesListComponent extends BasePaginatedList implements OnInit {
  private readonly dataService = inject(DataService);

  // Mapping between tab types and their list / store endpoints
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

  // Currently active tab
  selectedMasterType: MasterType = 'skills';

  // Convenience getter for the active tab configuration
  get selectedMasterConfig(): MasterConfig {
    return this.masterConfigs.find((m) => m.type === this.selectedMasterType)!;
  }

  // Full data set from API and filtered/paged data for display
  records: MasterRecord[] = [];
  allRecords: MasterRecord[] = [];

  // Search + sort state
  searchTerm = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isAddModalOpen = false;

  // Breadcrumb uses current tab label
  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Master Tables', route: '/master-tables' },
      { label: this.selectedMasterConfig.label, route: '/master-tables' }
    ];
  }

  // Load initial tab on first render
  ngOnInit(): void {
    this.loadPage(this.currentPage, this.pageSize);
  }

  // Switch between master types (tabs)
  onTabSelect(masterType: MasterType): void {
    if (this.selectedMasterType === masterType) return;
    
    this.selectedMasterType = masterType;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadPage(this.currentPage, this.pageSize);
  }

  // Fetch data for the current master type
  protected loadPage(page: number = this.currentPage, pageSize: number = this.pageSize): void {
    const cfg = this.selectedMasterConfig;

    // Reset state before each load
    this.allRecords = [];
    this.records = [];
    this.error = null;

    if (!cfg.endpoint) {
      this.error = `API endpoint not configured for ${cfg.label}.`;
      return;
    }

    // Build endpoint with pagination params expected by backend
    const endpointWithParams = `${cfg.endpoint}?page=${page}&per_page=${pageSize}`;

    this.isLoading = true;
    this.dataService
      .get<any>(endpointWithParams)
      .pipe(
        catchError((error) => {
          console.error(`Error loading ${cfg.label}:`, error);
          this.error =
            error.error?.message || error.message || `Failed to load ${cfg.label}.`;
          return of({ data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        const data = response.data || response.results || response || [];
        const meta = (response as any).meta || {};

        this.allRecords = (Array.isArray(data) ? data : []).map((item: any) =>
          this.mapToRecord(this.selectedMasterType, item)
        );

        // Update pagination from backend meta (fallback to requested values)
        this.updatePaginationFromMeta(meta, page, pageSize);

        this.applyFilters();
      });
  }

  // Normalize raw API record to MasterRecord shape
  private mapToRecord(type: MasterType, item: any): MasterRecord {
    const base: MasterRecord = {
      id: String(item.id),
      name: item.name || '',
      createdAt: item.created_at || '',
      status: this.normalizeStatus(item.status)
    };

    switch (type) {
      case 'countries':
      case 'states':
      case 'cities':
        return {
          ...base,
          extra1: item.code || item.iso_code || '',
          extra2: item.parent_name || ''
        };
      case 'ashram_adhaar_areas':
        return {
          ...base,
          extra1: item.branch_name || '',
          extra2: item.city || ''
        };
      default:
        return base;
    }
  }

  // Convert various backend status formats to "Active"/"Inactive"
  private normalizeStatus(status: any): string | undefined {
    if (status === 1 || status === true || status === 'active') {
      return 'Active';
    }
    if (status != null) {
      return 'Inactive';
    }
    return undefined;
  }

  // Apply search + sort to allRecords and update records
  applyFilters(): void {
    let filtered = [...this.allRecords];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((rec) =>
        rec.name.toLowerCase().includes(searchLower) ||
        rec.extra1?.toLowerCase().includes(searchLower) ||
        rec.extra2?.toLowerCase().includes(searchLower)
      );
    }

    if (this.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.sortField] ?? '';
        const bVal = (b as any)[this.sortField] ?? '';

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.records = filtered;
  }

  // Handle click on table header to change sort field/direction
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Choose the appropriate sort icon for a column
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // Slice current page from filtered records
  get pagedRecords(): MasterRecord[] {
    // Records already represent the current page from the backend
    return this.records;
  }

  // Action menu for each row
  getActionOptions(rec: MasterRecord): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  // Handle "Edit" / "Delete" selection from action menu
  onAction(rec: MasterRecord, option: MenuOption): void {
    if (!option) return;
    
    const action = typeof option === 'string' ? option : (option.value || option.id);
    
    switch (action) {
      case 'edit':
        this.editRecord(rec);
        break;
      case 'delete':
        this.deleteRecord(rec);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  // Placeholder for future edit workflow
  private editRecord(rec: MasterRecord): void {
    console.log('Edit record:', rec, 'for master:', this.selectedMasterType);
  }

  // Delete the selected record using its configured endpoint
  private deleteRecord(rec: MasterRecord): void {
    if (!confirm(`Are you sure you want to delete "${rec.name}"?`)) {
      return;
    }

    const cfg = this.selectedMasterConfig;
    if (!cfg.endpoint) {
      this.error = `Cannot delete entry: API endpoint not configured for ${cfg.label}.`;
      return;
    }

    this.isLoading = true;
    this.dataService
      .delete<any>(`${cfg.endpoint}/${rec.id}`)
      .pipe(
        catchError((error) => {
          console.error(`Error deleting ${cfg.label} entry:`, error);
          this.error =
            error.error?.message ||
            error.message ||
            `Failed to delete ${cfg.label} entry.`;
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response !== null) {
          this.loadPage(this.currentPage, this.pageSize);
        }
      });
  }

  // Stable trackBy for *ngFor on rows
  trackById(index: number, rec: MasterRecord): string {
    return rec.id;
  }

  // Show "Add entry" modal
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  // Hide "Add entry" modal
  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  // Create new entry for current master type using its store endpoint
  onAddEntrySubmit(data: { name: string; status: string }): void {
    if (!data?.name?.trim()) {
      return;
    }

    const cfg = this.selectedMasterConfig;
    if (!cfg.storeEndpoint) {
      this.error = `Cannot add entry: API store endpoint not configured for ${cfg.label}.`;
      return;
    }

    // Prepare payload for API
    const payload: any = {
      name: data.name.trim(),
      // Backend expects numeric status: 1 = Active, 0 = Inactive
      status: data.status === 'Active' ? 1 : 0
    };

    this.isLoading = true;
    this.dataService
      .post<any>(cfg.storeEndpoint, payload)
      .pipe(
        catchError((error) => {
          console.error(`Error adding ${cfg.label} entry:`, error);
          this.error =
            error.error?.message ||
            error.message ||
            `Failed to add ${cfg.label} entry.`;
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.isAddModalOpen = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          this.loadPage(this.currentPage, this.pageSize);
        }
      });
  }
}
