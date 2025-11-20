import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { CustomerDetailComponent } from './detail/customer-detail.component';
import { CustomerAddressModalComponent } from './detail/customer-address-modal/customer-address-modal.component';
import { DateRangePickerComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { DataService } from '../../data.service';

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  created_at: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, BreadcrumbComponent, DateRangePickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, ModalComponent, AddCustomerComponent, CustomerDetailComponent, CustomerAddressModalComponent],
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent {
  customers: Customer[] = [];
  allCustomers: Customer[] = [];

  // Filters
  customerName = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Side panel
  sidePanelOpen = false;

  // Modal state
  detailModalOpen = false;
  selectedCustomerId: string | null = null;
  private isReopening = false;
  private clearCustomerIdTimeout: any = null;
  addressModalOpen = false; // Track if address modal is open
  addressModalAddresses: any = null; // Store addresses for address modal

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Customers', route: '/customers' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<any>('customers.json').subscribe((response) => {
      const rawCustomers = response?.customers ?? [];
      this.allCustomers = rawCustomers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company || '',
        phone: c.phone,
        created_at: c.created_at
      }));

      this.applyFilter();
    });
  }

  get pagedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.customers.slice(start, start + this.pageSize);
  }

  getThisMonthCustomers(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allCustomers.filter(customer => {
      const customerDate = new Date(customer.created_at);
      return customerDate.getMonth() === currentMonth && 
             customerDate.getFullYear() === currentYear;
    }).length;
  }

  trackById(_: number, c: Customer): string {
    return c.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onDateRangeChange(range: { fromDate: Date | null; toDate: Date | null }): void {
    this.fromDate = range.fromDate;
    this.toDate = range.toDate;
    this.onSearchChange();
  }

  resetFilters(): void {
    this.customerName = '';
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const name = this.customerName.trim().toLowerCase();

    this.customers = this.allCustomers.filter((c) => {
      const matchesName = !name || 
        (c.name || '').toLowerCase().includes(name) ||
        (c.email || '').toLowerCase().includes(name) ||
        (c.id || '').toLowerCase().includes(name);
      const cd = c.created_at ? new Date(c.created_at) : null;
      const withinFrom = !this.fromDate || (cd && cd >= this.fromDate);
      const withinTo = !this.toDate || (cd && cd <= this.toDate);
      return matchesName && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.customers.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  viewCustomerDetails(customerId: string): void {
    if (customerId) {
      this.selectedCustomerId = customerId;
      this.detailModalOpen = true;
    }
  }

  closeDetailModal(): void {
    // Cancel any pending timeout to clear customer ID
    if (this.clearCustomerIdTimeout) {
      clearTimeout(this.clearCustomerIdTimeout);
      this.clearCustomerIdTimeout = null;
    }
    
    this.detailModalOpen = false;
    
    // Only schedule timeout to clear if we're not reopening AND address modal is not opening
    // If address modal is opening, we'll handle clearing in reopenDetailModal or when address modal closes
    if (!this.isReopening && !this.addressModalOpen) {
      this.clearCustomerIdTimeout = setTimeout(() => {
        // Triple-check all conditions inside the timeout callback
        if (!this.detailModalOpen && !this.isReopening && !this.addressModalOpen) {
          this.selectedCustomerId = null;
        }
        this.clearCustomerIdTimeout = null;
      }, 200);
    }
  }

  onAddressModalOpening(addresses: any): void {
    this.addressModalAddresses = addresses;
    this.addressModalOpen = true;
  }

  closeAddressModal(): void {
    this.addressModalOpen = false;
    this.addressModalAddresses = null;
    // Reopen detail modal if we were in modal mode
    if (this.selectedCustomerId) {
      setTimeout(() => {
        this.reopenDetailModal();
      }, 100);
    }
  }

  reopenDetailModal(): void {
    // Set isReopening flag FIRST to prevent timeout from clearing customerId
    this.isReopening = true;
    
    // Cancel any pending timeout to clear customer ID
    if (this.clearCustomerIdTimeout) {
      clearTimeout(this.clearCustomerIdTimeout);
      this.clearCustomerIdTimeout = null;
    }
    
    if (this.selectedCustomerId) {
      this.detailModalOpen = true;
      // Reset flags after modal opens (use longer delay to ensure timeout has checked)
      setTimeout(() => {
        this.isReopening = false;
        this.addressModalOpen = false; // Reset address modal flag
      }, 250); // Increased to 250ms to be longer than the 200ms timeout
    }
  }

  // ==================== Side Panel Methods ====================
  openAddCustomerPanel(): void {
    this.sidePanelOpen = true;
  }

  closeAddCustomerPanel(): void {
    this.sidePanelOpen = false;
  }

  onCustomerSaved(): void {
    this.closeAddCustomerPanel();
    // Reload customers list
    this.data.getJson<any>('customers.json').subscribe((response) => {
      const rawCustomers = response?.customers ?? [];
      this.allCustomers = rawCustomers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company || '',
        phone: c.phone,
        created_at: c.created_at
      }));

      this.applyFilter();
    });
  }

  onCustomerCancelled(): void {
    this.closeAddCustomerPanel();
  }
}


