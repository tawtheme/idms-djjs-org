import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../../data.service';

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
export class AddMasterEntryModalComponent implements OnChanges {
  /** Shared data service for fetching dropdown data (countries, states, cities) */
  private readonly dataService = inject(DataService);
  /** Whether the modal is open */
  @Input() isOpen = false;
  
  /** Master table type (e.g., 'skills', 'degrees') */
  @Input() masterType: string = '';
  
  /** Master table label (e.g., 'Skills', 'Degrees') */
  @Input() masterLabel: string = '';

  /** Mode: add new entry (default) or edit existing one */
  @Input() mode: 'add' | 'edit' = 'add';

  /** Initial data when editing an existing record */
  @Input() initialData: MasterEntryFormData | null = null;

  /** Event emitted when modal is closed */
  @Output() close = new EventEmitter<void>();
  
  /** Event emitted when form is submitted */
  @Output() submit = new EventEmitter<MasterEntryFormData>();

  /** Form data */
  name = '';
  status = 'Active';

  /**
   * Optional bank-specific fields.
   * These are only used when masterType === 'banks'.
   */
  branch = '';
  ifsc_code = '';
  address = '';
  country = '';
  state = '';
  city = '';
  phone_primary = '';
  phone_secondary = '';
  remarks = '';

  /** Dropdown options for country / state / city (used only for banks) */
  countryOptions: DropdownOption[] = [];
  stateOptions: DropdownOption[] = [];
  cityOptions: DropdownOption[] = [];

  /** Currently selected IDs for cascading dropdowns */
  selectedCountryId: string | null = null;
  selectedStateId: string | null = null;
  selectedCityId: string | null = null;

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
    'Banks': 'Bank',
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
   * React to input changes (masterType / isOpen / initialData) to lazily load dropdown data
   * and pre-fill fields in edit mode.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Pre-fill when editing and initialData changes
    if (changes['initialData'] && this.initialData) {
      this.name = this.initialData.name ?? '';
      this.status = this.initialData.status ?? 'Active';

      if (this.masterType === 'banks') {
        this.branch = this.initialData.branch ?? '';
        this.ifsc_code = this.initialData.ifsc_code ?? '';
        this.address = this.initialData.address ?? '';
        this.country = this.initialData.country ?? '';
        this.state = this.initialData.state ?? '';
        this.city = this.initialData.city ?? '';
        this.phone_primary = this.initialData.phone_primary ?? '';
        this.phone_secondary = this.initialData.phone_secondary ?? '';
        this.remarks = this.initialData.remarks ?? '';

        // If we have IDs for cascading dropdowns, pre-select them
        if (this.initialData.countryId) {
          this.selectedCountryId = this.initialData.countryId;
          this.loadStates(this.initialData.countryId, this.initialData.stateId, this.initialData.cityId);
        }
      }
    }

