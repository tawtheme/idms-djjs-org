import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new projects
 * Modal-based form with Project Name, Project Head, Initiative, Description, and Status fields
 */
@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.scss']
})
export class AddProjectModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{ 
    name: string; 
    projectHead: string; 
    initiative: string; 
    description: string; 
    status: string 
  }>();

  /** Form data */
  name = '';
  projectHead = '';
  initiative = '';
  description = '';
  status = 'Active'; // Default status

  /** Project Head dropdown options */
  readonly projectHeadOptions: DropdownOption[] = [
    { id: '0', label: 'Select Project Head', value: '' }
    // TODO: Load actual project head options from API
  ];

  /** Initiative dropdown options */
  readonly initiativeOptions: DropdownOption[] = [
    { id: '0', label: 'Select Initiative', value: '' }
    // TODO: Load actual initiative options from API
  ];

  /** Status dropdown options */
  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  /**
   * Get footer buttons for modal
   */
  get footerButtons(): Array<{
    text: string;
    type: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    action?: string;
  }> {
    return [
      {
        text: 'Cancel',
        type: 'secondary',
        action: 'cancel'
      },
      {
        text: 'Submit',
        type: 'primary',
        disabled: !this.isFormValid,
        action: 'submit'
      }
    ];
  }

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
      name: this.name.trim(),
      projectHead: this.projectHead,
      initiative: this.initiative,
      description: this.description.trim(),
      status: this.status
    });

    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle footer button actions
   */
  onFooterAction(action: string): void {
    if (action === 'submit') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.onClose();
    }
  }

  /**
   * Handle project head selection change
   */
  onProjectHeadChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.projectHead = values[0];
    } else {
      this.projectHead = '';
    }
  }

  /**
   * Handle initiative selection change
   */
  onInitiativeChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.initiative = values[0];
    } else {
      this.initiative = '';
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
    return !!(
      this.name.trim() && 
      this.projectHead && 
      this.initiative && 
      this.description.trim()
    );
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.name = '';
    this.projectHead = '';
    this.initiative = '';
    this.description = '';
    this.status = 'Active';
  }
}

