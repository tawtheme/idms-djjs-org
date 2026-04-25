import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from '../../../../data.service';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type TabId =
  | 'basic'
  | 'address'
  | 'personal'
  | 'education'
  | 'medical'
  | 'spiritual'
  | 'sewa'
  | 'program'
  | 'donation';

interface TabDef { id: TabId; label: string; }

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent, IconComponent],
  selector: 'app-volunteer-view',
  templateUrl: './volunteer-view.component.html',
  styleUrls: ['./volunteer-view.component.scss']
})
export class VolunteerViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);

  tabs: TabDef[] = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'address', label: 'Address Details' },
    { id: 'personal', label: 'Personal & Family Details' },
    { id: 'education', label: 'Education & Work Details' },
    { id: 'medical', label: 'Medical' },
    { id: 'spiritual', label: 'Spiritual Details' },
    { id: 'sewa', label: 'Sewa Tracking' },
    { id: 'program', label: 'Program Journey' },
    { id: 'donation', label: 'Donations' }
  ];

  activeTab: TabId = 'basic';

  userId: string | null = null;
  user: any = null;
  isLoading = false;
  error: string | null = null;

  // Tab-specific lazy data
  sewaBranches: any[] = [];
  sewaLoading = false;
  sewaError: string | null = null;

  programRows: any[] = [];
  programLoading = false;
  programError: string | null = null;

  donationRows: any[] = [];
  donationLoading = false;
  donationError: string | null = null;

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) this.loadUser();
  }

  loadUser(): void {
    this.isLoading = true;
    this.error = null;
    this.dataService.get<any>(`v1/users/${this.userId}`).pipe(
      catchError((err) => {
        console.error('Error loading volunteer:', err);
        this.error = err?.error?.message || err?.message || 'Failed to load volunteer.';
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoading = false;
      this.user = response?.data?.user || response?.data || response || null;
    });
  }

  setTab(id: TabId): void {
    this.activeTab = id;
    if (id === 'sewa' && !this.sewaBranches.length && !this.sewaLoading && !this.sewaError) this.loadSewa();
    if (id === 'program' && !this.programRows.length && !this.programLoading && !this.programError) this.loadProgram();
    if (id === 'donation' && !this.donationRows.length && !this.donationLoading && !this.donationError) this.loadDonation();
  }

  loadSewa(): void {
    if (!this.userId) return;
    this.sewaLoading = true;
    this.dataService.get<any>(`v1/users/${this.userId}/sewa_tracking/view`).pipe(
      catchError((err) => { this.sewaError = err?.message || 'Failed'; return of(null); })
    ).subscribe((response) => {
      this.sewaLoading = false;
      if (!response) return;
      const data = response?.data?.refineUserSewaDatas || response?.refineUserSewaDatas || {};
      this.sewaBranches = Object.values(data).map((b: any) => ({
        branchName: b?.name || '',
        sewaGroups: Object.values(b?.sewaDatas || {}).map((s: any) => ({
          sewaName: s?.sewaName || '',
          rows: (Array.isArray(s?.sewaTracks) ? s.sewaTracks : []).map((t: any) => ({
            sewaName: t?.sewa?.name || s?.sewaName || '',
            badgeId: t?.badge_id ?? '',
            allocatedDate: t?.created_at || '',
            unallocatedDate: t?.status === 0 ? (t?.updated_at || '') : '',
            reason: t?.reason || ''
          }))
        }))
      }));
    });
  }

  loadProgram(): void {
    if (!this.userId) return;
    this.programLoading = true;
    this.dataService.get<any>(`v1/users/${this.userId}/program_journey/view`).pipe(
      catchError((err) => { this.programError = err?.message || 'Failed'; return of(null); })
    ).subscribe((response) => {
      this.programLoading = false;
      if (!response) return;
      const list = response?.data?.user?.user_program_sewa_volunteers || [];
      this.programRows = (Array.isArray(list) ? list : []).map((p: any) => {
        const program = p?.program_sewa?.program || {};
        const sewa = p?.program_sewa?.sewa || {};
        const att = (program?.program_attendances || [])[0] || {};
        return {
          programName: program?.name || '',
          sewaName: sewa?.name || '',
          status: att?.status ? String(att.status) : '',
          checkIn: att?.check_in || '',
          checkOut: att?.check_out || '',
          startDate: program?.start_date_time || '',
          endDate: program?.end_date_time || ''
        };
      });
    });
  }

  loadDonation(): void {
    if (!this.userId) return;
    this.donationLoading = true;
    this.dataService.get<any>(`v1/users/${this.userId}/donation/view`).pipe(
      catchError((err) => { this.donationError = err?.message || 'Failed'; return of(null); })
    ).subscribe((response) => {
      this.donationLoading = false;
      if (!response) return;
      const list = response?.data?.user?.user_donations || [];
      this.donationRows = (Array.isArray(list) ? list : []).map((d: any) => ({
        programName: d?.program?.name || d?.program_name || '',
        amount: d?.amount ?? d?.donation_amount ?? '',
        date: d?.donation_date || d?.created_at || d?.date || ''
      }));
    });
  }

  // -- Convenience getters for templated sections -------------------------
  get profile() { return this.user?.user_profile || {}; }
  get addresses(): any[] {
    const arr = this.user?.user_address;
    if (!arr) return [];
    return Array.isArray(arr) ? arr : [arr];
  }
  get permanentAddress() { return this.addresses[0] || {}; }
  get correspondenceAddress() { return this.addresses[1] || {}; }
  get firstImage(): string | null {
    const imgs = this.user?.user_images || [];
    return imgs.length ? (imgs[0]?.full_path || null) : null;
  }
  get userEmergencyContacts(): any[] {
    const arr = this.user?.user_emergency_contacts || this.profile?.emergency_contacts;
    return Array.isArray(arr) ? arr : (arr ? [arr] : []);
  }
  get familyMembers(): any[] {
    const arr = this.user?.user_family_members || this.profile?.family_members;
    return Array.isArray(arr) ? arr : (arr ? [arr] : []);
  }
}
