import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { CustomerAddressModalComponent } from './customer-address-modal/customer-address-modal.component';
import { CustomerOrdersComponent } from './customer-orders/customer-orders.component';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderHistory {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  lastOrderId?: string;
  lastOrderDate?: string;
}

interface Notes {
  internalNotes?: string;
  customerNotes?: string;
}

interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
}


interface CustomerDetailModel {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source?: string;
  createdAt: string;
  lastOrderDate?: string;
  addresses: {
    billing: Address;
    shipping: Address;
  };
  orderHistory?: OrderHistory;
  notes?: Notes;
  activityLog: ActivityLogItem[];
}

interface CustomerDetailResponse {
  customers: CustomerDetailModel[];
  filters?: {
    status?: string[];
    source?: string[];
    date?: string[];
  };
}


@Component({
  standalone: true,
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, BreadcrumbComponent, CustomerAddressModalComponent, CustomerOrdersComponent]
})
export class CustomerDetailComponent implements OnInit, OnChanges {
  @Input() customerId: string | null = null;
  @Output() closeDetailModal = new EventEmitter<void>();
  @Output() requestDetailModalReopen = new EventEmitter<void>();
  @Output() addressModalOpening = new EventEmitter<any>();
  
  loading = false;
  customer: CustomerDetailModel | null = null;
  isModalMode = false;

  // Address modal
  addressModalOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Customers', route: '/customers' },
    { label: 'Customer Details', route: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    // If customerId is provided as Input, use it; otherwise get from route
    if (this.customerId) {
      this.isModalMode = true;
      this.loadCustomer();
    } else {
      this.isModalMode = false;
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.customerId = id;
          this.loadCustomer();
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId']) {
      if (changes['customerId'].currentValue) {
        this.isModalMode = true;
        if (!changes['customerId'].firstChange) {
          this.loadCustomer();
        }
      }
    }
  }

  // ==================== Data Loading Methods ====================
  private loadCustomer(): void {
    if (!this.customerId || this.loading) {
      return;
    }

    this.loading = true;
    this.data.getJson<CustomerDetailResponse>('customers_detail.json').subscribe({
      next: (response) => {
        const customers = response?.customers || [];
        const found = customers.find((c) => c.id === this.customerId);
        this.customer = found || null;
        this.loading = false;
        
        if (this.customer) {
          this.breadcrumbs[1].label = this.customer.name;
        }
      },
      error: () => {
        this.customer = null;
        this.loading = false;
      }
    });
  }

  // ==================== Formatting Methods ====================
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return this.formatDateFallback(dateString);
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

  formatJoinedDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return this.formatDateFallback(dateString);
      }

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  }

  private formatDateFallback(dateString: string): string {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  }

  // ==================== Action Methods ====================
  blockCustomer(): void {
    // TODO: Implement block customer functionality
  }

  copyToClipboard(text: string | null | undefined): void {
    if (!text) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopyFeedback();
      }).catch(() => {
        // Fallback to execCommand if clipboard API fails
        this.fallbackCopyToClipboard(text);
      });
    } else {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showCopyFeedback();
      }
    } catch (err) {
      // Silent fail
    }
    document.body.removeChild(textArea);
  }

  private showCopyFeedback(): void {
    // Create a temporary toast-like notification
    const toast = document.createElement('div');
    toast.textContent = 'Copied to clipboard!';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('copy-toast-animation')) {
      const style = document.createElement('style');
      style.id = 'copy-toast-animation';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 2 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // ==================== Address Modal Methods ====================
  openAddressModal(): void {
    // Close detail modal first if in modal mode
    if (this.isModalMode) {
      // Notify parent that address modal is opening BEFORE closing detail modal
      // Pass addresses to parent so it can display the modal
      this.addressModalOpening.emit(this.customer?.addresses || null);
      this.closeDetailModal.emit();
    } else {
      // If not in modal mode, open immediately in this component
      this.addressModalOpen = true;
    }
  }

  closeAddressModal(): void {
    this.addressModalOpen = false;
    
    // Reopen detail modal if we were in modal mode
    if (this.isModalMode) {
      // Use setTimeout to ensure address modal closes first
      setTimeout(() => {
        this.requestDetailModalReopen.emit();
      }, 100);
    }
  }

  // ==================== Utility Methods ====================
  getShortAddress(address: any, maxLength: number = 50): string {
    if (!address) {
      return 'N/A';
    }
    
    const parts: string[] = [];
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    
    const fullAddress = parts.join(', ');
    
    if (fullAddress.length <= maxLength) {
      return fullAddress;
    }
    
    return fullAddress.substring(0, maxLength).trim() + '...';
  }

  getFullAddress(address: any): string {
    if (!address) {
      return 'N/A';
    }
    
    const parts: string[] = [];
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
}

