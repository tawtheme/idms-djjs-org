import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DataService } from '../../../data.service';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShipmentForm {
  shipmentId: string;
  carrier: string;
  trackingNumber: string;
  shipDate: string;
  status: string;
  estimatedDeliveryDate?: string;
  packageDetails: {
    weight: string;
    dimensions: string;
    packageType: string;
    itemsCount: number;
    declaredValue: number;
    currency: string;
  };
  recipientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: Address;
  };
  senderDetails: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address: Address;
  };
  shippingService: {
    serviceType: string;
    serviceLevel: string;
    signatureRequired: boolean;
    insurance: boolean;
    insuranceAmount: number;
  };
  costs: {
    shippingCost: number;
    insuranceCost: number;
    totalCost: number;
    currency: string;
  };
}

@Component({
  standalone: true,
  selector: 'app-create-shipment',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, DatepickerComponent, BreadcrumbComponent],
  templateUrl: './create-shipment.component.html',
  styleUrls: ['./create-shipment.component.scss']
})
export class CreateShipmentComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Shipments', route: '/shipments' },
    { label: 'Create Shipment', route: '/shipments/create' }
  ];

  shipment: ShipmentForm = {
    shipmentId: '',
    carrier: '',
    trackingNumber: '',
    shipDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    estimatedDeliveryDate: '',
    packageDetails: {
      weight: '',
      dimensions: '',
      packageType: '',
      itemsCount: 1,
      declaredValue: 0,
      currency: 'USD'
    },
    recipientDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA'
      }
    },
    senderDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA'
      }
    },
    shippingService: {
      serviceType: '',
      serviceLevel: '',
      signatureRequired: false,
      insurance: false,
      insuranceAmount: 0
    },
    costs: {
      shippingCost: 0,
      insuranceCost: 0,
      totalCost: 0,
      currency: 'USD'
    }
  };

  submitting = false;

  // Dropdown options
  carrierOptions: DropdownOption[] = [
    { id: '1', label: 'FedEx', value: 'FedEx' },
    { id: '2', label: 'UPS', value: 'UPS' },
    { id: '3', label: 'USPS', value: 'USPS' },
    { id: '4', label: 'DHL', value: 'DHL' },
    { id: '5', label: 'Amazon Logistics', value: 'Amazon Logistics' }
  ];

  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Pending', value: 'pending' },
    { id: '2', label: 'In Transit', value: 'in_transit' },
    { id: '3', label: 'Out for Delivery', value: 'out_for_delivery' },
    { id: '4', label: 'Delivered', value: 'delivered' },
    { id: '5', label: 'Exception', value: 'exception' },
    { id: '6', label: 'Returned', value: 'returned' }
  ];

  packageTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Box', value: 'Box' },
    { id: '2', label: 'Envelope', value: 'Envelope' },
    { id: '3', label: 'Package', value: 'Package' },
    { id: '4', label: 'Pallet', value: 'Pallet' },
    { id: '5', label: 'Tube', value: 'Tube' }
  ];

  serviceTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Ground', value: 'Ground' },
    { id: '2', label: 'Express', value: 'Express' },
    { id: '3', label: 'Overnight', value: 'Overnight' },
    { id: '4', label: '2-Day', value: '2-Day' },
    { id: '5', label: '3-Day', value: '3-Day' }
  ];

  serviceLevelOptions: DropdownOption[] = [
    { id: '1', label: 'Standard', value: 'Standard' },
    { id: '2', label: 'Priority', value: 'Priority' },
    { id: '3', label: 'Express', value: 'Express' }
  ];

  countryOptions: DropdownOption[] = [
    { id: '1', label: 'United States', value: 'USA' },
    { id: '2', label: 'Canada', value: 'Canada' },
    { id: '3', label: 'Mexico', value: 'Mexico' }
  ];

  constructor(private data: DataService, private router: Router) {}

  ngOnInit(): void {
    // Load any additional data if needed
  }

  getSelectedValues(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  onDropdownChange(path: string[], value: any): void {
    const selectedValue = Array.isArray(value) && value.length > 0 ? value[0] : value;
    let target: any = this.shipment;
    
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]];
    }
    
    target[path[path.length - 1]] = selectedValue;
  }

  onInsuranceChange(): void {
    if (!this.shipment.shippingService.insurance) {
      this.shipment.shippingService.insuranceAmount = 0;
      this.shipment.costs.insuranceCost = 0;
    }
    this.calculateTotalCost();
  }

  calculateTotalCost(): void {
    this.shipment.costs.totalCost = 
      this.shipment.costs.shippingCost + 
      this.shipment.costs.insuranceCost;
  }

  getDateValue(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  onShipDateChange(date: Date | null): void {
    this.shipment.shipDate = date ? this.formatYmd(date) : '';
  }

  onEstimatedDeliveryDateChange(date: Date | null): void {
    this.shipment.estimatedDeliveryDate = date ? this.formatYmd(date) : '';
  }

  private formatYmd(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  save(): void {
    if (!this.shipment.shipmentId || !this.shipment.carrier || !this.shipment.trackingNumber) {
      alert('Please fill required fields: Shipment ID, Carrier, and Tracking Number');
      return;
    }

    // Calculate total cost
    this.calculateTotalCost();

    this.submitting = true;
    console.log('Saving shipment:', JSON.stringify(this.shipment, null, 2));

    // In a real app, you would save to the backend here
    // this.data.createShipment(this.shipment).subscribe({
    //   next: () => {
    //     this.submitting = false;
    //     if (this.isInModal) {
    //       this.saved.emit();
    //     } else {
    //       this.router.navigate(['/shipments']);
    //     }
    //   },
    //   error: (error) => {
    //     console.error('Error creating shipment:', error);
    //     this.submitting = false;
    //   }
    // });

    // Simulate API call
    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.saved.emit();
      } else {
        this.router.navigateByUrl('/shipments');
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/shipments');
    }
  }
}

