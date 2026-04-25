import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { DataService } from '../../../../data.service';

export interface SewaTrackRow {
  sewaName: string;
  badgeId: number | string;
  allocatedDate: string;
  unallocatedDate: string;
  reason: string;
}

export interface SewaGroup {
  sewaName: string;
  rows: SewaTrackRow[];
}

export interface BranchGroup {
  branchName: string;
  sewaGroups: SewaGroup[];
}

export interface ProgramJourneyRow {
  programName: string;
  sewaName: string;
  status: string;
  checkIn: string;
  checkOut: string;
  startDate: string;
  endDate: string;
}

export interface DonationRow {
  programName: string;
  amount: string | number;
  date: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LoadingComponent],
  selector: 'app-sewa-tracking-modal',
  templateUrl: './sewa-tracking-modal.component.html',
  styleUrls: ['./sewa-tracking-modal.component.scss']
})
export class SewaTrackingModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() userId: string | null = null;
  @Input() branchName: string = '';
  @Output() close = new EventEmitter<void>();

  private dataService = inject(DataService);

  branches: BranchGroup[] = [];
  programRows: ProgramJourneyRow[] = [];
  donationRows: DonationRow[] = [];
  activeTab: 'sewa' | 'program' | 'donation' = 'sewa';
  isLoading = false;
  isLoadingProgram = false;
  isLoadingDonation = false;
  error: string | null = null;
  programError: string | null = null;
  donationError: string | null = null;
  searchTerm = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen'] || changes['userId']) && this.isOpen && this.userId) {
      this.activeTab = 'sewa';
      this.loadSewaTracking();
      this.programRows = [];
      this.programError = null;
      this.donationRows = [];
      this.donationError = null;
    }
  }

  setTab(tab: 'sewa' | 'program' | 'donation'): void {
    this.activeTab = tab;
    if (tab === 'program' && this.userId && this.programRows.length === 0 && !this.isLoadingProgram && !this.programError) {
      this.loadProgramJourney();
    }
    if (tab === 'donation' && this.userId && this.donationRows.length === 0 && !this.isLoadingDonation && !this.donationError) {
      this.loadDonations();
    }
  }

  loadDonations(): void {
    if (!this.userId) return;
    this.isLoadingDonation = true;
    this.donationError = null;

    this.dataService.get<any>(`v1/users/${this.userId}/donation/view`).pipe(
      catchError((err) => {
        console.error('Error loading donations:', err);
        this.donationError = err?.error?.message || err?.message || 'Failed to load donations.';
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoadingDonation = false;
      if (!response) return;
      const list = response?.data?.user?.user_donations || [];
      this.donationRows = (Array.isArray(list) ? list : []).map((d: any) => ({
        programName: d?.program?.name || d?.program_name || '',
        amount: d?.amount ?? d?.donation_amount ?? '',
        date: d?.donation_date || d?.created_at || d?.date || ''
      }));
    });
  }

  loadProgramJourney(): void {
    if (!this.userId) return;
    this.isLoadingProgram = true;
    this.programError = null;

    this.dataService.get<any>(`v1/users/${this.userId}/program_journey/view`).pipe(
      catchError((err) => {
        console.error('Error loading program journey:', err);
        this.programError = err?.error?.message || err?.message || 'Failed to load program journey.';
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoadingProgram = false;
      if (!response) return;
      const list = response?.data?.user?.user_program_sewa_volunteers || [];
      this.programRows = (Array.isArray(list) ? list : []).map((p: any) => {
        const program = p?.program_sewa?.program || {};
        const sewa = p?.program_sewa?.sewa || {};
        const attendance = (program?.program_attendances || [])[0] || {};
        return {
          programName: program?.name || '',
          sewaName: sewa?.name || '',
          status: attendance?.status ? String(attendance.status) : '',
          checkIn: attendance?.check_in || '',
          checkOut: attendance?.check_out || '',
          startDate: program?.start_date_time || '',
          endDate: program?.end_date_time || ''
        };
      });
    });
  }

  loadSewaTracking(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.error = null;
    this.branches = [];

    this.dataService.get<any>(`v1/users/${this.userId}/sewa_tracking/view`).pipe(
      catchError((err) => {
        console.error('Error loading sewa tracking:', err);
        this.error = err?.error?.message || err?.message || 'Failed to load sewa tracking.';
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoading = false;
      if (!response) return;
      const data = response?.data?.refineUserSewaDatas || response?.refineUserSewaDatas || {};
      this.branches = Object.values(data).map((branch: any) => ({
        branchName: branch?.name || '',
        sewaGroups: Object.values(branch?.sewaDatas || {}).map((sewa: any) => ({
          sewaName: sewa?.sewaName || '',
          rows: (Array.isArray(sewa?.sewaTracks) ? sewa.sewaTracks : []).map((t: any) => ({
            sewaName: t?.sewa?.name || sewa?.sewaName || '',
            badgeId: t?.badge_id ?? '',
            allocatedDate: t?.created_at || '',
            unallocatedDate: t?.status === 0 ? (t?.updated_at || '') : '',
            reason: t?.reason || ''
          }))
        }))
      }));
    });
  }

  filteredRows(rows: SewaTrackRow[]): SewaTrackRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      r.sewaName.toLowerCase().includes(term) ||
      String(r.badgeId).toLowerCase().includes(term)
    );
  }

  onClose(): void {
    this.close.emit();
  }
}
