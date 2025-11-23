import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Donation amounts
  totalDonationAmount = 882921779.92;
  latestMonthDonationAmount = 0.00;

  // Stats data
  stats = [
    { 
      title: 'Total Visitors', 
      value: 7, 
      icon: 'person',
      iconColor: 'blue'
    },
    { 
      title: 'Total Volunteers', 
      value: 10329, 
      icon: 'groups',
      iconColor: 'blue'
    },
    { 
      title: 'Total Desiring Devotees', 
      value: 1, 
      icon: 'person_add',
      iconColor: 'blue'
    },
    { 
      title: 'Total Branches', 
      value: 135, 
      icon: 'account_tree',
      iconColor: 'green'
    },
    { 
      title: 'Total Programs', 
      value: 17, 
      icon: 'event',
      iconColor: 'green'
    }
  ];

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format number with commas
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }
}

