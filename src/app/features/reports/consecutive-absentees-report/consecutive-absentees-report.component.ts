import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DataService } from '../../../data.service';
import { applyTableSort } from '../../../shared/utils/table-sort';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

interface AbsenteeRow {
    id: string;
    image: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
}

type SortField = 'id' | 'name' | 'email' | 'phone' | 'createdAt';

@Component({
    standalone: true,
    selector: 'app-consecutive-absentees-report',
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
    templateUrl: './consecutive-absentees-report.component.html',
    styleUrls: ['./consecutive-absentees-report.component.scss']
})
export class ConsecutiveAbsenteesReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;
    programHoldingBranchError: string | null = null;
    consecutiveLeavesError: string | null = null;

    // Filter values
    selectedProgramHoldingBranch: any[] = [];
    selectedTaskBranch: any[] = [];
    selectedBranchSearchType: any[] = [];
    selectedSewa: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    fromDate: Date | null = null;
    toDate: Date | null = null;
    consecutiveLeaves: string = '';

    // Filter options
    branchOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [
        { id: 'both', label: 'In Both', value: 'both' }
    ];
    sewaOptions: DropdownOption[] = [];

    // Data
    rows: AbsenteeRow[] = [];

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

    private validateRequired(): boolean {
        let valid = true;
        this.programHoldingBranchError = null;
        this.consecutiveLeavesError = null;

        if (!this.selectedProgramHoldingBranch?.length) {
            this.programHoldingBranchError = 'Program Holding Branch is required';
            valid = false;
        }
        if (!this.consecutiveLeaves || !this.consecutiveLeaves.toString().trim()) {
            this.consecutiveLeavesError = 'No. of Consecutive Leaves is required';
            valid = false;
        }
        return valid;
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
            branch_id: this.selectedProgramHoldingBranch?.length ? String(this.selectedProgramHoldingBranch[0]) : '',
            user_branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            sewa_id: this.selectedSewa?.length ? String(this.selectedSewa[0]) : '',
            branch_type: this.selectedBranchSearchType?.length ? String(this.selectedBranchSearchType[0]) : '',
            from_date: this.fromDate ? this.formatApiDate(this.fromDate) : '',
            to_date: this.toDate ? this.formatApiDate(this.toDate) : '',
            number_of_consecutive_leaves: String(this.consecutiveLeaves ?? '').trim(),
            search: this.quickSearch.trim(),
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: this.pageSize,
            page: this.currentPage,
            is_export: '0',
            exportChoice: 'web'
        };
        return { ...payload, ...extra };
    }

    loadReport(): void {
        if (!this.validateRequired()) return;

        this.isLoading = true;
        this.error = null;

        this.dataService.post<any>('v1/reports/volunteer_not_attending_sewa', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading consecutive absentees report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];
            const meta = response.meta || response.pagination || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: String(item.unique_id ?? item.id ?? ''),
                image: item.user_image?.full_path || item.user_image?.image || item.image || item.profile_image || '',
                name: item.name || '',
                email: item.email || '',
                phone: item.phone || item.mobile || '',
                createdAt: this.formatDisplayDateTime(item.created_at)
            }));

            this.totalItems = meta ? (meta.total ?? meta.total_count ?? this.rows.length) : this.rows.length;
            this.isLoading = false;
        });
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
        if (!this.validateRequired()) return;
        this.isExporting = true;
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/volunteer_not_attending_sewa', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError((err) => {
                console.error('Error exporting consecutive absentees report:', err);
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
                        if (url && choice === 'web') window.open(url, '_blank');
                    } catch { /* ignore */ }
                });
                return;
            }

            const blob = new Blob([body], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `consecutive-absentees-report-${this.formatApiDate(new Date())}.xlsx`;
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
            return `${dd.padStart(2, '0')} ${months[parseInt(mm, 10) - 1]} ${yyyy} at ${parseInt(hh, 10)}:${min} ${ap.toLowerCase()}`;
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        const hours24 = d.getHours();
        const ampm = hours24 >= 12 ? 'pm' : 'am';
        const hours12 = hours24 % 12 || 12;
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} at ${hours12}:${min} ${ampm}`;
    }

    trackById(_index: number, row: AbsenteeRow): string {
        return row.id;
    }
}
