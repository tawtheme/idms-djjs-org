import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AddEditItemComponent } from './add-edit-item/add-edit-item.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DataService } from '../../../data.service';

export interface Item {
  item_id: string;
  item_name: string;
  description: string;
  unit_of_measure: string;
  unit_price: number;
  tax_percent: number;
  link?: string;
}

@Component({
  standalone: true,
  selector: 'app-items',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScrollingModule,
    BreadcrumbComponent,
    PagerComponent,
    EmptyStateComponent,
    ModalComponent,
    AddEditItemComponent,
    MenuDropdownComponent
  ],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {
  items: Item[] = [];
  allItems: Item[] = [];

  // Filters
  itemName = '';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Modal
  modalOpen = false;
  editingItem: Item | null = null;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Catalog', route: '/catalog' },
    { label: 'Items', route: '/catalog/items' }
  ];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.data.getJson<{ items: Item[] }>('items.json').subscribe((response) => {
      const rawItems = response?.items ?? [];
      this.allItems = rawItems.map((item: any) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        description: item.description || '',
        unit_of_measure: item.unit_of_measure || '',
        unit_price: item.unit_price || 0,
        tax_percent: item.tax_percent || 0,
        link: item.link || ''
      }));

      this.applyFilter();
    });
  }

  get pagedItems(): Item[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  trackById(_: number, item: Item): string {
    return item.item_id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilters(): void {
    this.itemName = '';
    this.applyFilter();
  }

  applyFilter(): void {
    const name = this.itemName.trim().toLowerCase();

    this.items = this.allItems.filter((item) => {
      const matchesName = !name || 
        (item.item_name || '').toLowerCase().includes(name) ||
        (item.item_id || '').toLowerCase().includes(name) ||
        (item.description || '').toLowerCase().includes(name);
      return matchesName;
    });

    // Reset pagination after filtering
    this.totalItems = this.items.length;
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

  // Modal Methods
  openAddItemPanel(): void {
    this.editingItem = null;
    this.modalOpen = true;
  }

  openEditItemPanel(item: Item): void {
    this.editingItem = { ...item };
    this.modalOpen = true;
  }

  closeItemModal(): void {
    this.modalOpen = false;
    this.editingItem = null;
  }

  onItemSaved(): void {
    this.closeItemModal();
    // Reload items list
    this.loadItems();
  }

  onItemCancelled(): void {
    this.closeItemModal();
  }

  deleteItem(item: Item): void {
    if (confirm(`Are you sure you want to delete ${item.item_name}?`)) {
      this.allItems = this.allItems.filter(i => i.item_id !== item.item_id);
      this.applyFilter();
    }
  }

  getActionOptions(item: Item): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'edit',
        label: 'Edit',
        value: 'edit',
        icon: 'edit'
      }
    ];
  }

  onAction(item: Item, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      // For now, view will open edit panel. You can create a separate view component later
      this.openEditItemPanel(item);
    } else if (actionId === 'edit') {
      this.openEditItemPanel(item);
    }
  }

  getAveragePrice(): string {
    if (this.allItems.length === 0) return '$0.00';
    const total = this.allItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    const average = total / this.allItems.length;
    return `$${average.toFixed(2)}`;
  }

  getItemsWithLinks(): number {
    return this.allItems.filter(item => item.link && item.link.trim() !== '').length;
  }
}

