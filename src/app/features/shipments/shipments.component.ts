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
import { ShipmentDetailComponent } from './detail/shipment-detail.component';
import { DataService } from '../../data.service';

interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  shipDate: string;
  status: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, DatepickerComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, ShipmentDetailComponent],
  selector: 'app-shipments',
  templateUrl: './shipments.component.html',
  styleUrl: './shipments.component.scss'
})
export class ShipmentsComponent {
  shipments: Shipment[] = [];
  allShipments: Shipment[] = [];

  // Filters
  shipmentId = '';
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];
  selectedCarrier: any[] = [];
  carrierOptions: DropdownOption[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Side Panel
  sidePanelOpen = false;
  selectedShipmentId: string | null = null;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Shipments', route: '/shipments' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<any>('shipments.json').subscribe((response) => {
      const rawShipments = response?.shipments ?? [];
      this.allShipments = rawShipments.map((s: any) => ({
        id: s.id,
        orderId: s.orderId,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        shipDate: s.shipDate,
        status: s.status
      }));

      // Get filter values from JSON filters if available
      const filterStatuses = response?.filters?.status || [];
      const filterCarriers = response?.filters?.carrier || [];

      // Build status options from JSON filters if available, otherwise build from data
      if (filterStatuses.length > 0) {
        this.statusOptions = filterStatuses.map((v: string, idx: number) => ({
          id: String(idx + 1),
          label: this.formatStatus(v),
          value: v
        }));
      } else {
        const statusSet = new Set<string>();
        for (const s of this.allShipments) {
          if (s.status) statusSet.add(s.status);
        }
        this.statusOptions = Array.from(statusSet).map((v, idx) => ({
          id: String(idx + 1),
          label: this.formatStatus(v),
          value: v
        }));
      }

      // Build carrier options from JSON filters if available, otherwise build from data
      if (filterCarriers.length > 0) {
        this.carrierOptions = filterCarriers.map((v: string, idx: number) => ({
          id: String(idx + 1),
          label: v,
          value: v
        }));
      } else {
        const carrierSet = new Set<string>();
        for (const s of this.allShipments) {
          if (s.carrier) carrierSet.add(s.carrier);
        }
        this.carrierOptions = Array.from(carrierSet).map((v, idx) => ({
          id: String(idx + 1),
          label: v,
          value: v
        }));
      }

      this.applyFilter();
    });
  }

  get pagedShipments(): Shipment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.shipments.slice(start, start + this.pageSize);
  }

  trackById(_: number, s: Shipment): string {
    return s.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.shipmentId = '';
    this.selectedStatus = [];
    this.selectedCarrier = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const id = this.shipmentId.trim().toLowerCase();
    const status = this.selectedStatus[0] || '';
    const carrier = this.selectedCarrier[0] || '';

    this.shipments = this.allShipments.filter((s) => {
      const matchesId = !id || (s.id || '').toLowerCase().includes(id) || (s.trackingNumber || '').toLowerCase().includes(id);
      const matchesStatus = !status || s.status === status;
      const matchesCarrier = !carrier || s.carrier === carrier;
      const sd = s.shipDate ? new Date(s.shipDate) : null;
      const withinFrom = !this.fromDate || (sd && sd >= this.fromDate);
      const withinTo = !this.toDate || (sd && sd <= this.toDate);
      return matchesId && matchesStatus && matchesCarrier && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.shipments.length;
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

  getStatusClass(status: string | undefined): string {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    return `status-${s}`;
  }

  formatStatus(status: string | undefined): string {
    if (!status) return '';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  openDetailPanel(shipmentId: string): void {
    this.selectedShipmentId = shipmentId;
    this.sidePanelOpen = true;
  }

  closeDetailPanel(): void {
    this.sidePanelOpen = false;
    this.selectedShipmentId = null;
  }
}


