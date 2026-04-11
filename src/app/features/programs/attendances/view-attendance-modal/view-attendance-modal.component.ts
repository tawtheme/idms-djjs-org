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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.programId) {
      this.loadAggregatedData();
      this.loadSewaTypes();
      this.loadVolunteerDetails();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  switchTab(tab: 'aggregated' | 'details'): void {
    this.activeTab = tab;
  }

  // ── Aggregated Data ──
  loadAggregatedData(): void {
    this.isLoadingAggregated = true;
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
    });
  }

  loadSewaTypes(): void {
    this.dataService.get<any>(`v1/programs/${this.programId}/sewas`).pipe(
      catchError(() => of({ data: { sewas: [] } }))
    ).subscribe((response) => {
      const sewas = response.data?.sewas || response.data || [];
      this.sewaTypeOptions = (Array.isArray(sewas) ? sewas : []).map((sewa: any) => ({
        id: String(sewa.id),
        label: sewa.name,
        value: sewa.id
      }));
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
        badgeNo: item.badge_no || item.badge_number || '',
        donation: item.donation || item.donation_amount || 0,
        status: item.status || '',
        checkIn: item.check_in || item.checkin_time || '',
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

  getStatusClass(status: any): string {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'leave': return 'status-leave';
      case 'left': return 'status-left';
      default: return '';
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
