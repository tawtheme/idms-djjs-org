import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

export interface CompanyData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

@Component({
  standalone: true,
  selector: 'app-company-information',
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './company-information.component.html',
  styleUrls: ['./company-information.component.scss']
})
export class CompanyInformationComponent implements OnChanges {
  @Input() companyData: CompanyData = {
    name: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA'
    }
  };

  @Input() submitting: boolean = false;
  @Input() f: any;

  @Output() dataChange = new EventEmitter<CompanyData>();
  @Output() cancel = new EventEmitter<void>();

  isEditing: boolean = false;
  editedData: CompanyData = { ...this.companyData };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyData'] && !this.isEditing) {
      this.editedData = { ...this.companyData };
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  startEdit(): void {
    this.isEditing = true;
    this.editedData = { ...this.companyData };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedData = { ...this.companyData };
  }

  saveEdit(): void {
    this.companyData = { ...this.editedData };
    this.isEditing = false;
    this.dataChange.emit({ ...this.companyData });
  }

  countryOptions: DropdownOption[] = [
    { id: '1', label: 'United States', value: 'USA' },
    { id: '2', label: 'Canada', value: 'Canada' },
    { id: '3', label: 'Mexico', value: 'Mexico' },
    { id: '4', label: 'United Kingdom', value: 'UK' }
  ];

  getSelectedValues(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  onFieldChange(field: string, value: any): void {
    if (field.includes('.')) {
      const parts = field.split('.');
      let target: any = this.companyData;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
    } else {
      (this.companyData as any)[field] = value;
    }
    this.dataChange.emit({ ...this.companyData });
  }

  onDropdownChange(field: string, value: any): void {
    const selectedValue = Array.isArray(value) && value.length > 0 ? value[0] : value;
    if (field.includes('.')) {
      const parts = field.split('.');
      let target: any = this.editedData;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = selectedValue;
    } else {
      (this.editedData as any)[field] = selectedValue;
    }
  }

  getFormattedAddress(): string {
    const addr = this.companyData.address;
    if (!addr.addressLine1 && !addr.city) {
      return '—';
    }
    
    const parts: string[] = [];
    if (addr.addressLine1) parts.push(addr.addressLine1);
    if (addr.addressLine2) parts.push(addr.addressLine2);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postalCode) parts.push(addr.postalCode);
    if (addr.country) parts.push(addr.country);
    
    return parts.join(', ');
  }
}

