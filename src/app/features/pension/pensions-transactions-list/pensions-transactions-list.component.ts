import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { CreateTransactionComponent } from '../create-transaction/create-transaction.component';

export interface PensionTransaction {
  id: number;
  image?: string;
  name: string;
  creditAmount?: number;
  withdrawalAmount?: number;
  creditDate?: Date;
  withdrawDate?: Date;
  note?: string;
  opening?: number;
  closing?: number;
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
    ModalComponent,
    DropdownComponent,
    CreateTransactionComponent
  ],
  selector: 'app-pensions-transactions-list',
  templateUrl: './pensions-transactions-list.component.html',
  styleUrls: ['./pensions-transactions-list.component.scss']
})
export class PensionsTransactionsListComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  transactions: PensionTransaction[] = [];
  allTransactions: PensionTransaction[] = [];

  // Selection
  selectedTransactions = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  
  // More Filters Modal
  moreFiltersModalOpen = false;
  moreFilters: any = {};

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Create Transaction Modal
  createTransactionModalOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Financial', route: '/pensions' },
    { label: 'Pensions Transactions List', route: '/pensions/transactions-list' }
  ];

  constructor() {
    // Sample data - empty for now as per design
    this.allTransactions = [];

    // Initialize gender options
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.applyFilters();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '-';
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  applyFilters() {
    let filtered = [...this.allTransactions];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.name.toLowerCase().includes(search) ||
        transaction.id.toString().includes(search) ||
        (transaction.note && transaction.note.toLowerCase().includes(search))
      );
    }

    // Gender filter
    const gender = this.selectedGender[0]?.value || '';
    if (gender) {
      // Note: Assuming transactions have a gender field or related person has gender
      // Adjust this filter based on your actual data structure
      // filtered = filtered.filter(transaction => transaction.gender === gender);
    }

    // Sorting
    if (this.sortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.sortField];
        const bVal = (b as any)[this.sortField];
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.transactions = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    this.updatePagedData();
  }

  sortBy(field: string) {
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

  updatePagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
  }

  get pagedTransactions(): PensionTransaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.transactions.slice(start, end);
  }

  // Selection
  toggleSelectTransaction(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedTransactions.has(id)) {
      this.selectedTransactions.delete(id);
    } else {
      this.selectedTransactions.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedTransactions.clear();
    } else {
      this.pagedTransactions.forEach(transaction => this.selectedTransactions.add(transaction.id));
    }
  }

  isAllSelected(): boolean {
    return this.pagedTransactions.length > 0 &&
           this.pagedTransactions.every(transaction => this.selectedTransactions.has(transaction.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedTransactions.filter(transaction => this.selectedTransactions.has(transaction.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedTransactions.length;
  }

  // Actions
  getActionOptions(transaction: PensionTransaction): MenuOption[] {
    return [
      { id: '1', label: 'Edit', value: 'edit' },
      { id: '2', label: 'View Details', value: 'view' },
      { id: '3', label: 'Delete', value: 'delete' }
    ];
  }

  onAction(transaction: PensionTransaction, option: MenuOption) {
    console.log('Action:', option.value, 'on transaction:', transaction);
    // Implement action logic
  }

  // Pagination
  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  trackById(index: number, transaction: PensionTransaction): number {
    return transaction.id;
  }

  // Create Transaction Modal
  openCreateTransactionModal() {
    this.createTransactionModalOpen = true;
  }

  closeCreateTransactionModal() {
    this.createTransactionModalOpen = false;
  }

  onTransactionCreated() {
    // Handle transaction creation - refresh list, close modal, etc.
    this.closeCreateTransactionModal();
    // Refresh the transactions list
    this.applyFilters();
  }

  // Filter Modal
  openMoreFiltersModal() {
    this.moreFiltersModalOpen = true;
  }

  closeMoreFiltersModal() {
    this.moreFiltersModalOpen = false;
  }

  onMoreFiltersApply(filters: any) {
    this.moreFilters = filters;
    this.applyFilters();
  }

  resetFilter() {
    this.searchTerm = '';
    this.selectedGender = [];
    this.moreFilters = {};
    this.applyFilters();
  }
}

