import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
    field: string;
    direction: SortDirection;
}

/**
 * Service to manage table sorting state.
 * For multiple tables on one page, provide this service at the component level.
 */
@Injectable({
    providedIn: 'root'
})
export class SortService {
    private sortStateSubject = new BehaviorSubject<SortState>({ field: '', direction: 'asc' });
    sortState$ = this.sortStateSubject.asObservable();

    /**
     * Get current sort state
     */
    get currentSort(): SortState {
        return this.sortStateSubject.value;
    }

    /**
     * Toggle sort direction for a field
     * @param field The field name to sort by
     * @returns Updated SortState
     */
    toggleSort(field: string): SortState {
        const currentState = this.currentSort;
        let newDirection: SortDirection = 'asc';

        if (currentState.field === field) {
            newDirection = currentState.direction === 'asc' ? 'desc' : 'asc';
        }

        const newState: SortState = { field, direction: newDirection };
        this.sortStateSubject.next(newState);
        return newState;
    }

    /**
     * Determine the Material Icon name based on current sort state
     * @param field The field name
     * @param defaultIcon Icon to show when not sorted by this field
     * @returns Icon name string
     */
    getSortIcon(field: string, defaultIcon: string = 'unfold_more'): string {
        const state = this.currentSort;
        if (state.field !== field) return defaultIcon;
        return state.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
    }

    /**
     * Set sort state explicitly
     */
    setSort(field: string, direction: SortDirection): void {
        this.sortStateSubject.next({ field, direction });
    }

    /**
     * Reset sort state
     */
    reset(): void {
        this.sortStateSubject.next({ field: '', direction: 'asc' });
    }
}
