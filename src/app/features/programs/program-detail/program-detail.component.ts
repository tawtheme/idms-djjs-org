import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DataService } from '../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ProgramBasic {
  id: string;
  name: string;
  initiative: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  startDateTime: string;
  endDateTime: string;
  status: number;
  remarks: string;
  donations: Donation[];
}

export interface SewaListItem {
  sewaId: string;
  sewaName: string;
  totalVolunteers: number;
}

export interface Volunteer {
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
  imports: [CommonModule, FormsModule, IconComponent, LoadingComponent, EmptyStateComponent],
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
  program: ProgramBasic | null = null;

  sewaList: SewaListItem[] = [];
  isLoadingSewaList = false;

  currentVolunteers: Volunteer[] = [];
  isLoadingVolunteers = false;
  isLoadingMoreVolunteers = false;
  volunteerPage = 1;
  volunteerHasMore = false;
  private currentSewaId = '';

  activeSewaTabIndex = -1;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs' },
    { label: 'Programs List', route: '/programs/programs-list' },
    { label: 'Details' }
  ];

  volunteerSearchTerm = '';
  sewaSearchTerm = '';
  private readonly volPerPage = 50;

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    if (this.programId) {
      this.loadProgramDetails();
    }
  }

  loadProgramDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>(`v1/programs/${this.programId}`).pipe(
      catchError((err) => {
        this.error = err.error?.message || 'Failed to load program details.';
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((response) => {
      if (!response) return;
      const data = response.data || response;
      this.program = this.mapProgramBasic(data);
      this.isLoading = false;
      this.loadSewaList();
    });
  }

  loadSewaList(): void {
    this.isLoadingSewaList = true;
    this.dataService.get<any>(`v1/programs/${this.programId}/volunteers/attendance-summary`).pipe(
      catchError(() => of(null)),
      finalize(() => this.isLoadingSewaList = false)
    ).subscribe((response) => {
      if (!response) {
        this.sewaList = [];
        return;
      }
      const data = response.data || {};
      const items = data.items || [];
      this.sewaList = (Array.isArray(items) ? items : []).map((item: any) => ({
        sewaId: item.sewa_id || '',
        sewaName: item.sewa_name || '',
        totalVolunteers: item.total_volunteers || 0
      }));
      this.activeSewaTabIndex = -1;
      this.currentVolunteers = [];
    });
  }

  loadSewaVolunteers(sewaId: string): void {
    this.currentSewaId = sewaId;
    this.currentVolunteers = [];
    this.volunteerPage = 1;
    this.volunteerHasMore = false;
    this.volunteerSearchTerm = '';
    this.fetchVolunteersPage(true);
  }

  loadMoreVolunteers(): void {
    if (this.isLoadingMoreVolunteers || !this.volunteerHasMore) return;
    this.volunteerPage += 1;
    this.fetchVolunteersPage(false);
  }

  private fetchVolunteersPage(isInitial: boolean): void {
    if (isInitial) {
      this.isLoadingVolunteers = true;
    } else {
      this.isLoadingMoreVolunteers = true;
    }

    const params = new HttpParams()
      .set('program_id', this.programId)
      .set('sewa_id', this.currentSewaId)
      .set('per_page', this.volPerPage.toString())
      .set('page', this.volunteerPage.toString());

    this.dataService.get<any>(`v1/programs/view/${this.programId}`, { params }).pipe(
      catchError(() => of(null)),
      finalize(() => {
        if (isInitial) {
          this.isLoadingVolunteers = false;
        } else {
          this.isLoadingMoreVolunteers = false;
        }
      })
    ).subscribe((response) => {
      if (!response) return;
      const data = response.data || response;

      let volunteerArr: any[] = [];
      if (Array.isArray(data)) {
        volunteerArr = data;
      } else if (Array.isArray(data.volunteers)) {
        volunteerArr = data.volunteers;
      } else if (Array.isArray(data.records)) {
        volunteerArr = data.records;
      } else if (Array.isArray(data.program_sewa_volunteers)) {
        volunteerArr = data.program_sewa_volunteers;
      } else if (Array.isArray(data.program_sewas)) {
        const matched = data.program_sewas.find((ps: any) =>
          String(ps.sewa_id || ps.sewa?.id) === String(this.currentSewaId)
        ) || data.program_sewas[0];
        volunteerArr = matched?.program_sewa_volunteers || matched?.volunteers || [];
      }

      const mapped: Volunteer[] = volunteerArr.map((v: any) => ({
        id: v.id,
        user: {
          id: v.user?.id || '',
          uniqueId: v.user?.unique_id || 0,
          name: v.user?.name || '',
          image: v.user?.user_image?.full_path || v.user?.image || ''
        },
        badgeId: v.program_sewa_volunteer_badge?.badge_id || v.badge_id || null
      }));

      this.currentVolunteers = isInitial ? mapped : [...this.currentVolunteers, ...mapped];

      const meta = response.meta || {};
      const totalFromMeta = Number(meta.total ?? meta.itemsCount ?? response.total ?? 0);
      if (totalFromMeta > 0) {
        this.volunteerHasMore = this.currentVolunteers.length < totalFromMeta;
      } else {
        this.volunteerHasMore = mapped.length >= this.volPerPage;
      }
    });
  }

  private mapProgramBasic(data: any): ProgramBasic {
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

  getTotalDonations(): number {
    if (!this.program) return 0;
    return this.program.donations.reduce((sum, d) => sum + d.amount, 0);
  }

  selectSewaTab(index: number): void {
    this.activeSewaTabIndex = index;
    const sewa = this.sewaList[index];
    if (sewa) {
      this.loadSewaVolunteers(sewa.sewaId);
    }
  }

  get activeSewa(): SewaListItem | null {
    if (this.sewaList.length === 0) return null;
    return this.sewaList[this.activeSewaTabIndex] || null;
  }

  get filteredSewaList(): SewaListItem[] {
    const term = this.sewaSearchTerm.toLowerCase().trim();
    if (!term) return this.sewaList;
    return this.sewaList.filter((s) =>
      (s.sewaName || '').toLowerCase().includes(term)
    );
  }

  selectSewa(sewa: SewaListItem): void {
    const index = this.sewaList.findIndex((s) => s.sewaId === sewa.sewaId);
    if (index >= 0) {
      this.selectSewaTab(index);
    }
  }

  get filteredVolunteers(): Volunteer[] {
    const term = this.volunteerSearchTerm.toLowerCase().trim();
    if (!term) return this.currentVolunteers;
    return this.currentVolunteers.filter((v) =>
      (v.user?.name || '').toLowerCase().includes(term) ||
      (v.user?.uniqueId || '').toString().toLowerCase().includes(term) ||
      (v.badgeId || '').toString().toLowerCase().includes(term)
    );
  }

  get pagedVolunteers(): Volunteer[] {
    return this.filteredVolunteers;
  }

  onVolunteerSearchChange(): void {
    // Search is client-side over already-loaded volunteers
  }

  goBack(): void {
    this.router.navigate(['/programs/programs-list']);
  }
}
