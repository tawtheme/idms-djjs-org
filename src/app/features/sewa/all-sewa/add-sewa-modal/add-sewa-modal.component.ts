import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new sewa
 * Modal-based form with Sewa Name, Type, and Status fields
 */
@Component({
  selector: 'app-add-sewa-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-sewa-modal.component.html',
  styleUrls: ['./add-sewa-modal.component.scss']
})
export class AddSewaModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{ name: string; type: string; status: string }>();

  /** Form data */
  name = '';
  type = '';
  status = 'Active'; // Default status

  /** Type dropdown options */
  readonly typeOptions: DropdownOption[] = [
    { id: '1', label: 'Volunteer', value: 'Volunteer' },
    { id: '2', label: 'Preacher', value: 'Preacher' },
    { id: '3', label: 'Desiring Devotee', value: 'Desiring Devotee' }
  ];

  /** Status dropdown options */
  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  /**
   * Handle modal close
   */
  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.isFormValid) {
      return; // Basic validation - name and type are required
    }

    this.submit.emit({
      name: this.name.trim(),
      type: this.type,
      status: this.status
    });

    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle type selection change
   */
  onTypeChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.type = values[0];
    } else {
      this.type = '';
    }
  }

  /**
   * Handle status selection change
   */
  onStatusChange(values: any[] | null): void {
    if (values && values.length > 0) {
      this.status = values[0];
    }
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    return !!(this.name.trim() && this.type);
  }

  /**
   * Get footer buttons for the modal
   */
  get footerButtons(): Array<{ text: string; type: 'primary' | 'secondary' | 'danger'; disabled?: boolean; action?: string }> {
    return [
      { text: 'Cancel', type: 'secondary', action: 'cancel' },
      { text: 'Submit', type: 'primary', disabled: !this.isFormValid, action: 'submit' }
    ];
  }

  /**
   * Handle footer button actions
   */
  onFooterAction(action: string): void {
    if (action === 'cancel') {
      this.onClose();
    } else if (action === 'submit') {
      this.onSubmit();
    }
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.name = '';
    this.type = '';
    this.status = 'Active';
  }
}

