import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerAddresses {
  billing: Address;
  shipping: Address;
}

@Component({
  standalone: true,
  selector: 'app-customer-address-modal',
  templateUrl: './customer-address-modal.component.html',
  styleUrls: ['./customer-address-modal.component.scss'],
  imports: [CommonModule, ModalComponent]
})
export class CustomerAddressModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() addresses: CustomerAddresses | null = null;
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: any): void {
    // Component lifecycle hook - no action needed
  }

  onClose(): void {
    this.close.emit();
  }
}

