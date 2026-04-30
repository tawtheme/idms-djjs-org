import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DataService } from '../../../data.service';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

interface SewaIssuedRow {
    id: string;
    image: string;
    name: string;
    phone: string;
    branch: string;
    sewa: string;
    badgeNo: string;
    issuedDate: string;
    reason: string;
    enterBy: string;
    status: string;
}

type SortField =
    | 'id'
    | 'name'
    | 'phone'
    | 'branch'
    | 'sewa'
    | 'badgeNo'
    | 'issuedDate'
    | 'reason'
    | 'enterBy'
    | 'status';

@Component({
    standalone: true,
    selector: 'app-sewa-issued-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        PagerComponent,
        EmptyStateComponent,
        LoadingComponent,
        IconComponent,
        ImagePreviewDirective
    ],
    templateUrl: './sewa-issued-report.component.html',
    styleUrls: ['./sewa-issued-report.component.scss']
})
export class SewaIssuedReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;

    // Filters
    selectedTaskBranch: any[] = [];
    selectedSewa: any[] = [];
    selectedSewaAssigned: any[] = [];
    selectedMonths: any[] = [];
    selectedYear: any[] = [];
    quickSearch = '';

    // Filter options
    taskBranchOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];
    sewaAssignedOptions: DropdownOption[] = [
        { id: 'all', label: 'All', value: '' },
        { id: 'yes', label: 'Yes', value: '1' },
        { id: 'no', label: 'No', value: '0' }
    ];
    monthOptions: DropdownOption[] = [
        { id: 'all', label: 'Select All', value: 'all' },
        { id: '1', label: 'January', value: '1' },
        { id: '2', label: 'February', value: '2' },
        { id: '3', label: 'March', value: '3' },
        { id: '4', label: 'April', value: '4' },
        { id: '5', label: 'May', value: '5' },
        { id: '6', label: 'June', value: '6' },
        { id: '7', label: 'July', value: '7' },
        { id: '8', label: 'August', value: '8' },
        { id: '9', label: 'September', value: '9' },
        { id: '10', label: 'October', value: '10' },
        { id: '11', label: 'November', value: '11' },
        { id: '12', label: 'December', value: '12' }
    ];
    yearOptions: DropdownOption[] = [];

    // Data
    rows: SewaIssuedRow[] = [];

    // Sort
    sortField: SortField | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageSize = 25;
    currentPage = 1;
    totalItems = 0;

    ngOnInit(): void {
        this.loadBranches();
        this.loadSewaOptions();
        this.buildYearOptions();
    }

    private loadBranches(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            this.taskBranchOptions = (Array.isArray(data) ? data : []).map((branch: any) => ({
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

    private buildYearOptions(): void {
        const currentYear = new Date().getFullYear();
        const years: DropdownOption[] = [{ id: 'all', label: 'All', value: 'all' }];
        for (let y = currentYear; y >= currentYear - 10; y--) {
            years.push({ id: String(y), label: String(y), value: String(y) });
        }
        this.yearOptions = years;
    }

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : 'all',
            sewa_id: this.selectedSewa?.length ? String(this.selectedSewa[0]) : 'all',
            year: this.selectedYear?.length ? String(this.selectedYear[0]) : 'all',
            month: this.resolveSelectedMonths(),
            sewa_assigned: this.selectedSewaAssigned?.length ? String(this.selectedSewaAssigned[0]) : '',
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
        this.isLoading = true;
        this.error = null;

        this.dataService.post<any>('v1/reports/list_of_sewa_issued', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading sewa issued report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];
            const meta = response.meta || response.pagination || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: String(item.id ?? ''),
                image: item.image || item.profile_image || '',
                name: item.name || '',
                phone: item.phone || item.mobile || '',
                branch: item.branch?.name || item.branch_name || '',
                sewa: item.sewa?.name || item.sewa_name || '',
                badgeNo: item.badge_no || item.badge_number || '',
                issuedDate: this.formatDisplayDate(item.issued_date || item.unallocated_date || item.allocated_date),
                reason: item.reason || '',
                enterBy: item.enter_by || item.entered_by || item.created_by_name || '',
                status: item.status || ''
            }));

            this.totalItems = meta ? (meta.total ?? meta.total_count ?? this.rows.length) : this.rows.length;
            this.isLoading = false;
        });
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedTaskBranch = [];
        this.selectedSewa = [];
        this.selectedSewaAssigned = [];
        this.selectedMonths = [];
        this.selectedYear = [];
        this.quickSearch = '';
        this.sortField = '';
        this.sortDirection = 'asc';
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
        this.isExporting = true;
        this.dataService.post<any>('v1/reports/list_of_sewa_issued', this.buildPayload({ is_export: '1', exportChoice: choice })).pipe(
            catchError((err) => {
                console.error('Error exporting sewa issued report:', err);
                this.error = err.error?.message || err.message || 'Failed to export report.';
                this.isExporting = false;
                return of(null);
            })
        ).subscribe((response) => {
            this.isExporting = false;
            if (!response) return;
            const url = response.data?.url || response.url || response.file_url;
            if (url && choice === 'web') {
                window.open(url, '_blank');
            }
        });
    }

    private formatDisplayDate(value: string | null | undefined): string {
        if (!value) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m) {
            const [, dd, mm, yyyy] = m;
            return `${dd.padStart(2, '0')} ${months[parseInt(mm, 10) - 1]} ${yyyy}`;
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    trackById(_index: number, row: SewaIssuedRow): string {
        return row.id;
    }

    get selectedMonthLabels(): string[] {
        const values = this.resolveSelectedMonths();
        if (!values.length) return [];
        return values
            .map((v) => this.monthOptions.find((o) => String(o.value) === String(v))?.label || '')
            .filter((l) => !!l);
    }

    removeSelectedMonth(label: string): void {
        const target = this.monthOptions.find((o) => o.label === label);
        if (!target) return;
        const targetValue = String(target.value);
        const current = this.selectedMonths.map(String);
        if (current.includes('all')) {
            // expand "all" to explicit list, then drop the target
            this.selectedMonths = this.monthOptions
                .filter((o) => o.value !== 'all' && String(o.value) !== targetValue)
                .map((o) => String(o.value));
            return;
        }
        this.selectedMonths = current.filter((v) => v !== targetValue);
    }

    private resolveSelectedMonths(): string[] {
        if (!this.selectedMonths?.length) return [];
        const values = this.selectedMonths.map(String);
        if (values.includes('all')) {
            return ['1','2','3','4','5','6','7','8','9','10','11','12'];
        }
        return values;
    }

    onMonthSelectionChange(values: any[]): void {
        const next = (values || []).map(String);
        const previouslyAll = this.selectedMonths.map(String).includes('all');
        const nowAll = next.includes('all');
        if (nowAll && !previouslyAll) {
            this.selectedMonths = ['all'];
        } else if (nowAll && next.length > 1) {
            this.selectedMonths = next.filter(v => v !== 'all');
        } else {
            this.selectedMonths = next;
        }
    }
}
