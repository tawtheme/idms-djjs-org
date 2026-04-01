import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { AllocatedVolunteer } from '../allocate-sewa.component';
import { DataService } from '../../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
    selector: 'app-allocated-section',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    templateUrl: './allocated-section.component.html',
    styleUrls: ['./allocated-section.component.scss']
})
export class AllocatedSectionComponent implements OnInit {
    @Output() unassign = new EventEmitter<AllocatedVolunteer[]>();

    private dataService = inject(DataService);
    volunteers: AllocatedVolunteer[] = [];

    searchTerm = '';
    selectedIds = new Set<number | string>();

    // Sorting state
    sortField = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Pagination
    currentPage = 1;
    pageSize = 20;

    ngOnInit(): void {
    }

    loadVolunteers(filters: any = {}): void {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params = params.set(key, filters[key]);
            }
        });

        this.dataService.get<any>('v1/assigned-regular-sewas', { params }).pipe(
            catchError((error) => {
                console.error('Error loading allocated volunteers:', error);
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];

            this.volunteers = (Array.isArray(data) ? data : []).map((item: any) => {
                const sewaInfo = item.sewa || item.regular_sewa || {};
                return {
                    id: item.id ?? item.user_id ?? item.unique_id ?? '',
                    badgeNo: item.badge_no || item.badge_number || '',
                    name: item.name || item.full_name || '',
                    image: item.image || item.profile_image || (item.user_images?.[0]?.full_path ?? undefined),
                    head: sewaInfo.head || item.head || '',
                    subHead: sewaInfo.sub_head || item.sub_head || '',
                    isRegular: sewaInfo.is_regular === 1 || sewaInfo.is_regular === true || item.is_regular === 1 || item.is_regular === true,
                    sewa: sewaInfo.name || sewaInfo.sewa_name || item.sewa_name || ''
                };
            });
        });
    }

    refresh(): void {
        this.loadVolunteers();
    }

    get filteredVolunteers(): AllocatedVolunteer[] {
        const term = this.searchTerm.trim().toLowerCase();
        let filtered = this.volunteers.filter(v =>
            !term ||
            v.name.toLowerCase().includes(term) ||
            (v.badgeNo && v.badgeNo.toLowerCase().includes(term)) ||
            (v.sewa && v.sewa.toLowerCase().includes(term)) ||
            String(v.id).includes(term)
        );

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

    get pagedVolunteers(): AllocatedVolunteer[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredVolunteers.slice(start, start + this.pageSize);
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
            this.pagedVolunteers.forEach(v => this.selectedIds.add(v.id));
        } else {
            this.pagedVolunteers.forEach(v => this.selectedIds.delete(v.id));
        }
    }

    isAllSelected(): boolean {
        return this.pagedVolunteers.length > 0 &&
            this.pagedVolunteers.every(v => this.selectedIds.has(v.id));
    }

    isIndeterminate(): boolean {
        const selectedCount = this.pagedVolunteers.filter(v => this.selectedIds.has(v.id)).length;
        return selectedCount > 0 && selectedCount < this.pagedVolunteers.length;
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
