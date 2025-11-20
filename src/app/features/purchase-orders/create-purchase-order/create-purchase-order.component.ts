import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DataService } from '../../../data.service';

interface PurchaseOrderItem {
  item_id: string;
  item_name: string;
  description: string;
  unit_of_measure: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  total_amount: number;
}

interface Supplier {
  supplier_id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  billing_address: string;
  delivery_address: string;
}

@Component({
  standalone: true,
  selector: 'app-create-purchase-order',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, DatepickerComponent],
  templateUrl: './create-purchase-order.component.html',
  styleUrls: ['./create-purchase-order.component.scss']
})
export class CreatePurchaseOrderComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Purchase Orders', route: '/purchase-orders' },
    { label: 'Create Purchase Order', route: '/purchase-orders/create' }
  ];

  purchaseOrder: any = {
    purchase_order_id: '', // Will be auto-generated in ngOnInit
    purchase_order_date: new Date().toISOString().split('T')[0],
    supplier: {
      supplier_id: '',
      supplier_name: '',
      contact_person: '',
      phone: '',
      email: '',
      billing_address: '',
      delivery_address: ''
    },
    purchase_type: '',
    expected_delivery_date: '',
    status: 'Draft',
    items: [],
    payment_terms: '',
    mode_of_payment: '',
    attachments: [],
    notes: '',
    created_by: '',
    approved_by: null
  };

  submitting = false;
  newItem: PurchaseOrderItem = {
    item_id: '',
    item_name: '',
    description: '',
    unit_of_measure: '',
    quantity: 0,
    unit_price: 0,
    tax_percent: 18,
    total_amount: 0
  };

  totals = {
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  };

  // Discount editing
  editingDiscount = false;
  discountEditValue = '0';


  // Dropdown options
  purchaseTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Raw Material', value: 'Raw Material' },
    { id: '2', label: 'Equipment', value: 'Equipment' },
    { id: '3', label: 'Services', value: 'Services' },
    { id: '4', label: 'Consumables', value: 'Consumables' }
  ];

  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Draft', value: 'Draft' },
    { id: '2', label: 'Pending Approval', value: 'Pending Approval' },
    { id: '3', label: 'Approved', value: 'Approved' },
    { id: '4', label: 'Sent', value: 'Sent' }
  ];

  paymentModeOptions: DropdownOption[] = [
    { id: '1', label: 'Bank Transfer', value: 'Bank Transfer' },
    { id: '2', label: 'Credit Card', value: 'Credit Card' },
    { id: '3', label: 'Check', value: 'Check' },
    { id: '4', label: 'Cash', value: 'Cash' }
  ];

  unitOfMeasureOptions: DropdownOption[] = [
    { id: '1', label: 'Ream', value: 'Ream' },
    { id: '2', label: 'Litre', value: 'Litre' },
    { id: '3', label: 'Kilogram', value: 'Kilogram' },
    { id: '4', label: 'Piece', value: 'Piece' },
    { id: '5', label: 'Box', value: 'Box' }
  ];

  supplierOptions: DropdownOption[] = [];
  allSuppliers: any[] = [];
  itemOptions: DropdownOption[] = [];
  allItems: any[] = [];

  constructor(private router: Router, private data: DataService) {}

  ngOnInit(): void {
    // Auto-generate Purchase Order ID
    this.generatePurchaseOrderId();
    // Load suppliers
    this.loadSuppliers();
    // Load items
    this.loadItems();
    // Initialize totals
    this.calculateTotals();
  }

  loadSuppliers(): void {
    this.data.getJson<any>('suppliers.json').subscribe((response) => {
      const rawSuppliers = response?.suppliers ?? [];
      this.allSuppliers = rawSuppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        company: s.company || '',
        email: s.email || '',
        phone: s.phone || '',
        contact_person: s.contact_person || ''
      }));

      // Create dropdown options from suppliers
      this.supplierOptions = this.allSuppliers.map((supplier) => ({
        id: supplier.id,
        label: supplier.name,
        value: supplier.id
      }));
    });
  }

  onSupplierChange(supplierId: string): void {
    const selectedSupplier = this.allSuppliers.find(s => s.id === supplierId);
    if (selectedSupplier) {
      this.purchaseOrder.supplier.supplier_id = selectedSupplier.id;
      this.purchaseOrder.supplier.supplier_name = selectedSupplier.name;
      this.purchaseOrder.supplier.contact_person = selectedSupplier.contact_person || '';
      this.purchaseOrder.supplier.phone = selectedSupplier.phone || '';
      this.purchaseOrder.supplier.email = selectedSupplier.email || '';
    }
  }

  loadItems(): void {
    this.data.getJson<any>('items.json').subscribe((response) => {
      const rawItems = response?.items ?? [];
      this.allItems = rawItems.map((item: any) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        description: item.description || '',
        unit_of_measure: item.unit_of_measure || '',
        tax_percent: item.tax_percent || 18
      }));

      // Create dropdown options from items
      this.itemOptions = this.allItems.map((item) => ({
        id: item.item_id,
        label: item.item_name,
        value: item.item_id,
        description: item.description
      }));
    });
  }

  onItemChange(itemId: string): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem) {
      this.newItem.item_id = selectedItem.item_id;
      this.newItem.item_name = selectedItem.item_name;
      this.newItem.description = selectedItem.description || '';
      this.newItem.unit_of_measure = selectedItem.unit_of_measure || '';
      this.newItem.tax_percent = selectedItem.tax_percent || 18;
    }
  }

  onItemChangeForExisting(itemId: string, index: number): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem && this.purchaseOrder.items[index]) {
      this.purchaseOrder.items[index].item_id = selectedItem.item_id;
      this.purchaseOrder.items[index].item_name = selectedItem.item_name;
      this.purchaseOrder.items[index].description = selectedItem.description || '';
      this.purchaseOrder.items[index].unit_of_measure = selectedItem.unit_of_measure || '';
      this.purchaseOrder.items[index].tax_percent = selectedItem.tax_percent || 18;
      this.calculateItemTotal(this.purchaseOrder.items[index]);
    }
  }

  generatePurchaseOrderId(): void {
    const year = new Date().getFullYear();
    const storageKey = `po_counter_${year}`;
    
    // Get the last counter from localStorage or start from 1
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    // Save the new counter
    localStorage.setItem(storageKey, counter.toString());
    
    // Format: PO-YYYY-XXX (e.g., PO-2025-001)
    const paddedCounter = counter.toString().padStart(3, '0');
    this.purchaseOrder.purchase_order_id = `PO-${year}-${paddedCounter}`;
  }

  getSelectedValues(value: string | null | undefined): any[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  onDropdownChange(field: string, values: any[]): void {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      this.purchaseOrder[parent][child] = values.length > 0 ? values[0] : '';
    } else {
      this.purchaseOrder[field] = values.length > 0 ? values[0] : '';
    }
  }

  calculateItemTotal(item: PurchaseOrderItem): void {
    const subtotal = item.quantity * item.unit_price;
    const taxAmount = (subtotal * item.tax_percent) / 100;
    item.total_amount = subtotal + taxAmount;
    this.calculateTotals();
  }

  calculateTotals(): void {
    // Calculate subtotal from existing items
    let subtotal = this.purchaseOrder.items.reduce((sum: number, item: PurchaseOrderItem) => 
      sum + (item.quantity * item.unit_price), 0);
    
    // Include newItem in subtotal if it has valid data
    if (this.newItem.item_id && this.newItem.quantity > 0 && this.newItem.unit_price > 0) {
      subtotal += this.newItem.quantity * this.newItem.unit_price;
    }
    
    // Use discount amount directly (now editable inline)
    const discountAmount = this.totals.discount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    
    // Calculate tax from all items
    let tax = this.purchaseOrder.items.reduce((sum: number, item: PurchaseOrderItem) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + (itemSubtotal * item.tax_percent) / 100;
    }, 0);
    
    // Include newItem tax if it has valid data
    if (this.newItem.item_id && this.newItem.quantity > 0 && this.newItem.unit_price > 0) {
      const newItemSubtotal = this.newItem.quantity * this.newItem.unit_price;
      tax += (newItemSubtotal * this.newItem.tax_percent) / 100;
    }
    
    this.totals.subtotal = subtotal;
    this.totals.tax = tax;
    this.totals.total = afterDiscount + tax;
  }

  addItem(): void {
    if (!this.newItem.item_id || !this.newItem.item_name || !this.newItem.quantity || !this.newItem.unit_price) {
      alert('Please fill Item Name, Quantity, and Unit Price');
      return;
    }
    this.calculateItemTotal(this.newItem);
    this.purchaseOrder.items.push({ ...this.newItem });
    this.resetNewItem();
    this.calculateTotals();
  }

  addNewItemSection(): void {
    // Add an empty item to the list so user can fill it directly
    const emptyItem: PurchaseOrderItem = {
      item_id: '',
      item_name: '',
      description: '',
      unit_of_measure: '',
      quantity: 0,
      unit_price: 0,
      tax_percent: 18,
      total_amount: 0
    };
    this.purchaseOrder.items.push(emptyItem);
  }

  removeItem(index: number): void {
    this.purchaseOrder.items.splice(index, 1);
    this.calculateTotals();
  }

  resetNewItem(): void {
    this.newItem = {
      item_id: '',
      item_name: '',
      description: '',
      unit_of_measure: '',
      quantity: 0,
      unit_price: 0,
      tax_percent: 18,
      total_amount: 0
    };
  }

  getTotalAmount(): number {
    return this.purchaseOrder.items.reduce((sum: number, item: PurchaseOrderItem) => sum + item.total_amount, 0);
  }

  getPurchaseOrderDate(): Date | null {
    return this.purchaseOrder.purchase_order_date ? new Date(this.purchaseOrder.purchase_order_date) : null;
  }

  getExpectedDeliveryDate(): Date | null {
    return this.purchaseOrder.expected_delivery_date ? new Date(this.purchaseOrder.expected_delivery_date) : null;
  }

  save(): void {
    if (!this.purchaseOrder.supplier.supplier_name) {
      alert('Please fill Supplier Name');
      return;
    }

    if (this.purchaseOrder.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    this.purchaseOrder.created_by = 'Current User'; // In real app, get from auth service
    this.submitting = true;
    console.log('Saving purchase order:', JSON.stringify(this.purchaseOrder, null, 2));

    // In a real application, you would make an HTTP call here
    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.saved.emit();
      } else {
        this.router.navigateByUrl('/purchase-orders');
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/purchase-orders');
    }
  }

  // ==================== Discount Editing Methods ====================
  startEditingDiscount(): void {
    this.editingDiscount = true;
    this.discountEditValue = (this.totals.discount || 0).toString();
  }

  saveDiscount(): void {
    const numericValue = parseFloat(this.discountEditValue) || 0;
    this.totals.discount = Math.max(0, numericValue);
    this.editingDiscount = false;
    this.calculateTotals();
  }

  cancelEditingDiscount(): void {
    this.editingDiscount = false;
    this.discountEditValue = (this.totals.discount || 0).toString();
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

    // Allow control keys: backspace, delete, tab, arrow keys, home, end
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow decimal point (only one)
    if (event.key === '.' || event.key === ',') {
      const input = event.target as HTMLInputElement;
      if (input && input.value.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Only allow numeric keys (0-9)
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDiscountInput(event: any): void {
    let value = event.target.value;
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    this.discountEditValue = value;
    event.target.value = value;
  }

  onDiscountPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = (event.clipboardData || (window as any).clipboardData).getData('text');
    // Only allow numeric values with decimal point
    const numericValue = paste.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    let value = parts[0];
    if (parts.length > 1) {
      value += '.' + parts.slice(1).join('').substring(0, 2);
    }
    this.discountEditValue = value;
    // Update the input field
    const target = event.target as HTMLInputElement;
    if (target) {
      target.value = value;
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.purchaseOrder.supplier.supplier_name 
      && this.purchaseOrder.items.length > 0 
      && (!this.form || (this.form.valid ?? true));
  }
}

