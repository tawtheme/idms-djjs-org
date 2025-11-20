import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../../data.service';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';

interface CustomerOrder {
  order_id: string;
  order_date: string;
  order_status: string;
  order_source?: string;
  total_amount: number;
  items?: Array<{
    title?: string;
    sku?: string;
  }>;
}

interface OrdersResponse {
  orders: CustomerOrder[];
}

interface CustomerDetailResponse {
  filters?: {
    status?: string[];
    source?: string[];
    date?: string[];
  };
}

@Component({
  standalone: true,
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.scss'],
  imports: [CommonModule, FormsModule, DropdownComponent, DatepickerComponent]
})
export class CustomerOrdersComponent implements OnInit, OnChanges {
  @Input() customerId: string | null = null;
  @Input() customerName: string | null = null;
  @Input() customerCompany: string | null = null;

  customerOrders: CustomerOrder[] = [];
  allCustomerOrders: CustomerOrder[] = [];

  // Order filtering
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];
  selectedSource: any[] = [];
  sourceOptions: DropdownOption[] = [];
  selectedDate: Date | null = null;
  searchText = '';

  ngOnInit(): void {
    if (this.customerId) {
      this.loadFilterOptions();
      this.loadCustomerOrders();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'] && !changes['customerId'].firstChange) {
      this.loadCustomerOrders();
    }
  }

  private loadFilterOptions(): void {
    this.data.getJson<CustomerDetailResponse>('customers_detail.json').subscribe({
      next: (response) => {
        // Load status options from JSON
        if (response?.filters?.status) {
          this.statusOptions = response.filters.status.map((v, idx) => ({
            id: String(idx + 1),
            label: v.charAt(0).toUpperCase() + v.slice(1),
            value: v
          }));
        }
        
        // Load source options from JSON
        if (response?.filters?.source) {
          this.sourceOptions = response.filters.source.map((v, idx) => ({
            id: String(idx + 1),
            label: v,
            value: v
          }));
        }
      }
    });
  }

  private loadCustomerOrders(): void {
    if (!this.customerId) {
      return;
    }

    this.data.getJson<OrdersResponse>('orders.json').subscribe({
      next: (response) => {
        const allOrders = response?.orders || [];
        // Filter orders by customer
        this.allCustomerOrders = allOrders.filter((order: any) => {
          const customerName = order.customer_name || '';
          const orderCustomerName = customerName.toLowerCase();
          const customerNameMatch = this.customerName?.toLowerCase() || '';
          const customerCompanyMatch = this.customerCompany?.toLowerCase() || '';
          
          // Match by customer name or company name
          return orderCustomerName.includes(customerNameMatch) ||
                 (customerCompanyMatch && orderCustomerName.includes(customerCompanyMatch)) ||
                 orderCustomerName.includes(this.customerId?.toLowerCase() || '');
        });

        this.applyOrderFilters();
      },
      error: () => {
        this.allCustomerOrders = [];
        this.customerOrders = [];
      }
    });
  }

  // ==================== Order Filtering Methods ====================
  applyOrderFilters(): void {
    let filtered = [...this.allCustomerOrders];

    // Filter by status (skip if empty or "all" is selected)
    if (this.selectedStatus.length > 0 && this.selectedStatus[0] !== 'all') {
      const selectedStatusValue = this.selectedStatus[0];
      filtered = filtered.filter(order => {
        if (!order.order_status) return false;
        return order.order_status === selectedStatusValue;
      });
    }

    // Filter by source (skip if empty or "all" is selected)
    if (this.selectedSource.length > 0 && this.selectedSource[0] !== 'all') {
      const selectedSourceValue = this.selectedSource[0];
      filtered = filtered.filter(order => {
        if (!order.order_source) return false;
        // Normalize both for comparison
        const orderSource = order.order_source.charAt(0).toUpperCase() + order.order_source.slice(1).toLowerCase();
        return orderSource === selectedSourceValue;
      });
    }

    // Filter by date
    if (this.selectedDate) {
      const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(order => {
        if (!order.order_date) return false;
        const orderDateStr = order.order_date.split('T')[0];
        return orderDateStr === selectedDateStr;
      });
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(order => {
        return order.order_id.toLowerCase().includes(search) ||
               (order.items && order.items.some((item: any) => 
                 (item.title || '').toLowerCase().includes(search)
               ));
      });
    }

    this.customerOrders = filtered;
  }

  onStatusFilterChange(): void {
    this.applyOrderFilters();
  }

  onSourceFilterChange(): void {
    this.applyOrderFilters();
  }

  onDateFilterChange(): void {
    this.applyOrderFilters();
  }

  onSearchChange(): void {
    this.applyOrderFilters();
  }

  resetFilters(): void {
    // Reset all filters to show all data (empty selections show all)
    this.selectedStatus = [];
    this.selectedSource = [];
    this.selectedDate = null;
    
    // Reapply filters
    this.applyOrderFilters();
  }

  // ==================== Formatting Methods ====================
  getStatusClass(status: string | undefined): string {
    if (!status) {
      return '';
    }
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return `status-${normalizedStatus}`;
  }

  formatOrderDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  }

  formatSource(source: string | undefined | null): string {
    if (!source) {
      return 'N/A';
    }
    // Normalize to title case
    return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
  }

  trackByOrderId(index: number, order: CustomerOrder): string {
    return order.order_id;
  }

  exportOrderList(): void {
    // TODO: Implement export functionality
    console.log('Export order list');
  }

  constructor(private data: DataService) {}
}

