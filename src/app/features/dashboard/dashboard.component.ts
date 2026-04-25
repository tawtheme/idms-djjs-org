import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { DataService } from '../../data.service';

interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  iconColor: 'blue' | 'green';
}

interface DashboardData {
  total_visitors: number;
  total_volunteers: number;
  total_desiring_devotees: number;
  total_preachers: number;
  total_devotees: number;
  total_branches: number;
  total_programs: number;
  total_donation: string;
  latest_month_donation: string;
  upcoming_programs: any[];
  branchList: any[];
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, LoadingComponent],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dataService = inject(DataService);

  isLoading = true;

  totalDonation = '';
  latestMonthDonation = '';

  stats: DashboardStat[] = [];

  upcomingPrograms: any[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.dataService.get<any>('v1/dashboard').pipe(
      catchError((error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading = false;
        return of({ data: null });
      })
    ).subscribe((response) => {
      const data: DashboardData | null = response?.data ?? null;
      if (data) {
        this.totalDonation = data.total_donation ?? '';
        this.latestMonthDonation = data.latest_month_donation ?? '';
        this.upcomingPrograms = data.upcoming_programs ?? [];
        this.stats = [
          { title: 'Total Visitors', value: data.total_visitors ?? 0, icon: 'person', iconColor: 'blue' },
          { title: 'Total Volunteers', value: data.total_volunteers ?? 0, icon: 'groups', iconColor: 'blue' },
          { title: 'Total Desiring Devotees', value: data.total_desiring_devotees ?? 0, icon: 'person_add', iconColor: 'blue' },
          { title: 'Total Preachers', value: data.total_preachers ?? 0, icon: 'person', iconColor: 'green' },
          { title: 'Total Devotees', value: data.total_devotees ?? 0, icon: 'groups', iconColor: 'green' },
          { title: 'Total Branches', value: data.total_branches ?? 0, icon: 'account_tree', iconColor: 'green' },
          { title: 'Total Programs', value: data.total_programs ?? 0, icon: 'event', iconColor: 'green' }
        ];
      }
      this.isLoading = false;
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }
}
