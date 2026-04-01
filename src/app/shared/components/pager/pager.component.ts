import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  standalone: true,
  selector: 'app-pager',
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerComponent {
  @Input() total = 0;
  @Input() pageSize = 20;
  @Input() currentPage = 1;
  @Input() pageSizeOptions: number[] = [20, 50, 100, 150, 200, 500];
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get startIndex(): number {
    if (this.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.total);
  }

  // Build a compact page list with ellipses, e.g. 1 2 3 4 5 … 99
  get pages(): Array<number | string> {
    const pages: Array<number | string> = [];
    const tp = this.totalPages;
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
      return pages;
    }
    const add = (v: number | string) => pages.push(v);
    const c = this.currentPage;
    add(1);
    if (c <= 4) {
      add(2); add(3); add(4); add(5); add('…');
    } else if (c >= tp - 3) {
      add('…'); add(tp - 4); add(tp - 3); add(tp - 2); add(tp - 1);
    } else {
      add('…'); add(c - 1); add(c); add(c + 1); add('…');
    }
    add(tp);
    return pages;
  }

  goToPage(page: number): void {
    const clamped = Math.min(this.totalPages, Math.max(1, page));
    if (clamped !== this.currentPage) {
      this.pageChange.emit(clamped);
    }
  }

  changePageSize(size: number): void {
    this.pageSizeChange.emit(Number(size));
  }
}


