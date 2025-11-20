import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../../data.service';
import { PurchaseOrder } from '../../../../models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PagerComponent } from '../../../../shared/components/pager/pager.component';

interface PurchaseOrderResponse {
  purchaseOrders: PurchaseOrder[];
}

@Component({
  standalone: true,
  selector: 'app-supplier-orders',
  templateUrl: './supplier-orders.component.html',
  styleUrls: ['./supplier-orders.component.scss'],
  imports: [CommonModule, RouterModule, EmptyStateComponent, PagerComponent]
})
export class SupplierOrdersComponent implements OnInit, OnChanges {
  @Input() supplierId: string | null = null;
  
  purchaseOrders: PurchaseOrder[] = [];
  loading = false;
  filteredOrders: PurchaseOrder[] = [];

  // Pagination
  pageSizeOptions: number[] = [10, 20, 50];
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    if (this.supplierId) {
      this.loadPurchaseOrders();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supplierId'] && this.supplierId) {
      this.loadPurchaseOrders();
    }
  }

  private loadPurchaseOrders(): void {
    if (!this.supplierId || this.loading) {
      return;
    }

    this.loading = true;
    this.data.getJson<PurchaseOrderResponse>('purchase-orders.json').subscribe({
      next: (response) => {
        const allOrders = response?.purchaseOrders || [];
        // Filter orders by supplierId
        this.purchaseOrders = allOrders.filter(
          order => order.supplierId === this.supplierId
        );
        this.filteredOrders = [...this.purchaseOrders];
        this.totalItems = this.filteredOrders.length;
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.purchaseOrders = [];
        this.filteredOrders = [];
        this.totalItems = 0;
        this.currentPage = 1;
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return `status-${normalizedStatus}`;
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  get pagedOrders(): PurchaseOrder[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Order History Stats
  get totalOrders(): number {
    return this.filteredOrders.length;
  }

  get totalValue(): number {
    return this.filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  get averageOrderValue(): number {
    if (this.totalOrders === 0) return 0;
    return this.totalValue / this.totalOrders;
  }

  get lastOrder(): PurchaseOrder | null {
    if (this.filteredOrders.length === 0) return null;
    return this.filteredOrders.reduce((latest, order) => {
      if (!latest) return order;
      const orderDate = new Date(order.date);
      const latestDate = new Date(latest.date);
      return orderDate > latestDate ? order : latest;
    }, null as PurchaseOrder | null);
  }
}

