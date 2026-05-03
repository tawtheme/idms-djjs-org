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

interface DonationRow {
    id: string;
    sewaName: string;
    donationAmount: number;
}

type SortField = 'sewaName' | 'donationAmount';

@Component({
    standalone: true,
    selector: 'app-donation-dept-wise-report',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        PagerComponent,
        EmptyStateComponent,
        IconComponent
    ],
    templateUrl: './donation-dept-wise-report.component.html',
    styleUrls: ['./donation-dept-wise-report.component.scss']
})
export class DonationDeptWiseReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;

    // Filter selections
    selectedTaskBranch: any[] = [];
    selectedProgram: any[] = [];
    searchTerm = '';

    // Filter options
    taskBranchOptions: DropdownOption[] = [];
    programOptions: DropdownOption[] = [];

    // Data
    rows: DonationRow[] = [];
    totalDonation = 0;

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
        this.loadReport();
    }

    onTaskBranchChange(values: any[]): void {
        this.selectedTaskBranch = values || [];
        this.selectedProgram = [];
        this.programOptions = [];
        if (this.selectedTaskBranch.length) {
            this.loadProgramOptions(String(this.selectedTaskBranch[0]));
        }
    }

    private loadBranchOptions(): void {
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

    private loadProgramOptions(branchId: string): void {
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

    private isMeaningful(v: any): boolean {
        return v !== undefined && v !== null && v !== '' && v !== 'none';
    }

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            per_page: String(this.pageSize),
            page: String(this.currentPage),
            sortByColumn: this.sortField || '',
            orderBy: this.sortField ? this.sortDirection : '',
            is_export: '0',
            exportChoice: 'web'
        };

        if (this.isMeaningful(this.selectedTaskBranch[0])) payload['branch_id'] = String(this.selectedTaskBranch[0]);
        if (this.isMeaningful(this.selectedProgram[0])) payload['program_id'] = String(this.selectedProgram[0]);
        if (this.isMeaningful(this.searchTerm)) payload['search'] = this.searchTerm.trim();

        return { ...payload, ...extra };
    }

    loadReport(): void {
        this.isLoading = true;
        this.error = null;

        const payload = this.buildPayload();

        this.dataService.post<any>('v1/reports/sewa_donations', payload).pipe(
            catchError((err) => {
                console.error('Error loading donation report:', err);
                this.error = err.error?.message || err.message || 'Failed to load report.';
                this.isLoading = false;
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response?.data || response?.results || response || [];
            const meta = response?.meta || response?.pagination || null;
            const totals = response?.totals || response?.summary || {};

            this.rows = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: String(item.id ?? item.sewa_id ?? ''),
                sewaName: item.sewa?.name || item.sewa_name || item.name || '',
                donationAmount: Number(item.donations_sum_amount ?? item.donation_amount ?? item.total_amount ?? item.amount ?? 0)
            }));

            if (meta) {
                this.totalItems = meta.total ?? meta.total_count ?? this.rows.length;
            } else {
                this.totalItems = this.rows.length;
            }

            const apiTotal = totals.total_donation ?? totals.totalDonation ?? response?.total_donation;
            this.totalDonation = apiTotal != null
                ? Number(apiTotal)
                : this.rows.reduce((sum, r) => sum + (r.donationAmount || 0), 0);

            this.isLoading = false;
        });
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadReport();
    }

    resetFilters(): void {
        this.selectedTaskBranch = [];
        this.selectedProgram = [];
        this.searchTerm = '';
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

    exportReport(choice: 'web' | 'email' = 'web'): void {
        this.isExporting = true;
        const payload = this.buildPayload({ is_export: '1', exportChoice: choice });

        this.dataService.post<any>('v1/reports/sewa_donations', payload, { responseType: 'blob', observe: 'response' }).pipe(
            catchError(async (err) => {
                console.error('Error exporting donation report:', err);
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
            a.download = `donation-dept-wise-${stamp}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        });
    }

    formatCurrency(amount: number): string {
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
        return `₹${formatted}`;
    }

    trackById(_index: number, row: DonationRow): string {
        return row.id;
    }
}
