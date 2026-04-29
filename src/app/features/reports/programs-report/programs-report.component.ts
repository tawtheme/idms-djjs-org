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
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface ProgramReportRow {
    id: string;
    name: string;
    programCoordinator: string;
    initiative: string;
    project: string;
    branch: string;
    totalVolunteers: number;
    totalPresent: number;
    totalLeave: number;
    totalAbsent: number;
    startDateTime: string;
    endDateTime: string;
}

type SortField =
    | 'name'
    | 'programCoordinator'
    | 'initiative'
    | 'project'
    | 'branch'
    | 'totalVolunteers'
    | 'totalPresent'
    | 'totalLeave'
    | 'totalAbsent'
    | 'startDateTime'
    | 'endDateTime';

@Component({
    standalone: true,
    selector: 'app-programs-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        DatepickerComponent,
        PagerComponent,
        EmptyStateComponent,
        LoadingComponent,
        IconComponent
    ],
    templateUrl: './programs-report.component.html',
    styleUrls: ['./programs-report.component.scss']
})
export class ProgramsReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;
    branchError: string | null = null;
    hasSearched = false;

    // Filters
    selectedTaskBranch: any[] = [];
    taskBranchOptions: DropdownOption[] = [];
    nameSearch = '';
    quickSearch = '';
    fromDate: Date | null = null;
    toDate: Date | null = null;

    // Data
    allRows: ProgramReportRow[] = [];
    rows: ProgramReportRow[] = [];

    // Sort
    sortField: SortField | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageSize = 100;
    currentPage = 1;
    totalItems = 0;

    ngOnInit(): void {
        this.loadBranchOptions();
    }

    private loadBranchOptions(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response.data || response.results || []);
            this.taskBranchOptions = (Array.isArray(data) ? data : []).map((branch: any) => ({
                id: String(branch.id),
                label: branch.name || branch.label || branch.title || '',
                value: branch.id
            }));
        });
    }

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            from_date: this.fromDate ? this.formatApiDate(this.fromDate) : '',
            to_date: this.toDate ? this.formatApiDate(this.toDate) : '',
            name: this.nameSearch.trim(),
            search: this.quickSearch.trim(),
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: String(this.pageSize),
            page: String(this.currentPage)
        };
        return { ...payload, ...extra };
    }

    loadReport(): void {
        if (!this.selectedTaskBranch?.length) {
            this.branchError = 'Please select a Task Branch to view the report.';
            this.allRows = [];
            this.rows = [];
            this.totalItems = 0;
            this.hasSearched = false;
            return;
        }
        this.branchError = null;
        this.hasSearched = true;
        this.isLoading = true;
        this.error = null;

        const payload = this.buildPayload();

        this.dataService.post<any>('v1/reports/programs', payload).pipe(
            catchError((err) => {
                console.error('Error loading programs report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];
            const meta = response.meta || response.pagination || null;

            this.allRows = (Array.isArray(data) ? data : []).map((item: any) => {
                const totalVolunteers = Number(item.total_volunteers ?? 0);
                const totalPresent = Number(item.total_present ?? 0);
                const totalLeave = Number(item.total_leave ?? 0);
                const totalAbsent = item.total_absent != null
                    ? Number(item.total_absent)
                    : Math.max(totalVolunteers - totalPresent - totalLeave, 0);
                return {
                    id: String(item.id ?? ''),
                    name: item.program_name || item.name || '',
                    programCoordinator: item.program_coordinator || item.user?.name || '',
                    initiative: item.initiative_name || item.initiative?.name || '',
                    project: item.project_name || item.project?.name || '',
                    branch: item.branch_name || item.branch?.name || '',
                    totalVolunteers,
                    totalPresent,
                    totalLeave,
                    totalAbsent,
                    startDateTime: this.formatDisplayDateTime(item.start_date_time),
                    endDateTime: this.formatDisplayDateTime(item.end_date_time)
                };
            });

            if (meta) {
                this.totalItems = meta.total ?? meta.total_count ?? this.allRows.length;
            } else {
                this.totalItems = this.allRows.length;
            }

            this.applyFiltersAndSort();
            this.isLoading = false;
        });
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedTaskBranch = [];
        this.nameSearch = '';
        this.quickSearch = '';
        this.fromDate = null;
        this.toDate = null;
        this.sortField = '';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.branchError = null;
        this.hasSearched = false;
        this.allRows = [];
        this.rows = [];
        this.totalItems = 0;
    }

    private applyFiltersAndSort(): void {
        this.rows = [...this.allRows];
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

    getSortIcon(field: SortField): string {
        if (this.sortField !== field) return 'unfold_more';
        return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
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
        if (!this.selectedTaskBranch?.length) {
            this.branchError = 'Please select a Task Branch to export the report.';
            return;
        }
        this.branchError = null;
        this.isExporting = true;
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/programs', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError((err) => {
                console.error('Error exporting programs report:', err);
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
            a.download = `programs-report-${this.formatApiDate(new Date())}.xlsx`;
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

    trackById(_index: number, row: ProgramReportRow): string {
        return row.id;
    }
}
