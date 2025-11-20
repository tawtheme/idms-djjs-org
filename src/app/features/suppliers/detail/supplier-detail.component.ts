import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../../data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SupplierProfileDetailComponent, SupplierDetailModel } from './supplier-profile-detail/supplier-profile-detail.component';
import { SupplierOrdersComponent } from './supplier-orders/supplier-orders.component';


interface SupplierDetailResponse {
  suppliers: SupplierDetailModel[];
}

@Component({
  standalone: true,
  selector: 'app-supplier-detail',
  templateUrl: './supplier-detail.component.html',
  styleUrls: ['./supplier-detail.component.scss'],
  imports: [CommonModule, RouterModule, BreadcrumbComponent, SupplierProfileDetailComponent, SupplierOrdersComponent]
})
export class SupplierDetailComponent implements OnInit {
  supplierId: string | null = null;
  loading = false;
  supplier: SupplierDetailModel | null = null;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Suppliers', route: '/suppliers' },
    { label: 'Supplier Details', route: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.supplierId = id;
        this.loadSupplier();
      }
    });
  }

  // ==================== Data Loading Methods ====================
  private loadSupplier(): void {
    if (!this.supplierId || this.loading) {
      return;
    }

    this.loading = true;
    this.data.getJson<SupplierDetailResponse>('suppliers_detail.json').subscribe({
      next: (response) => {
        const suppliers = response?.suppliers || [];
        const found = suppliers.find((s) => s.id === this.supplierId);
        this.supplier = found || null;
        this.loading = false;
        
        if (this.supplier) {
          this.breadcrumbs[1].label = this.supplier.name;
        }
      },
      error: () => {
        this.supplier = null;
        this.loading = false;
      }
    });
  }

}

