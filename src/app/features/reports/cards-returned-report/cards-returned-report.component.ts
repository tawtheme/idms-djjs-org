import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { DataService } from '../../../data.service';
import { applyTableSort } from '../../../shared/utils/table-sort';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

interface CardRow {
    id: string;
    image: string;
    name: string;
    phone: string;
    fatherName: string;
    sewa: string;
    badgeNo: string;
    checkIn: string;
    checkOut: string;
}

type SortField = 'id' | 'name' | 'phone' | 'fatherName' | 'sewa' | 'badgeNo' | 'checkIn' | 'checkOut';

@Component({
    standalone: true,
    selector: 'app-cards-returned-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        PagerComponent,
        EmptyStateComponent,
        IconComponent,
        ImagePreviewDirective
    ],
    templateUrl: './cards-returned-report.component.html',
    styleUrls: ['./cards-returned-report.component.scss']
})
export class CardsReturnedReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;
    hasSearched = false;
    quickSearch = '';
    branchError: string | null = null;
    programError: string | null = null;

    // Filters
    selectedTaskBranch: any[] = [];
    selectedCardStatus: any[] = [];
    selectedPrograms: any[] = [];
    selectedSewas: any[] = [];

    // Options
    branchOptions: DropdownOption[] = [];
    cardStatusOptions: DropdownOption[] = [
        { id: 'returned', label: 'Returned', value: 'returned' },
        { id: 'not_returned', label: 'Not Returned', value: 'not_returned' }
    ];
    programOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];

    // Data
    rows: CardRow[] = [];

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
            this.programOptions = (Array.isArray(data) ? data : []).map((p: any) => ({
                id: String(p.id),
                label: p.name || p.title || '',
                value: String(p.id)
            }));
        });
    }

    onTaskBranchChange(value: any[]): void {
        this.selectedTaskBranch = value;
        this.branchError = null;
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

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            card_status: this.selectedCardStatus?.length ? (this.selectedCardStatus[0] === 'returned' ? '1' : '0') : '',
            sewa_id: this.selectedSewas?.length ? String(this.selectedSewas[0]) : '',
            program_id: this.selectedPrograms?.length ? String(this.selectedPrograms[0]) : '',
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
        if (!this.selectedTaskBranch?.length) {
            this.branchError = 'Task Branch is required.';
            valid = false;
        } else {
            this.branchError = null;
        }
        if (!this.selectedPrograms?.length) {
            this.programError = 'Programs is required.';
            valid = false;
        } else {
            this.programError = null;
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

        this.dataService.post<any>('v1/reports/cards', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading cards returned report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];
            const meta = response.meta || response.pagination || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: String(item.unique_id ?? item.id ?? ''),
                image: item.full_path || item.image_url || item.profile_image || item.image || '',
                name: item.user_name || item.name || '',
                phone: item.phone || item.mobile || '',
                fatherName: item.father_name || item.spouse_name || '',
                sewa: item.sewa?.name || item.sewa_name || '',
                badgeNo: String(item.badge_no ?? item.badge_id ?? ''),
                checkIn: this.formatDisplayDateTime(item.check_in),
                checkOut: this.formatDisplayDateTime(item.check_out)
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

        this.dataService.post<any>('v1/reports/cards', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError((err) => {
                console.error('Error exporting cards returned report:', err);
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
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            a.download = `cards-${yyyy}-${mm}-${dd}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        });
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

    trackById(_index: number, row: CardRow): string {
        return row.id;
    }
}
