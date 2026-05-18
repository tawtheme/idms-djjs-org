import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../components/icon/icon.component';

@Component({
    selector: 'hlm-pagination',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (total > pageSize) {
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 text-sm">
                <div class="inline-flex items-center gap-2 text-muted-foreground">
                    <span>Rows per page:</span>
                    <select
                        [(ngModel)]="pageSize"
                        (ngModelChange)="changePageSize($event)"
                        class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                        @for (size of pageSizeOptions; track size) {
                            <option [ngValue]="size">{{ size }}</option>
                        }
                    </select>
                </div>

                <div class="inline-flex items-center gap-1">
                    <button
                        type="button"
                        (click)="goToPage(currentPage - 1)"
                        [disabled]="currentPage === 1"
                        class="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                        <app-icon name="chevron_left" />
                        <span class="hidden sm:inline">Previous</span>
                    </button>

                    <ul class="m-0 flex list-none items-center gap-1 p-0" aria-label="Pagination">
                        @for (p of pages; track $index) {
                            <li>
                                <button
                                    type="button"
                                    [disabled]="p === '…'"
                                    (click)="goToPage(+p)"
                                    [class]="pageBtnClass(p)">
                                    {{ p }}
                                </button>
                            </li>
                        }
                    </ul>

                    <button
                        type="button"
                        (click)="goToPage(currentPage + 1)"
                        [disabled]="currentPage === totalPages"
                        class="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                        <span class="hidden sm:inline">Next</span>
                        <app-icon name="chevron_right" />
                    </button>
                </div>

                <div class="text-muted-foreground">
                    Total: <strong class="font-semibold text-foreground">{{ total }}</strong> records
                </div>
            </div>
        }
    `,
})
export class HlmPaginationComponent {
    @Input() total = 0;
    @Input() pageSize = 20;
    @Input() currentPage = 1;
    @Input() pageSizeOptions: number[] = [20, 50, 100, 150, 200, 500];
    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.total / this.pageSize));
    }

    get pages(): Array<number | string> {
        const pages: Array<number | string> = [];
        const tp = this.totalPages;
        if (tp <= 7) {
            for (let i = 1; i <= tp; i++) pages.push(i);
            return pages;
        }
        const c = this.currentPage;
        pages.push(1);
        if (c <= 4) {
            pages.push(2, 3, 4, 5, '…');
        } else if (c >= tp - 3) {
            pages.push('…', tp - 4, tp - 3, tp - 2, tp - 1);
        } else {
            pages.push('…', c - 1, c, c + 1, '…');
        }
        pages.push(tp);
        return pages;
    }

    goToPage(page: number): void {
        const clamped = Math.min(this.totalPages, Math.max(1, page));
        if (clamped !== this.currentPage) this.pageChange.emit(clamped);
    }

    changePageSize(size: number): void {
        this.pageSizeChange.emit(Number(size));
    }

    pageBtnClass(p: number | string): string {
        const base = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors disabled:cursor-default disabled:bg-transparent disabled:text-muted-foreground';
        if (p === '…') return `${base}`;
        if (p === this.currentPage) return `${base} bg-primary text-primary-foreground font-medium`;
        return `${base} text-foreground hover:bg-muted`;
    }
}
