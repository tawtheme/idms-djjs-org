import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { AddSewaModalComponent } from './add-sewa-modal/add-sewa-modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataService } from '../../../data.service';
import { SearchService, SearchState } from '../../../core/services/search.service';
import { SortService } from '../../../core/services/sort.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { BasePaginatedList } from '../../../shared/pagination/base-paginated-list';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Sewa } from './sewa.interface';
import { IconComponent } from '../../../shared/components/icon/icon.component';

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
    AddSewaModalComponent,
    ConfirmationDialogComponent,
    IconComponent
  ],
  selector: 'app-all-sewa',
  templateUrl: './all-sewa.component.html',
  styleUrls: ['./all-sewa.component.scss'],
  providers: [SortService]
})
export class AllSewaComponent extends BasePaginatedList implements OnInit, OnDestroy {

  private readonly dataService = inject(DataService);
  private readonly searchService = inject(SearchService);
  private readonly sortService = inject(SortService);
  private readonly snackbarService = inject(SnackbarService);

  private searchSubscription?: Subscription;
  private sortSubscription?: Subscription;

  sewas: Sewa[] = [];

  // Modal & Dialog state
  isAddModalOpen = false;
  isEditMode = false;
  editingSewa: Sewa | null = null;
  isDeleteDialogOpen = false;
  sewaToDelete: Sewa | null = null;

  // Selection
  selectedSewas = new Set<string>();

  // Filters
  searchTerm = '';
  selectedType: any[] = [];
  typeOptions: DropdownOption[] = [
    { id: '1', label: 'Volunteer', value: 'Volunteer' },
    { id: '2', label: 'Preacher', value: 'Preacher' },
    { id: '3', label: 'Desiring Devotee', value: 'Desiring Devotee' }
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sewa', route: '/sewa' },
    { label: 'All Sewa', route: '/sewa/all-sewa' }
  ];

  constructor() {
    super();
    this.pageSize = 20;
  }

  ngOnInit(): void {
    this.initSearch();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.sortSubscription?.unsubscribe();
  }

  private initSearch(): void {
    this.cleanupSubscriptions();

    const search$ = this.searchService.createSearch<any>('v1/sewas', {
      defaultPageSize: this.pageSize,
      debounceTime: 300,
      enableCache: true,
      queryParamName: 'name',
      sortByParamName: 'sortByColumn',
      sortDirectionParamName: 'orderBy'
    });

    this.searchSubscription = search$.subscribe(state => this.handleSearchUpdate(state));

    // Initial search with current filters
    this.applyFilter();

    this.sortSubscription = this.sortService.sortState$.subscribe(sort => {
      if (sort.field) {
        this.searchService.updateSort(sort.field, sort.direction);
      }
    });
  }

  private cleanupSubscriptions(): void {
    this.searchSubscription?.unsubscribe();
    this.sortSubscription?.unsubscribe();
  }

  private handleSearchUpdate(state: SearchState<any>): void {
    this.isLoading = state.loading;
    this.error = state.error;

    let results = state.results.map((item: any) => this.mapToSewa(item));

    // Apply client-side sort as a fallback/immediate feedback, matching Master Table logic
    this.applyClientSideSort(results);

    this.sewas = results;
    this.totalItems = state.total;
    this.currentPage = state.currentPage;

    // Collect any new types found in the results to make filters more dynamic
    state.results.forEach((item: any) => {
      if (item.type && !this.typeOptions.find(opt => opt.value === item.type)) {
        this.typeOptions.push({
          id: String(this.typeOptions.length + 1),
          label: item.type,
          value: item.type
        });
      }
    });
  }

  private mapToSewa(item: any): Sewa {
    return {
      id: String(item.id),
      uuid: item.uuid || item.unique_id,
      name: item.name || '',
      type: item.type || '',
      createdAt: this.parseApiDate(item.created_at || item.createdAt || '')
    };
  }

