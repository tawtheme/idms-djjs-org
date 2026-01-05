import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, shareReplay, tap } from 'rxjs/operators';
import { DataService } from '../../data.service';

/**
 * Search parameters for server-side search
 */
export interface SearchParams {
    /** Search query string */
    query: string;
    /** Current page number (1-indexed) */
    page?: number;
    /** Number of items per page */
    perPage?: number;
    /** Sort field */
    sortBy?: string;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Additional filters */
    filters?: Record<string, any>;
}

/**
 * Search result from server
 */
export interface SearchResult<T> {
    /** Array of results */
    data: T[];
    /** Pagination metadata */
    meta?: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
        from?: number;
        to?: number;
    };
}

/**
 * Search state for tracking loading and errors
 */
export interface SearchState<T> {
    /** Search results */
    results: T[];
    /** Loading state */
    loading: boolean;
    /** Error message if any */
    error: string | null;
    /** Total count of results */
    total: number;
    /** Current page */
    currentPage: number;
    /** Total pages */
    totalPages: number;
    /** Whether there are more results */
    hasMore: boolean;
}

/**
 * Configuration for search behavior
 */
export interface SearchConfig {
    /** Debounce time in milliseconds (default: 300) */
    debounceTime?: number;
    /** Minimum query length to trigger search (default: 0) */
    minQueryLength?: number;
    /** Enable caching of search results (default: true) */
    enableCache?: boolean;
    /** Cache TTL in milliseconds (default: 5 minutes) */
    cacheTTL?: number;
    /** Default page size (default: 20) */
    defaultPageSize?: number;
}

/**
 * Cache entry for search results
 */
interface CacheEntry<T> {
    data: SearchResult<T>;
    timestamp: number;
}

/**
 * Server-side search service with debouncing, caching, and pagination
 */
