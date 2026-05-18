import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DataService } from '../../../data.service';
import { applyTableSort } from '../../../shared/utils/table-sort';
import { HlmSelectComponent, DropdownOption } from '../../../shared/ui';
import { HlmDatepickerComponent } from '../../../shared/ui';
import { HlmPaginationComponent } from '../../../shared/ui';
import { HlmEmptyStateComponent } from '../../../shared/ui';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';
import { HlmSheetComponent } from '../../../shared/ui';
import { HlmButtonDirective } from '../../../shared/ui';

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
        HlmSelectComponent,
        HlmDatepickerComponent,
        HlmPaginationComponent,
        HlmEmptyStateComponent,
        IconComponent,
        ImagePreviewDirective,
        HlmSheetComponent,
        HlmButtonDirective
    ],
    templateUrl: './volunteers-attendance-report.component.html',
    styleUrls: ['./volunteers-attendance-report.component.scss']
})
export class VolunteersAttendanceReportComponent implements OnInit {
    private dataService = inject(DataService);

    isExporting = false;
    error: string | null = null;
    holdingBranchError: string | null = null;
    programsError: string | null = null;

    selectedProgramHoldingBranch: any[] = [];
    selectedTaskBranch: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedBranchSearchType: any[] = [];
    selectedPrograms: any[] = [];
    selectedSewas: any[] = [];
    selectedAttendanceStatus: any[] = [];
    fromDate: Date | null = null;
    toDate: Date | null = null;

    branchOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [
        { id: 'task', label: 'Task Branch', value: 'task' },
        { id: 'corresponding', label: 'Corresponding Branch', value: 'corresponding' },
        { id: 'both', label: 'In Both', value: 'both' }
    ];
    programOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];
    attendanceStatusOptions: DropdownOption[] = [
        { id: '1', label: 'Present', value: '1' },
        { id: '2', label: 'Absent', value: '2' },
        { id: '0', label: 'On Leave', value: '0' }
    ];

    rows: VolunteerAttendanceRow[] = [];
    summary: AttendanceSummary = {
        totalVolunteers: 0,
        presentVolunteers: 0,
        absentVolunteers: 0,
        onLeaveVolunteers: 0
    };

    sortField: SortField | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageSize = 100;
    currentPage = 1;
    totalItems = 0;

    showAdvancedFilters = false;

    ngOnInit(): void {
        this.loadBranches();
    }

    activeFilterCount(): number {
        return this.activeFilterChips().length;
    }

    /** Chips for filters that live in the side panel only — primary-row inputs
     *  are visible directly above, so duplicating them as chips is noise. */
    activeFilterChips(): Array<{ key: string; label: string; value: string }> {
        const chips: Array<{ key: string; label: string; value: string }> = [];
        const labelOf = (opts: DropdownOption[], value: any): string =>
            opts.find(o => String(o.value) === String(value))?.label || String(value);
        const formatDate = (d: Date): string =>
            `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        for (const v of this.selectedSewas) {
            chips.push({ key: `sewa:${v}`, label: 'Sewa', value: labelOf(this.sewaOptions, v) });
        }
        if (this.selectedAttendanceStatus.length > 0) {
            chips.push({ key: 'attendanceStatus', label: 'Attendance Status', value: labelOf(this.attendanceStatusOptions, this.selectedAttendanceStatus[0]) });
        }
        if (this.fromDate) {
            chips.push({ key: 'fromDate', label: 'From', value: formatDate(this.fromDate) });
        }
        if (this.toDate) {
            chips.push({ key: 'toDate', label: 'To', value: formatDate(this.toDate) });
        }
        return chips;
    }

    trackChipByKey(_: number, chip: { key: string }): string {
        return chip.key;
    }

    reloadPage(): void {
        window.location.reload();
    }

    removeFilterChip(key: string): void {
        if (key.startsWith('sewa:')) {
            const value = key.slice('sewa:'.length);
            this.selectedSewas = this.selectedSewas.filter(v => String(v) !== value);
        } else if (key === 'attendanceStatus') {
            this.selectedAttendanceStatus = [];
        } else if (key === 'fromDate') {
            this.fromDate = null;
        } else if (key === 'toDate') {
            this.toDate = null;
        }
        this.applyFilter();
    }

    onProgramHoldingBranchChange(value: any[]): void {
        this.selectedProgramHoldingBranch = value;
        this.holdingBranchError = null;
        this.selectedPrograms = [];
        this.selectedSewas = [];
        this.sewaOptions = [];
        this.loadPrograms(value?.[0] ? String(value[0]) : '');
    }

    onProgramsChange(value: any[]): void {
        this.selectedPrograms = value;
        this.programsError = null;
        this.selectedSewas = [];
        this.loadSewaOptions(value?.[0] ? String(value[0]) : '');
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    sortBy(field: SortField): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.rows = applyTableSort(this.rows, this.sortField, this.sortDirection);
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

    loadReport(): void {
        if (!this.validateRequired()) {
            this.rows = [];
            this.totalItems = 0;
            return;
        }
        this.error = null;
        const payload = this.buildPayload({ is_export: '0', exportChoice: 'web' });

        this.dataService.post<any>('v1/reports/volunteers_attendance', payload).pipe(
            catchError((err) => {
                console.error('Error loading volunteers attendance report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                return of({ data: {} });
            })
        ).subscribe((response) => {
            const data = response?.data ?? response ?? {};
            const records = data?.records || data?.rows || data?.data || (Array.isArray(data) ? data : []);
            const meta = response?.meta || response?.pagination || data?.meta || null;

            this.rows = (Array.isArray(records) ? records : []).map((item: any) => ({
                id: String(item.user_unique_id ?? item.unique_id ?? item.uniqueId ?? item.user?.unique_id ?? item.id ?? ''),
                userImage: item.full_path || item.image_url || item.user_image?.full_path || item.user?.image_url || item.image || item.profile_image || item.user?.image || '',
                name: item.user_name || item.name || item.volunteer_name || item.user?.name || '',
                father: item.father_name || item.father || item.user?.father_name || '',
                mother: item.mother_name || item.mother || item.user?.mother_name || '',
                spouse: item.spouse_name || item.spouse || item.user?.spouse_name || '',
                phone: item.phone || item.mobile || item.mobile_number || item.user?.mobile || '',
                sewa: item.sewa?.name || item.sewa_name || item.sewa || item.program_sewa?.name || item.program_sewa?.sewa?.name || '',
                badgeId: String(item.badge_id ?? item.badge ?? item.badge_no ?? item.badge_number ?? item.user?.badge_id ?? ''),
                donation: Number(item.donation ?? item.donation_amount ?? item.amount ?? 0),
                taskBranch: item.working_branch || item.task_branch?.name || item.task_branch_name || item.taskBranch || item.user?.task_branch?.name || item.branch?.name || '',
                correspondingBranch: item.home_branch || item.corresponding_branch?.name || item.corresponding_branch_name || item.correspondingBranch || item.user?.corresponding_branch?.name || '',
                status: this.resolveStatusLabel(item.attendance_status ?? item.status),
                checkIn: this.formatDisplayDateTime(item.check_in || item.checked_in || item.check_in_time || item.checkin_time)
            }));

            this.totalItems = meta
                ? (meta.total ?? meta.total_count ?? meta.itemsCount ?? this.rows.length)
                : (response?.total ?? data?.total ?? this.rows.length);
        });

        this.loadAttendanceSummary();
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
            const body: Blob | undefined = response?.body;
            if (!body) return;

            if (body.type?.includes('application/json')) {
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

    private loadPrograms(branchId: string): void {
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

    private loadSewaOptions(programId: string): void {
        if (!programId) {
            this.sewaOptions = [];
            return;
        }
        this.dataService.get<any>('v1/options/programSewas', { params: { program_id: programId } }).pipe(
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

    private loadAttendanceSummary(): void {
        const programId = this.selectedPrograms?.[0] ? String(this.selectedPrograms[0]) : '';
        if (!programId) return;

        const params = new HttpParams().set('mode', 'report');
        this.dataService.get<any>(`v1/attendances/${programId}`, { params }).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const data = response?.data ?? response ?? {};
            this.summary = {
                totalVolunteers: Number(data?.total_volunteers ?? data?.summary?.total_volunteers ?? 0),
                presentVolunteers: Number(data?.total_check_in ?? data?.summary?.present_volunteers ?? 0),
                absentVolunteers: Number(data?.total_absent ?? data?.summary?.absent_volunteers ?? 0),
                onLeaveVolunteers: Number(data?.total_leaves ?? data?.summary?.on_leave_volunteers ?? data?.summary?.leave_volunteers ?? 0)
            };
        });
    }

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const first = (arr: any[]) => (arr?.[0] ? String(arr[0]) : '');
        return {
            branch_id: first(this.selectedProgramHoldingBranch),
            user_branch_id: first(this.selectedTaskBranch),
            home_branch: first(this.selectedCorrespondingBranch),
            sewa_id: first(this.selectedSewas),
            branch_type: first(this.selectedBranchSearchType),
            program_id: first(this.selectedPrograms),
            attendance_status: first(this.selectedAttendanceStatus),
            from_date: this.fromDate ? this.formatApiDate(this.fromDate) : '',
            to_date: this.toDate ? this.formatApiDate(this.toDate) : '',
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: this.pageSize,
            page: this.currentPage,
            ...extra
        };
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

    private resolveStatusLabel(status: any): string {
        const s = String(status ?? '').trim().toLowerCase();
        if (!s) return '';
        if (s === '1' || s === 'present' || s === 'checkin' || s === 'check_in') return 'Present';
        if (s === '0' || s === 'leave' || s === 'on leave') return 'Leave';
        if (s === '2' || s === 'checkout' || s === 'check_out' || s === 'return') return 'CheckOut';
        if (s === '3' || s === 'absent' || s === 'not_attended') return 'Absent';
        return String(status);
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
}