  private applyClientSideSort(results: Sewa[]): void {
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

  private parseApiDate(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    if (dateStr.includes('T') || dateStr.includes('-')) return dateStr;

    const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
    if (parts) {
      const [_, day, month, year, rest] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`;
    }
    return dateStr;
  }

  loadSewas(): void {
    this.applyFilter();
  }

  protected override loadPage(page: number = this.currentPage, pageSize: number = this.pageSize): void {
    this.searchService.searchWithParams({ page, perPage: pageSize });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedType = [];
    this.sortService.reset();
    this.applyFilter();
  }

  applyFilter(): void {
    const filters: Record<string, any> = {};
    if (this.selectedType?.length > 0) {
      filters['type'] = this.selectedType[0];
    }

    const currentSort = this.sortService.currentSort;
    this.searchService.searchWithParams({
      query: this.searchTerm,
      filters,
      page: 1,
      sortBy: currentSort.field || undefined,
      sortDirection: currentSort.field ? currentSort.direction : undefined
    });
  }

  // Sorting
  sortBy(field: string): void {
    this.sortService.toggleSort(field);
  }

  getSortIcon(field: string): string {
    return this.sortService.getSortIcon(field);
  }

  // trackBy helper
  trackById(_: number, s: Sewa): string {
    return s.id;
  }

  // Selection handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.sewas.forEach(s => this.selectedSewas.add(s.id));
    } else {
      this.sewas.forEach(s => this.selectedSewas.delete(s.id));
    }
  }

  toggleSelectSewa(id: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedSewas.has(id)) {
      this.selectedSewas.delete(id);
    } else {
      this.selectedSewas.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.sewas.length > 0 &&
      this.sewas.every(s => this.selectedSewas.has(s.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.sewas.filter(s => this.selectedSewas.has(s.id)).length;
    return selectedCount > 0 && selectedCount < this.sewas.length;
  }

  // Action handlers
  getActionOptions(sewa: Sewa): MenuOption[] {
    return [
      { id: 'view', label: 'View', value: 'view', icon: 'visibility' },
      { id: 'edit', label: 'Edit', value: 'edit', icon: 'edit' },
      { id: 'delete', label: 'Delete', value: 'delete', icon: 'delete' }
    ];
  }

  onAction(sewa: Sewa, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    if (actionId === 'view') {
      this.viewDetails(sewa);
    } else if (actionId === 'edit') {
      this.editSewa(sewa);
    } else if (actionId === 'delete') {
      this.deleteSewa(sewa);
    }
  }

  viewDetails(sewa: Sewa): void {
    console.log('View sewa details:', sewa);
    // Future: redirect to details page
  }

  editSewa(sewa: Sewa): void {
    this.isEditMode = true;
    this.editingSewa = sewa;
    this.isAddModalOpen = true;
  }

  deleteSewa(sewa: Sewa): void {
    this.sewaToDelete = sewa;
    this.isDeleteDialogOpen = true;
  }

  confirmDelete(): void {
    if (!this.sewaToDelete) return;

    const idToDelete = this.sewaToDelete.uuid || this.sewaToDelete.id;
    const sewaName = this.sewaToDelete.name;

    // Close dialog immediately for better UX
    this.isDeleteDialogOpen = false;
    this.isLoading = true;

    this.dataService.delete(`v1/sewas/${idToDelete}`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.sewaToDelete = null;
      }))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess(`"${sewaName}" deleted successfully`);
          this.searchService.refresh();
        },
        error: (err) => {
          console.error('Delete failed:', err);
          const errorMsg = err.error?.message || err.message || 'Failed to delete sewa.';
          this.snackbarService.showError(errorMsg);
          this.error = errorMsg;
        }
      });
  }

  cancelDelete(): void {
    this.isDeleteDialogOpen = false;
    this.sewaToDelete = null;
  }

  // Modal methods
  openAddModal(): void {
    this.isEditMode = false;
    this.editingSewa = null;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.isEditMode = false;
    this.editingSewa = null;
  }

  onAddSewaSubmit(formData: { name: string; type: string }): void {
    const isEdit = this.isEditMode;
    const sewaName = formData.name;

    // Close modal immediately for better UX
    this.closeAddModal();
    this.isLoading = true;

    const payload = {
      name: formData.name,
      type: formData.type
    };

    const id = this.editingSewa?.uuid || this.editingSewa?.id;
    const request = isEdit && id
      ? this.dataService.patch(`v1/sewas/${id}`, payload)
      : this.dataService.post('v1/sewas/store', payload);

    request.pipe(finalize(() => {
      this.isLoading = false;
    })).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`"${sewaName}" ${isEdit ? 'updated' : 'added'} successfully`);
        this.searchService.refresh();
      },
      error: (err) => {
        console.error('Submit failed:', err);
        const errorMsg = err.error?.message || err.message || `Failed to ${isEdit ? 'update' : 'add'} sewa.`;
        this.snackbarService.showError(errorMsg);
        this.error = errorMsg;
      }
    });
  }
}

