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
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Type definition for all available master table types
 */
type MasterType =
  | 'skills'
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

/**
 * Configuration interface for master table types
 */
interface MasterConfig {
  type: MasterType;
  label: string;
  endpoint: string | null;
}

/**
 * Master record interface representing a single record in any master table
 * Note: extra1 and extra2 are used for search functionality but not displayed in the table
 */
export interface MasterRecord {
  id: string;
  name: string;
  createdAt: string;
  status?: string;
  extra1?: string; // Used for search: code/iso_code for countries/states/cities, branch_name for ashram_adhaar_areas
  extra2?: string; // Used for search: parent_name for countries/states/cities, city for ashram_adhaar_areas
}

/**
 * Component for displaying and managing master tables list
 * Supports multiple master table types with filtering, sorting, and pagination
 */
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
export class MasterTablesListComponent implements OnInit {
  private readonly dataService = inject(DataService);

  /**
   * Configuration array for all available master table types
   * Each config defines the type, display label, and API endpoint
   */
  readonly masterConfigs: MasterConfig[] = [
    { type: 'skills', label: 'Skills', endpoint: 'v1/skills' },
    { type: 'degrees', label: 'Degrees', endpoint: 'v1/degrees' },
    { type: 'professions', label: 'Professions', endpoint: 'v1/professions' },
    { type: 'languages', label: 'Languages', endpoint: 'v1/languages' },
    { type: 'dress_codes', label: 'Dress Codes', endpoint: 'v1/dress_codes' },
    { type: 'castes', label: 'Castes', endpoint: 'v1/castes' },
    { type: 'newspapers', label: 'Newspapers', endpoint: 'v1/newspapers' },
    { type: 'countries', label: 'Countries', endpoint: 'v1/countries' },
    { type: 'states', label: 'States', endpoint: 'v1/states' },
    { type: 'districts', label: 'Districts', endpoint: null }, // endpoint not provided
    { type: 'cities', label: 'Cities', endpoint: 'v1/cities' },
    { type: 'ashram_adhaar_areas', label: 'Ashram Adhaar Areas', endpoint: 'v1/ashram_adhaar_areas' },
    { type: 'weapon_types', label: 'Weapon Types', endpoint: 'v1/weapon_types' },
    { type: 'technical_qualifications', label: 'Technical Qualifications', endpoint: 'v1/technical_qualifications' }
  ];

  /** Currently selected master table type */
  selectedMasterType: MasterType = 'skills';

  /**
   * Getter for the currently selected master table configuration
   * @returns The configuration object for the selected master type
   */
  get selectedMasterConfig(): MasterConfig {
    return this.masterConfigs.find((m) => m.type === this.selectedMasterType)!;
  }

  /** Filtered and sorted records to display */
  records: MasterRecord[] = [];
  /** All records loaded from API (before filtering/sorting) */
  allRecords: MasterRecord[] = [];

  /** Search filter term */
  searchTerm = '';

  /** Current field being sorted by */
  sortField = '';
  /** Current sort direction */
  sortDirection: 'asc' | 'desc' = 'asc';

  /** Available page size options */
  readonly pageSizeOptions: number[] = [20, 50, 100];
  /** Current page size */
  pageSize = 20;
  /** Current page number (1-indexed) */
  currentPage = 1;
  /** Total number of items after filtering */
  totalItems = 0;

  /** Loading state indicator */
  isLoading = false;
  /** Error message if API call fails */
  error: string | null = null;

  /** Modal state for adding new entry */
  isAddModalOpen = false;

