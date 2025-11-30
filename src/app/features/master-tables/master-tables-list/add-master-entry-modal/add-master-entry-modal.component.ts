import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

/**
 * Component for adding new entries to master tables
 * Modal-based form with dynamic label based on master table type
 */
@Component({
  selector: 'app-add-master-entry-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-master-entry-modal.component.html',
  styleUrls: ['./add-master-entry-modal.component.scss']
})
export class AddMasterEntryModalComponent {
  /** Whether the modal is open */
  @Input() isOpen = false;
  
  /** Master table type (e.g., 'skills', 'degrees') */
  @Input() masterType: string = '';
  
  /** Master table label (e.g., 'Skills', 'Degrees') */
  @Input() masterLabel: string = '';

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<{ name: string; status: string }>();

  /** Form data */
  name = '';
  status = 'Active';

  /** Status dropdown options */
  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  /**
   * Map of plural labels to singular forms
   * Used for generating dynamic labels and titles
   */
  private readonly labelMap: { [key: string]: string } = {
    'Skills': 'Skill',
    'Degrees': 'Degree',
    'Professions': 'Profession',
    'Languages': 'Language',
    'Dress Codes': 'Dress Code',
    'Castes': 'Caste',
    'Newspapers': 'Newspaper',
    'Countries': 'Country',
    'States': 'State',
    'Districts': 'District',
    'Cities': 'City',
    'Ashram Adhaar Areas': 'Ashram Adhaar Area',
    'Weapon Types': 'Weapon Type',
    'Technical Qualifications': 'Technical Qualification'
  };

  /**
   * Get singular form of master label
   * @returns Singular form of the label
   */
  private getSingularLabel(): string {
    if (!this.masterLabel) {
      return 'Entry';
    }
    return this.labelMap[this.masterLabel] || this.masterLabel;
  }

  /**
   * Get the dynamic label for the name field
   * @returns Label based on master table type (e.g., "Skill Name", "Degree Name")
   */
  get nameFieldLabel(): string {
    return `${this.getSingularLabel()} Name`;
  }

  /**
   * Get modal title
   * @returns Title for the modal (e.g., "Add New Skill")
   */
  get modalTitle(): string {
    return `Add New ${this.getSingularLabel()}`;
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
   * @param values - Selected values from dropdown
   */
  onStatusChange(values: string[] | null): void {
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