@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private readonly dataService = inject(DataService);

    // Subject for search queries
    private searchSubject = new Subject<SearchParams>();

    // Internal subscription for the search pipeline
    private searchSubscription?: Subscription;

    // Current search state
    private searchStateSubject = new BehaviorSubject<SearchState<any>>({
        results: [],
        loading: false,
        error: null,
        total: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false
    });

    // Cache for search results
    private cache = new Map<string, CacheEntry<any>>();

    // Current endpoint and config
    private currentEndpoint: string = '';
    private currentConfig: Required<SearchConfig> = {
        debounceTime: 300,
        minQueryLength: 0,
        enableCache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        defaultPageSize: 20
    };

    // Current search parameters
    private currentParams: SearchParams = {
        query: '',
        page: 1,
        perPage: 20
    };

    /**
     * Create a new search observable for a specific endpoint
     * @param endpoint - API endpoint for search
     * @param config - Search configuration
     * @returns Observable of search state
     */
    createSearch<T>(endpoint: string, config?: SearchConfig): Observable<SearchState<T>> {
        this.currentEndpoint = endpoint;
        this.currentConfig = { ...this.currentConfig, ...config };

        // Reset current params for the new search context
        this.currentParams = {
            query: '',
            page: 1,
            perPage: this.currentConfig.defaultPageSize,
            sortBy: undefined,
            sortDirection: undefined,
            filters: undefined
        };

        // Clean up any existing search pipeline subscription
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }

        // Set up the search pipeline
        this.searchSubscription = this.searchSubject.pipe(
            // Debounce to avoid too many requests
            debounceTime(this.currentConfig.debounceTime),

            // Only proceed if parameters changed
            distinctUntilChanged((prev, curr) =>
                prev.query === curr.query &&
                prev.page === curr.page &&
                prev.perPage === curr.perPage &&
                prev.sortBy === curr.sortBy &&
                prev.sortDirection === curr.sortDirection &&
                JSON.stringify(prev.filters) === JSON.stringify(curr.filters)
            ),

            // Update loading state
            tap(() => this.updateState({ loading: true, error: null })),

            // Switch to new search request (cancels previous)
            switchMap(params => this.performSearch<T>(params))
        ).subscribe({
            next: (result) => {
                this.updateState({
                    results: result.data,
                    loading: false,
                    error: null,
                    total: result.meta?.total || result.data.length,
                    currentPage: result.meta?.currentPage || this.currentParams.page || 1,
                    totalPages: result.meta?.lastPage || 1,
                    hasMore: (result.meta?.currentPage || 1) < (result.meta?.lastPage || 1)
                });
            },
            error: (error) => {
                this.updateState({
                    results: [],
                    loading: false,
                    error: error.error?.message || error.message || 'Search failed',
                    total: 0,
                    currentPage: 1,
                    totalPages: 1,
                    hasMore: false
                });
            }
        });

        return this.searchStateSubject.asObservable();
    }

    /**
     * Perform a search with just a query string
     * @param query - Search query
     */
    search(query: string): void {
        this.currentParams = {
            ...this.currentParams,
            query,
            page: 1 // Reset to first page on new search
        };

        // Check minimum query length
        if (query.length < this.currentConfig.minQueryLength) {
            this.updateState({
                results: [],
                loading: false,
                error: null,
                total: 0,
                currentPage: 1,
                totalPages: 1,
                hasMore: false
            });
            return;
        }

        this.searchSubject.next(this.currentParams);
    }

    /**
     * Perform a search with full parameters
     * @param params - Partial search parameters (merged with current)
     */
    searchWithParams(params: Partial<SearchParams>): void {
        this.currentParams = {
            ...this.currentParams,
            ...params
        };

        this.searchSubject.next(this.currentParams);
    }

    /**
     * Go to a specific page
     * @param page - Page number
     */
    goToPage(page: number): void {
        this.searchWithParams({ page });
    }

    /**
     * Change page size
     * @param perPage - Items per page
     */
    changePageSize(perPage: number): void {
        this.searchWithParams({ perPage, page: 1 });
    }

    /**
     * Update sort parameters
     * @param sortBy - Field to sort by
     * @param sortDirection - Sort direction
     */
    updateSort(sortBy: string, sortDirection: 'asc' | 'desc'): void {
        this.searchWithParams({ sortBy, sortDirection });
    }

    /**
     * Update filters
     * @param filters - Filter object
     */
    updateFilters(filters: Record<string, any>): void {
        this.searchWithParams({ filters, page: 1 });
    }

    /**
     * Clear search and reset state
     */
    clear(): void {
        this.currentParams = {
            query: '',
            page: 1,
            perPage: this.currentConfig.defaultPageSize
        };

        this.updateState({
            results: [],
            loading: false,
            error: null,
            total: 0,
            currentPage: 1,
            totalPages: 1,
            hasMore: false
        });
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get current search state (synchronous)
     */
    getCurrentState<T>(): SearchState<T> {
        return this.searchStateSubject.value;
    }

    /**
     * Perform the actual search request
     */
    private performSearch<T>(params: SearchParams): Observable<SearchResult<T>> {
        const cacheKey = this.getCacheKey(params);

        // Check cache if enabled
        if (this.currentConfig.enableCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.currentConfig.cacheTTL) {
                return of(cached.data as SearchResult<T>);
            }
        }

        // Build query parameters
        const queryParams = this.buildQueryParams(params);
        const url = `${this.currentEndpoint}?${queryParams}`;

        return this.dataService.get<any>(url).pipe(
            map(response => this.normalizeResponse<T>(response)),
            tap(result => {
                // Cache the result if enabled
                if (this.currentConfig.enableCache) {
                    this.cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                }
            }),
            catchError(error => {
                throw error;
            })
        );
    }

    /**
     * Build query parameters string
     */
    private buildQueryParams(params: SearchParams): string {
        const queryParts: string[] = [];

        if (params.query) {
            queryParts.push(`search=${encodeURIComponent(params.query)}`);
        }

        if (params.page) {
            queryParts.push(`page=${params.page}`);
        }

        if (params.perPage) {
            queryParts.push(`per_page=${params.perPage}`);
        }

        if (params.sortBy) {
            const sortBy = params.sortBy === 'createdAt' ? 'created_at' : params.sortBy;
            queryParts.push(`sort_by=${encodeURIComponent(sortBy)}`);
            queryParts.push(`order_by=${encodeURIComponent(sortBy)}`);
        }

        if (params.sortDirection) {
            queryParts.push(`sort_direction=${params.sortDirection}`);
            queryParts.push(`order=${params.sortDirection}`);
            queryParts.push(`direction=${params.sortDirection}`);
        }

        if (params.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
                }
            });
        }

        return queryParts.join('&');
    }

    /**
     * Normalize API response to standard format
     */
    private normalizeResponse<T>(response: any): SearchResult<T> {
        // Handle different response formats
        const data = response.data || response.results || response || [];
        const meta = response.meta || response.pagination || {};

        return {
            data: Array.isArray(data) ? data : [],
            meta: {
                currentPage: meta.current_page || meta.currentPage || 1,
                lastPage: meta.last_page || meta.lastPage || meta.total_pages || 1,
                perPage: meta.per_page || meta.perPage || 20,
                total: meta.total || data.length,
                from: meta.from,
                to: meta.to
            }
        };
    }

    /**
     * Generate cache key from search parameters
     */
    private getCacheKey(params: SearchParams): string {
        return JSON.stringify({
            endpoint: this.currentEndpoint,
            ...params
        });
    }

    /**
     * Update search state
     */
    private updateState(partial: Partial<SearchState<any>>): void {
        this.searchStateSubject.next({
            ...this.searchStateSubject.value,
            ...partial
        });
    }
}
