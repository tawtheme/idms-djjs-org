import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new branch areas
 * Modal-based form with Branch, Branch Area Name, and Status fields
 */
@Component({
  selector: 'app-add-branch-area-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-branch-area-modal.component.html',
  styleUrls: ['./add-branch-area-modal.component.scss']
})
export class AddBranchAreaModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();

  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{
    branch: string;
    areaName: string;
    status: string;
  }>();

  /** Form data */
  branch = '';
  areaName = '';
  status = 'Active'; // Default status

  /** Branch dropdown options */
  readonly branchOptions: DropdownOption[] = [
    { id: '0', label: 'Select Branch', value: '' }
    // TODO: Load actual branch options from API
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
      return; // Basic validation - required fields
    }

    this.submit.emit({
      branch: this.branch,
      areaName: this.areaName.trim(),
      status: this.status
    });

    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle branch selection change
   */
  onBranchChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.branch = values[0];
    } else {
      this.branch = '';
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
    return !!(this.branch && this.areaName.trim());
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
    this.branch = '';
    this.areaName = '';
    this.status = 'Active';
  }
}

