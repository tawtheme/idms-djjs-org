import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ProgramDetail {
  id: string;
  name: string;
  initiative: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  startDateTime: string;
  endDateTime: string;
  status: number;
  remarks: string;
  programSewas: ProgramSewa[];
  donations: Donation[];
}

export interface ProgramSewa {
  id: string;
  sewa: { id: string; name: string };
  volunteers: ProgramSewaVolunteer[];
}

export interface ProgramSewaVolunteer {
  id: string;
  user: {
    id: string;
    uniqueId: number;
    name: string;
    image: string;
  };
  badgeId: number | null;
}

export interface Donation {
  id: string;
  sewaId: string;
  userId: string;
  amount: number;
}

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingComponent, PagerComponent],
  templateUrl: './program-detail.component.html',
  styleUrls: ['./program-detail.component.scss']
})
export class ProgramDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);

  programId = '';
  isLoading = true;
  error: string | null = null;
  program: ProgramDetail | null = null;
  activeSewaTabIndex = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs' },
    { label: 'Programs List', route: '/programs/programs-list' },
    { label: 'Details' }
  ];

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    if (this.programId) {
      this.loadProgramDetails();
    }
  }

  loadProgramDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>(`v1/programs/view/${this.programId}`).pipe(
      catchError((err) => {
        this.error = err.error?.message || 'Failed to load program details.';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((response) => {
      if (!response) return;

      const data = response.data || response;
      this.program = this.mapProgramDetail(data);
      this.breadcrumbs = [
        { label: 'Programs', route: '/programs' },
        { label: 'Programs List', route: '/programs/programs-list' },
        { label: 'Details' }
      ];
      this.activeSewaTabIndex = 0;
      this.isLoading = false;
    });
  }

  private mapProgramDetail(data: any): ProgramDetail {
    return {
      id: data.id,
      name: data.name || '',
      initiative: data.initiative || null,
      project: data.project || null,
      branch: data.branch || null,
      startDateTime: data.start_date_time || '',
      endDateTime: data.end_date_time || '',
      status: data.status,
      remarks: data.remarks || '',
      programSewas: (data.program_sewas || []).map((ps: any) => ({
        id: ps.id,
        sewa: ps.sewa || { id: ps.sewa_id, name: '' },
        volunteers: (ps.program_sewa_volunteers || []).map((v: any) => ({
          id: v.id,
          user: {
            id: v.user?.id || '',
            uniqueId: v.user?.unique_id || 0,
            name: v.user?.name || '',
            image: v.user?.user_image?.full_path || ''
          },
          badgeId: v.program_sewa_volunteer_badge?.badge_id || null
        }))
      })),
      donations: (data.donations || []).map((d: any) => ({
        id: d.id,
        sewaId: d.sewa_id,
        userId: d.user_id,
        amount: d.amount
      }))
    };
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Completed';
      case 2: return 'In Progress';
      case 3: return 'Cancelled';
      default: return 'Pending';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'status-completed';
      case 2: return 'status-in-progress';
      case 3: return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getTotalVolunteers(): number {
    if (!this.program) return 0;
    return this.program.programSewas.reduce((sum, ps) => sum + ps.volunteers.length, 0);
  }

  getTotalDonations(): number {
    if (!this.program) return 0;
    return this.program.donations.reduce((sum, d) => sum + d.amount, 0);
  }

  volunteerSearchTerm = '';
  volCurrentPage = 1;
  volPageSize = 20;
  volPageSizeOptions = [10, 20, 50];

  selectSewaTab(index: number): void {
    this.activeSewaTabIndex = index;
    this.volunteerSearchTerm = '';
    this.volCurrentPage = 1;
  }

  get activeSewaTab(): ProgramSewa | null {
    if (!this.program || this.program.programSewas.length === 0) return null;
    return this.program.programSewas[this.activeSewaTabIndex] || null;
  }

  get filteredVolunteers(): any[] {
    if (!this.activeSewaTab) return [];
    const term = this.volunteerSearchTerm.toLowerCase().trim();
    if (!term) return this.activeSewaTab.volunteers;
    return this.activeSewaTab.volunteers.filter((v: any) =>
      (v.user?.name || '').toLowerCase().includes(term) ||
      (v.user?.uniqueId || '').toString().toLowerCase().includes(term) ||
      (v.badgeId || '').toString().toLowerCase().includes(term)
    );
  }

  get pagedVolunteers(): any[] {
    const start = (this.volCurrentPage - 1) * this.volPageSize;
    return this.filteredVolunteers.slice(start, start + this.volPageSize);
  }

  goBack(): void {
    this.router.navigate(['/programs/programs-list']);
  }
}
