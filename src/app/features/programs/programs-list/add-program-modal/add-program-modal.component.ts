import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';

/**
 * Component for adding new programs
 * Modal-based form with Program Name, Program Co-ordinator, Initiative, Project, Branch, Choose Sewa, Start Date Time, End Date Time, Status, Repeats, and Remarks fields
 */
@Component({
  selector: 'app-add-program-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent,
    DatepickerComponent
  ],
  templateUrl: './add-program-modal.component.html',
  styleUrls: ['./add-program-modal.component.scss']
})
export class AddProgramModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{ 
    name: string; 
    programCoordinator: string; 
    initiative: string; 
    project: string; 
    branch: string; 
    chooseSewa: string; 
    startDateTime: Date | null; 
    endDateTime: Date | null; 
    status: string; 
    repeats: string; 
    remarks: string 
  }>();

  /** Form data */
  name = '';
  programCoordinator = '';
  initiative = '';
  project = '';
  branch = '';
  chooseSewa = '';
  startDateTime: Date | null = null;
  endDateTime: Date | null = null;
  status = 'Active'; // Default status
  repeats = 'Once'; // Default repeats
  remarks = '';

  /** Program Co-ordinator dropdown options */
  readonly programCoordinatorOptions: DropdownOption[] = [
    { id: '0', label: 'Select Program Co-ordinator', value: '' }
    // TODO: Load actual program coordinator options from API
  ];

  /** Initiative dropdown options */
  readonly initiativeOptions: DropdownOption[] = [
    { id: '0', label: 'Select Initiative', value: '' }
    // TODO: Load actual initiative options from API
  ];

  /** Project dropdown options */
  readonly projectOptions: DropdownOption[] = [
    { id: '0', label: 'Select Project', value: '' }
    // TODO: Load actual project options from API
  ];

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

  /** Repeats dropdown options */
  readonly repeatsOptions: DropdownOption[] = [
    { id: '1', label: 'Once', value: 'Once' },
    { id: '2', label: 'Daily', value: 'Daily' },
    { id: '3', label: 'Weekly', value: 'Weekly' },
    { id: '4', label: 'Monthly', value: 'Monthly' },
    { id: '5', label: 'Yearly', value: 'Yearly' }
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
      programCoordinator: this.programCoordinator,
      initiative: this.initiative,
      project: this.project,
      branch: this.branch,
      chooseSewa: this.chooseSewa.trim(),
      startDateTime: this.startDateTime,
      endDateTime: this.endDateTime,
      status: this.status,
      repeats: this.repeats,
      remarks: this.remarks.trim()
    });

    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle program coordinator selection change
   */
  onProgramCoordinatorChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.programCoordinator = values[0];
    } else {
      this.programCoordinator = '';
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
   * Handle project selection change
   */
  onProjectChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.project = values[0];
    } else {
      this.project = '';
    }
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
   * Handle repeats selection change
   */
  onRepeatsChange(values: any[] | null): void {
    if (values && values.length > 0) {
      this.repeats = values[0];
    }
  }

  /**
   * Handle start date time change
   */
  onStartDateTimeChange(date: Date | null): void {
    this.startDateTime = date;
  }

  /**
   * Handle end date time change
   */
  onEndDateTimeChange(date: Date | null): void {
    this.endDateTime = date;
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    return !!(
      this.name.trim() &&
      this.programCoordinator &&
      this.initiative &&
      this.project &&
      this.branch &&
      this.chooseSewa.trim() &&
      this.startDateTime &&
      this.endDateTime
    );
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
    this.programCoordinator = '';
    this.initiative = '';
    this.project = '';
    this.branch = '';
    this.chooseSewa = '';
    this.startDateTime = null;
    this.endDateTime = null;
    this.status = 'Active';
    this.repeats = 'Once';
    this.remarks = '';
  }
}

