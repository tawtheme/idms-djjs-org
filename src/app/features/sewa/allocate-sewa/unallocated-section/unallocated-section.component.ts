import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { UnallocatedVolunteer } from '../allocate-sewa.component';
import { DataService } from '../../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
@Component({
    selector: 'app-unallocated-section',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './unallocated-section.component.html',
    styleUrls: ['./unallocated-section.component.scss']
})
export class UnallocatedSectionComponent implements OnInit {
    @Output() allocate = new EventEmitter<UnallocatedVolunteer[]>();

    private dataService = inject(DataService);
    volunteers: UnallocatedVolunteer[] = [];

    searchTerm = '';
    selectedIds = new Set<number | string>();

    // Pagination
    currentPage = 1;
    pageSize = 50;
    totalItems = 0;
    isLoading = false;
    isLoadingMore = false;

    private lastFilters: any = {};

    ngOnInit(): void {
    }

    loadVolunteers(filters: any = {}, append = false): void {
        if (!append) {
            this.lastFilters = filters || {};
            this.currentPage = 1;
        }

        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
        }

        let params = new HttpParams()
            .set('per_page', this.pageSize.toString())
            .set('page', this.currentPage.toString());

        Object.keys(this.lastFilters).forEach(key => {
            if (this.lastFilters[key]) {
                params = params.set(key, this.lastFilters[key]);
            }
        });
        const term = this.searchTerm.trim();
        if (term) {
            params = params.set('search', term);
        }

        this.dataService.get<any>('v1/userSewas', { params }).pipe(
            catchError((error) => {
                console.error('Error loading unallocated volunteers:', error);
                return of({ data: [] });
            }),
            finalize(() => {
                this.isLoading = false;
                this.isLoadingMore = false;
            })
        ).subscribe((response) => {
            const records = response?.data?.records || response?.data || response?.results || response || [];

            const newRecords = (Array.isArray(records) ? records : []).map((item: any) => ({
                id: item.id || item.user_id || '',
                uniqueId: item.unique_id != null ? String(item.unique_id) : '',
                name: item.name || item.full_name || '',
                image: item.image || item.profile_image || item.user_image?.full_path || (item.user_images?.[0]?.full_path ?? undefined),
                phone: item.phone || item.mobile || item.contact_no || ''
            }));

            if (append) {
                this.volunteers = [...this.volunteers, ...newRecords];
            } else {
                this.volunteers = newRecords;
            }

            this.totalItems = response?.total
                ?? response?.meta?.total
                ?? response?.data?.total
                ?? this.volunteers.length;
        });
    }

    loadMore(): void {
        this.currentPage++;
        this.loadVolunteers(this.lastFilters, true);
    }

    get hasMore(): boolean {
        return this.volunteers.length < this.totalItems;
    }

    refresh(): void {
        this.loadVolunteers(this.lastFilters);
    }

    onSearchEnter(): void {
        this.loadVolunteers(this.lastFilters);
    }

    toggleSelect(id: number | string, event: Event): void {
        event.stopPropagation();
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
    }

    toggleSelectAll(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked) {
            this.volunteers.forEach(v => this.selectedIds.add(v.id));
        } else {
            this.volunteers.forEach(v => this.selectedIds.delete(v.id));
        }
    }

    isAllSelected(): boolean {
        return this.volunteers.length > 0 &&
            this.volunteers.every(v => this.selectedIds.has(v.id));
    }

    isIndeterminate(): boolean {
        const count = this.volunteers.filter(v => this.selectedIds.has(v.id)).length;
        return count > 0 && count < this.volunteers.length;
    }

    onAllocate(): void {
        const selected = this.volunteers.filter(v => this.selectedIds.has(v.id));
        if (selected.length > 0) {
            this.allocate.emit(selected);
            this.selectedIds.clear();
        }
    }

    trackById(_: number, item: UnallocatedVolunteer): number | string {
        return item.id;
    }
}
