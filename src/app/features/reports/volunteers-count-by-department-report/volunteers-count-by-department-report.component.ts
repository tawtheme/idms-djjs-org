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
        this.loadReport();
    }

    onTaskBranchChange(values: any[]): void {
        this.selectedTaskBranch = values || [];
        this.selectedPrograms = [];
        this.programOptions = [];
        if (this.selectedTaskBranch.length) {
            this.loadPrograms(String(this.selectedTaskBranch[0]));
        }
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

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            program_id: this.selectedPrograms?.length ? this.selectedPrograms.map((id) => String(id)).join(',') : '',
            search: '',
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

        this.dataService.post<any>('v1/reports/volunteers-attending-sewa', this.buildPayload()).pipe(
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
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/volunteers-attending-sewa', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError(async (err) => {
                console.error('Error exporting volunteers count by department report:', err);
                let message = err?.error?.message || err?.message || 'Failed to export report.';
                if (err?.error instanceof Blob) {
                    try {
                        const text = await err.error.text();
                        const json = JSON.parse(text);
                        message = json?.message || json?.errors?.branch_id || message;
                    } catch { /* ignore */ }
                }
                this.error = message;
                this.isExporting = false;
                return null;
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
            const today = new Date();
            const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            a.download = `volunteers-attending-sewa-${stamp}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        });
    }

    trackById(_index: number, row: DepartmentRow): string {
        return row.id;
    }
}
