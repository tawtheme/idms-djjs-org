import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { Sewa } from '../sewa.interface';

/**
 * Component for adding or editing sewa
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
export class AddSewaModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() title = 'Add New Sewa';
  @Input() initialData?: Sewa | null;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ name: string; type: string }>();

  name = '';
  type = '';

  readonly typeOptions: DropdownOption[] = [
    { id: '1', label: 'Volunteer', value: 'Volunteer' },
    { id: '2', label: 'Preacher', value: 'Preacher' },
    { id: '3', label: 'Desiring Devotee', value: 'Desiring Devotee' }
  ];

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.initialData) {
      this.name = this.initialData.name || '';
      this.type = this.initialData.type || '';
    } else {
      this.resetForm();
    }
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.isFormValid) return;

    this.submit.emit({
      name: this.name.trim(),
      type: this.type
    });

    this.resetForm();
  }

  onTypeChange(values: any[] | null): void {
    this.type = (values && values.length > 0) ? values[0] : '';
  }

  get isFormValid(): boolean {
    return !!(this.name.trim() && this.type);
  }

  get footerButtons(): Array<{ text: string; type: 'primary' | 'secondary' | 'danger'; disabled?: boolean; action?: string }> {
    return [
      { text: 'Cancel', type: 'secondary', action: 'cancel' },
      { text: 'Submit', type: 'primary', disabled: !this.isFormValid, action: 'submit' }
    ];
  }

  onFooterAction(action: string): void {
    if (action === 'cancel') this.onClose();
    else if (action === 'submit') this.onSubmit();
  }

  private resetForm(): void {
    this.name = '';
    this.type = '';
  }
}


