import { Component, Output, EventEmitter, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { AllocatedVolunteer } from '../allocate-sewa.component';
import { DataService } from '../../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ImagePreviewDirective } from '../../../../shared/directives/image-preview.directive';

@Component({
    selector: 'app-allocated-section',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent, ImagePreviewDirective],
    templateUrl: './allocated-section.component.html',
    styleUrls: ['./allocated-section.component.scss']
})
export class AllocatedSectionComponent implements OnInit {
    @Output() unassign = new EventEmitter<AllocatedVolunteer[]>();
    @Input() sewaAssignedBranchId: string | null = null;

    private dataService = inject(DataService);
    volunteers: AllocatedVolunteer[] = [];

    searchTerm = '';
    selectedIds = new Set<number | string>();

    // Sorting state
    sortField = '';
    sortDirection: 'asc' | 'desc' = 'asc';

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

        this.dataService.get<any>('v1/assigned-regular-sewas', { params }).pipe(
            catchError((error) => {
                console.error('Error loading allocated volunteers:', error);
                return of({ data: [] });
            }),
            finalize(() => {
                this.isLoading = false;
                this.isLoadingMore = false;
            })
        ).subscribe((response) => {
            const records = response?.data?.records || response?.data || response?.results || response || [];

            const newRecords = (Array.isArray(records) ? records : []).map((item: any) => {
                const sewaInfo = item.sewa || item.regular_sewa || {};
                const userInfo = item.user || {};
                const headVal = item.head ?? sewaInfo.head;
                const subHeadVal = item.sub_head ?? sewaInfo.sub_head;
                return {
                    id: item.id ?? '',
                    userId: item.user_id || userInfo.id || '',
                    sewaId: item.sewa_id || sewaInfo.id || '',
                    uniqueId: userInfo.unique_id != null ? String(userInfo.unique_id) : (item.unique_id != null ? String(item.unique_id) : ''),
                    badgeNo: item.badge_id != null ? String(item.badge_id) : (item.badge_no || item.badge_number || ''),
                    name: userInfo.name || item.name || item.full_name || '',
                    image: userInfo.user_image?.full_path || userInfo.user_images?.[0]?.full_path || item.user_image?.full_path || item.user_images?.[0]?.full_path || item.image || item.profile_image || undefined,
                    head: headVal != null ? String(headVal) : '',
                    subHead: subHeadVal != null ? String(subHeadVal) : '',
                    headChecked: Number(headVal) === 1,
                    subHeadChecked: Number(subHeadVal) === 1,
                    isRegular: item.sewa_mode === 1 || item.sewa_mode === '1' || sewaInfo.is_regular === 1 || sewaInfo.is_regular === true || item.is_regular === 1 || item.is_regular === true,
                    sewa: sewaInfo.name || sewaInfo.sewa_name || item.sewa_name || ''
                };
            });

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

    get filteredVolunteers(): AllocatedVolunteer[] {
        let filtered = [...this.volunteers];

        if (this.sortField) {
            filtered.sort((a, b) => {
                let aVal: any = (a as any)[this.sortField];
                let bVal: any = (b as any)[this.sortField];

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = String(bVal).toLowerCase();
                }

                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }

    sortBy(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
    }

    getSortIcon(field: string): string {
        if (this.sortField !== field) return 'unfold_more';
        return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
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
            this.filteredVolunteers.forEach(v => this.selectedIds.add(v.id));
        } else {
            this.filteredVolunteers.forEach(v => this.selectedIds.delete(v.id));
        }
    }

    isAllSelected(): boolean {
        return this.filteredVolunteers.length > 0 &&
            this.filteredVolunteers.every(v => this.selectedIds.has(v.id));
    }

    isIndeterminate(): boolean {
        const selectedCount = this.filteredVolunteers.filter(v => this.selectedIds.has(v.id)).length;
        return selectedCount > 0 && selectedCount < this.filteredVolunteers.length;
    }

    toggleHead(volunteer: AllocatedVolunteer, event: Event): void {
        event.stopPropagation();
        const checked = (event.target as HTMLInputElement).checked;
        this.callRoleApi(volunteer, 'head', checked);
    }

    toggleSubHead(volunteer: AllocatedVolunteer, event: Event): void {
        event.stopPropagation();
        const checked = (event.target as HTMLInputElement).checked;
        this.callRoleApi(volunteer, 'sub-head', checked);
    }

    toggleIsRegular(volunteer: AllocatedVolunteer, event: Event): void {
        event.stopPropagation();
        const checked = (event.target as HTMLInputElement).checked;
        this.callRoleApi(volunteer, 'sewa_mode', checked);
    }

    private callRoleApi(volunteer: AllocatedVolunteer, type: 'head' | 'sub-head' | 'sewa_mode', checked: boolean): void {
        if (!volunteer.userId || !volunteer.sewaId || !this.sewaAssignedBranchId) {
            alert('User, Sewa, and Sewa Assignment Branch are required.');
            this.volunteers = [...this.volunteers];
            return;
        }

        const body = {
            user_id: volunteer.userId,
            sewa_id: volunteer.sewaId,
            sewa_assigned_branch_id: this.sewaAssignedBranchId,
            action: checked ? '1' : '0'
        };

        // Optimistic update
        const prevHead = volunteer.headChecked;
        const prevSubHead = volunteer.subHeadChecked;
        const prevIsRegular = volunteer.isRegular;
        if (type === 'head') {
            volunteer.headChecked = checked;
            if (checked) volunteer.subHeadChecked = false;
        } else if (type === 'sub-head') {
            volunteer.subHeadChecked = checked;
            if (checked) volunteer.headChecked = false;
        } else {
            volunteer.isRegular = checked;
        }

        const label = type === 'head' ? 'Head' : type === 'sub-head' ? 'Sub Head' : 'Is Regular';
        this.dataService.post<any>(`v1/user-sewas/${type}`, body).pipe(
            catchError((err) => {
                console.error(`Failed to update ${type}:`, err);
                alert(err?.error?.message || `Failed to update ${label}.`);
                volunteer.headChecked = prevHead;
                volunteer.subHeadChecked = prevSubHead;
                volunteer.isRegular = prevIsRegular;
                this.volunteers = [...this.volunteers];
                return of(null);
            })
        ).subscribe();
    }

    onUnassign(): void {
        const selected = this.volunteers.filter(v => this.selectedIds.has(v.id));
        if (selected.length > 0) {
            this.unassign.emit(selected);
            this.selectedIds.clear();
        }
    }

    trackById(_: number, item: AllocatedVolunteer): number | string {
        return item.id;
    }

    // Expose Math to template
    Math = Math;
}
