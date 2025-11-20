import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../shared/components/datepicker/datepicker.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { CreateSupplierComponent } from './create-supplier/create-supplier.component';
import { DataService } from '../../data.service';

interface Supplier {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contact_person: string;
  address: string;
  supplier_type: string;
  created_at: string;
  status?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, CreateSupplierComponent],
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent {
  suppliers: Supplier[] = [];
  allSuppliers: Supplier[] = [];

  // Filters
  supplierName = '';
  selectedSupplierType: any[] = [];
  supplierTypeOptions: DropdownOption[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Side Panel
  sidePanelOpen = false;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Suppliers', route: '/suppliers' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<any>('suppliers.json').subscribe((response) => {
      const rawSuppliers = response?.suppliers ?? [];
      this.allSuppliers = rawSuppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        company: s.company || '',
        email: s.email,
        phone: s.phone,
        contact_person: s.contact_person || '',
        address: s.address || '',
        supplier_type: s.supplier_type || '',
        created_at: s.created_at,
        status: s.status || 'active' // Default to active if status not provided
      }));

      // Build supplier type options from data
      const typeSet = new Set<string>();
      for (const s of this.allSuppliers) {
        if (s.supplier_type) {
          typeSet.add(s.supplier_type);
        }
      }
      this.supplierTypeOptions = Array.from(typeSet).sort().map((v, idx) => ({
        id: String(idx + 1),
        label: v,
        value: v
      }));

      this.applyFilter();
    });
  }

  get pagedSuppliers(): Supplier[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.suppliers.slice(start, start + this.pageSize);
  }

  getTotalCount(): number {
    return this.allSuppliers.length;
  }

  getTotalPercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return 100; // Total is always 100%
  }

  getActiveCount(): number {
    return this.allSuppliers.filter(s => (s.status || 'active').toLowerCase() === 'active').length;
  }

  getActivePercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return Math.round((this.getActiveCount() / total) * 100);
  }

  getInactiveCount(): number {
    return this.allSuppliers.filter(s => (s.status || 'active').toLowerCase() === 'inactive').length;
  }

  getInactivePercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return Math.round((this.getInactiveCount() / total) * 100);
  }

  getThisMonthSuppliers(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allSuppliers.filter(supplier => {
      const supplierDate = new Date(supplier.created_at);
      return supplierDate.getMonth() === currentMonth && 
             supplierDate.getFullYear() === currentYear;
    }).length;
  }

  trackById(_: number, s: Supplier): string {
    return s.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.supplierName = '';
    this.selectedSupplierType = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const name = this.supplierName.trim().toLowerCase();
    const supplierType = this.selectedSupplierType[0] || '';

    this.suppliers = this.allSuppliers.filter((s) => {
      const matchesName = !name || 
        (s.name || '').toLowerCase().includes(name) ||
        (s.email || '').toLowerCase().includes(name) ||
        (s.id || '').toLowerCase().includes(name) ||
        (s.company || '').toLowerCase().includes(name);
      const matchesType = !supplierType || s.supplier_type === supplierType;
      const sd = s.created_at ? new Date(s.created_at) : null;
      const withinFrom = !this.fromDate || (sd && sd >= this.fromDate);
      const withinTo = !this.toDate || (sd && sd <= this.toDate);
      return matchesName && matchesType && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.suppliers.length;
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

  openCreatePanel(): void {
    this.sidePanelOpen = true;
  }

  closeCreatePanel(): void {
    this.sidePanelOpen = false;
  }

  onSupplierSaved(): void {
    this.closeCreatePanel();
    // Reload suppliers list
    this.data.getJson<any>('suppliers.json').subscribe((response) => {
      const rawSuppliers = response?.suppliers ?? [];
      this.allSuppliers = rawSuppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        company: s.company || '',
        email: s.email,
        phone: s.phone,
        contact_person: s.contact_person || '',
        address: s.address || '',
        supplier_type: s.supplier_type || '',
        created_at: s.created_at,
        status: s.status || 'active' // Default to active if status not provided
      }));
      this.applyFilter();
    });
  }

  viewSupplierDetails(supplierId: string): void {
    this.router.navigate(['/suppliers', supplierId]);
  }
}


