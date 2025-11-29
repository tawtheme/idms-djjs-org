import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type MasterType =
  | 'skills'
  | 'degrees'
  | 'professions'
  | 'languages'
  | 'dress_codes'
  | 'bank'
  | 'castes'
  | 'newspapers'
  | 'countries'
  | 'states'
  | 'districts'
  | 'cities'
  | 'ashram_adhaar_areas'
  | 'weapon_types'
  | 'technical_qualifications';

interface MasterConfig {
  type: MasterType;
  label: string;
  endpoint: string | null;
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
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    PagerComponent,
    EmptyStateComponent,
    MenuDropdownComponent,
    DropdownComponent
  ],
  selector: 'app-master-tables-list',
  templateUrl: './master-tables-list.component.html',
  styleUrls: ['./master-tables-list.component.scss']
})
export class MasterTablesListComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  private dataService = inject(DataService);

  readonly masterConfigs: MasterConfig[] = [
    { type: 'skills', label: 'Skills', endpoint: 'v1/skills' },
    { type: 'degrees', label: 'Degrees', endpoint: 'v1/degrees' },
    { type: 'professions', label: 'Professions', endpoint: 'v1/professions' },
    { type: 'languages', label: 'Languages', endpoint: 'v1/languages' },
    { type: 'dress_codes', label: 'Dress Codes', endpoint: 'v1/dress_codes' },
    { type: 'bank', label: 'Banks', endpoint: null }, // endpoint not provided
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

  // Selected master
  selectedMasterType: MasterType = 'skills';

  get selectedMasterConfig(): MasterConfig {
    return this.masterConfigs.find((m) => m.type === this.selectedMasterType)!;
  }

  get masterOptions(): DropdownOption[] {
    return this.masterConfigs.map((m) => ({
      id: m.type,
      label: m.label,
      value: m.type
    }));
  }

  // For dropdown, we pass just the selected value array

  records: MasterRecord[] = [];
  allRecords: MasterRecord[] = [];

  // Selection
  selectedRecords = new Set<string>();

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

  // Loading / error
  isLoading = false;
  error: string | null = null;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Master Tables', route: '/master-tables' },
    { label: 'All Tables', route: '/master-tables' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadRecords();
  }

  // app-dropdown emits an array of selected values
  onMasterChange(values: any[] | null): void {
    const value = Array.isArray(values) ? values[0] : null;
    if (!value) return;
    this.selectedMasterType = value as MasterType;
    this.currentPage = 1;
    this.selectedRecords.clear();
    this.loadRecords();
  }

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
   * Map raw API item to MasterRecord depending on master type.
   */
  private mapToRecord(type: MasterType, item: any): MasterRecord {
    // Most of these master tables have { id, name, status?, created_at }
    const baseStatus =
      item.status === 1 || item.status === true || item.status === 'active'
        ? 'Active'
        : item.status != null
        ? 'Inactive'
        : undefined;

    const base: MasterRecord = {
      id: String(item.id),
      name: item.name || '',
      createdAt: item.created_at || '',
      status: baseStatus
    };

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

  applyFilters(): void {
    let filtered = [...this.allRecords];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter((rec) =>
        rec.name.toLowerCase().includes(search) ||
        (rec.extra1 && rec.extra1.toLowerCase().includes(search)) ||
        (rec.extra2 && rec.extra2.toLowerCase().includes(search))
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

    this.records = filtered;
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
  get pagedRecords(): MasterRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.records.slice(start, end);
  }

  // Selection
  toggleSelectRecord(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedRecords.has(id)) {
      this.selectedRecords.delete(id);
    } else {
      this.selectedRecords.add(id);
    }
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedRecords.clear();
    } else {
      this.pagedRecords.forEach((rec) => this.selectedRecords.add(rec.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedRecords.length > 0 && this.pagedRecords.every((rec) => this.selectedRecords.has(rec.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedRecords.filter((rec) => this.selectedRecords.has(rec.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedRecords.length;
  }

  // Actions
  getActionOptions(rec: MasterRecord): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(rec: MasterRecord, option: MenuOption): void {
    console.log('Action:', option.value, 'on record:', rec, 'for master:', this.selectedMasterType);
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, rec: MasterRecord): string {
    return rec.id;
  }
}


