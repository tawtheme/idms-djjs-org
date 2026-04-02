import { Component, inject, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ViewAttendanceModalComponent } from '../view-attendance-modal/view-attendance-modal.component';
import { DataService } from '../../../../data.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface AttendanceRecord {
  id: string;
  name: string;
  image?: string;
  sewa: string;
  sewaId: string;
  badgeNo: string;
  donation: number | string;
  status: string;
  checkIn: string;
  remarks: string;
}

interface EditingCell {
  recordId: string;
  field: 'donation' | 'status' | 'remarks';
  value: string;
}

interface AttendanceSummary {
  programName: string;
  programDate: string;
  totalVolunteers: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  totalLeaves: number;
  totalLeft: number;
}

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent,
    EmptyStateComponent,
    LoadingComponent,
    IconComponent,
    ModalComponent,
    ConfirmationDialogComponent,
    ViewAttendanceModalComponent
  ],
  templateUrl: './attendance-detail.component.html',
  styleUrls: ['./attendance-detail.component.scss']
})
export class AttendanceDetailComponent implements OnInit {
  private dataService = inject(DataService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs/programs-list' },
    { label: 'Attendances', route: '/programs/attendances' },
    { label: 'Attendance Detail' }
  ];

  programId = '';
  attendanceMode: 'checkin' | 'checkout' = 'checkin';

  summary: AttendanceSummary = {
    programName: '',
    programDate: '',
    totalVolunteers: 0,
    totalCheckIns: 0,
    totalCheckOuts: 0,
    totalLeaves: 0,
    totalLeft: 0
  };

  // Modal
  showAttendanceModal = false;
  showViewDetail = false;
  viewRecord: AttendanceRecord | null = null;
  showDeleteConfirm = false;
  deleteTarget: AttendanceRecord | null = null;

  // Inline editing
  editingCell: EditingCell | null = null;
  isSaving = false;
  private editStarted = false;

  // Enter ID
  enterId = '';

  // Filter
  filterTerm = '';

  // Table data
  allRecords: AttendanceRecord[] = [];
  records: AttendanceRecord[] = [];

