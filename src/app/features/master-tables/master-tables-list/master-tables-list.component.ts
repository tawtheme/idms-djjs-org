import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AddMasterEntryModalComponent } from './add-master-entry-modal/add-master-entry-modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataService } from '../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BasePaginatedList } from '../../../shared/pagination/base-paginated-list';
import type { MasterEntryFormData } from './add-master-entry-modal/add-master-entry-modal.component';

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
    AddMasterEntryModalComponent,
    ConfirmationDialogComponent
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

  // Edit/Add modal state
  isEditMode = false;
  editingRecord: MasterRecord | null = null;
  editingInitialData: MasterEntryFormData | null = null;

  // Delete confirmation dialog state
  isDeleteDialogOpen = false;
  recordToDelete: MasterRecord | null = null;

  // Timing trackers for edit process
  private editStartTime: number = 0;
  private fetchStartTime: number = 0;
  private updateStartTime: number = 0;
  private listReloadStartTime: number = 0;

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

    // Track list reload timing if this is part of edit/add flow
    const isEditReload = this.listReloadStartTime > 0;

    this.isLoading = true;
    this.dataService
      .get<any>(endpointWithParams)
      .pipe(
        catchError((error) => {
          if (isEditReload) {
            const reloadDuration = performance.now() - this.listReloadStartTime;
            console.error(`[EDIT] Error during list reload:`, {
              error,
              duration: `${reloadDuration.toFixed(2)}ms`,
              timestamp: new Date().toISOString()
            });
            // Clean up edit state on error
            this.resetEditState();
          } else {
            console.error(`Error loading ${cfg.label}:`, error);
          }
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

        // Log list reload completion if this was part of edit/add flow
        if (isEditReload) {
          const reloadDuration = performance.now() - this.listReloadStartTime;
          const totalEditDuration = this.editStartTime > 0 ? performance.now() - this.editStartTime : 0;
          
          console.log(`[EDIT] List reload completed:`, {
            reloadDuration: `${reloadDuration.toFixed(2)}ms`,
            totalEditDuration: `${totalEditDuration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          
          // Clean up edit state after list reload completes
          this.resetEditState();
        }
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

  // Open modal in edit mode with selected record
  private editRecord(rec: MasterRecord): void {
    const cfg = this.selectedMasterConfig;
    if (!cfg.endpoint) {
      this.error = `Cannot load entry for edit: API endpoint not configured for ${cfg.label}.`;
      return;
    }

    // Track edit process start
    this.editStartTime = performance.now();
    console.log(`[EDIT] Edit clicked for ${cfg.label} record:`, {
      id: rec.id,
      name: rec.name,
      timestamp: new Date().toISOString(),
      time: this.editStartTime
    });

    // Open modal immediately with current row values (no loader in modal for edit)
    this.isEditMode = true;
    this.editingRecord = rec;
    this.editingInitialData = {
      id: rec.id,
      name: rec.name,
      status: rec.status || 'Active'
    };
    this.isAddModalOpen = true;

    const modalOpenTime = performance.now();
    const timeToModalOpen = modalOpenTime - this.editStartTime;
    console.log(`[EDIT] Modal opened:`, {
      timeToOpen: `${timeToModalOpen.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    // Optionally refresh data from API in background (without affecting modal loader)
    this.fetchStartTime = performance.now();
    console.log(`[EDIT] Starting API fetch for record ${rec.id}:`, {
      endpoint: `${cfg.endpoint}/${rec.id}`,
      timestamp: new Date().toISOString(),
      time: this.fetchStartTime
    });

    this.dataService
      .get<any>(`${cfg.endpoint}/${rec.id}`)
      .pipe(
        catchError((error) => {
          const fetchDuration = performance.now() - this.fetchStartTime;
          console.error(`[EDIT] Error loading ${cfg.label} entry for edit:`, {
            error,
            duration: `${fetchDuration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          this.error =
            error.error?.message ||
            error.message ||
            `Failed to load ${cfg.label} entry for edit.`;
          return of(null);
        })
      )
      .subscribe((response) => {
        const fetchDuration = performance.now() - this.fetchStartTime;
        console.log(`[EDIT] API fetch completed:`, {
          duration: `${fetchDuration.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });

        if (!response) {
          return;
        }
        const item = (response as any).data ?? response;

        const statusLabel = this.normalizeStatus(item.status) || 'Active';

        const baseData: MasterEntryFormData = {
          id: String(item.id ?? rec.id),
          name: item.name ?? rec.name,
          status: statusLabel
        };

        // For banks, map extended fields if present
        if (this.selectedMasterType === 'banks') {
          baseData.branch = item.branch ?? '';
          baseData.ifsc_code = item.ifsc_code ?? '';
          baseData.address = item.address ?? '';
          baseData.country = item.country ?? '';
          baseData.state = item.state ?? '';
          baseData.city = item.city ?? '';
          baseData.phone_primary = item.phone_primary ?? '';
          baseData.phone_secondary = item.phone_secondary ?? '';
          baseData.remarks = item.remarks ?? '';

          // Optional IDs for cascading dropdowns
          if (item.country_id) {
            baseData.countryId = String(item.country_id);
          }
          if (item.state_id) {
            baseData.stateId = String(item.state_id);
          }
          if (item.city_id) {
            baseData.cityId = String(item.city_id);
          }
        }

        // Update modal with freshest values (if still in edit mode)
        this.editingInitialData = baseData;
        const totalTimeToDataReady = performance.now() - this.editStartTime;
        console.log(`[EDIT] Modal data updated with API response:`, {
          totalTimeToDataReady: `${totalTimeToDataReady.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      });
  }

  // Open delete confirmation dialog
  private deleteRecord(rec: MasterRecord): void {
    this.recordToDelete = rec;
    this.isDeleteDialogOpen = true;
  }

  // Handle delete confirmation - proceed with deletion
  onConfirmDelete(): void {
    if (!this.recordToDelete) {
      this.isDeleteDialogOpen = false;
      return;
    }

    const rec = this.recordToDelete;
    const cfg = this.selectedMasterConfig;
    
    if (!cfg.endpoint) {
      this.error = `Cannot delete entry: API endpoint not configured for ${cfg.label}.`;
      this.isDeleteDialogOpen = false;
      this.recordToDelete = null;
      return;
    }

    this.isLoading = true;
    this.isDeleteDialogOpen = false;
    
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
          this.recordToDelete = null;
        })
      )
      .subscribe((response) => {
        if (response !== null) {
          // Reload the current page after successful deletion
          this.loadPage(this.currentPage, this.pageSize);
        }
      });
  }

  // Handle delete cancellation
  onCancelDelete(): void {
    this.isDeleteDialogOpen = false;
    this.recordToDelete = null;
  }

  // Get delete confirmation message
  get deleteConfirmationMessage(): string {
    if (!this.recordToDelete) {
      return 'Are you sure you want to delete this record?';
    }
    return `Are you sure you want to delete "${this.recordToDelete.name}"? This action cannot be undone.`;
  }

  // Stable trackBy for *ngFor on rows
  trackById(index: number, rec: MasterRecord): string {
    return rec.id;
  }

  // Helper method to clean up edit state and timing trackers
  private resetEditState(): void {
    this.isEditMode = false;
    this.editingRecord = null;
    this.editingInitialData = null;
    this.editStartTime = 0;
    this.fetchStartTime = 0;
    this.updateStartTime = 0;
    this.listReloadStartTime = 0;
  }

  // Show "Add entry" modal
  openAddModal(): void {
    this.resetEditState();
    this.isAddModalOpen = true;
  }

  // Hide "Add entry" modal
  closeAddModal(): void {
    if (this.isEditMode && this.editStartTime > 0) {
      const timeSinceEditStart = performance.now() - this.editStartTime;
      console.log(`[EDIT] Modal closed manually (without submit):`, {
        timeSinceEditStart: `${timeSinceEditStart.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    this.isAddModalOpen = false;
    this.resetEditState();
  }

  // Create or update entry for current master type
  onAddEntrySubmit(data: MasterEntryFormData): void {
    if (!data?.name?.trim()) {
      return;
    }

    // Store edit state before closing modal
    const isEdit = this.isEditMode && this.editingRecord;
    const editingRec = this.editingRecord;

    // Close modal immediately after submit
    this.isAddModalOpen = false;

    if (isEdit && editingRec) {
      this.updateEntry(editingRec, data);
    } else {
      this.createEntry(data);
    }
  }

  // Create new entry for current master type using its store endpoint (POST)
  private createEntry(data: MasterEntryFormData): void {
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

    // Attach bank-specific fields when needed
    this.attachBankFieldsIfNeeded(data, payload);

    // Show loader in listing (modal is already closed)
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
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          this.listReloadStartTime = performance.now();
          console.log(`[ADD] Starting list reload:`, {
            timestamp: new Date().toISOString(),
            time: this.listReloadStartTime
          });
          this.loadPage(this.currentPage, this.pageSize);
        } else {
          // If API call failed, stop loading
          this.isLoading = false;
        }
      });
  }

  // Update existing entry for current master type using its endpoint and PUT
  private updateEntry(rec: MasterRecord, data: MasterEntryFormData): void {
    const cfg = this.selectedMasterConfig;
    if (!cfg.endpoint) {
      this.error = `Cannot update entry: API endpoint not configured for ${cfg.label}.`;
      return;
    }

    const submitTime = performance.now();
    const timeSinceEditStart = submitTime - this.editStartTime;
    console.log(`[EDIT] Form submitted (Update):`, {
      recordId: rec.id,
      timeSinceEditStart: `${timeSinceEditStart.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    const payload: any = {
      name: data.name.trim(),
      status: data.status === 'Active' ? 1 : 0
    };

    // Attach bank-specific fields when needed
    this.attachBankFieldsIfNeeded(data, payload);

    // Show loader in listing (modal is already closed)
    this.isLoading = true;

    this.updateStartTime = performance.now();
    console.log(`[EDIT] Starting PUT API call:`, {
      endpoint: `${cfg.endpoint}/${rec.id}`,
      timestamp: new Date().toISOString(),
      time: this.updateStartTime
    });

    this.dataService
      .put<any>(`${cfg.endpoint}/${rec.id}`, payload)
      .pipe(
        catchError((error) => {
          const updateDuration = performance.now() - this.updateStartTime;
          console.error(`[EDIT] Error updating ${cfg.label} entry:`, {
            error,
            duration: `${updateDuration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });
          this.error =
            error.error?.message ||
            error.message ||
            `Failed to update ${cfg.label} entry.`;
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          const updateDuration = performance.now() - this.updateStartTime;
          console.log(`[EDIT] PUT API completed:`, {
            duration: `${updateDuration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          });

          this.listReloadStartTime = performance.now();
          console.log(`[EDIT] Starting list reload:`, {
            timestamp: new Date().toISOString(),
            time: this.listReloadStartTime
          });
          this.loadPage(this.currentPage, this.pageSize);
        } else {
          // If API call returned null, stop loading and clean up
          this.isLoading = false;
          this.resetEditState();
        }
      });
  }

  /**
   * Attach bank-specific fields to the payload when current tab is "banks".
   * Keeps create/update logic DRY.
   */
  private attachBankFieldsIfNeeded(data: MasterEntryFormData, payload: any): void {
    if (this.selectedMasterType !== 'banks') {
      return;
    }

    if (data.branch != null) payload.branch = data.branch;
    if (data.ifsc_code != null) payload.ifsc_code = data.ifsc_code;
    if (data.address != null) payload.address = data.address;
    if (data.country != null) payload.country = data.country;
    if (data.state != null) payload.state = data.state;
    if (data.city != null) payload.city = data.city;
    if (data.phone_primary != null) payload.phone_primary = data.phone_primary;
    if (data.phone_secondary != null) payload.phone_secondary = data.phone_secondary;
    if (data.remarks != null) payload.remarks = data.remarks;
  }
}
