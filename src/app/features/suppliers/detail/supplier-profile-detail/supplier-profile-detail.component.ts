import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierOrdersComponent } from '../supplier-orders/supplier-orders.component';

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ProductCategory {
  category: string;
  items: string[];
}

export interface OrderHistory {
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: string;
  lastOrderId?: string;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
}

export interface Notes {
  internalNotes?: string;
  supplierNotes?: string;
}

export interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
}

export interface SupplierDetailModel {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contactPerson: string;
  first_name?: string;
  last_name?: string;
  contactEmail?: string;
  contactPhone?: string;
  supplierType: string;
  status: string;
  createdAt: string;
  address: Address;
  products?: ProductCategory[];
  orderHistory?: OrderHistory;
  notes?: Notes;
  activityLog: ActivityLogItem[];
}

@Component({
  standalone: true,
  selector: 'app-supplier-profile-detail',
  templateUrl: './supplier-profile-detail.component.html',
  styleUrls: ['./supplier-profile-detail.component.scss'],
  imports: [CommonModule, RouterModule, SupplierOrdersComponent]
})
export class SupplierProfileDetailComponent {
  @Input() supplier: SupplierDetailModel | null = null;
  @Input() supplierId: string | null = null;

  getStatusClass(status: string | undefined): string {
    if (!status) {
      return '';
    }
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return `status-${normalizedStatus}`;
  }

  formatStatus(status: string | undefined): string {
    if (!status) {
      return '';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      
      // Handle invalid dates
      if (isNaN(date.getTime())) {
        return this.formatDateFallback(dateString);
      }

      // Format based on whether it includes time
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      if (dateString.includes('T')) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

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
}

