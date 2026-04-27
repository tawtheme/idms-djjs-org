import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { PagerComponent } from '../../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { DataService } from '../../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface AggregatedRow {
  sewaName: string;
  totalVolunteers: number;
  present: number;
  return: number;
  leaves: number;
  left: number;
  absent: number;
}

interface VolunteerRecord {
  id: string;
  name: string;
  image: string;
  sewa: string;
  sewaId: string;
  badgeNo: string;
  donation: number | string;
  status: string;
  checkIn: string;
  checkOut: string;
  remarks: string;
}

@Component({
  selector: 'app-view-attendance-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    IconComponent,
    DropdownComponent,
    PagerComponent,
    EmptyStateComponent,
    LoadingComponent
  ],
  templateUrl: './view-attendance-modal.component.html',
  styleUrls: ['./view-attendance-modal.component.scss']
})
export class ViewAttendanceModalComponent implements OnChanges {
  private dataService = inject(DataService);

  @Input() isOpen = false;
  @Input() programId = '';
  @Input() programName = '';
  @Output() closeModal = new EventEmitter<void>();

  // Tabs
  activeTab: 'aggregated' | 'details' = 'aggregated';

  // Aggregated data
  aggregatedRows: AggregatedRow[] = [];
  isLoadingAggregated = false;

  // Volunteer details
  volunteerRecords: VolunteerRecord[] = [];
  isLoadingDetails = false;
  filterTerm = '';
  selectedListViewType: any[] = [];
  selectedSewaType: any[] = [];

  listViewOptions: DropdownOption[] = [
    { id: 'none', label: 'None', value: 'none' },
    { id: 'left', label: 'Left', value: 'left' },
    { id: 'checkIn', label: 'Present', value: 'checkIn' },
    { id: 'checkout', label: 'Return', value: 'checkout' },
    { id: 'leave', label: 'Leave', value: 'leave' },
    { id: 'not_attended', label: 'Absent', value: 'not_attended' }
  ];