  /**
   * Get breadcrumb navigation items
   * Dynamically shows the selected master table name in the breadcrumb
   * @returns Array of breadcrumb items
   */
  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Master Tables', route: '/master-tables' },
      { label: this.selectedMasterConfig.label, route: '/master-tables' }
    ];
  }

  /**
   * Initialize component and load initial data
   */
  ngOnInit(): void {
    this.loadRecords();
  }

  /**
   * Handle tab selection to switch between master table types
   * @param masterType - The master table type to switch to
   */
  onTabSelect(masterType: MasterType): void {
    if (this.selectedMasterType === masterType) return;
    
    this.selectedMasterType = masterType;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadRecords();
  }

  /**
   * Load records from API for the currently selected master table type
   * Handles loading state, error handling, and data transformation
   */
  private loadRecords(): void {
    const cfg = this.selectedMasterConfig;
    this.allRecords = [];
    this.records = [];
    this.totalItems = 0;
    this.error = null;

    if (!cfg.endpoint) {
      this.error = `API endpoint not configured for ${cfg.label}.`;
      return;
    }

    this.isLoading = true;
    this.dataService.get<any>(cfg.endpoint).pipe(
      catchError((error) => {
        console.error(`Error loading ${cfg.label}:`, error);
        this.error = error.error?.message || error.message || `Failed to load ${cfg.label}.`;
        this.isLoading = false;
        return of({ data: [] });
      })
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];

      this.allRecords = (Array.isArray(data) ? data : []).map((item: any) =>
        this.mapToRecord(this.selectedMasterType, item)
      );

      this.isLoading = false;
      this.applyFilters();
    });
  }

  /**
   * Convert raw API response item to standardized MasterRecord format
   * Handles different data structures for different master table types
   * @param type - The master table type
   * @param item - Raw item from API response
   * @returns Standardized MasterRecord object
   */
  private mapToRecord(type: MasterType, item: any): MasterRecord {
    const base: MasterRecord = {
      id: String(item.id),
      name: item.name || '',
      createdAt: item.created_at || '',
      status: this.normalizeStatus(item.status)
    };

    // Handle special cases for tables with additional fields
    switch (type) {
      case 'countries':
      case 'states':
      case 'cities':
        return {
          ...base,
          extra1: item.code || item.iso_code || '',
          extra2: item.parent_name || '' // e.g., country name for state, state name for city
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

  /**
   * Normalize status value from API to consistent string format
   * @param status - Status value from API (can be number, boolean, or string)
   * @returns Normalized status string ('Active', 'Inactive', or undefined)
   */
  private normalizeStatus(status: any): string | undefined {
    if (status === 1 || status === true || status === 'active') {
      return 'Active';
    }
    if (status != null) {
      return 'Inactive';
    }
    return undefined;
  }

  /**
   * Apply search filter and sorting to all records
   * Updates the filtered records array and resets pagination
   */
  applyFilters(): void {
    let filtered = [...this.allRecords];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((rec) =>
        rec.name.toLowerCase().includes(searchLower) ||
        rec.extra1?.toLowerCase().includes(searchLower) ||
        rec.extra2?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
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
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset to first page after filtering
  }

  /**
   * Handle column header click for sorting
   * Toggles sort direction if clicking the same field, otherwise sets new sort field
   * @param field - The field name to sort by
   */
  sortBy(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction for same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort field with ascending direction
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  /**
   * Get the appropriate Material Icon name for sort indicator
   * @param field - The field name to check
   * @returns Material Icon name for the sort indicator
   */
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more'; // Neutral/unsorted state
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Get paginated records for current page
   * @returns Array of records for the current page
   */
  get pagedRecords(): MasterRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.records.slice(start, end);
  }

  /**
   * Get action menu options for a record
   * @param rec - The master record
   * @returns Array of menu options
   */
  getActionOptions(rec: MasterRecord): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'Delete', value: 'delete' }
    ];
  }

  /**
   * Handle action menu item selection
   * @param rec - The master record the action is performed on
   * @param option - The selected menu option
   */
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

  /**
   * Handle edit action for a record
   * @param rec - The master record to edit
   */
  private editRecord(rec: MasterRecord): void {
    console.log('Edit record:', rec, 'for master:', this.selectedMasterType);
    // TODO: Implement edit functionality
  }

  /**
   * Handle delete action for a record
   * @param rec - The master record to delete
   */
  private deleteRecord(rec: MasterRecord): void {
    if (!confirm(`Are you sure you want to delete "${rec.name}"?`)) {
      return;
    }
    
    console.log('Delete record:', rec, 'for master:', this.selectedMasterType);
    // TODO: Implement delete API call
    // After successful deletion, reload records:
    // this.loadRecords();
  }

  /**
   * Handle page change event from pagination component
   * @param page - The page number to navigate to
   */
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  /**
   * Handle page size change event from pagination component
   * @param size - The new page size
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // Reset to first page when changing page size
  }

  /**
   * TrackBy function for ngFor to optimize rendering performance
   * @param index - Array index
   * @param rec - Master record
   * @returns Unique identifier for the record
   */
  trackById(index: number, rec: MasterRecord): string {
    return rec.id;
  }

  /**
   * Open the add new entry modal
   */
  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  /**
   * Close the add new entry modal
   */
  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  /**
   * Handle form submission from add entry modal
   * @param data - Form data containing name and status
   */
  onAddEntrySubmit(data: { name: string; status: string }): void {
    if (!data?.name?.trim()) {
      return;
    }
    
    const cfg = this.selectedMasterConfig;
    if (!cfg.endpoint) {
      this.error = `Cannot add entry: API endpoint not configured for ${cfg.label}.`;
      return;
    }
    
    // TODO: Implement API call to add new entry
    // Example:
    // this.dataService.post(cfg.endpoint, {
    //   name: data.name.trim(),
    //   status: data.status === 'Active' ? 1 : 0
    // }).subscribe({
    //   next: () => {
    //     this.loadRecords();
    //     this.closeAddModal();
    //   },
    //   error: (error) => {
    //     this.error = error.error?.message || 'Failed to add entry.';
    //   }
    // });
    
    console.log('Add new entry:', data, 'for master type:', this.selectedMasterType);
  }
}
