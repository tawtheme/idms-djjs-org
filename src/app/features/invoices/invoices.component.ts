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
import { InvoiceDetailComponent } from './detail/invoice-detail.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreateInvoiceComponent } from './create-invoice/create-invoice.component';
import { DataService } from '../../data.service';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  orderId: string;
  date: string;
  lines: InvoiceLine[];
  total: number;
  status: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, InvoiceDetailComponent, ModalComponent, CreateInvoiceComponent],
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent {
  invoices: Invoice[] = [];
  allInvoices: Invoice[] = [];

  // Filters
  invoiceId = '';
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
  selectedInvoiceId: string | null = null;

  // Modal
  createModalOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Invoices', route: '/invoices' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<any>('invoices.json').subscribe((response) => {
      const rawInvoices = response?.invoices ?? [];
      this.allInvoices = rawInvoices.map((inv: any) => ({
        id: inv.id,
        orderId: inv.orderId,
        date: inv.date,
        lines: inv.lines || [],
        total: inv.total,
        status: inv.status
      }));

      // Build status options from data
      const statusSet = new Set<string>();
      for (const inv of this.allInvoices) {
        if (inv.status) {
          statusSet.add(inv.status);
        }
      }
      this.statusOptions = Array.from(statusSet).sort().map((v, idx) => ({
        id: String(idx + 1),
        label: v.charAt(0).toUpperCase() + v.slice(1),
        value: v
      }));

      this.applyFilter();
    });
  }

  get pagedInvoices(): Invoice[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.invoices.slice(start, start + this.pageSize);
  }

  trackById(_: number, inv: Invoice): string {
    return inv.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.invoiceId = '';
    this.selectedStatus = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const invoiceId = this.invoiceId.trim().toLowerCase();
    const status = this.selectedStatus[0] || '';

    this.invoices = this.allInvoices.filter((inv) => {
      const matchesId = !invoiceId || 
        (inv.id || '').toLowerCase().includes(invoiceId) ||
        (inv.orderId || '').toLowerCase().includes(invoiceId);
      const matchesStatus = !status || inv.status === status;
      const invDate = inv.date ? new Date(inv.date) : null;
      const withinFrom = !this.fromDate || (invDate && invDate >= this.fromDate);
      const withinTo = !this.toDate || (invDate && invDate <= this.toDate);
      return matchesId && matchesStatus && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.invoices.length;
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
      case 'paid':
        return 'status-paid';
      case 'issued':
        return 'status-issued';
      case 'credited':
        return 'status-credited';
      case 'overdue':
        return 'status-overdue';
      default:
        return 'status-default';
    }
  }

  openDetailPanel(invoiceId: string): void {
    this.selectedInvoiceId = invoiceId;
    this.sidePanelOpen = true;
  }

  closeDetailPanel(): void {
    this.sidePanelOpen = false;
    this.selectedInvoiceId = null;
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  onInvoiceSaved(): void {
    this.closeCreateModal();
    // Reload invoices if needed
    this.applyFilter();
  }

  // Invoice Stats
  get totalInvoices(): number {
    return this.allInvoices.length;
  }

  get filteredInvoicesCount(): number {
    return this.invoices.length;
  }

  get totalValue(): number {
    return this.allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  }

  get paidInvoices(): number {
    return this.allInvoices.filter(inv => inv.status?.toLowerCase() === 'paid').length;
  }

  get overdueInvoices(): number {
    return this.allInvoices.filter(inv => inv.status?.toLowerCase() === 'overdue').length;
  }

  get issuedInvoices(): number {
    return this.allInvoices.filter(inv => inv.status?.toLowerCase() === 'issued').length;
  }

  get thisMonthInvoices(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allInvoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === currentMonth && 
             invDate.getFullYear() === currentYear;
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
}


