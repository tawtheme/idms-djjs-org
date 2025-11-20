import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';

interface PurchaseOrderItem {
  item_name: string;
  ordered_qty: number;
  received_qty: number;
  pending_qty: number;
  unit_price: number;
  total: number;
  status: string;
}

interface FinancialSummary {
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
}

interface Attachment {
  file_name: string;
  file_url: string;
}

interface ActivityLogItem {
  action: string;
  by: string;
  timestamp: string;
}

interface PurchaseOrderDetailModel {
  purchase_order_id: string;
  purchase_order_date: string;
  supplier_name: string;
  status: string;
  expected_delivery_date: string;
  created_by: string;
  approved_by: string;
  financial_summary: FinancialSummary;
  items: PurchaseOrderItem[];
  attachments: Attachment[];
  activity_log: ActivityLogItem[];
  remarks: string;
}

@Component({
  standalone: true,
  selector: 'app-purchase-order-detail',
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.scss'],
  imports: [CommonModule]
})
export class PurchaseOrderDetailComponent implements OnChanges {
  @Input() purchaseOrderId: string | null = null;
  loading = false;
  purchaseOrder: PurchaseOrderDetailModel | null = null;

  constructor(private data: DataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['purchaseOrderId']) {
      this.loadPurchaseOrder();
    }
  }

  private loadPurchaseOrder(): void {
    if (!this.purchaseOrderId || this.loading) return;
    this.loading = true;
    this.data.getJson<any>('purchase-orders_detail.json').subscribe((resp) => {
      const list = resp?.purchaseOrders || [];
      // Check for both purchase_order_id and id fields for compatibility
      const found = list.find((po: any) => 
        po.purchase_order_id === this.purchaseOrderId || po.id === this.purchaseOrderId
      );
      if (found) {
        this.purchaseOrder = found as PurchaseOrderDetailModel;
      }
      this.loading = false;
    }, () => { this.loading = false; });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const s = status.toLowerCase().replace(/\s+/g, '_');
    return `status-${s}`;
  }

  formatStatus(status: string | undefined): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return dateString;
      }
      if (dateString.includes('T')) {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        });
      }
    } catch {
      return dateString;
    }
  }
}
