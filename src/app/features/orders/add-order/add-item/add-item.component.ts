import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../../data.service';

export interface OrderItemData {
  item_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  total_amount: number;
}

@Component({
  standalone: true,
  selector: 'app-add-item',
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent implements OnInit {
  @Input() items: OrderItemData[] = [];
  @Output() itemsChange = new EventEmitter<OrderItemData[]>();

  newItem: OrderItemData = {
    item_id: '',
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_percent: 0,
    total_amount: 0
  };

  itemOptions: DropdownOption[] = [];
  allItems: any[] = [];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.data.getJson<any>('items.json').subscribe((response) => {
      const items = response?.items || [];
      this.allItems = items;
      this.itemOptions = items.map((item: any, index: number) => ({
        id: String(index + 1),
        label: `${item.item_name} (${item.item_id})`,
        value: item.item_id
      }));
    });
  }

  onItemChange(itemId: string): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem) {
      this.newItem.item_id = selectedItem.item_id;
      this.newItem.item_name = selectedItem.item_name;
      this.newItem.description = selectedItem.description || '';
      this.newItem.tax_percent = selectedItem.tax_percent || 0;
      this.newItem.unit_price = selectedItem.unit_price || 0;
      // Recalculate item total when item is selected
      this.calculateItemTotal(this.newItem);
    }
  }

  onItemChangeForExisting(itemId: string, index: number): void {
    const selectedItem = this.allItems.find(item => item.item_id === itemId);
    if (selectedItem && this.items[index]) {
      const updatedItems = [...this.items];
      updatedItems[index].item_id = selectedItem.item_id;
      updatedItems[index].item_name = selectedItem.item_name;
      updatedItems[index].description = selectedItem.description || '';
      updatedItems[index].tax_percent = selectedItem.tax_percent || 0;
      updatedItems[index].unit_price = selectedItem.unit_price || 0;
      this.calculateItemTotal(updatedItems[index]);
      this.itemsChange.emit(updatedItems);
    }
  }

  addItem(): void {
    // If no items exist, use the newItem form
    if (this.items.length === 0) {
      if (!this.newItem.item_id || this.newItem.quantity <= 0) {
        return;
      }
      
      const itemToAdd: OrderItemData = { ...this.newItem };
      const updatedItems = [...this.items, itemToAdd];
      this.itemsChange.emit(updatedItems);
      
      // Reset new item
      this.newItem = {
        item_id: '',
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_percent: 0,
        total_amount: 0
      };
    } else {
      // If items exist, add a new empty item to the list
      const newEmptyItem: OrderItemData = {
        item_id: '',
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_percent: 0,
        total_amount: 0
      };
      const updatedItems = [...this.items, newEmptyItem];
      this.itemsChange.emit(updatedItems);
    }
  }

  removeItem(index: number): void {
    const updatedItems = [...this.items];
    updatedItems.splice(index, 1);
    this.itemsChange.emit(updatedItems);
  }


  calculateItemTotal(item: OrderItemData): void {
    const subtotal = item.quantity * item.unit_price;
    const taxAmount = (subtotal * item.tax_percent) / 100;
    item.total_amount = subtotal + taxAmount;
    
    // Emit changes if item is in the items array (not newItem)
    const itemIndex = this.items.findIndex(i => i === item);
    if (itemIndex !== -1) {
      this.itemsChange.emit([...this.items]);
    }
  }

  getSelectedItemValues(value: string | null | undefined): string[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }
}

