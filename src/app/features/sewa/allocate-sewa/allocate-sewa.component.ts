import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

export interface AllocateSewaForm {
  sewa: string;
  volunteer: string;
  allocationDate: string;
  allocationTime: string;
  status: string;
  notes: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent
  ],
  selector: 'app-allocate-sewa',
  templateUrl: './allocate-sewa.component.html',
  styleUrls: ['./allocate-sewa.component.scss']
})
export class AllocateSewaComponent {
  formData: AllocateSewaForm = {
    sewa: '',
    volunteer: '',
    allocationDate: '',
    allocationTime: '',
    status: 'Active',
    notes: ''
  };

  sewaOptions: DropdownOption[] = [];
  volunteerOptions: DropdownOption[] = [];
  statusOptions: DropdownOption[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sewa', route: '/sewa' },
    { label: 'Allocate Sewa', route: '/sewa/allocate-sewa' }
  ];

  constructor() {
    // Initialize dropdown options
    this.sewaOptions = [
      { id: '1', label: 'VIP Langar', value: 'VIP Langar' },
      { id: '2', label: 'SG LANGAR', value: 'SG LANGAR' },
      { id: '3', label: 'Regular Langar', value: 'Regular Langar' },
      { id: '4', label: 'Special Event Sewa', value: 'Special Event Sewa' },
      { id: '5', label: 'Community Service', value: 'Community Service' }
    ];

    this.volunteerOptions = [
      { id: '1', label: 'Admin', value: 'Admin' },
      { id: '2', label: 'Preacher', value: 'Preacher' },
      { id: '3', label: 'Resident', value: 'Resident' },
      { id: '4', label: 'Volunteer 1', value: 'Volunteer 1' },
      { id: '5', label: 'Volunteer 2', value: 'Volunteer 2' }
    ];

    this.statusOptions = [
      { id: '1', label: 'Active', value: 'Active' },
      { id: '2', label: 'Pending', value: 'Pending' },
      { id: '3', label: 'Completed', value: 'Completed' },
      { id: '4', label: 'Cancelled', value: 'Cancelled' }
    ];

    // Set default date to today
    const today = new Date();
    this.formData.allocationDate = today.toISOString().split('T')[0];
    
    // Set default time to current time
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    this.formData.allocationTime = `${hours}:${minutes}`;
  }

  getSelectedValues(value: string): any[] {
    if (!value) return [];
    return [{ id: value, label: value, value: value }];
  }

  onDropdownChange(field: keyof AllocateSewaForm, event: any[]): void {
    if (event && event.length > 0) {
      (this.formData[field] as any) = event[0].value;
    } else {
      (this.formData[field] as any) = '';
    }
  }

  save(): void {
    if (this.isFormValid()) {
      console.log('Allocating sewa:', this.formData);
      // Here you would typically make an API call to save the allocation
      alert('Sewa allocated successfully!');
      this.resetForm();
    } else {
      alert('Please fill in all required fields');
    }
  }

  resetForm(): void {
    this.formData = {
      sewa: '',
      volunteer: '',
      allocationDate: new Date().toISOString().split('T')[0],
      allocationTime: '',
      status: 'Active',
      notes: ''
    };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.sewa &&
      this.formData.volunteer &&
      this.formData.allocationDate &&
      this.formData.allocationTime &&
      this.formData.status
    );
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.resetForm();
    }
  }
}

