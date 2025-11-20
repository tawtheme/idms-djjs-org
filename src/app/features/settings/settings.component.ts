import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { DataService } from '../../data.service';
import { CompanyInformationComponent, CompanyData } from './company-information/company-information.component';
import { PreferencesComponent, PreferencesData } from './preferences/preferences.component';
import { NotificationsComponent, NotificationsData } from './notifications/notifications.component';

interface SettingsForm {
  company: {
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
  };
  preferences: {
    currency: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    orderNotifications: boolean;
    jobNotifications: boolean;
    shipmentNotifications: boolean;
    invoiceNotifications: boolean;
  };
}

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    BreadcrumbComponent,
    CompanyInformationComponent,
    PreferencesComponent,
    NotificationsComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Settings', route: '/settings' }
  ];

  settings: SettingsForm = {
    company: {
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
    },
    preferences: {
      currency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      jobNotifications: true,
      shipmentNotifications: true,
      invoiceNotifications: true
    }
  };

  submitting = false;
  activeTab: string = 'company';

  // Tab options
  tabs = [
    { id: 'company', label: 'Company Information', icon: 'business' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' }
  ];


  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.data.getJson<any>('settings.json').subscribe({
      next: (response) => {
        const settingsData = response?.settings || {};
        
        // Load company information
        if (settingsData.company) {
          this.settings.company = {
            ...this.settings.company,
            ...settingsData.company
          };
        }
        
        // Load preferences
        if (settingsData.preferences) {
          this.settings.preferences = {
            ...this.settings.preferences,
            ...settingsData.preferences
          };
        }
        
        // Load notifications
        if (settingsData.notifications) {
          this.settings.notifications = {
            ...this.settings.notifications,
            ...settingsData.notifications
          };
        }
        
        // Backward compatibility with old format
        if (settingsData.companyName) {
          this.settings.company.name = settingsData.companyName;
        }
        if (settingsData.currency) {
          this.settings.preferences.currency = settingsData.currency;
        }
        if (settingsData.timezone) {
          this.settings.preferences.timezone = settingsData.timezone;
        }
        if (settingsData.address) {
          this.settings.company.address = { ...this.settings.company.address, ...settingsData.address };
        }
        if (settingsData.email) {
          this.settings.company.email = settingsData.email;
        }
        if (settingsData.phone) {
          this.settings.company.phone = settingsData.phone;
        }
      },
      error: () => {
        // Use default values if settings file doesn't exist
        console.log('Settings file not found, using defaults');
      }
    });
  }

  onCompanyChange(data: CompanyData): void {
    this.settings.company = { ...data };
  }

  onPreferencesChange(data: PreferencesData): void {
    this.settings.preferences = { ...data };
  }

  onNotificationsChange(data: NotificationsData): void {
    this.settings.notifications = { ...data };
  }

  save(): void {
    this.submitting = true;
    console.log('Saving settings:', JSON.stringify(this.settings, null, 2));

    // In a real app, you would save to the backend here
    // this.data.updateSettings(this.settings).subscribe({
    //   next: () => {
    //     this.submitting = false;
    //     // Show success message
    //   },
    //   error: (error) => {
    //     console.error('Error saving settings:', error);
    //     this.submitting = false;
    //   }
    // });

    // Simulate API call
    setTimeout(() => {
      this.submitting = false;
      alert('Settings saved successfully!');
    }, 400);
  }

  cancel(): void {
    // Reload settings to discard changes
    this.loadSettings();
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  isActiveTab(tabId: string): boolean {
    return this.activeTab === tabId;
  }
}
