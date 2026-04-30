import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';
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
  imports: [CommonModule, FormsModule, IconComponent, LoadingComponent, EmptyStateComponent, ImagePreviewDirective],
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

    this.dataService.get<any>(`v1/programs/${this.programId}`, { params: { actionType: 'view' } }).pipe(
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
      const summary = (Array.isArray(items) ? items : []).map((item: any) => ({
        sewaId: String(item.sewa_id || ''),
        sewaName: item.sewa_name || '',
        totalVolunteers: item.total_volunteers || 0
      }));

      const allSewas = data.sewa_Ids ?? data.sewaIds ?? data.sewa_ids ?? [];
      const normalized: SewaListItem[] = this.normalizeSewaIds(allSewas);

      const byId = new Map<string, SewaListItem>();
      // Seed from sewa_Ids first so order/coverage is preserved.
      normalized.forEach((s) => { if (s.sewaId) byId.set(s.sewaId, s); });
      // Overlay with items so we pick up real volunteer counts and any missing ids.
      summary.forEach((s) => {
        const existing = byId.get(s.sewaId);
        byId.set(s.sewaId, {
          sewaId: s.sewaId,
          sewaName: s.sewaName || existing?.sewaName || '',
          totalVolunteers: s.totalVolunteers
        });
      });

      this.sewaList = Array.from(byId.values());
      this.activeSewaTabIndex = -1;
      this.currentVolunteers = [];
    });
  }

  private normalizeSewaIds(input: any): SewaListItem[] {
    if (!input) return [];
    const list = Array.isArray(input) ? input : Object.entries(input).map(([id, value]) => {
      if (value && typeof value === 'object') return { id, ...(value as object) };
      return { id, name: value };
    });
    return list
      .map((entry: any) => {
        if (typeof entry === 'string' || typeof entry === 'number') {
          return { sewaId: String(entry), sewaName: '', totalVolunteers: 0 } as SewaListItem;
        }
        if (entry && typeof entry === 'object') {
          return {
            sewaId: String(entry.sewa_id ?? entry.sewa?.id ?? entry.id ?? ''),
            sewaName: entry.sewa?.name || entry.sewa_name || entry.name || entry.label || '',
            totalVolunteers: entry.total_volunteers ?? 0
          } as SewaListItem;
        }
        return null;
      })
      .filter((s): s is SewaListItem => !!s && !!s.sewaId);
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

    let params = new HttpParams()
      .set('program_id', this.programId)
      .set('sewa_id', this.currentSewaId)
      .set('per_page', this.volPerPage.toString())
      .set('page', this.volunteerPage.toString());

    const term = this.volunteerSearchTerm.trim();
    if (term) {
      params = params.set('search', term);
    }

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

  private computeProgramStatus(): { status: 'Completed' | 'Running' | 'Upcoming' | 'Scheduled'; scheduledDays?: number } {
    const start = this.program?.startDateTime;
    const end = this.program?.endDateTime;
    const now = new Date();
    const startDate = start ? new Date(start) : null;
    let endDate = end ? new Date(end) : null;
    if (end && typeof end === 'string' && !end.includes('T') && !end.includes(':')) {
      endDate = new Date(end + 'T23:59:59');
    }

    if (!startDate || isNaN(startDate.getTime())) return { status: 'Upcoming' };
    if (now < startDate) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntil = Math.ceil((startDay.getTime() - today.getTime()) / msPerDay);
      if (daysUntil > 6) return { status: 'Scheduled', scheduledDays: daysUntil };
      return { status: 'Upcoming' };
    }
    if (endDate && now > endDate) return { status: 'Completed' };
    return { status: 'Running' };
  }

  getStatusLabel(_status?: number): string {
    const { status, scheduledDays } = this.computeProgramStatus();
    if (status === 'Scheduled') {
      return `Scheduled in ${scheduledDays} ${scheduledDays === 1 ? 'day' : 'days'}`;
    }
    return status;
  }

  getStatusClass(_status?: number): string {
    return 'status-' + this.computeProgramStatus().status.toLowerCase();
  }

  getTotalDonations(): number {
    if (!this.program) return 0;
    return this.program.donations.reduce((sum, d) => sum + d.amount, 0);
  }

  selectSewaTab(index: number): void {
    this.activeSewaTabIndex = index;
    const sewa = this.sewaList[index];
    if (!sewa) return;
    if (sewa.totalVolunteers <= 0) {
      this.currentSewaId = sewa.sewaId;
      this.currentVolunteers = [];
      this.volunteerPage = 1;
      this.volunteerHasMore = false;
      this.volunteerSearchTerm = '';
      return;
    }
    this.loadSewaVolunteers(sewa.sewaId);
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
    return this.currentVolunteers;
  }

  get pagedVolunteers(): Volunteer[] {
    return this.filteredVolunteers;
  }

  onVolunteerSearchChange(): void {
    // Search runs on Enter; see onVolunteerSearchSubmit
  }

  onVolunteerSearchSubmit(): void {
    if (!this.currentSewaId) return;
    this.volunteerPage = 1;
    this.volunteerHasMore = false;
    this.fetchVolunteersPage(true);
  }

  goBack(): void {
    this.router.navigate(['/programs/programs-list']);
  }
}
