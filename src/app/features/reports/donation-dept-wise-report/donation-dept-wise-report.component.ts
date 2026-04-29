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
        LoadingComponent,
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
        this.loadProgramOptions();
        this.loadReport();
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

    private loadProgramOptions(): void {
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

        return { ...payload, ...extra };
    }

    loadReport(): void {
        this.isLoading = true;
        this.error = null;

        const payload = this.buildPayload();

        this.dataService.post<any>('v1/reports/donation-dept-wise', payload).pipe(
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
                donationAmount: Number(item.donation_amount ?? item.total_amount ?? item.amount ?? 0)
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

        this.dataService.post<any>('v1/reports/donation-dept-wise', payload).pipe(
            catchError((err) => {
                console.error('Error exporting donation report:', err);
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
