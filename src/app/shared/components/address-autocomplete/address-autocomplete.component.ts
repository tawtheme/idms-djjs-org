import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { GoogleMapsService } from '../../services/google-maps.service';
import { environment } from '../../../../environments/environment';

export interface AddressSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface AddressDetails {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
  formatted_address: string;
  place_id: string;
}

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './address-autocomplete.component.html',
  styleUrls: ['./address-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressAutocompleteComponent),
      multi: true
    }
  ]
})
export class AddressAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder: string = 'Enter address';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() googleApiKey: string = environment.googleMapsApiKey;
  @Input() country: string = 'us'; // Restrict to specific country
  @Input() types: string = 'address'; // Google Places types
  @Input() mode: 'address' | 'state' = 'address'; // Component mode
  
  @Output() addressSelected = new EventEmitter<AddressDetails>();
  @Output() suggestionsChanged = new EventEmitter<AddressSuggestion[]>();
  
  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  
  value: string = '';
  suggestions: AddressSuggestion[] = [];
  showSuggestions: boolean = false;
  selectedIndex: number = -1;
  isLoading: boolean = false;
  
  private onTouched = () => {};
  private onChange = (value: string) => {};
  
  constructor(private googleMapsService: GoogleMapsService) {}
  
  ngOnInit(): void {
    this.initializeGoogleMaps();
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }
  
  private initializeGoogleMaps(): void {
    if (this.googleApiKey) {
      this.googleMapsService.setApiKey(this.googleApiKey);
      this.googleMapsService.loadApi().catch(error => {
        console.error('Failed to load Google Maps API:', error);
      });
    } else {
      console.warn('Google Maps API key not provided');
    }
  }
  
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    
    if (this.value.length >= 2) {
      this.getSuggestions(this.value);
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }
  
  private getSuggestions(input: string): void {
    this.isLoading = true;
    
    const requestOptions = this.mode === 'state' 
      ? { types: ['(regions)'], componentRestrictions: { country: 'us' } }
      : { types: [this.types], country: this.country };
    
    this.googleMapsService.getPlacePredictions(input, requestOptions).then(predictions => {
      this.isLoading = false;
      
      // Filter for states only if in state mode
      let filteredPredictions = predictions;
      if (this.mode === 'state') {
        filteredPredictions = predictions.filter(prediction => 
          prediction.description.includes(', USA') &&
          (prediction.types?.includes('administrative_area_level_1') || 
           prediction.description.match(/^[A-Za-z\s]+,\s*USA$/))
        );
      }
      
      this.suggestions = filteredPredictions.map(prediction => ({
        description: prediction.description,
        place_id: prediction.place_id,
        structured_formatting: prediction.structured_formatting
      }));
      this.showSuggestions = true;
      this.suggestionsChanged.emit(this.suggestions);
    }).catch(error => {
      this.isLoading = false;
      this.suggestions = [];
      this.showSuggestions = false;
      console.warn('Places API error:', error);
    });
  }
  
  selectSuggestion(suggestion: AddressSuggestion): void {
    this.value = suggestion.description;
    this.showSuggestions = false;
    this.selectedIndex = -1;
    this.onChange(this.value);
    
    // Get detailed address information
    this.getAddressDetails(suggestion.place_id);
  }
  
  private getAddressDetails(placeId: string): void {
    this.googleMapsService.getPlaceDetails(placeId, ['address_components', 'formatted_address', 'place_id'])
      .then(place => {
        const addressDetails = this.parseAddressComponents(place);
        this.addressSelected.emit(addressDetails);
      })
      .catch(error => {
        console.warn('Place details error:', error);
      });
  }
  
  private parseAddressComponents(place: google.maps.places.PlaceResult): AddressDetails {
    const addressComponents = place.address_components || [];
    const details: AddressDetails = {
      formatted_address: place.formatted_address || '',
      place_id: place.place_id || ''
    };
    
    addressComponents.forEach((component: google.maps.places.AddressComponent) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        details.street_number = component.long_name;
      } else if (types.includes('route')) {
        details.route = component.long_name;
      } else if (types.includes('locality')) {
        details.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        details.administrative_area_level_1 = component.long_name;
      } else if (types.includes('postal_code')) {
        details.postal_code = component.long_name;
      } else if (types.includes('country')) {
        details.country = component.long_name;
      }
    });
    
    return details;
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions || this.suggestions.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.showSuggestions = false;
        this.selectedIndex = -1;
        break;
    }
  }
  
  onBlur(): void {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedIndex = -1;
      this.onTouched();
    }, 200);
  }
  
  onFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }
  
  clearAddress(): void {
    this.value = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.selectedIndex = -1;
    this.onChange('');
  }
  
  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}