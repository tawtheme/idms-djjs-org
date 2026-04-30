import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DataService } from '../../../data.service';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

interface VolunteerAttendanceRow {
    id: string;
    userImage: string;
    name: string;
    father: string;
    mother: string;
    spouse: string;
    phone: string;
    sewa: string;
    badgeId: string;
    donation: number;
    taskBranch: string;
    correspondingBranch: string;
    status: string;
    checkIn: string;
}

interface AttendanceSummary {
    totalVolunteers: number;
    presentVolunteers: number;
    absentVolunteers: number;
    onLeaveVolunteers: number;
}

type SortField =
    | 'id'
    | 'name'
    | 'father'
    | 'mother'
    | 'spouse'
    | 'phone'
    | 'sewa'
    | 'badgeId'
    | 'donation'
    | 'taskBranch'
    | 'correspondingBranch'
    | 'status'
    | 'checkIn';

@Component({
    standalone: true,
    selector: 'app-volunteers-attendance-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        DatepickerComponent,
        PagerComponent,
        EmptyStateComponent,
        IconComponent,
        ImagePreviewDirective
    ],
    templateUrl: './volunteers-attendance-report.component.html',
    styleUrls: ['./volunteers-attendance-report.component.scss']
})
export class VolunteersAttendanceReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;
    hasSearched = false;
    holdingBranchError: string | null = null;
    programsError: string | null = null;

    // Filters
    selectedProgramHoldingBranch: any[] = [];
    selectedTaskBranch: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedBranchSearchType: any[] = [];
    selectedPrograms: any[] = [];
    selectedSewas: any[] = [];
    selectedAttendanceStatus: any[] = [];
    fromDate: Date | null = null;
    toDate: Date | null = null;

    // Filter options
    branchOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [
        { id: 'task', label: 'Task Branch', value: 'task' },
        { id: 'corresponding', label: 'Corresponding Branch', value: 'corresponding' },
        { id: 'both', label: 'In Both', value: 'both' }
    ];
    programOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];
    attendanceStatusOptions: DropdownOption[] = [
        { id: 'present', label: 'Present', value: 'present' },
        { id: 'absent', label: 'Absent', value: 'absent' },
        { id: 'leave', label: 'On Leave', value: 'leave' }
    ];

    // Data
    rows: VolunteerAttendanceRow[] = [];

    summary: AttendanceSummary = {
        totalVolunteers: 0,
        presentVolunteers: 0,
        absentVolunteers: 0,
        onLeaveVolunteers: 0
    };

    // Sort
    sortField: SortField | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageSize = 100;
    currentPage = 1;
    totalItems = 0;

    ngOnInit(): void {
        this.loadBranches();
        this.loadSewaOptions();
    }

    private loadBranches(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            this.branchOptions = (Array.isArray(data) ? data : []).map((branch: any) => ({
                id: String(branch.id),
                label: branch.name || branch.label || branch.title || '',
                value: String(branch.id)
            }));
        });
    }

    private loadPrograms(branchId?: string): void {
        if (!branchId) {
            this.programOptions = [];
            return;
        }
        this.dataService.get<any>('v1/options/programs', { params: { branch_id: branchId } }).pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            this.programOptions = (Array.isArray(data) ? data : []).map((program: any) => ({
                id: String(program.id),
                label: program.name || program.label || program.title || '',
                value: String(program.id)
            }));
        });
    }

    onProgramHoldingBranchChange(value: any[]): void {
        this.selectedProgramHoldingBranch = value;
        this.holdingBranchError = null;
        this.selectedPrograms = [];
        const branchId = value?.length ? String(value[0]) : '';
        this.loadPrograms(branchId);
    }

    private loadSewaOptions(): void {
        this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } }).pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const sewas = response?.data?.sewas || response?.data || response || [];
            this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
                id: String(s.id),
                label: s.name || s.sewa_name || '',
                value: String(s.id)
            }));
        });
    }

    quickSearch = '';

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            user_branch_id: this.selectedProgramHoldingBranch?.length ? String(this.selectedProgramHoldingBranch[0]) : '',
            sewa_id: this.selectedSewas?.length ? String(this.selectedSewas[0]) : '',
            branch_type: this.selectedBranchSearchType?.length ? String(this.selectedBranchSearchType[0]) : '',
            program_id: this.selectedPrograms?.length ? String(this.selectedPrograms[0]) : '',
            from_date: this.fromDate ? this.formatApiDate(this.fromDate) : '',
            to_date: this.toDate ? this.formatApiDate(this.toDate) : '',
            search: this.quickSearch.trim(),
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: this.pageSize,
            page: this.currentPage
        };
        return { ...payload, ...extra };
    }

    private validateRequired(): boolean {
        let valid = true;
        if (!this.selectedProgramHoldingBranch?.length) {
            this.holdingBranchError = 'Program Holding Branch is required.';
            valid = false;
        } else {
            this.holdingBranchError = null;
        }
        if (!this.selectedPrograms?.length) {
            this.programsError = 'Programs is required.';
            valid = false;
        } else {
            this.programsError = null;
        }
        return valid;
    }

    loadReport(): void {
        if (!this.validateRequired()) {
            this.hasSearched = false;
            this.rows = [];
            this.totalItems = 0;
            return;
        }
        this.hasSearched = true;
        this.isLoading = true;
        this.error = null;

        this.dataService.post<any>('v1/reports/volunteers_attendance', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading volunteers attendance report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response?.data?.rows || response?.data || response?.results || response || [];
            const meta = response?.meta || response?.pagination || response?.data?.meta || null;
            const summary = response?.data?.summary || response?.summary || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: String(item.id ?? ''),
                userImage: item.user_image || item.image || item.profile_image || '',
                name: item.name || '',
                father: item.father_name || item.father || '',
                mother: item.mother_name || item.mother || '',
                spouse: item.spouse_name || item.spouse || '',
                phone: item.phone || item.mobile || item.mobile_number || '',
                sewa: item.sewa?.name || item.sewa_name || '',
                badgeId: item.badge_id || '',
                donation: Number(item.donation ?? item.donation_amount ?? 0),
                taskBranch: item.task_branch?.name || item.task_branch_name || item.branch?.name || '',
                correspondingBranch: item.corresponding_branch?.name || item.corresponding_branch_name || '',
                status: item.attendance_status || item.status || '',
                checkIn: this.formatDisplayDateTime(item.check_in || item.check_in_time)
            }));

            this.totalItems = meta ? (meta.total ?? meta.total_count ?? this.rows.length) : this.rows.length;

            this.summary = {
                totalVolunteers: Number(summary?.total_volunteers ?? this.totalItems),
                presentVolunteers: Number(summary?.present_volunteers ?? 0),
                absentVolunteers: Number(summary?.absent_volunteers ?? 0),
                onLeaveVolunteers: Number(summary?.on_leave_volunteers ?? summary?.leave_volunteers ?? 0)
            };

            this.isLoading = false;
        });
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedProgramHoldingBranch = [];
        this.selectedTaskBranch = [];
        this.selectedCorrespondingBranch = [];
        this.selectedBranchSearchType = [];
        this.selectedPrograms = [];
        this.selectedSewas = [];
        this.selectedAttendanceStatus = [];
        this.quickSearch = '';
        this.fromDate = null;
        this.toDate = null;
        this.sortField = '';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.hasSearched = false;
        this.rows = [];
        this.totalItems = 0;
        this.summary = { totalVolunteers: 0, presentVolunteers: 0, absentVolunteers: 0, onLeaveVolunteers: 0 };
        this.holdingBranchError = null;
        this.programsError = null;
    }

    sortBy(field: SortField): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.currentPage = 1;
        this.loadReport();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadReport();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadReport();
    }

    exportReport(choice: 'web' | 'email' = 'web'): void {
        if (!this.validateRequired()) return;
        this.isExporting = true;
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/volunteers_attendance', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError((err) => {
                console.error('Error exporting volunteers attendance report:', err);
                this.error = err.error?.message || err.message || 'Failed to export report.';
                this.isExporting = false;
                return of(null);
            })
        ).subscribe((response: any) => {
            this.isExporting = false;
            if (!response) return;
            const body: Blob = response.body;
            if (!body) return;

            if (body.type && body.type.includes('application/json')) {
                body.text().then(text => {
                    try {
                        const json = JSON.parse(text);
                        const url = json.data?.url || json.url || json.file_url;
                        if (url) window.open(url, '_blank');
                    } catch {}
                });
                return;
            }

            const blob = new Blob([body], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `volunteers-attendance-${this.formatApiDate(new Date())}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        });
    }

    private formatApiDate(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    private formatDisplayDateTime(value: string | null | undefined): string {
        if (!value) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i);
        if (m) {
            const [, dd, mm, yyyy, hh, min, ap] = m;
            return `${dd.padStart(2, '0')} ${months[parseInt(mm, 10) - 1]} ${yyyy} ${parseInt(hh, 10)}:${min} ${ap.toLowerCase()}`;
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        const hours24 = d.getHours();
        const ampm = hours24 >= 12 ? 'pm' : 'am';
        const hours12 = hours24 % 12 || 12;
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} ${hours12}:${min} ${ampm}`;
    }

    statusBadgeClass(status: string): string {
        const s = (status || '').toLowerCase();
        if (s === 'present') return 'badge--success';
        if (s === 'absent') return 'badge--danger';
        if (s === 'leave' || s === 'on leave') return 'badge--warning';
        return 'badge--neutral';
    }

    trackById(_index: number, row: VolunteerAttendanceRow): string {
        return row.id;
    }
}
