import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AddressAutocompleteComponent, AddressDetails } from './address-autocomplete.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-address-autocomplete-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddressAutocompleteComponent],
  template: `
    <div class="example-container">
      <h3>Address Autocomplete Example</h3>
      
      <form [formGroup]="exampleForm">
        <div class="form-group">
          <label>Business Address</label>
          <app-address-autocomplete
            formControlName="businessAddress"
            [googleApiKey]="googleApiKey"
            [placeholder]="'Enter business address'"
            [country]="'us'"
            [types]="'address'"
            (addressSelected)="onAddressSelected($event)">
          </app-address-autocomplete>
        </div>
        
        <div class="form-group">
          <label>Home Address</label>
          <app-address-autocomplete
            formControlName="homeAddress"
            [googleApiKey]="googleApiKey"
            [placeholder]="'Enter home address'"
            [country]="'us'"
            [types]="'address'"
            (addressSelected)="onAddressSelected($event)">
          </app-address-autocomplete>
        </div>
      </form>
      
      <div *ngIf="selectedAddress" class="address-details">
        <h4>Selected Address Details:</h4>
        <pre>{{ selectedAddress | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .example-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .address-details {
      margin-top: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    pre {
      background-color: #fff;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class AddressAutocompleteExampleComponent {
  exampleForm: FormGroup;
  selectedAddress: AddressDetails | null = null;
  
  // Using API key from environment
  googleApiKey = environment.googleMapsApiKey;
  
  constructor(private fb: FormBuilder) {
    this.exampleForm = this.fb.group({
      businessAddress: [''],
      homeAddress: ['']
    });
  }
  
  onAddressSelected(addressDetails: AddressDetails): void {
    this.selectedAddress = addressDetails;
    console.log('Address selected:', addressDetails);
  }
}
