import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

@Component({
  standalone: true,
  selector: 'app-create-user',
  imports: [CommonModule, FormsModule, RouterModule, DropdownComponent],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  @Input() isInModal: boolean = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  user: any = {
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active',
    created_at: '',
    last_login: null,
    avatar: null,
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  };

  submitting = false;

  // Dropdown options
  roleOptions: DropdownOption[] = [
    { id: '1', label: 'Admin', value: 'admin' },
    { id: '2', label: 'Manager', value: 'manager' },
    { id: '3', label: 'Operator', value: 'operator' },
    { id: '4', label: 'Sales', value: 'sales' },
    { id: '5', label: 'Accountant', value: 'accountant' },
    { id: '6', label: 'Viewer', value: 'viewer' }
  ];

  departmentOptions: DropdownOption[] = [
    { id: '1', label: 'Administration', value: 'Administration' },
    { id: '2', label: 'Operations', value: 'Operations' },
    { id: '3', label: 'Production', value: 'Production' },
    { id: '4', label: 'Sales', value: 'Sales' },
    { id: '5', label: 'Finance', value: 'Finance' },
    { id: '6', label: 'Quality Control', value: 'Quality Control' },
    { id: '7', label: 'Customer Service', value: 'Customer Service' }
  ];

  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'active' },
    { id: '2', label: 'Inactive', value: 'inactive' }
  ];

  constructor(private router: Router) { }

  // Helper method to get selected values array for dropdown
  getSelectedValues(value: string | null | undefined): any[] {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  // Helper method to handle dropdown selection change
  onDropdownChange(field: string, values: any[]): void {
    this.user[field] = values.length > 0 ? values[0] : '';
  }

  ngOnInit(): void {
    // Initialize with default values if needed
    this.resetForm();
  }

  resetForm(): void {
    this.user = {
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      status: 'active',
      created_at: '',
      last_login: null,
      avatar: null,
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    };
    this.submitting = false;
  }

  save(): void {
    if (!this.user.id || !this.user.first_name || !this.user.last_name || !this.user.email) {
      alert('Please fill User ID, First Name, Last Name, and Email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Set meta information
    const now = new Date().toISOString();
    this.user.created_at = now;
    this.user.last_login = null; // New users haven't logged in yet
    // Combine first_name and last_name into name for display
    this.user.name = `${this.user.first_name} ${this.user.last_name}`.trim();

    this.submitting = true;
    console.log('Saving user:', JSON.stringify(this.user, null, 2));

    // In a real application, you would make an HTTP call here
    setTimeout(() => {
      this.submitting = false;
      if (this.isInModal) {
        this.saved.emit();
      } else {
        this.router.navigateByUrl('/users-roles');
      }
    }, 400);
  }

  cancel(): void {
    if (this.isInModal) {
      this.cancelled.emit();
    } else {
      this.router.navigateByUrl('/users-roles');
    }
  }
}

