export abstract class BasePaginatedList {
  // Common pagination state shared across listing components
  pageSizeOptions: number[] = [20, 50, 100, 150, 200, 500];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  // Common loading + error state
  isLoading = false;
  error: string | null = null;

  /**
   * Update pagination properties from backend meta object.
   * Expects shape:
   * {
   *   current_page: number;
   *   per_page: number;
   *   total: number;
   *   last_page?: number;
   * }
   */
  protected updatePaginationFromMeta(
    meta: { current_page?: number; per_page?: number; total?: number; last_page?: number } | null | undefined,
    fallbackPage: number,
    fallbackPageSize: number
  ): void {
    this.currentPage = meta?.current_page ?? fallbackPage;
    this.pageSize = meta?.per_page ?? fallbackPageSize;
    this.totalItems = meta?.total ?? this.totalItems ?? 0;
  }

  /**
   * Implemented by concrete list components to actually fetch data
   * for the given page and page size.
   */
  protected abstract loadPage(page: number, pageSize: number): void;

  /**
   * Called from <app-pager> when user changes page.
   * Triggers a new API call using the shared pagination state.
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPage(page, this.pageSize);
  }

  /**
   * Called from <app-pager> when user changes "rows per page".
   * Resets to first page and reloads with new size.
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadPage(1, size);
  }
}


