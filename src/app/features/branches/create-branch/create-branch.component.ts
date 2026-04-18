import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-create-branch',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './create-branch.component.html',
  styleUrls: ['./create-branch.component.scss']
})
export class CreateBranchComponent {
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);

  isLoading = false;

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
  canBeParentBranch = 'Yes';
  status = 'Active';

  readonly parentBranchOptions: DropdownOption[] = [
    { id: '0', label: 'Select Parent Branch', value: '' }
  ];

  readonly branchHeadOptions: DropdownOption[] = [
    { id: '0', label: 'Select Branch Head', value: '' }
  ];

  readonly countryOptions: DropdownOption[] = [
    { id: '0', label: 'Select Country', value: '' }
  ];

  readonly canBeParentBranchOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'Yes' },
    { id: '2', label: 'No', value: 'No' }
  ];

  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  onParentBranchChange(values: any[] | null): void {
    this.parentBranch = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onBranchHeadChange(values: any[] | null): void {
    this.branchHead = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onCountryChange(values: any[] | null): void {
    this.country = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onCanBeParentBranchChange(values: any[] | null): void {
    if (values && values.length > 0) this.canBeParentBranch = values[0];
  }

  onStatusChange(values: any[] | null): void {
    if (values && values.length > 0) this.status = values[0];
  }

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

  onSubmit(): void {
    if (!this.isFormValid) {
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }
    this.snackbarService.showSuccess('Branch created successfully!');
    this.router.navigateByUrl('/branches');
  }

  onReset(): void {
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
