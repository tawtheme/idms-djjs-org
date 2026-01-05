import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { LocationService } from '../../../../core/services/location.service';

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
  /** Shared location service for fetching dropdown data (countries, states, cities) */
  private readonly locationService = inject(LocationService);
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
  district = '';
  phone_primary = '';
  phone_secondary = '';
  remarks = '';

  /** Dropdown options for country / state / district / city (used for banks, states, districts, cities) */
  countryOptions: DropdownOption[] = [];
  stateOptions: DropdownOption[] = [];
  districtOptions: DropdownOption[] = [];
  cityOptions: DropdownOption[] = [];

  /** Currently selected IDs for cascading dropdowns */
  selectedCountryId: string | null = null;
  selectedStateId: string | null = null;
  selectedDistrictId: string | null = null;
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
          this.loadStates(
            this.initialData.countryId,
            this.initialData.country || '',
            this.initialData.stateId,
            this.initialData.districtId,
            this.initialData.cityId
          );
        }
      }
    }

    // Load countries when modal opens for banks, states, districts, or cities
    if (this.isOpen && this.countryOptions.length === 0) {
      if (this.masterType === 'banks' || this.masterType === 'states' ||
        this.masterType === 'districts' || this.masterType === 'cities') {
        this.loadCountries();
      }
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
      payload.district = this.district.trim();
      payload.city = this.city.trim();
      payload.countryId = this.selectedCountryId || undefined;
      payload.stateId = this.selectedStateId || undefined;
      payload.districtId = this.selectedDistrictId || undefined;
      payload.cityId = this.selectedCityId || undefined;
      payload.phone_primary = this.phone_primary.trim();
      payload.phone_secondary = this.phone_secondary.trim();
      payload.remarks = this.remarks.trim();
    }

    // Include country for states master
    if (this.masterType === 'states') {
      payload.countryId = this.selectedCountryId || undefined;
      payload.country = this.country.trim();
    }

    // Include country and state for districts master
    if (this.masterType === 'districts') {
      payload.countryId = this.selectedCountryId || undefined;
      payload.stateId = this.selectedStateId || undefined;
      payload.country = this.country.trim();
      payload.state = this.state.trim();
    }

    // Include country, state, and district for cities master
    if (this.masterType === 'cities') {
      payload.countryId = this.selectedCountryId || undefined;
      payload.stateId = this.selectedStateId || undefined;
      payload.districtId = this.selectedDistrictId || undefined;
      payload.country = this.country.trim();
      payload.state = this.state.trim();
      payload.district = this.district.trim();
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
    this.district = '';
    this.phone_primary = '';
    this.phone_secondary = '';
    this.remarks = '';
    this.countryOptions = [];
    this.stateOptions = [];
    this.districtOptions = [];
    this.cityOptions = [];
    this.selectedCountryId = null;
    this.selectedStateId = null;
    this.selectedDistrictId = null;
    this.selectedCityId = null;
  }

  // -------- Bank-specific dropdown helpers --------

  /**
   * Load all countries for the country dropdown (banks only)
   */
  private loadCountries(): void {
    this.locationService.loadCountries().subscribe((options) => {
      this.countryOptions = options;
    });
  }

  /**
   * Load states for the selected country
   * Optionally pre-select a state and city when editing.
   */
  private loadStates(countryId: string, countryName: string, preselectStateId?: string, preselectDistrictId?: string, preselectCityId?: string): void {
    if (!countryId || !countryName) {
      this.stateOptions = [];
      this.districtOptions = [];
      this.cityOptions = [];
      return;
    }

    this.locationService.loadStates(countryName).subscribe((options) => {
      this.stateOptions = options;

      // Pre-select state (and load next level) when editing
      if (preselectStateId) {
        this.selectedStateId = preselectStateId;
        const selected = this.stateOptions.find((opt) => opt.value === preselectStateId);
        this.state = selected?.label || '';

        if (this.masterType === 'cities' || this.masterType === 'banks') {
          this.loadDistricts(preselectStateId, this.state, preselectDistrictId, preselectCityId);
        } else {
          this.loadCities(preselectStateId, this.state, preselectCityId);
        }
      }
    });
  }

  /**
   * Load cities for the selected state
   * Optionally pre-select a city when editing.
   */
  private loadCities(stateId: string, stateName: string, preselectCityId?: string): void {
    if (!stateId || !stateName) {
      this.cityOptions = [];
      return;
    }

    this.locationService.loadCities({
      stateName: stateName,
      countryName: this.country || undefined
    }).subscribe((options) => {
      this.cityOptions = options;

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
    const countryName = selected?.label || '';
    this.country = countryName;

    // Reset dependent selections
    this.state = '';
    this.district = '';
    this.city = '';
    this.selectedStateId = null;
    this.selectedDistrictId = null;
    this.selectedCityId = null;
    this.stateOptions = [];
    this.districtOptions = [];
    this.cityOptions = [];

    // Only load states for districts, cities, and banks master types
    // Don't load states when adding a new state (masterType === 'states')
    if (this.masterType === 'districts' || this.masterType === 'cities' || this.masterType === 'banks') {
      this.loadStates(first, countryName);
    }
  }

  /**
   * Handle state selection change - also triggers loading of districts or cities.
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
    const stateName = selected?.label || '';
    this.state = stateName;

    // Reset dependent selections
    this.district = '';
    this.city = '';
    this.selectedDistrictId = null;
    this.selectedCityId = null;
    this.districtOptions = [];
    this.cityOptions = [];

    // Only load districts for cities and banks master types
    // Don't load districts when adding a new district (masterType === 'districts')
    if (this.masterType === 'cities' || this.masterType === 'banks') {
      this.loadDistricts(first, stateName);
    }
    // Note: We don't load cities directly anymore as the hierarchy is now
    // Country → State → District → City for better data organization
  }

  /**
   * Handle district selection change - also triggers loading of cities.
   */
  onDistrictChange(values: string[] | null): void {
    const first = values && values.length ? values[0] : null;
    this.selectedDistrictId = first;

    if (!first) {
      this.district = '';
      this.city = '';
      this.cityOptions = [];
      return;
    }

    const selected = this.districtOptions.find((opt) => opt.value === first);
    const districtName = selected?.label || '';
    this.district = districtName;

    // Reset cities
    this.city = '';
    this.cityOptions = [];
    this.selectedCityId = null;

    // Only load cities for banks master type
    // Don't load cities when adding a new city (masterType === 'cities')
    if (this.masterType === 'banks') {
      this.loadCitiesForDistrict(first, districtName);
    }
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

  /**
   * Load districts for the selected state (for cities master)
   */
  private loadDistricts(stateId: string, stateName: string, preselectDistrictId?: string, preselectCityId?: string): void {
    if (!stateId || !stateName) {
      this.districtOptions = [];
      this.cityOptions = [];
      return;
    }

    this.locationService.loadDistricts(stateName, this.country || undefined).subscribe((options) => {
      this.districtOptions = options;

      // Pre-select district when editing
      if (preselectDistrictId) {
        this.selectedDistrictId = preselectDistrictId;
        const selected = this.districtOptions.find((opt) => opt.value === preselectDistrictId);
        this.district = selected?.label || '';

        if (preselectCityId) {
          this.loadCitiesForDistrict(preselectDistrictId, this.district, preselectCityId);
        }
      }
    });
  }

  /**
   * Load cities for the selected district (for cities master)
   */
  private loadCitiesForDistrict(districtId: string, districtName: string, preselectCityId?: string): void {
    if (!districtId || !districtName) {
      this.cityOptions = [];
      return;
    }

    this.locationService.loadCities({
      districtName: districtName,
      stateName: this.state || undefined,
      countryName: this.country || undefined
    }).subscribe((options) => {
      this.cityOptions = options;

      if (preselectCityId) {
        this.selectedCityId = preselectCityId;
        const selected = this.cityOptions.find((opt) => opt.value === preselectCityId);
        this.city = selected?.label || '';
      }
    });
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
  // Optional IDs for cascading dropdowns (banks, states, districts, cities)
  countryId?: string;
  stateId?: string;
  districtId?: string;
  cityId?: string;
  branch?: string;
  ifsc_code?: string;
  address?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  phone_primary?: string;
  phone_secondary?: string;
  remarks?: string;
}

