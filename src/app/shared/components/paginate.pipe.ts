import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true
})
export class PaginatePipe implements PipeTransform {
  transform<T>(items: readonly T[] | null | undefined, page: number, pageSize: number): T[] {
    if (!items || pageSize <= 0) {
      return [];
    }
    const start = (Math.max(1, page) - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }
}


