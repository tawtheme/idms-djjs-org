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
import { PurchaseOrderDetailComponent } from './detail/purchase-order-detail.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePurchaseOrderComponent } from './create-purchase-order/create-purchase-order.component';
import { DataService } from '../../data.service';
import { PurchaseOrder } from '../../models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, PurchaseOrderDetailComponent, ModalComponent, CreatePurchaseOrderComponent],
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss']
})
export class PurchaseOrdersComponent {
  purchaseOrders: PurchaseOrder[] = [];
  allPurchaseOrders: PurchaseOrder[] = [];

  // Filters
  purchaseOrderId = '';
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
  selectedPurchaseOrderId: string | null = null;

  // Modal
  createModalOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Purchase Orders', route: '/purchase-orders' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<{ purchaseOrders: PurchaseOrder[] }>('purchase-orders.json').subscribe((res) => {
      const rawPOs = res?.purchaseOrders ?? [];
      this.allPurchaseOrders = rawPOs.map((po: any) => ({
        id: po.id,
        supplierId: po.supplierId,
        date: po.date,
        expectedDate: po.expectedDate,
        lines: po.lines || [],
        total: po.total,
        status: po.status
      }));

      // Build status options from data
      const statusSet = new Set<string>();
      for (const po of this.allPurchaseOrders) {
        if (po.status) {
          statusSet.add(po.status);
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

  get pagedPurchaseOrders(): PurchaseOrder[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.purchaseOrders.slice(start, start + this.pageSize);
  }

  trackById(_: number, po: PurchaseOrder): string {
    return po.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.purchaseOrderId = '';
    this.selectedStatus = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const poId = this.purchaseOrderId.trim().toLowerCase();
    const status = this.selectedStatus[0] || '';

    this.purchaseOrders = this.allPurchaseOrders.filter((po) => {
      const matchesId = !poId || 
        (po.id || '').toLowerCase().includes(poId) ||
        (po.supplierId || '').toLowerCase().includes(poId);
      const matchesStatus = !status || po.status === status;
      const poDate = po.date ? new Date(po.date) : null;
      const withinFrom = !this.fromDate || (poDate && poDate >= this.fromDate);
      const withinTo = !this.toDate || (poDate && poDate <= this.toDate);
      return matchesId && matchesStatus && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.purchaseOrders.length;
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
      case 'received':
        return 'status-received';
      case 'sent':
        return 'status-sent';
      case 'pending':
        return 'status-pending';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  openDetailPanel(poId: string): void {
    this.selectedPurchaseOrderId = poId;
    this.sidePanelOpen = true;
  }

  closeDetailPanel(): void {
    this.sidePanelOpen = false;
    this.selectedPurchaseOrderId = null;
  }

  // Purchase Order Stats
  get totalPurchaseOrders(): number {
    return this.allPurchaseOrders.length;
  }

  get totalValue(): number {
    return this.allPurchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);
  }

  get receivedOrders(): number {
    return this.allPurchaseOrders.filter(po => po.status?.toLowerCase() === 'received').length;
  }

  get sentOrders(): number {
    return this.allPurchaseOrders.filter(po => po.status?.toLowerCase() === 'sent').length;
  }

  get pendingOrders(): number {
    return this.allPurchaseOrders.filter(po => po.status?.toLowerCase() === 'pending').length;
  }

  get draftOrders(): number {
    return this.allPurchaseOrders.filter(po => po.status?.toLowerCase() === 'draft').length;
  }

  get thisMonthOrders(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allPurchaseOrders.filter(po => {
      const poDate = new Date(po.date);
      return poDate.getMonth() === currentMonth && 
             poDate.getFullYear() === currentYear;
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

  onPurchaseOrderSaved(): void {
    this.closeCreateModal();
    // Reload purchase orders if needed
    this.applyFilter();
  }
}


