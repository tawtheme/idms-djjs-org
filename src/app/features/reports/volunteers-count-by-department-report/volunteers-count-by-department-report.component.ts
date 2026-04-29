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
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface DepartmentRow {
    id: string;
    sewaName: string;
    present: number;
    absent: number;
    onLeave: number;
    total: number;
}

type SortField = 'sewaName' | 'present' | 'absent' | 'onLeave' | 'total';

@Component({
    standalone: true,
    selector: 'app-volunteers-count-by-department-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        PagerComponent,
        EmptyStateComponent,
        IconComponent
    ],
    templateUrl: './volunteers-count-by-department-report.component.html',
    styleUrls: ['./volunteers-count-by-department-report.component.scss']
})
export class VolunteersCountByDepartmentReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;

    // Filters
    selectedTaskBranch: any[] = [];
    selectedPrograms: any[] = [];

    // Filter options
    branchOptions: DropdownOption[] = [];
    programOptions: DropdownOption[] = [];

    // Data
    rows: DepartmentRow[] = [];

    // Totals (footer)
    totals = { present: 0, absent: 0, onLeave: 0, total: 0 };

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
        this.loadPrograms();
        this.loadReport();
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

    private loadPrograms(): void {
        this.dataService.get<any>('v1/options/programs').pipe(
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

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            program_ids: this.selectedPrograms?.length ? this.selectedPrograms.map((id) => String(id)) : [],
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

        this.dataService.post<any>('v1/reports/volunteers-count-by-department', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading volunteers count by department report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response?.data?.rows || response?.data || response?.results || response || [];
            const meta = response?.meta || response?.pagination || response?.data?.meta || null;

            this.rows = (Array.isArray(data) ? data : []).map((item: any, idx: number) => ({
                id: String(item.id ?? item.sewa_id ?? idx),
                sewaName: item.sewa_name || item.name || item.department || '',
                present: Number(item.present ?? item.total_present ?? 0),
                absent: Number(item.absent ?? item.total_absent ?? 0),
                onLeave: Number(item.on_leave ?? item.leave ?? item.total_leave ?? 0),
                total: Number(item.total ?? item.total_volunteers ?? 0)
            }));

            this.totalItems = meta ? (meta.total ?? meta.total_count ?? this.rows.length) : this.rows.length;
            this.recalculateTotals(response?.data?.totals || response?.totals);
            this.isLoading = false;
        });
    }

    private recalculateTotals(serverTotals?: any): void {
        if (serverTotals) {
            this.totals = {
                present: Number(serverTotals.present ?? serverTotals.total_present ?? 0),
                absent: Number(serverTotals.absent ?? serverTotals.total_absent ?? 0),
                onLeave: Number(serverTotals.on_leave ?? serverTotals.total_leave ?? 0),
                total: Number(serverTotals.total ?? serverTotals.total_volunteers ?? 0)
            };
            return;
        }
        this.totals = this.rows.reduce(
            (acc, r) => ({
                present: acc.present + r.present,
                absent: acc.absent + r.absent,
                onLeave: acc.onLeave + r.onLeave,
                total: acc.total + r.total
            }),
            { present: 0, absent: 0, onLeave: 0, total: 0 }
        );
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedTaskBranch = [];
        this.selectedPrograms = [];
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
        this.dataService.post<any>('v1/reports/volunteers-count-by-department', this.buildPayload({ is_export: '1', exportChoice: choice })).pipe(
            catchError((err) => {
                console.error('Error exporting volunteers count by department report:', err);
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

    trackById(_index: number, row: DepartmentRow): string {
        return row.id;
    }
}
