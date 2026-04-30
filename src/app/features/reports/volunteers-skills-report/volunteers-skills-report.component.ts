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

interface VolunteerSkillRow {
    id: string;
    image: string;
    userName: string;
    fatherName: string;
    motherName: string;
    spouseName: string;
    phone: string;
    sewa: string;
    badgeId: string;
    skills: string;
    taskBranch: string;
    correspondingBranch: string;
}

type SortField = 'id' | 'userName' | 'fatherName' | 'motherName' | 'spouseName' | 'phone' | 'sewa' | 'badgeId' | 'skills' | 'taskBranch' | 'correspondingBranch';

@Component({
    standalone: true,
    selector: 'app-volunteers-skills-report',
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
    templateUrl: './volunteers-skills-report.component.html',
    styleUrls: ['./volunteers-skills-report.component.scss']
})
export class VolunteersSkillsReportComponent implements OnInit {
    private dataService = inject(DataService);

    isLoading = false;
    isExporting = false;
    error: string | null = null;

    // Filters
    selectedSkills: any[] = [];
    selectedTaskBranch: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedBranchSearchType: any[] = [];
    city = '';
    age = '';

    // Options
    skillOptions: DropdownOption[] = [];
    branchOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [
        { id: 'both', label: 'In Both', value: 'both' }
    ];

    // Data
    rows: VolunteerSkillRow[] = [];

    // Sort
    sortField: SortField | '' = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    pageSizeOptions: number[] = [10, 25, 50, 100];
    pageSize = 100;
    currentPage = 1;
    totalItems = 0;

    ngOnInit(): void {
        this.loadSkills();
        this.loadBranches();
        this.loadReport();
    }

    private loadSkills(): void {
        this.dataService.get<any>('v1/options/skills').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            this.skillOptions = (Array.isArray(data) ? data : []).map((s: any) => ({
                id: String(s.id),
                label: s.name || s.label || s.title || '',
                value: String(s.id)
            }));
        });
    }

    private loadBranches(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            this.branchOptions = (Array.isArray(data) ? data : []).map((b: any) => ({
                id: String(b.id),
                label: b.name || b.label || b.title || '',
                value: String(b.id)
            }));
        });
    }

    private buildPayload(extra: Record<string, any> = {}): Record<string, any> {
        const payload: Record<string, any> = {
            skill_ids: this.selectedSkills?.length ? this.selectedSkills.map(String) : [],
            branch_id: this.selectedTaskBranch?.length ? String(this.selectedTaskBranch[0]) : '',
            corresponding_branch_id: this.selectedCorrespondingBranch?.length ? String(this.selectedCorrespondingBranch[0]) : '',
            branch_search_type: this.selectedBranchSearchType?.length ? String(this.selectedBranchSearchType[0]) : '',
            city: this.city.trim(),
            age: this.age.trim(),
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

        this.dataService.post<any>('v1/reports/volunteers-skills', this.buildPayload()).pipe(
            catchError((err) => {
                console.error('Error loading volunteers skills report:', err);
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
                userName: item.name || item.user_name || '',
                fatherName: item.father_name || '',
                motherName: item.mother_name || '',
                spouseName: item.spouse_name || '',
                phone: item.phone || item.mobile || '',
                sewa: item.sewa?.name || item.sewa_name || '',
                badgeId: item.badge_id || item.badge_no || '',
                skills: Array.isArray(item.skills) ? item.skills.map((s: any) => s.name || s).join(', ') : (item.skills || ''),
                taskBranch: item.branch?.name || item.task_branch || '',
                correspondingBranch: item.corresponding_branch?.name || item.corresponding_branch_name || ''
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
        this.dataService.post<any>('v1/reports/volunteers-skills', this.buildPayload({ is_export: '1', exportChoice: choice })).pipe(
            catchError((err) => {
                console.error('Error exporting volunteers skills report:', err);
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

    trackById(_index: number, row: VolunteerSkillRow): string {
        return row.id;
    }
}
