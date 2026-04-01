import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { UnallocatedVolunteer } from '../allocate-sewa.component';
import { DataService } from '../../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
    selector: 'app-unallocated-section',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    templateUrl: './unallocated-section.component.html',
    styleUrls: ['./unallocated-section.component.scss']
})
export class UnallocatedSectionComponent implements OnInit {
    @Output() allocate = new EventEmitter<UnallocatedVolunteer[]>();

    private dataService = inject(DataService);
    volunteers: UnallocatedVolunteer[] = [];

    searchTerm = '';
    selectedIds = new Set<number | string>();

    // Pagination (internal state)
    currentPage = 1;
    pageSize = 12; // Grid view usually looks better with multiples of 3 or 4

    ngOnInit(): void {
    }

    loadVolunteers(filters: any = {}): void {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params = params.set(key, filters[key]);
            }
        });

        this.dataService.get<any>('v1/userSewas', { params }).pipe(
            catchError((error) => {
                console.error('Error loading unallocated volunteers:', error);
                return of({ data: [] });
            })
        ).subscribe((response) => {
            const data = response.data || response.results || response || [];

            this.volunteers = (Array.isArray(data) ? data : []).map((item: any) => ({
                id: item.unique_id || item.id || item.user_id || '',
                name: item.name || item.full_name || '',
                image: item.image || item.profile_image || item.user_image?.full_path || (item.user_images?.[0]?.full_path ?? undefined),
                phone: item.phone || item.mobile || item.contact_no || ''
            }));
        });
    }

    refresh(): void {
        this.loadVolunteers();
    }

    get filteredVolunteers(): UnallocatedVolunteer[] {
        const term = this.searchTerm.trim().toLowerCase();
        return this.volunteers.filter(v =>
            !term ||
            v.name.toLowerCase().includes(term) ||
            String(v.id).includes(term) ||
            (v.phone && v.phone.includes(term))
        );
    }

    get pagedVolunteers(): UnallocatedVolunteer[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredVolunteers.slice(start, start + this.pageSize);
    }

    toggleSelect(id: number | string, event: Event): void {
        event.stopPropagation();
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
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
