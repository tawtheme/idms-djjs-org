import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerDetails {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  billingAddress: Address;
  shippingAddress?: Address;
}

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  tax: number;
}

interface InvoiceTotals {
  subtotal: number;
  tax: number;
  taxPercent: number;
  discount: number;
  total: number;
  currency: string;
}

interface PaymentInfo {
  paymentStatus: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  transactionId: string | null;
  paymentReference: string | null;
  amountPaid: number;
  balanceDue: number;
}

interface InvoiceTerms {
  paymentTerms: string;
  dueDate: string;
  lateFeePercent: number;
  notes: string;
}

interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
}

interface InvoiceDetailModel {
  id: string;
  orderId: string;
  date: string;
  dueDate: string;
  status: string;
  paidDate?: string;
  customerDetails: CustomerDetails;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
  paymentInfo: PaymentInfo;
  terms: InvoiceTerms;
  activityLog: ActivityLogItem[];
}

interface InvoiceDetailResponse {
  invoices: InvoiceDetailModel[];
}

@Component({
  standalone: true,
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss'],
  imports: [CommonModule]
})
export class InvoiceDetailComponent implements OnChanges {
  @Input() invoiceId: string | null = null;
  loading = false;
  invoice: InvoiceDetailModel | null = null;

  constructor(private data: DataService) {}

  // ==================== Lifecycle Methods ====================
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invoiceId'] && this.invoiceId) {
      this.loadInvoice();
    }
  }

  // ==================== Data Loading Methods ====================
  private loadInvoice(): void {
    if (!this.invoiceId || this.loading) {
      return;
    }

    this.loading = true;
    this.data.getJson<InvoiceDetailResponse>('invoices_detail.json').subscribe({
      next: (response) => {
        const invoices = response?.invoices || [];
        const found = invoices.find((inv) => inv.id === this.invoiceId);
        this.invoice = found || null;
        this.loading = false;
      },
      error: () => {
        this.invoice = null;
        this.loading = false;
      }
    });
  }

  // ==================== Formatting Methods ====================
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

