import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

@Component({
  selector: 'app-breadcrumb-example',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  template: `
    <div class="breadcrumb-examples">
      <h2>Breadcrumb Component Examples</h2>
      
      <!-- Basic Breadcrumb -->
      <div class="example-section">
        <h3>Basic Breadcrumb</h3>
        <app-breadcrumb [items]="basicItems"></app-breadcrumb>
      </div>

      <!-- Breadcrumb with Icons -->
      <div class="example-section">
        <h3>With Icons</h3>
        <app-breadcrumb [items]="iconItems"></app-breadcrumb>
      </div>

      <!-- Custom Separator -->
      <div class="example-section">
        <h3>Custom Separator</h3>
        <app-breadcrumb [items]="basicItems" separator="›"></app-breadcrumb>
      </div>

      <!-- Without Home -->
      <div class="example-section">
        <h3>Without Home</h3>
        <app-breadcrumb [items]="basicItems" [showHome]="false"></app-breadcrumb>
      </div>

      <!-- Long Breadcrumb with Ellipsis -->
      <div class="example-section">
        <h3>Long Breadcrumb (with ellipsis)</h3>
        <app-breadcrumb [items]="longItems" [maxItems]="3"></app-breadcrumb>
      </div>

      <!-- Disabled Items -->
      <div class="example-section">
        <h3>With Disabled Items</h3>
        <app-breadcrumb [items]="disabledItems"></app-breadcrumb>
      </div>
    </div>
  `,
  styles: [`
    .breadcrumb-examples {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .example-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    h2 {
      color: #333;
      margin-bottom: 20px;
    }
    
    h3 {
      color: #555;
      margin-bottom: 10px;
      font-size: 16px;
    }
  `]
})
export class BreadcrumbExampleComponent {
  basicItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Clients', route: '/clients' },
    { label: 'Add Client', route: '/clients/add' }
  ];

  iconItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Clients', route: '/clients', icon: 'people' },
    { label: 'Add Client', route: '/clients/add', icon: 'person_add' }
  ];

  longItems: BreadcrumbItem[] = [
    { label: 'Home', route: '/home' },
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Clients', route: '/clients' },
    { label: 'Client Details', route: '/clients/123' },
    { label: 'Edit Client', route: '/clients/123/edit' },
    { label: 'Settings', route: '/clients/123/settings' },
    { label: 'Advanced Settings', route: '/clients/123/settings/advanced' }
  ];

  disabledItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Clients', route: '/clients' },
    { label: 'Add Client', disabled: true }
  ];
}