  sewaTypeOptions: DropdownOption[] = [];

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Track which tabs have already loaded — avoids re-fetching when user toggles back
  private aggregatedLoaded = false;
  private detailsLoaded = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.programId) {
      this.aggregatedLoaded = false;
      this.detailsLoaded = false;
      this.loadActiveTab();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  switchTab(tab: 'aggregated' | 'details'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadActiveTab();
  }

  private loadActiveTab(): void {
    if (this.activeTab === 'aggregated') {
      if (this.aggregatedLoaded) return;
      this.loadAggregatedData();
    } else {
      if (this.detailsLoaded) return;
      this.loadVolunteerDetails();
    }
  }

  // ── Aggregated Data ──
  loadAggregatedData(): void {
    this.isLoadingAggregated = true;
    this.aggregatedLoaded = true;
    this.dataService.get<any>(`v1/programs/${this.programId}/volunteers/attendance-summary`).pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.isLoadingAggregated = false)
    ).subscribe((response) => {
      const data = response.data || {};
      const items = data.items || [];
      this.aggregatedRows = (Array.isArray(items) ? items : []).map((item: any) => ({
        sewaName: item.sewa_name || '',
        totalVolunteers: item.total_volunteers || 0,
        present: item.total_check_in || 0,
        return: item.total_check_out || 0,
        leaves: item.total_leaves || 0,
        left: item.total_left || 0,
        absent: item.total_absent || 0
      }));
      this.sewaTypeOptions = this.buildSewaOptions(data.sewa_Ids ?? data.sewa_ids, items);
    });
  }

  /**
   * Builds the sewa-filter dropdown from the attendance-summary response so we
   * don't need a separate `/programs/{id}/sewas` round-trip. Prefers the
   * explicit `sewa_Ids` array when the API returns it; otherwise falls back to
   * deduping `{sewa_id, sewa_name}` pairs out of the aggregated items.
   */
  private buildSewaOptions(sewaIds: any, items: any[]): { id: string; label: string; value: any }[] {
    if (Array.isArray(sewaIds) && sewaIds.length) {
      return sewaIds
        .map((s: any) => {
          const id = s?.sewa?.id ?? s?.sewa_id ?? s?.id ?? s?.value ?? s;
          const name = s?.sewa?.name ?? s?.name ?? s?.sewa_name ?? s?.label ?? '';
          return { id: String(id ?? ''), label: String(name), value: id };
        })
        .filter(o => o.id);
    }
    const seen = new Set<string>();
    return (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        id: String(item.sewa_id ?? ''),
        label: item.sewa_name || '',
        value: item.sewa_id
      }))
      .filter(o => {
        if (!o.id || seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
  }

  downloadAggregatedCSV(): void {
    const headers = ['Sewa Name', 'Total Volunteers', 'Present', 'Return', 'Leaves', 'Left', 'Absent'];
    const rows = this.aggregatedRows.map(r => [
      r.sewaName, r.totalVolunteers, r.present, r.return, r.leaves, r.left, r.absent
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csv, 'aggregated-attendance-report.csv');
  }

  // ── Volunteer Details ──
  loadVolunteerDetails(): void {
    this.isLoadingDetails = true;
    this.detailsLoaded = true;

    const body: any = {
      program_id: this.programId,
      per_page: this.pageSize,
      page: this.currentPage
    };

    if (this.filterTerm.trim()) {
      body.search = this.filterTerm.trim();
    }

    const listView = this.selectedListViewType.length > 0 ? this.selectedListViewType[0] : null;
    if (listView && listView !== 'none') {
      body.type = listView;
    }

    if (this.selectedSewaType.length > 0) {
      body.sewaIds = this.selectedSewaType.map(v => String(v));
    }

    this.dataService.post<any>(`v1/programs/${this.programId}/volunteers/attendance-details`, body).pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.isLoadingDetails = false)
    ).subscribe((response) => {
      const records = response.data?.records || response.records || response.data || [];
      this.volunteerRecords = (Array.isArray(records) ? records : []).map((item: any) => ({
        id: item.unique_id || item.id || '',
        name: item.name || item.volunteer_name || '',
        image: item.image || item.user_image || '',
        sewa: item.sewa || item.sewa_name || '',
        sewaId: item.sewa_id || '',
        badgeNo: String(item.badge ?? item.badge_id ?? item.badge_no ?? item.badge_number ?? ''),
        donation: item.donation || item.donation_amount || 0,
        status: item.status ?? '',
        checkIn: item.checked_in || item.check_in || item.checkin_time || '',
        checkOut: item.checked_out || item.check_out || item.checkout_time || '',
        remarks: item.remarks || ''
      }));
      this.totalItems = response.total || response.meta?.total || response.meta?.itemsCount || this.volunteerRecords.length;
    });
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadVolunteerDetails();
  }

  onListViewChange(): void {
    this.currentPage = 1;
    this.loadVolunteerDetails();
  }

  onSewaTypeChange(): void {
    this.currentPage = 1;
    this.loadVolunteerDetails();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVolunteerDetails();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadVolunteerDetails();
  }

  exportDetailsCSV(): void {
    const headers = ['ID', 'Name', 'Sewa', 'Badge No', 'Donation', 'Status', 'CheckIn', 'Remarks'];
    const rows = this.volunteerRecords.map(r => [
      r.id, r.name, r.sewa, r.badgeNo, r.donation, r.status, r.checkIn, r.remarks
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    this.downloadFile(csv, 'volunteer-attendance-details.csv');
  }

  printDetails(): void {
    window.print();
  }

  getStatusClass(record: VolunteerRecord | any): string {
    const key = this.resolveStatusKey(record);
    switch (key) {
      case 'left': return 'status-left';
      case 'leave': return 'status-leave';
      case 'checkout': return 'status-checkout';
      case 'checkin': return 'status-present';
      case 'absent': return 'status-absent';
      default: return '';
    }
  }

  getStatusLabel(record: VolunteerRecord | any): string {
    const key = this.resolveStatusKey(record);
    switch (key) {
      case 'left': return 'Left';
      case 'leave': return 'Leave';
      case 'checkout': return 'CheckOut';
      case 'checkin': return 'Present';
      case 'absent': return 'Absent';
      default: return '';
    }
  }

  hasStatus(record: VolunteerRecord | any): boolean {
    return record?.status !== '' && record?.status !== null && record?.status !== undefined;
  }

  private resolveStatusKey(record: VolunteerRecord | any): 'left' | 'leave' | 'checkout' | 'checkin' | 'absent' | '' {
    const status = String(record?.status ?? '').trim().toLowerCase();
    const hasCheckIn = !!record?.checkIn;
    const hasCheckOut = !!record?.checkOut;

    switch (status) {
      case '0':
      case 'leave':
        return 'leave';
      case '2':
      case 'checkout':
      case 'check_out':
      case 'check out':
      case 'return':
        return 'checkout';
      case '3':
      case 'absent':
      case 'not_attended':
        return 'absent';
      case 'left':
        return 'left';
      case '1':
      case 'present':
      case 'checkin':
      case 'check_in':
      case 'check in':
        if (hasCheckIn && hasCheckOut) return 'checkout';
        return 'checkin';
      default:
        return '';
    }
  }

  trackById(_: number, record: VolunteerRecord): string {
    return record.id;
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
