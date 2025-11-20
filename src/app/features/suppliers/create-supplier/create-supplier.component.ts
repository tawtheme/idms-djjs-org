import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { SnackbarComponent, SnackbarConfig } from '../../../shared/components/snackbar/snackbar.component';

interface SupplierAddress {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Supplier {
  supplier_id: string;
  supplier_name: string;
  company: string;
  contact_person: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  supplier_type: string;
  status: string;
  billing_address: SupplierAddress;
  delivery_address: SupplierAddress;
  notes: string;
  created_by: string;
  created_at: string;
}

@Component({
  standalone: true,
  selector: 'app-create-supplier',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, SnackbarComponent],
  templateUrl: './create-supplier.component.html',
  styleUrls: ['./create-supplier.component.scss']
})
export class CreateSupplierComponent implements OnInit {
  @Input() isInModal: boolean = true; // Default to true since it's used in side panel
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  supplier: Supplier = {
    supplier_id: '',
    supplier_name: '',
    company: '',
    contact_person: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    supplier_type: '',
    status: 'Active',
    billing_address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    delivery_address: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    notes: '',
    created_by: '',
    created_at: new Date().toISOString()
  };

  submitting = false;
  snackbarConfig: SnackbarConfig | null = null;

  // Dropdown options
  supplierTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Paper & Materials', value: 'Paper & Materials' },
    { id: '2', label: 'Ink & Chemicals', value: 'Ink & Chemicals' },
    { id: '3', label: 'Equipment & Machinery', value: 'Equipment & Machinery' },
    { id: '4', label: 'Binding & Finishing', value: 'Binding & Finishing' },
    { id: '5', label: 'Digital Supplies', value: 'Digital Supplies' },
    { id: '6', label: 'Finishing Services', value: 'Finishing Services' },
    { id: '7', label: 'Logistics', value: 'Logistics' },
    { id: '8', label: 'Services', value: 'Services' },
    { id: '9', label: 'Packaging', value: 'Packaging' },
    { id: '10', label: 'Software & Technology', value: 'Software & Technology' }
  ];

  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' },
    { id: '3', label: 'Blocked', value: 'Blocked' },
    { id: '4', label: 'Pending', value: 'Pending' }
  ];

  constructor(private router: Router) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    this.generateSupplierId();
  }

  // ==================== Supplier ID Generation ====================
  generateSupplierId(): void {
    const year = new Date().getFullYear();
    const storageKey = `supplier_counter_${year}`;
    
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    localStorage.setItem(storageKey, counter.toString());
    
    const paddedCounter = counter.toString().padStart(3, '0');
    this.supplier.supplier_id = `SUP-${year}-${paddedCounter}`;
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
      (this.supplier as any)[parent][child] = value;
    } else {
      (this.supplier as any)[field] = value;
    }
  }

  // ==================== Form Submission Methods ====================
  save(): void {
    if (!this.supplier.supplier_name) {
      this.showError('Please fill Supplier Name');
      return;
    }

    if (!this.supplier.email) {
      this.showError('Please fill Email');
      return;
    }

    this.supplier.created_by = 'Current User';
    this.submitting = true;
    console.log('Saving supplier:', JSON.stringify(this.supplier, null, 2));

    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.showSuccess('Supplier created successfully');
        setTimeout(() => {
          this.saved.emit();
        }, 1000);
      } else {
        this.router.navigateByUrl('/suppliers');
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/suppliers');
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.supplier.supplier_name 
      && !!this.supplier.email
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

