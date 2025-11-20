import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { SnackbarComponent, SnackbarConfig } from '../../../../shared/components/snackbar/snackbar.component';
import { Item } from '../items.component';

@Component({
  standalone: true,
  selector: 'app-add-edit-item',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent, SnackbarComponent],
  templateUrl: './add-edit-item.component.html',
  styleUrls: ['./add-edit-item.component.scss']
})
export class AddEditItemComponent implements OnInit {
  @Input() item: Item | null = null;
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('f') form?: NgForm;

  itemData: Item = {
    item_id: '',
    item_name: '',
    description: '',
    unit_of_measure: '',
    unit_price: 0,
    tax_percent: 0
  };

  submitting = false;
  snackbarConfig: SnackbarConfig | null = null;
  isEditMode = false;

  // Dropdown options
  unitOfMeasureOptions: DropdownOption[] = [
    { id: '1', label: 'Piece', value: 'Piece' },
    { id: '2', label: 'Ream', value: 'Ream' },
    { id: '3', label: 'Box', value: 'Box' },
    { id: '4', label: 'Square Meter', value: 'Square Meter' },
    { id: '5', label: 'Meter', value: 'Meter' },
    { id: '6', label: 'Set', value: 'Set' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (this.item) {
      this.isEditMode = true;
      this.itemData = { ...this.item };
    } else {
      this.generateItemId();
    }
  }

  generateItemId(): void {
    const year = new Date().getFullYear();
    const storageKey = `item_counter_${year}`;
    
    let counter = 1;
    const storedCounter = localStorage.getItem(storageKey);
    if (storedCounter) {
      counter = parseInt(storedCounter, 10) + 1;
    }
    
    localStorage.setItem(storageKey, counter.toString());
    
    const paddedCounter = counter.toString().padStart(3, '0');
    this.itemData.item_id = `ITM-${paddedCounter}`;
  }

  getSelectedValues(value: string | null | undefined): string[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  onDropdownChange(field: string, values: string[]): void {
    const value = values.length > 0 ? values[0] : '';
    (this.itemData as any)[field] = value;
  }

  save(): void {
    if (!this.itemData.item_name) {
      this.showError('Please fill Item Name');
      return;
    }

    if (!this.itemData.unit_of_measure) {
      this.showError('Please select Unit of Measure');
      return;
    }

    if (this.itemData.unit_price < 0) {
      this.showError('Unit Price cannot be negative');
      return;
    }

    if (this.itemData.tax_percent < 0 || this.itemData.tax_percent > 100) {
      this.showError('Tax percentage must be between 0 and 100');
      return;
    }

    this.submitting = true;
    console.log('Saving item:', JSON.stringify(this.itemData, null, 2));

    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.showSuccess(this.isEditMode ? 'Item updated successfully' : 'Item created successfully');
        setTimeout(() => {
          this.saved.emit();
        }, 1000);
      } else {
        this.showSuccess(this.isEditMode ? 'Item updated successfully' : 'Item created successfully');
        setTimeout(() => {
          this.router.navigateByUrl('/catalog/items');
        }, 1000);
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/catalog/items');
    }
  }

  submitForm(): void {
    this.save();
  }

  isFormValid(): boolean {
    return !this.submitting 
      && !!this.itemData.item_name 
      && !!this.itemData.unit_of_measure
      && this.itemData.unit_price >= 0
      && this.itemData.tax_percent >= 0
      && this.itemData.tax_percent <= 100
      && (!this.form || (this.form.valid ?? true));
  }

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

