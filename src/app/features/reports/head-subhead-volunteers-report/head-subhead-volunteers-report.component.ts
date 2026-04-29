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

interface HeadSubheadRow {
    id: string;
    sewaName: string;
    headName: string;
    headContact: string;
    headAddress: string;
    subHeadName: string;
    subHeadContact: string;
    subHeadAddress: string;
}

type SortField =
    | 'sewaName'
    | 'headName'
    | 'headContact'
    | 'headAddress'
    | 'subHeadName'
    | 'subHeadContact'
    | 'subHeadAddress';

@Component({
    standalone: true,
    selector: 'app-head-subhead-volunteers-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        PagerComponent,
        EmptyStateComponent,
        LoadingComponent,
        IconComponent
    ],
    templateUrl: './head-subhead-volunteers-report.component.html',
    styleUrls: ['./head-subhead-volunteers-report.component.scss']
})
export class HeadSubheadVolunteersReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;

    // Filters
    selectedTaskBranch: any[] = [];
    taskBranchOptions: DropdownOption[] = [];

    // Data
    rows: HeadSubheadRow[] = [];

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
        this.loadReport();
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

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            per_page: String(this.pageSize),
            page: String(this.currentPage),
            is_export: '0',
            exportChoice: 'web'
        };
        return { ...payload, ...extra };
    }

    loadReport(): void {
        this.isLoading = true;
        this.error = null;

        this.dataService.post<any>('v1/reports/head-subhead-volunteers', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading head/sub-head volunteers report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];
            const meta = response.meta || response.pagination || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any, idx: number) => ({
                id: String(item.id ?? idx),
                sewaName: item.sewa?.name || item.sewa_name || '',
                headName: item.head?.name || item.head_name || '',
                headContact: item.head?.contact || item.head_contact || item.head_phone || '',
                headAddress: item.head?.address || item.head_address || '',
                subHeadName: item.sub_head?.name || item.sub_head_name || '',
                subHeadContact: item.sub_head?.contact || item.sub_head_contact || item.sub_head_phone || '',
                subHeadAddress: item.sub_head?.address || item.sub_head_address || ''
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
        this.dataService.post<any>('v1/reports/head-subhead-volunteers', this.buildPayload({ is_export: '1', exportChoice: choice })).pipe(
            catchError((err) => {
                console.error('Error exporting head/sub-head volunteers report:', err);
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

    trackById(_index: number, row: HeadSubheadRow): string {
        return row.id;
    }
}
