import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SnackbarComponent, SnackbarConfig } from '../../../shared/components/snackbar/snackbar.component';
import { AddItemComponent, OrderItemData } from './add-item/add-item.component';
import { DataService } from '../../../data.service';
import { Order, OrderStatus } from '../../../models';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderData {
  id: string;
  externalId?: string;
  customerId: string;
  customerName?: string;
  orderDate: string;
  dueDate?: string;
  status: OrderStatus;
  source: string;
  items: OrderItemData[];
  shippingAddress: Address;
  notes?: string;
}

// Re-export OrderItemData for convenience
export type { OrderItemData };

@Component({
  standalone: true,
  selector: 'app-add-order',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, DatepickerComponent, SnackbarComponent, AddItemComponent],
  templateUrl: './add-order.component.html',
  styleUrls: ['./add-order.component.scss']
})
export class AddOrderComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Orders', route: '/orders' },
    { label: 'Add Order', route: '/orders/add' }
  ];

  order: OrderData = {
    id: '',
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    status: 'new',
    source: 'website',
    items: [],
    shippingAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  };


  submitting = false;
  snackbarConfig: SnackbarConfig | null = null;

  // Dropdown options
  statusOptions: DropdownOption[] = [
    { id: '1', label: 'New', value: 'new' },
    { id: '2', label: 'Confirmed', value: 'confirmed' },
    { id: '3', label: 'In Production', value: 'in_production' },
    { id: '4', label: 'Ready to Ship', value: 'ready_to_ship' },
    { id: '5', label: 'Shipped', value: 'shipped' },
    { id: '6', label: 'Cancelled', value: 'cancelled' }
  ];

  sourceOptions: DropdownOption[] = [
    { id: '1', label: 'Amazon', value: 'amazon' },
    { id: '2', label: 'Website', value: 'website' },
    { id: '3', label: 'Phone', value: 'phone' },
    { id: '4', label: 'Email', value: 'email' }
  ];

  customerOptions: DropdownOption[] = [];

  constructor(private router: Router, private data: DataService) {}

  ngOnInit(): void {
    this.generateOrderId();
    this.loadCustomers();
  }

  generateOrderId(): void {
    const year = new Date().getFullYear();
    const storageKey = `order_counter_${year}`;
    
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    localStorage.setItem(storageKey, counter.toString());
    
    const paddedCounter = counter.toString().padStart(6, '0');
    this.order.id = `ORD-${year}-${paddedCounter}`;
  }

  loadCustomers(): void {
    this.data.getJson<any>('customers.json').subscribe((response) => {
      const customers = response?.customers || [];
      this.customerOptions = customers.map((c: any, index: number) => ({
        id: String(index + 1),
        label: `${c.name}${c.company ? ` (${c.company})` : ''}`,
        value: c.id || c.customer_id
      }));
    });
  }


  getSelectedValues(value: string | null | undefined): string[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  onDropdownChange(field: string, values: string[]): void {
    const value = values.length > 0 ? values[0] : '';
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (this.order as any)[parent][child] = value;
    } else {
      (this.order as any)[field] = value;
    }
  }

  onDateChange(field: string, date: Date | null): void {
    if (date) {
      (this.order as any)[field] = date.toISOString().split('T')[0];
    } else {
      (this.order as any)[field] = undefined;
    }
  }

  getOrderDate(): Date | null {
    return this.order.orderDate ? new Date(this.order.orderDate) : null;
  }

  getDueDate(): Date | null {
    return this.order.dueDate ? new Date(this.order.dueDate) : null;
  }

  save(): void {
    if (!this.order.customerId) {
      this.showError('Please select a customer');
      return;
    }

    if (!this.order.orderDate) {
      this.showError('Please select an order date');
      return;
    }

    if (this.order.items.length === 0) {
      this.showError('Please add at least one item to the order');
      return;
    }

    this.submitting = true;
    console.log('Saving order:', JSON.stringify(this.order, null, 2));

    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.showSuccess('Order created successfully');
        setTimeout(() => {
          this.saved.emit();
        }, 1000);
      } else {
        this.showSuccess('Order created successfully');
        setTimeout(() => {
          this.router.navigateByUrl('/orders');
        }, 1000);
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/orders');
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.order.customerId 
      && !!this.order.orderDate
      && this.order.items.length > 0
      && (!this.form || (this.form.valid ?? true));
  }

  showError(message: string): void {
    this.snackbarConfig = {
      message,
      type: 'error',
      duration: 4000
    };
    setTimeout(() => {
      this.snackbarConfig = null;
    }, 4000);
  }

  showSuccess(message: string): void {
    this.snackbarConfig = {
      message,
      type: 'success',
      duration: 3000
    };
    setTimeout(() => {
      this.snackbarConfig = null;
    }, 3000);
  }

  onItemsChange(items: OrderItemData[]): void {
    this.order.items = items;
  }
}

