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

interface VolunteerReportRow {
    id: string;
    image: string;
    userName: string;
    fatherName: string;
    motherName: string;
    spouseName: string;
    phone: string;
    sewa: string;
    taskBranch: string;
    correspondingBranch: string;
    badgeId: string;
}

type SortField =
    | 'id'
    | 'userName'
    | 'fatherName'
    | 'motherName'
    | 'spouseName'
    | 'phone'
    | 'sewa'
    | 'taskBranch'
    | 'correspondingBranch'
    | 'badgeId';

@Component({
    standalone: true,
    selector: 'app-volunteers-branch-sewa-report',
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
    templateUrl: './volunteers-branch-sewa-report.component.html',
    styleUrls: ['./volunteers-branch-sewa-report.component.scss']
})
export class VolunteersBranchSewaReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;
    hasSearched = false;
    quickSearch = '';
    taskBranchError: string | null = null;

    // Filter selections
    selectedTaskBranch: any[] = [];
    selectedBranchSearchType: any[] = [];
    selectedSewa: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedSewaAllocated: any[] = [];

    // Filter options
    taskBranchOptions: DropdownOption[] = [];
    correspondingBranchOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [
        { id: 'both', label: 'In Both', value: 'both' }
    ];
    sewaAllocatedOptions: DropdownOption[] = [
        { id: '1', label: 'Allocated', value: '1' },
        { id: '0', label: 'UnAllocated', value: '0' }
    ];

    // Data
    rows: VolunteerReportRow[] = [];

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
        this.loadSewaOptions();
    }

    private loadBranchOptions(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            const options: DropdownOption[] = (Array.isArray(data) ? data : []).map((branch: any) => ({
                id: String(branch.id),
                label: branch.name || branch.label || branch.title || '',
                value: String(branch.id)
            }));
            this.taskBranchOptions = options;
            this.correspondingBranchOptions = options;
        });
    }

    private loadSewaOptions(): void {
        this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } }).pipe(
            catchError(() => of({ data: { sewas: [] } }))
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
            home_branch: this.selectedCorrespondingBranch?.length ? String(this.selectedCorrespondingBranch[0]) : '',
            sewa_id: this.selectedSewa?.length ? String(this.selectedSewa[0]) : '',
            branch_type: this.selectedBranchSearchType?.length ? String(this.selectedBranchSearchType[0]) : '',
            sewa_assigned: this.selectedSewaAllocated?.length ? String(this.selectedSewaAllocated[0]) : '',
            search: this.quickSearch.trim(),
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: this.pageSize,
            page: this.currentPage
        };
        return { ...payload, ...extra };
    }

    loadReport(): void {
        if (!this.selectedTaskBranch?.length) {
            this.taskBranchError = 'Task Branch is required.';
            this.hasSearched = false;
            this.rows = [];
            this.totalItems = 0;
            return;
        }
        this.taskBranchError = null;
        this.hasSearched = true;
        this.isLoading = true;
        this.error = null;

        const payload = this.buildPayload();

        this.dataService.post<any>('v1/reports/volunteers_branch_sewa', payload).pipe(
            catchError((err) => {
                console.error('Error loading volunteers report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response?.data || response?.results || response || [];
            const meta = response?.meta || response?.pagination || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => this.mapRow(item));

            if (meta) {
                this.totalItems = meta.total ?? meta.total_count ?? this.rows.length;
            } else {
                this.totalItems = this.rows.length;
            }

            this.isLoading = false;
        });
    }

    private mapRow(item: any): VolunteerReportRow {
        const profile = item.user_profile || {};
        const addressArray = Array.isArray(item.user_address) ? item.user_address : [item.user_address || {}];
        const primaryAddress = addressArray[0] || {};

        const userSewasRaw = Array.isArray(item.user_sewas) ? item.user_sewas : [];
        const sewaNames = userSewasRaw
            .map((us: any) => us?.sewa?.name || us?.sewa_name)
            .filter((n: any) => !!n)
            .join(', ');
        const badgeIds = userSewasRaw
            .map((us: any) => us?.badge_id)
            .filter((b: any) => b !== undefined && b !== null && b !== '')
            .join(', ');

        const images = Array.isArray(item.user_images) ? item.user_images : [];
        const firstImage = images[0]?.image_url || images[0]?.url || item.image || '';

        return {
            id: String(item.unique_id || item.uid || item.id || ''),
            image: firstImage,
            userName: item.name || '',
            fatherName: profile.father_name || item.father_name || '',
            motherName: profile.mother_name || item.mother_name || '',
            spouseName: profile.spouse_name || item.spouse_name || '',
            phone: item.phone || item.mobile_number || '',
            sewa: sewaNames,
            taskBranch: primaryAddress.working_branch?.name || primaryAddress.task_branch || item.task_branch || '',
            correspondingBranch: primaryAddress.home_branch?.name || primaryAddress.corresponding_branch || item.corresponding_branch || '',
            badgeId: badgeIds || item.badge_no || item.badge_number || ''
        };
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedTaskBranch = [];
        this.selectedBranchSearchType = [];
        this.selectedSewa = [];
        this.selectedCorrespondingBranch = [];
        this.selectedSewaAllocated = [];
        this.quickSearch = '';
        this.sortField = '';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.hasSearched = false;
        this.rows = [];
        this.totalItems = 0;
        this.taskBranchError = null;
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
        if (!this.selectedTaskBranch?.length) {
            this.taskBranchError = 'Task Branch is required.';
            return;
        }
        this.taskBranchError = null;
        this.isExporting = true;
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/volunteers_branch_sewa', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError((err) => {
                console.error('Error exporting volunteers report:', err);
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
            a.download = `volunteers-branch-sewa-${this.formatApiDate(new Date())}.xlsx`;
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

    trackById(_index: number, row: VolunteerReportRow): string {
        return row.id;
    }
}
