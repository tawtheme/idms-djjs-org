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

interface QuoteLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  tax: number;
}

interface QuoteTotals {
  subtotal: number;
  tax: number;
  taxPercent: number;
  discount: number;
  total: number;
  currency: string;
}

interface QuoteTerms {
  paymentTerms: string;
  validUntil: string;
  notes: string;
}

interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
}

interface QuoteDetailModel {
  id: string;
  orderId: string;
  date: string;
  validUntil: string;
  status: string;
  customerDetails: CustomerDetails;
  lines: QuoteLine[];
  totals: QuoteTotals;
  terms: QuoteTerms;
  activityLog: ActivityLogItem[];
}

interface QuoteDetailResponse {
  quotes: QuoteDetailModel[];
}

@Component({
  standalone: true,
  selector: 'app-quote-detail',
  templateUrl: './quote-detail.component.html',
  styleUrls: ['./quote-detail.component.scss'],
  imports: [CommonModule]
})
export class QuoteDetailComponent implements OnChanges {
  @Input() quoteId: string | null = null;
  loading = false;
  quote: QuoteDetailModel | null = null;

  constructor(private data: DataService) {}

  // ==================== Lifecycle Methods ====================
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quoteId'] && this.quoteId) {
      this.loadQuote();
    }
  }

  // ==================== Data Loading Methods ====================
  private loadQuote(): void {
    if (!this.quoteId || this.loading) {
      return;
    }

    this.loading = true;
    this.data.getJson<QuoteDetailResponse>('quotes_detail.json').subscribe({
      next: (response) => {
        const quotes = response?.quotes || [];
        const found = quotes.find((q) => q.id === this.quoteId);
        this.quote = found || null;
        this.loading = false;
      },
      error: () => {
        this.quote = null;
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

