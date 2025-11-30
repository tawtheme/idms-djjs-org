import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new initiatives
 * Modal-based form with Initiative Name and Status fields
 */
@Component({
  selector: 'app-add-initiative-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-initiative-modal.component.html',
  styleUrls: ['./add-initiative-modal.component.scss']
})
export class AddInitiativeModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{ name: string; status: string }>();

  /** Form data */
  name = '';
  status = 'Active'; // Default status

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
    if (!this.name.trim()) {
      return; // Basic validation - name is required
    }

    this.submit.emit({
      name: this.name.trim(),
      status: this.status
    });

    this.resetForm();
    this.close.emit();
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
   * Reset form to initial state
   */
  private resetForm(): void {
    this.name = '';
    this.status = 'Active';
  }
}

