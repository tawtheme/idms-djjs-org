import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';

export interface CreateTransactionForm {
  preacherId: number | null;
  creditAmount: number | null;
  creditDate: Date | null;
  withdrawalAmount: number | null;
  withdrawalDate: Date | null;
  remarks: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    DatepickerComponent
  ],
  selector: 'app-create-transaction',
  templateUrl: './create-transaction.component.html',
  styleUrls: ['./create-transaction.component.scss']
})
export class CreateTransactionComponent {
  @Output() transactionCreated = new EventEmitter<void>();
  @Input() hideBreadcrumbs: boolean = false;

  form: CreateTransactionForm = {
    preacherId: null,
    creditAmount: null,
    creditDate: null,
    withdrawalAmount: null,
    withdrawalDate: null,
    remarks: ''
  };

  preacherOptions: DropdownOption[] = [];
  selectedPreacher: any[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Financial', route: '/pensions' },
    { label: 'Create Transaction', route: '/pensions/create-transaction' }
  ];

  constructor() {
    // Set default dates to 22/11/2025
    const defaultDate = new Date(2025, 10, 22); // Month is 0-indexed, so 10 = November
    this.form.creditDate = defaultDate;
    this.form.withdrawalDate = defaultDate;

    // Initialize preacher options - replace with actual API data
    this.preacherOptions = [
      { id: '1', label: 'Preacher 1', value: 1 },
      { id: '2', label: 'Preacher 2', value: 2 },
      { id: '3', label: 'Preacher 3', value: 3 },
      { id: '4', label: 'Preacher 4', value: 4 },
      { id: '5', label: 'Preacher 5', value: 5 }
    ];
  }

  onPreacherChange(selection: any[]) {
    this.selectedPreacher = selection;
    this.form.preacherId = selection[0]?.value || null;
  }

  onCreditDateChange(date: Date | null) {
    this.form.creditDate = date;
  }

  onWithdrawalDateChange(date: Date | null) {
    this.form.withdrawalDate = date;
  }

  onSubmit() {
    if (!this.form.preacherId) {
      alert('Please select a preacher');
      return;
    }

    console.log('Submitting transaction:', this.form);
    // Implement submit logic
    // After successful submission, emit event to parent
    this.transactionCreated.emit();
  }

  onReset() {
    this.form = {
      preacherId: null,
      creditAmount: null,
      creditDate: new Date(2025, 10, 22),
      withdrawalAmount: null,
      withdrawalDate: new Date(2025, 10, 22),
      remarks: ''
    };
    this.selectedPreacher = [];
  }
}

