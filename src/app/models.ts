export type ID = string;

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
}

export interface Supplier {
  id: ID;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  notes?: string;
}

export interface Book {
  id: ID;
  isbn?: string;
  title: string;
  author?: string;
  trimSize?: string;
  pages?: number;
  color?: 'bw' | 'color';
  binding?: 'perfect' | 'saddle-stitch' | 'casebound' | 'spiral';
  paperStockId?: ID;
}

export interface InventoryItem {
  id: ID;
  sku: string;
  name: string;
  type: 'paper' | 'cover' | 'ink' | 'glue' | 'box' | 'other';
  unit: 'sheets' | 'kg' | 'liters' | 'units';
  onHand: number;
  reorderPoint?: number;
  supplierId?: ID;
}

export interface OrderItem {
  id: ID;
  bookId: ID;
  quantity: number;
  unitPrice?: number;
}

export type OrderStatus = 'new' | 'confirmed' | 'in_production' | 'ready_to_ship' | 'shipped' | 'cancelled';

export interface Order {
  id: ID;
  externalId?: string; // Amazon or other marketplace ID
  customerId: ID;
  orderDate: string; // ISO
  dueDate?: string; // ISO
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress?: Address;
  total?: number;
  notes?: string;
}

export type JobStatus = 'pending' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';

export interface PrintJob {
  id: ID;
  orderId: ID;
  orderItemId: ID;
  machine?: string;
  scheduledStart?: string; // ISO
  scheduledEnd?: string; // ISO
  actualStart?: string; // ISO
  actualEnd?: string; // ISO
  status: JobStatus;
  notes?: string;
}

export interface InvoiceLine {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: ID;
  orderId: ID;
  date: string; // ISO
  dueDate?: string; // ISO
  lines: InvoiceLine[];
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'void';
}

export interface PurchaseOrderLine {
  id: ID;
  itemId: ID;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: ID;
  supplierId: ID;
  date: string; // ISO
  expectedDate?: string; // ISO
  lines: PurchaseOrderLine[];
  total: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
}

export interface Shipment {
  id: ID;
  orderId: ID;
  carrier?: string;
  trackingNumber?: string;
  shipDate?: string; // ISO
  status: 'pending' | 'shipped' | 'delivered' | 'exception';
}

export interface ProductionScheduleItem {
  id: ID;
  jobId: ID;
  start: string; // ISO
  end: string; // ISO
  machine: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  roleIds: ID[];
}

export interface Role {
  id: ID;
  name: string;
  permissions: string[];
}

export interface Settings {
  companyName: string;
  address?: Address;
  currency: string;
  timezone: string;
}

export interface AmazonOrderImportSummary {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface IntegrationLog {
  id: ID;
  timestamp: string; // ISO
  source: 'amazon' | 'system';
  level: 'info' | 'warn' | 'error';
  message: string;
  payload?: unknown;
}