  // Loading & error
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    this.attendanceMode = (this.route.snapshot.queryParamMap.get('mode') as 'checkin' | 'checkout') || 'checkin';
    this.loadSummary();
    this.loadAttendanceData();
  }

  loadSummary(): void {
    this.dataService.get<any>(`v1/programs/${this.programId}/volunteers/attendance-summary`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const items = response.data || [];
      let totalVolunteers = 0;
      let totalCheckIns = 0;
      let totalCheckOuts = 0;
      let totalLeaves = 0;
      let totalLeft = 0;

      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          totalVolunteers += item.total_volunteers || 0;
          totalCheckIns += item.total_check_in || 0;
          totalCheckOuts += item.total_check_out || 0;
          totalLeaves += item.total_leaves || 0;
          totalLeft += item.total_left || 0;
        });
      }

      this.summary = {
        ...this.summary,
        totalVolunteers,
        totalCheckIns,
        totalCheckOuts,
        totalLeaves,
        totalLeft
      };
    });
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    this.error = null;

    let params = new HttpParams()
      .set('program_id', this.programId)
      .set('mode', this.attendanceMode)
      .set('per_page', this.pageSize.toString())
      .set('page', this.currentPage.toString());

    if (this.filterTerm.trim()) {
      params = params.set('search', this.filterTerm.trim());
    }

    this.dataService.get<any>(`v1/attendances/checkedin/volunteers/${this.programId}`, { params }).pipe(
      catchError((err) => {
        this.error = err.error?.message || 'Failed to load attendance data.';
        return of({ data: [] });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      const records = response.data?.records || response.records || response.data || [];
      this.allRecords = (Array.isArray(records) ? records : []).map((item: any) => ({
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

      this.records = [...this.allRecords];
      this.totalItems = response.total || response.meta?.total || this.allRecords.length;
    });
  }

  onEnterId(): void {
    if (!this.enterId.trim()) return;

    this.isSubmitting = true;

    const params = new HttpParams()
      .set('program_id', this.programId)
      .set('mode', this.attendanceMode)
      .set('search_column', this.enterId.trim());

    this.dataService.get<any>(`v1/attendances/checkedin/volunteers/${this.programId}`, { params }).pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe((response) => {
      if (response) {
        this.enterId = '';
        this.loadAttendanceData();
      }
    });
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadAttendanceData();
  }

  get pagedRecords(): AttendanceRecord[] {
    return this.records;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAttendanceData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAttendanceData();
  }

  trackById(_: number, record: AttendanceRecord): string {
    return record.id;
  }

  getStatusClass(status: any): string {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'leave': return 'status-leave';
      default: return '';
    }
  }

  getStatusLabel(status: any): string {
    const s = String(status);
    switch (s) {
      case '0': return 'Leave';
      case '1': return 'Checkin';
      default: return s;
    }
  }

  // ── Inline Editing ──
  startEditing(record: AttendanceRecord, field: 'donation' | 'status' | 'remarks'): void {
    if (this.isSaving) return;
    this.editingCell = {
      recordId: record.id,
      field,
      value: String(record[field] || '')
    };
    this.editStarted = true;
    setTimeout(() => {
      const el = this.elementRef.nativeElement.querySelector('.inline-input, .inline-select') as HTMLElement;
      el?.focus();
      this.editStarted = false;
    }, 100);
  }

  isEditing(recordId: string, field: string): boolean {
    return this.editingCell?.recordId === recordId && this.editingCell?.field === field;
  }

  cancelEditing(): void {
    this.editingCell = null;
  }

  saveEditing(record: AttendanceRecord): void {
    if (!this.editingCell || this.isSaving || this.editStarted) return;

    const { field, value } = this.editingCell;
    const originalValue = String(record[field] || '');

    if (value === originalValue) {
      this.editingCell = null;
      return;
    }

    this.isSaving = true;
    let endpoint = '';
    let body: any = {
      unique_id: record.id,
      program_id: this.programId,
      sewa_id: record.sewaId
    };

    if (field === 'donation') {
      endpoint = 'v1/attendances/update/donation';
      body.amount = Number(value) || 0;
    } else if (field === 'status') {
      endpoint = 'v1/attendances/update/status';
      body.status = value;
    } else if (field === 'remarks') {
      endpoint = 'v1/attendances/update/remarks';
      body.remarks = value;
    }

    this.dataService.put<any>(endpoint, body).pipe(
      catchError(() => {
        this.editingCell = null;
        return of(null);
      }),
      finalize(() => this.isSaving = false)
    ).subscribe((response) => {
      if (response) {
        (record as any)[field] = field === 'donation' ? (Number(value) || 0) : value;
        this.loadSummary();
        this.loadAttendanceData();
      }
      this.editingCell = null;
    });
  }

  onEditKeydown(event: KeyboardEvent, record: AttendanceRecord): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveEditing(record);
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  viewVolunteer(record: AttendanceRecord): void {
    this.viewRecord = record;
    this.showViewDetail = true;
  }

  closeViewDetail(): void {
    this.showViewDetail = false;
    this.viewRecord = null;
  }

  confirmDelete(record: AttendanceRecord): void {
    this.deleteTarget = record;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.deleteTarget) return;
    const body = {
      unique_id: this.deleteTarget.id,
      program_id: this.programId
    };
    this.showDeleteConfirm = false;
    this.http.delete<any>(`${environment.apiUrl}/v1/attendances/revert`, { body }).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.deleteTarget = null;
      this.loadSummary();
      this.loadAttendanceData();
    });
  }

  onDeleteCancel(): void {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  openAttendanceModal(): void {
    this.showAttendanceModal = true;
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
  }
}