    // Load countries when modal opens for banks
    if (this.masterType === 'banks' && this.isOpen && this.countryOptions.length === 0) {
      this.loadCountries();
    }
  }

  /**
   * Get modal title
   * @returns Title for the modal (e.g., "Add New Skill" or "Edit Skill")
   */
  get modalTitle(): string {
    const action = this.mode === 'edit' ? 'Edit' : 'Add New';
    return `${action} ${this.getSingularLabel()}`;
  }

  /**
   * Handle modal close
   */
  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  /**
   * Handle form submission.
   * Emits the form payload to the parent component.
   */
  onSubmit(): void {
    if (!this.name.trim()) {
      return;
    }

    const payload: MasterEntryFormData = {
      name: this.name.trim(),
      status: this.status
    };

    // Preserve id when editing, if provided
    if (this.initialData?.id) {
      payload.id = this.initialData.id;
    }

    // Include extended fields only for banks
    if (this.masterType === 'banks') {
      payload.branch = this.branch.trim();
      payload.ifsc_code = this.ifsc_code.trim();
      payload.address = this.address.trim();
      payload.country = this.country.trim();
      payload.state = this.state.trim();
      payload.city = this.city.trim();
      payload.phone_primary = this.phone_primary.trim();
      payload.phone_secondary = this.phone_secondary.trim();
      payload.remarks = this.remarks.trim();
    }

    this.submit.emit(payload);
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
    this.branch = '';
    this.ifsc_code = '';
    this.address = '';
    this.country = '';
    this.state = '';
    this.city = '';
    this.phone_primary = '';
    this.phone_secondary = '';
    this.remarks = '';
    this.countryOptions = [];
    this.stateOptions = [];
    this.cityOptions = [];
    this.selectedCountryId = null;
    this.selectedStateId = null;
    this.selectedCityId = null;
  }

  // -------- Bank-specific dropdown helpers --------

  /**
   * Transform API response to dropdown options
   */
  private transformToDropdownOptions(response: any): DropdownOption[] {
    const data = response?.data || response?.results || response || [];
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: String(item.id),
      label: item.name,
      value: String(item.id)
    }));
  }

  /**
   * Load all countries for the country dropdown (banks only)
   */
  private loadCountries(): void {
    this.dataService
      .get<any>('v1/countries')
      .subscribe((response) => {
        this.countryOptions = this.transformToDropdownOptions(response);
      });
  }

  /**
   * Load states for the selected country
   * Optionally pre-select a state and city when editing.
   */
  private loadStates(countryId: string, preselectStateId?: string, preselectCityId?: string): void {
    if (!countryId) {
      this.stateOptions = [];
      this.cityOptions = [];
      return;
    }

    this.dataService
      .get<any>(`v1/states?country_id=${countryId}`)
      .subscribe((response) => {
        this.stateOptions = this.transformToDropdownOptions(response);

        // Pre-select state (and load cities) when editing
        if (preselectStateId) {
          this.selectedStateId = preselectStateId;
          const selected = this.stateOptions.find((opt) => opt.value === preselectStateId);
          this.state = selected?.label || '';

          if (preselectCityId) {
            this.loadCities(preselectStateId, preselectCityId);
          }
        }
      });
  }

  /**
   * Load cities for the selected state
   * Optionally pre-select a city when editing.
   */
  private loadCities(stateId: string, preselectCityId?: string): void {
    if (!stateId) {
      this.cityOptions = [];
      return;
    }

    this.dataService
      .get<any>(`v1/cities?state_id=${stateId}`)
      .subscribe((response) => {
        this.cityOptions = this.transformToDropdownOptions(response);

        if (preselectCityId) {
          this.selectedCityId = preselectCityId;
          const selected = this.cityOptions.find((opt) => opt.value === preselectCityId);
          this.city = selected?.label || '';
        }
      });
  }

  /**
   * Handle country selection change - also triggers loading of states.
   */
  onCountryChange(values: string[] | null): void {
    const first = values && values.length ? values[0] : null;
    this.selectedCountryId = first;

    if (!first) {
      this.country = '';
      this.state = '';
      this.city = '';
      this.stateOptions = [];
      this.cityOptions = [];
      return;
    }

    const selected = this.countryOptions.find((opt) => opt.value === first);
    this.country = selected?.label || '';

    // Reset dependent selections
    this.state = '';
    this.city = '';
    this.stateOptions = [];
    this.cityOptions = [];

    this.loadStates(first);
  }

  /**
   * Handle state selection change - also triggers loading of cities.
   */
  onStateChange(values: string[] | null): void {
    const first = values && values.length ? values[0] : null;
    this.selectedStateId = first;

    if (!first) {
      this.state = '';
      this.city = '';
      this.cityOptions = [];
      return;
    }

    const selected = this.stateOptions.find((opt) => opt.value === first);
    this.state = selected?.label || '';

    // Reset cities and load for new state
    this.city = '';
    this.cityOptions = [];
    this.selectedCityId = null;

    this.loadCities(first);
  }

  /**
   * Handle city selection change.
   */
  onCityChange(values: string[] | null): void {
    const first = values && values.length ? values[0] : null;

    if (!first) {
      this.city = '';
      this.selectedCityId = null;
      return;
    }

    const selected = this.cityOptions.find((opt) => opt.value === first);
    this.city = selected?.label || '';
    this.selectedCityId = first;
  }
}

/**
 * Payload shape emitted from this modal.
 * For most master types only name + status are used.
 * For `banks`, additional optional fields are populated.
 */
export interface MasterEntryFormData {
  id?: string;
  name: string;
  status: string;
  // Optional IDs for cascading dropdowns (banks)
  countryId?: string;
  stateId?: string;
  cityId?: string;
  branch?: string;
  ifsc_code?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  phone_primary?: string;
  phone_secondary?: string;
  remarks?: string;
}

