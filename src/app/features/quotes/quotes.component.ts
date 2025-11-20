import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../shared/components/datepicker/datepicker.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { QuoteDetailComponent } from './detail/quote-detail.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreateQuoteComponent } from './create-quote/create-quote.component';
import { DataService } from '../../data.service';
import { Quote } from '../../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, QuoteDetailComponent, ModalComponent, CreateQuoteComponent],
  selector: 'app-quotes',
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.scss']
})
export class QuotesComponent {
  quotes: Quote[] = [];
  allQuotes: Quote[] = [];

  // Filters
  quoteId = '';
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Side Panel
  sidePanelOpen = false;
  selectedQuoteId: string | null = null;

  // Modal
  createModalOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Quotes', route: '/quotes' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<{ quotes: Quote[] }>('quotes.json').subscribe((res) => {
      const rawQuotes = res?.quotes ?? [];
      this.allQuotes = rawQuotes.map((q: any) => ({
        id: q.id,
        customerId: q.customerId,
        date: q.date,
        validUntil: q.validUntil,
        lines: q.lines || [],
        total: q.total,
        status: q.status
      }));

      // Build status options - only draft and sent
      this.statusOptions = [
        { id: '1', label: 'Draft', value: 'draft' },
        { id: '2', label: 'Sent', value: 'sent' }
      ];

      this.applyFilter();
    });
  }

  get pagedQuotes(): Quote[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.quotes.slice(start, start + this.pageSize);
  }

  trackById(_: number, q: Quote): string {
    return q.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.quoteId = '';
    this.selectedStatus = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const quoteId = this.quoteId.trim().toLowerCase();
    const status = this.selectedStatus[0] || '';

    this.quotes = this.allQuotes.filter((q) => {
      const matchesId = !quoteId || 
        (q.id || '').toLowerCase().includes(quoteId) ||
        (q.customerId || '').toLowerCase().includes(quoteId);
      const matchesStatus = !status || q.status === status;
      const qDate = q.date ? new Date(q.date) : null;
      const withinFrom = !this.fromDate || (qDate && qDate >= this.fromDate);
      const withinTo = !this.toDate || (qDate && qDate <= this.toDate);
      return matchesId && matchesStatus && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.quotes.length;
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

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'status-draft';
      case 'sent':
        return 'status-sent';
      default:
        return 'status-default';
    }
  }

  openDetailPanel(quoteId: string): void {
    this.selectedQuoteId = quoteId;
    this.sidePanelOpen = true;
  }

  closeDetailPanel(): void {
    this.sidePanelOpen = false;
    this.selectedQuoteId = null;
  }

  // Quote Stats
  get totalQuotes(): number {
    return this.allQuotes.length;
  }

  get totalValue(): number {
    return this.allQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
  }

  get sentQuotes(): number {
    return this.allQuotes.filter(q => q.status?.toLowerCase() === 'sent').length;
  }

  get draftQuotes(): number {
    return this.allQuotes.filter(q => q.status?.toLowerCase() === 'draft').length;
  }

  get thisMonthQuotes(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allQuotes.filter(q => {
      const qDate = new Date(q.date);
      return qDate.getMonth() === currentMonth && 
             qDate.getFullYear() === currentYear;
    }).length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  onQuoteSaved(): void {
    this.closeCreateModal();
    // Reload quotes if needed
    this.applyFilter();
  }
}


