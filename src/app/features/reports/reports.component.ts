import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-reports',
  template: `
    <h2>Reports</h2>
    <ul>
      <li>Sales by Month</li>
      <li>Production Throughput</li>
      <li>Inventory Valuation</li>
    </ul>
  `
})
export class ReportsComponent {}


