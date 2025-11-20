import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SnackbarComponent, SnackbarConfig } from '../../../shared/components/snackbar/snackbar.component';

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source?: string;
  createdAt: string;
  addresses: {
    billing: Address;
    shipping: Address;
  };
  notes?: string;
}

@Component({
  standalone: true,
  selector: 'app-add-customer',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, SnackbarComponent],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Customers', route: '/customers' },
    { label: 'Add Customer', route: '/customers/add' }
  ];

  customer: Customer = {
    id: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Active',
    source: '',
    createdAt: new Date().toISOString(),
    addresses: {
      billing: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      shipping: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    },
    notes: ''
  };

  submitting = false;
  snackbarConfig: SnackbarConfig | null = null;

  // Dropdown options
  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' },
    { id: '3', label: 'Blocked', value: 'Blocked' },
    { id: '4', label: 'Pending', value: 'Pending' }
  ];

  sourceOptions: DropdownOption[] = [
    { id: '1', label: 'Amazon', value: 'Amazon' },
    { id: '2', label: 'Website', value: 'Website' },
    { id: '3', label: 'Referral', value: 'Referral' },
    { id: '4', label: 'Phone', value: 'Phone' },
    { id: '5', label: 'Email', value: 'Email' },
    { id: '6', label: 'Partner', value: 'Partner' },
    { id: '7', label: 'Trade Show', value: 'Trade Show' }
  ];

  constructor(private router: Router) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    this.generateCustomerId();
  }

  // ==================== Customer ID Generation ====================
  generateCustomerId(): void {
    const year = new Date().getFullYear();
    const storageKey = `customer_counter_${year}`;
    
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    localStorage.setItem(storageKey, counter.toString());
    
    const paddedCounter = counter.toString().padStart(3, '0');
    this.customer.id = `CUST-${year}-${paddedCounter}`;
  }

  // ==================== Utility Methods ====================
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
      (this.customer as any)[parent][child] = value;
    } else {
      (this.customer as any)[field] = value;
    }
  }

  copyBillingToShipping(): void {
    this.customer.addresses.shipping = {
      ...this.customer.addresses.billing
    };
  }

  // ==================== Form Submission Methods ====================
  save(): void {
    if (!this.customer.name) {
      this.showError('Please fill Customer Name');
      return;
    }

    if (!this.customer.email) {
      this.showError('Please fill Email');
      return;
    }

    if (!this.customer.phone) {
      this.showError('Please fill Phone');
      return;
    }

    this.submitting = true;
    console.log('Saving customer:', JSON.stringify(this.customer, null, 2));

    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.showSuccess('Customer created successfully');
        setTimeout(() => {
          this.saved.emit();
        }, 1000);
      } else {
        this.showSuccess('Customer created successfully');
        setTimeout(() => {
          this.router.navigateByUrl('/customers');
        }, 1000);
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/customers');
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.customer.name 
      && !!this.customer.email
      && !!this.customer.phone
      && (!this.form || (this.form.valid ?? true));
  }

  // ==================== Snackbar Methods ====================
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
}

