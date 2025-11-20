import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SnackbarComponent, SnackbarConfig } from '../../../shared/components/snackbar/snackbar.component';
import { DataService } from '../../../data.service';

interface QuoteItem {
  item_id: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  total_amount: number;
}

interface CustomerAddress {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Customer {
  customer_id: string;
  customer_name: string;
  company: string;
  email: string;
  phone: string;
  billing_address: CustomerAddress;
  shipping_address: CustomerAddress;
}

interface QuoteTotals {
  subtotal: number;
  tax: number;
  tax_percent: number;
  discount: number;
  discount_percent: number;
  total: number;
  currency: string;
}

interface Quote {
  quote_id: string;
  quote_date: string;
  valid_until: string;
  order_id: string;
  customer: Customer;
  status: string;
  items: QuoteItem[];
  totals: QuoteTotals;
  payment_terms: string;
  notes: string;
  created_by: string;
  approved_by: string | null;
}

interface CustomerData {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface ItemData {
  item_id: string;
  item_name: string;
  description: string;
  tax_percent: number;
  unit_price: number;
}

@Component({
  standalone: true,
  selector: 'app-create-quote',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, DatepickerComponent, BreadcrumbComponent, SnackbarComponent],
  templateUrl: './create-quote.component.html',
  styleUrls: ['./create-quote.component.scss']
})
export class CreateQuoteComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Quotes', route: '/quotes' },
    { label: 'Create Quote', route: '/quotes/create' }
  ];

  quote: Quote = {
    quote_id: '',
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    order_id: '',
    customer: {
      customer_id: '',
      customer_name: '',
      company: '',
      email: '',
      phone: '',
      billing_address: {
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: ''
      },
      shipping_address: {
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: ''
      }
    },
    status: 'draft',
    items: [],
    totals: {
      subtotal: 0,
      tax: 0,
      tax_percent: 8,
      discount: 0,
      discount_percent: 0,
      total: 0,
      currency: 'USD'
    },
    payment_terms: 'Net 30',
    notes: '',
    created_by: '',
    approved_by: null
  };

  submitting = false;
  editingDiscount = false;
  discountEditValue = '0';
  snackbarConfig: SnackbarConfig | null = null;
  newItem: QuoteItem = {
    item_id: '',
    item_name: '',
    description: '',
    quantity: 0,
    unit_price: 0,
    tax_percent: 8,
    total_amount: 0
  };

  // Dropdown options
  customerOptions: DropdownOption[] = [];
  allCustomers: CustomerData[] = [];
  itemOptions: DropdownOption[] = [];
  allItems: ItemData[] = [];

  constructor(private router: Router, private data: DataService) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    this.generateQuoteId();
    this.loadCustomers();
    this.loadItems();
  }

  // ==================== Data Loading Methods ====================
  loadCustomers(): void {
    this.data.getJson<{ customers: CustomerData[] }>('customers.json').subscribe((response) => {
      const rawCustomers = response?.customers ?? [];
      this.allCustomers = rawCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company || '',
        email: c.email || '',
        phone: c.phone || ''
      }));

      this.customerOptions = this.allCustomers.map((customer) => ({
        id: customer.id,
        label: customer.name || customer.company,
        value: customer.id
      }));
    });
  }

  // ==================== Customer Methods ====================
  onCustomerChange(customerId: string): void {
    const selectedCustomer = this.allCustomers.find(c => c.id === customerId);
    if (selectedCustomer) {
      this.quote.customer.customer_id = selectedCustomer.id;
      this.quote.customer.customer_name = selectedCustomer.name || '';
      this.quote.customer.company = selectedCustomer.company || '';
      this.quote.customer.email = selectedCustomer.email || '';
      this.quote.customer.phone = selectedCustomer.phone || '';
    }
  }

  loadItems(): void {
    this.data.getJson<{ items: ItemData[] }>('items.json').subscribe((response) => {
      const rawItems = response?.items ?? [];
      this.allItems = rawItems.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        description: item.description || '',
        tax_percent: item.tax_percent || 8,
        unit_price: item.unit_price || 0
      }));

      this.itemOptions = this.allItems.map((item) => ({
        id: item.item_id,
        label: item.item_name,
        value: item.item_id,
        description: item.description
      }));
    });
  }

  // ==================== Item Methods ====================
  onItemChange(itemId: string): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem) {
      this.newItem.item_id = selectedItem.item_id;
      this.newItem.item_name = selectedItem.item_name;
      this.newItem.description = selectedItem.description || '';
      this.newItem.tax_percent = selectedItem.tax_percent || 8;
      this.newItem.unit_price = selectedItem.unit_price || 0;
      // Recalculate item total and overall totals when item is selected
      this.calculateItemTotal(this.newItem);
    }
  }

  onItemChangeForExisting(itemId: string, index: number): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem && this.quote.items[index]) {
      this.quote.items[index].item_id = selectedItem.item_id;
      this.quote.items[index].item_name = selectedItem.item_name;
      this.quote.items[index].description = selectedItem.description || '';
      this.quote.items[index].tax_percent = selectedItem.tax_percent || 8;
      this.quote.items[index].unit_price = selectedItem.unit_price || 0;
      this.calculateItemTotal(this.quote.items[index]);
      this.calculateTotals();
    }
  }

  // ==================== Quote ID Generation ====================
  generateQuoteId(): void {
    const year = new Date().getFullYear();
    const storageKey = `quote_counter_${year}`;
    
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    localStorage.setItem(storageKey, counter.toString());
    
    const paddedCounter = counter.toString().padStart(3, '0');
    this.quote.quote_id = `QT-${year}-${paddedCounter}`;
  }

  // ==================== Utility Methods ====================
  getSelectedValues(value: string | null | undefined): string[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  // ==================== Calculation Methods ====================
  calculateItemTotal(item: QuoteItem): void {
    const subtotal = item.quantity * item.unit_price;
    const taxAmount = (subtotal * item.tax_percent) / 100;
    item.total_amount = subtotal + taxAmount;
    this.calculateTotals();
  }

  calculateTotals(): void {
    // Calculate subtotal from existing items
    let subtotal = this.quote.items.reduce((sum: number, item: QuoteItem) => 
      sum + (item.quantity * item.unit_price), 0);
    
    // Include newItem in subtotal if it has valid data
    if (this.newItem.item_id && this.newItem.quantity > 0 && this.newItem.unit_price > 0) {
      subtotal += this.newItem.quantity * this.newItem.unit_price;
    }
    
    // Use discount amount directly (now editable inline)
    const discountAmount = this.quote.totals.discount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    
    const taxAmount = (afterDiscount * this.quote.totals.tax_percent) / 100;
    
    this.quote.totals.subtotal = subtotal;
    this.quote.totals.tax = taxAmount;
    this.quote.totals.total = afterDiscount + taxAmount;
  }

  // ==================== Item Management Methods ====================
  addItem(): void {
    if (!this.newItem.item_id || !this.newItem.item_name || !this.newItem.quantity || !this.newItem.unit_price) {
      this.showError('Please fill Item Name, Quantity, and Unit Price');
      return;
    }
    this.calculateItemTotal(this.newItem);
    this.quote.items.push({ ...this.newItem });
    this.resetNewItem();
    this.calculateTotals();
  }

  addNewItemSection(): void {
    const emptyItem: QuoteItem = {
      item_id: '',
      item_name: '',
      description: '',
      quantity: 0,
      unit_price: 0,
      tax_percent: 8,
      total_amount: 0
    };
    this.quote.items.push(emptyItem);
  }

  removeItem(index: number): void {
    this.quote.items.splice(index, 1);
    this.calculateTotals();
  }

  resetNewItem(): void {
    this.newItem = {
      item_id: '',
      item_name: '',
      description: '',
      quantity: 0,
      unit_price: 0,
      tax_percent: 8,
      total_amount: 0
    };
  }

  // ==================== Date Helper Methods ====================
  getQuoteDate(): Date | null {
    return this.quote.quote_date ? new Date(this.quote.quote_date) : null;
  }

  getValidUntilDate(): Date | null {
    return this.quote.valid_until ? new Date(this.quote.valid_until) : null;
  }

  // ==================== Form Submission Methods ====================
  save(): void {
    if (!this.quote.customer.customer_name) {
      this.showError('Please fill Customer Name');
      return;
    }

    if (this.quote.items.length === 0) {
      this.showError('Please add at least one item');
      return;
    }

    this.quote.created_by = 'Current User';
    this.submitting = true;
    console.log('Saving quote:', JSON.stringify(this.quote, null, 2));

    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.saved.emit();
      } else {
        this.router.navigateByUrl('/quotes');
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/quotes');
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.quote.customer.customer_name 
      && this.quote.items.length > 0 
      && (!this.form || (this.form.valid ?? true));
  }

  // ==================== Discount Editing Methods ====================
  startEditingDiscount(): void {
    this.editingDiscount = true;
    this.discountEditValue = (this.quote.totals.discount || 0).toString();
  }

  saveDiscount(): void {
    const numericValue = parseFloat(this.discountEditValue) || 0;
    this.quote.totals.discount = Math.max(0, numericValue);
    this.editingDiscount = false;
    this.calculateTotals();
  }

  cancelEditingDiscount(): void {
    this.editingDiscount = false;
    this.discountEditValue = (this.quote.totals.discount || 0).toString();
  }

  onDiscountKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveDiscount();
      return;
    }
    
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditingDiscount();
      return;
    }

    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    if (event.key === '.' || event.key === ',') {
      const input = event.target as HTMLInputElement;
      if (input && input.value.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDiscountInput(event: any): void {
    let value = event.target.value;
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    this.discountEditValue = value;
    event.target.value = value;
  }

  onDiscountPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = (event.clipboardData || (window as any).clipboardData).getData('text');
    const numericValue = paste.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    let value = parts[0];
    if (parts.length > 1) {
      value += '.' + parts.slice(1).join('').substring(0, 2);
    }
    this.discountEditValue = value;
    const target = event.target as HTMLInputElement;
    if (target) {
      target.value = value;
    }
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

