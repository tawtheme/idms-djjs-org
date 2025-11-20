import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';

interface TrackingHistoryItem {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface PackageDetails {
  weight: string;
  dimensions: string;
  packageType: string;
  itemsCount: number;
  declaredValue: number;
  currency: string;
}

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface RecipientDetails {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

interface SenderDetails {
  name: string;
  email?: string;
  phone?: string;
  address: Address;
}

interface ShippingService {
  serviceType: string;
  serviceLevel: string;
  signatureRequired: boolean;
  insurance: boolean;
  insuranceAmount: number;
}

interface DeliveryDetails {
  deliveredTo?: string;
  signedBy?: string;
  deliveryNotes?: string;
  attemptCount?: number;
  lastAttemptDate?: string;
  failureReason?: string;
  nextAttemptDate?: string;
}

interface ExceptionDetails {
  exceptionType?: string;
  exceptionReason?: string;
  requiresAction?: boolean;
  actionRequired?: string;
  holdDate?: string;
}

interface ReturnDetails {
  returnReason?: string;
  returnDate?: string;
  returnTrackingNumber?: string;
  estimatedReturnDate?: string;
}

interface HoldDetails {
  holdReason?: string;
  holdDate?: string;
  requiresAction?: boolean;
  actionRequired?: string;
  estimatedReleaseDate?: string;
}

interface Costs {
  shippingCost: number;
  insuranceCost: number;
  totalCost: number;
  currency: string;
}

interface ActivityLogItem {
  timestamp: string;
  action: string;
  user: string;
}

interface ShipmentDetailModel {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  shipDate: string;
  status: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryTime?: string;
  packageDetails: PackageDetails;
  recipientDetails: RecipientDetails;
  senderDetails: SenderDetails;
  shippingService: ShippingService;
  trackingHistory: TrackingHistoryItem[];
  deliveryDetails?: DeliveryDetails;
  exceptionDetails?: ExceptionDetails;
  returnDetails?: ReturnDetails;
  holdDetails?: HoldDetails;
  costs: Costs;
  activityLog: ActivityLogItem[];
}

@Component({
  standalone: true,
  selector: 'app-shipment-detail',
  templateUrl: './shipment-detail.component.html',
  styleUrls: ['./shipment-detail.component.scss'],
  imports: [CommonModule]
})
export class ShipmentDetailComponent implements OnChanges {
  @Input() shipmentId: string | null = null;
  loading = false;
  shipment: ShipmentDetailModel | null = null;

  constructor(private data: DataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shipmentId']) {
      this.loadShipment();
    }
  }

  private loadShipment(): void {
    if (!this.shipmentId || this.loading) return;
    this.loading = true;
    this.data.getJson<any>('shipments_detail.json').subscribe((resp) => {
      const list = resp?.shipments || [];
      const found = list.find((s: any) => s.id === this.shipmentId);
      if (found) {
        this.shipment = found as ShipmentDetailModel;
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
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatAddress(address: Address): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If it's just a date string (YYYY-MM-DD), format it differently
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return dateString;
      }
      // Check if it's a date-only string (no time component)
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

