import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';

export interface PreferencesData {
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
}

@Component({
  standalone: true,
  selector: 'app-preferences',
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnChanges {
  @Input() preferencesData: PreferencesData = {
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en'
  };

  @Input() submitting: boolean = false;
  @Input() f: any;

  @Output() dataChange = new EventEmitter<PreferencesData>();
  @Output() cancel = new EventEmitter<void>();

  isEditing: boolean = false;
  editedData: PreferencesData = { ...this.preferencesData };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preferencesData'] && !this.isEditing) {
      this.editedData = { ...this.preferencesData };
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  startEdit(): void {
    this.isEditing = true;
    this.editedData = { ...this.preferencesData };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedData = { ...this.preferencesData };
  }

  saveEdit(): void {
    this.preferencesData = { ...this.editedData };
    this.isEditing = false;
    this.dataChange.emit({ ...this.preferencesData });
  }

  currencyOptions: DropdownOption[] = [
    { id: '1', label: 'USD - US Dollar', value: 'USD' },
    { id: '2', label: 'EUR - Euro', value: 'EUR' },
    { id: '3', label: 'GBP - British Pound', value: 'GBP' },
    { id: '4', label: 'CAD - Canadian Dollar', value: 'CAD' },
    { id: '5', label: 'AUD - Australian Dollar', value: 'AUD' }
  ];

  timezoneOptions: DropdownOption[] = [
    { id: '1', label: 'America/New_York (EST)', value: 'America/New_York' },
    { id: '2', label: 'America/Chicago (CST)', value: 'America/Chicago' },
    { id: '3', label: 'America/Denver (MST)', value: 'America/Denver' },
    { id: '4', label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
    { id: '5', label: 'UTC', value: 'UTC' },
    { id: '6', label: 'Europe/London (GMT)', value: 'Europe/London' }
  ];

  dateFormatOptions: DropdownOption[] = [
    { id: '1', label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { id: '2', label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { id: '3', label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { id: '4', label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' }
  ];

  timeFormatOptions: DropdownOption[] = [
    { id: '1', label: '12 Hour (AM/PM)', value: '12h' },
    { id: '2', label: '24 Hour', value: '24h' }
  ];

  languageOptions: DropdownOption[] = [
    { id: '1', label: 'English', value: 'en' },
    { id: '2', label: 'Spanish', value: 'es' },
    { id: '3', label: 'French', value: 'fr' },
    { id: '4', label: 'German', value: 'de' }
  ];

  getSelectedValues(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  onDropdownChange(field: string, value: any): void {
    const selectedValue = Array.isArray(value) && value.length > 0 ? value[0] : value;
    (this.editedData as any)[field] = selectedValue;
  }

  getDisplayValue(field: keyof PreferencesData): string {
    const value = this.preferencesData[field];
    if (!value) return '—';
    
    // Find the label for the value
    const options = this.getOptionsForField(field);
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  getOptionsForField(field: keyof PreferencesData): DropdownOption[] {
    switch (field) {
      case 'currency':
        return this.currencyOptions;
      case 'timezone':
        return this.timezoneOptions;
      case 'dateFormat':
        return this.dateFormatOptions;
      case 'timeFormat':
        return this.timeFormatOptions;
      case 'language':
        return this.languageOptions;
      default:
        return [];
    }
  }
}

