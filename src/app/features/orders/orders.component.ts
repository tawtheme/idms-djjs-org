import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OrderDetailComponent } from './detail/order-detail.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AddOrderComponent } from './add-order/add-order.component';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../shared/components/datepicker/datepicker.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../shared/components/menu-dropdown/menu-dropdown.component';
import { DataService } from '../../data.service';
import { Order } from '../../models';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, ModalComponent, AddOrderComponent, OrderDetailComponent, PagerComponent, EmptyStateComponent, MenuDropdownComponent],
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {
  orders: Array<Order & { source?: string }> = [];
  allOrders: Array<Order & { source?: string }> = [];

  // Modal state
  detailModalOpen = false;
  selectedOrderId: string | null = null;
  addOrderModalOpen = false;

  // Filters
  orderNumber = '';
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];
  selectedSource: any[] = [];
  sourceOptions: DropdownOption[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  actionOptions: DropdownOption[] = [
    { id: 'view', label: 'View', value: 'view' }
  ];

  getActionOptions(order: Order & { source?: string }): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'edit',
        label: 'Edit',
        value: 'edit',
        icon: 'edit'
      }
    ];
  }

  onAction(order: Order & { source?: string }, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(order);
    } else if (actionId === 'edit') {
      // Navigate to edit page or open edit modal
      this.viewDetails(order);
    }
  }

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Orders', route: '/orders' }
  ];

  constructor(private data: DataService, private router: Router) {
    forkJoin({
      orders: this.data.getJson<any>('orders.json')
    }).subscribe(({ orders }) => {
      // Get filter values from JSON
      const filterSources = (orders?.filters?.order_source || []).map((s: any) => String(s).toLowerCase());
      const filterStatuses = orders?.filters?.order_status || [];
      const allow = filterSources.length > 0 ? new Set(filterSources) : new Set(['amazon', 'website']);

      // Map orders data
      const rawOrders = orders?.orders ?? [];
      this.allOrders = rawOrders.map((o: any) => {
        const raw = String(o.order_source || '').toLowerCase();
        const normalizedSource = allow.has(raw) ? raw : (raw === 'amazon' ? 'amazon' : 'website');
        return ({
          id: o.order_id,
          customerId: o.customer_name,
          orderDate: o.order_date,
          status: o.order_status,
          source: normalizedSource
        } as any);
      });

      // Build status options from JSON filters (maintains sequence)
      this.statusOptions = filterStatuses.map((v: string, i: number) => ({
        id: String(i + 1),
        label: String(v),
        value: String(v)
      }));

      // Build source options from JSON filters (maintains sequence)
      this.sourceOptions = filterSources.map((v: string, i: number) => ({
        id: String(i + 1),
        label: String(v),
        value: String(v)
      }));

      this.applyFilter();
    });
  }

  get filteredOrders(): Array<Order & { source?: string }> { return this.orders; }

  get pagedOrders(): Array<Order & { source?: string }> {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  trackById(_: number, o: Order & { source?: string }): string {
    return o.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.orderNumber = '';
    this.selectedStatus = [];
    this.selectedSource = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  viewDetails(order: Order & { source?: string }): void {
    if (!order?.id) return;
    this.selectedOrderId = order.id;
    this.detailModalOpen = true;
  }

  closeDetailModal(): void {
    this.detailModalOpen = false;
    this.selectedOrderId = null;
  }

  applyFilter(): void {
    const num = this.orderNumber.trim().toLowerCase();
    const status = this.selectedStatus[0] || '';
    const source = this.selectedSource[0] || '';

    this.orders = (this.allOrders as any).filter((o: any) => {
      const matchesNum = !num || (o.id || '').toLowerCase().includes(num);
      const matchesStatus = !status || o.status === status;
      const matchesSource = !source || o.source === source;
      const od = o.orderDate ? new Date(o.orderDate) : null;
      const withinFrom = !this.fromDate || (od && od >= this.fromDate);
      const withinTo = !this.toDate || (od && od <= this.toDate);
      return matchesNum && matchesStatus && matchesSource && withinFrom && withinTo;
    });

    // reset pagination after filtering
    this.totalItems = this.orders.length;
    this.currentPage = 1;
  }

  // Pagination event handlers for pager component
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  getStatusClass(status: string | undefined): string {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    return `status-${s}`;
  }

  onCreateOrderClick(): void {
    this.addOrderModalOpen = true;
  }

  closeAddOrderModal(): void {
    this.addOrderModalOpen = false;
  }

  onOrderSaved(): void {
    this.closeAddOrderModal();
    // Reload orders list if needed
    // You can add logic here to refresh the orders
  }

  onOrderCancelled(): void {
    this.closeAddOrderModal();
  }
}