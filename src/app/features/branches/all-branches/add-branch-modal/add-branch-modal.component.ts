import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new branches
 * Sidepanel-based form with Parent Branch, Name, Branch Code, Branch Head, Email,
 * Address, Country, State, City, Pincode, Can be a parent branch, and Status fields
 */
@Component({
  selector: 'app-add-branch-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidePanelComponent,
    DropdownComponent
  ],
  templateUrl: './add-branch-modal.component.html',
  styleUrls: ['./add-branch-modal.component.scss']
})
export class AddBranchModalComponent {
  /** Whether the sidepanel is open */
  @Input() isOpen = false;

  /** Event emitted when sidepanel is closed */
  @Output() close = new EventEmitter<void>();

  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{
    parentBranch: string;
    name: string;
    code: string;
    branchHead: string;
    email: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pincode: string;
    canBeParentBranch: string;
    status: string;
  }>();

  /** Form data */
  parentBranch = '';
  name = '';
  code = '';
  branchHead = '';
  email = '';
  address = '';
  country = '';
  state = '';
  city = '';
  pincode = '';
  canBeParentBranch = 'Yes'; // Default value
  status = 'Active'; // Default status

  /** Parent Branch dropdown options */
  readonly parentBranchOptions: DropdownOption[] = [
    { id: '0', label: 'Select Parent Branch', value: '' }
    // TODO: Load actual parent branch options from API
  ];

  /** Branch Head dropdown options */
  readonly branchHeadOptions: DropdownOption[] = [
    { id: '0', label: 'Select Branch Head', value: '' }
    // TODO: Load actual branch head options from API
  ];

  /** Country dropdown options */
  readonly countryOptions: DropdownOption[] = [
    { id: '0', label: 'Select Country', value: '' }
    // TODO: Load actual country options from API
  ];

  /** Can be a parent branch dropdown options */
  readonly canBeParentBranchOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'Yes' },
    { id: '2', label: 'No', value: 'No' }
  ];

  /** Status dropdown options */
  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  /**
   * Handle sidepanel close
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
      parentBranch: this.parentBranch,
      name: this.name.trim(),
      code: this.code.trim(),
      branchHead: this.branchHead,
      email: this.email.trim(),
      address: this.address.trim(),
      country: this.country,
      state: this.state.trim(),
      city: this.city.trim(),
      pincode: this.pincode.trim(),
      canBeParentBranch: this.canBeParentBranch,
      status: this.status
    });

    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle parent branch selection change
   */
  onParentBranchChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.parentBranch = values[0];
    } else {
      this.parentBranch = '';
    }
  }

  /**
   * Handle branch head selection change
   */
  onBranchHeadChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.branchHead = values[0];
    } else {
      this.branchHead = '';
    }
  }

  /**
   * Handle country selection change
   */
  onCountryChange(values: any[] | null): void {
    if (values && values.length > 0 && values[0] !== '') {
      this.country = values[0];
    } else {
      this.country = '';
    }
  }

  /**
   * Handle can be parent branch selection change
   */
  onCanBeParentBranchChange(values: any[] | null): void {
    if (values && values.length > 0) {
      this.canBeParentBranch = values[0];
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
      this.branchHead &&
      this.email.trim() &&
      this.address.trim() &&
      this.country &&
      this.state.trim() &&
      this.city.trim() &&
      this.pincode.trim()
    );
  }

  /**
   * Get footer buttons for the sidepanel
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
    this.parentBranch = '';
    this.name = '';
    this.code = '';
    this.branchHead = '';
    this.email = '';
    this.address = '';
    this.country = '';
    this.state = '';
    this.city = '';
    this.pincode = '';
    this.canBeParentBranch = 'Yes';
    this.status = 'Active';
  }
}

