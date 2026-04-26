import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { DataService } from '../../data.service';
import { DropdownOption } from '../../shared/components/dropdown/dropdown.component';

/**
 * Service for loading location data (countries, states, districts, cities)
 * with caching to optimize API calls
 */
@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private readonly dataService = inject(DataService);

    // Cache for location data
    private countriesCache$?: Observable<DropdownOption[]>;
    private statesCache = new Map<string, Observable<DropdownOption[]>>();
    private districtsCache = new Map<string, Observable<DropdownOption[]>>();
    private citiesCache = new Map<string, Observable<DropdownOption[]>>();

    /**
     * Load all countries
     * Results are cached to avoid redundant API calls
     */
    loadCountries(): Observable<DropdownOption[]> {
        if (!this.countriesCache$) {
            this.countriesCache$ = this.dataService
                .get<any>('v1/options/countries')
                .pipe(
                    map(response => this.transformToDropdownOptions(response)),
                    shareReplay(1) // Cache the result
                );
        }
        return this.countriesCache$;
    }

    /**
     * Load states for a specific country
     * Results are cached per country to avoid redundant API calls
     * @param countryName - Name of the country
     */
    loadStates(countryName: string): Observable<DropdownOption[]> {
        if (!countryName) {
            return of([]);
        }

        const cacheKey = countryName.toLowerCase();

        if (!this.statesCache.has(cacheKey)) {
            const states$ = this.dataService
                .get<any>(`v1/options/states?country=${encodeURIComponent(countryName)}`)
                .pipe(
                    map(response => this.transformToDropdownOptions(response)),
                    shareReplay(1) // Cache the result
                );
            this.statesCache.set(cacheKey, states$);
        }

        return this.statesCache.get(cacheKey)!;
    }

    /**
     * Load districts for a specific state
     * Results are cached per state to avoid redundant API calls
     * @param stateName - Name of the state
     * @param countryName - Optional country name for more specific filtering
     */
    loadDistricts(stateName: string, countryName?: string): Observable<DropdownOption[]> {
        if (!stateName) {
            return of([]);
        }

        const cacheKey = `${stateName.toLowerCase()}_${(countryName || '').toLowerCase()}`;

        if (!this.districtsCache.has(cacheKey)) {
            const countryParam = countryName ? `&country=${encodeURIComponent(countryName)}` : '';
            const districts$ = this.dataService
                .get<any>(`v1/options/districts?state=${encodeURIComponent(stateName)}${countryParam}`)
                .pipe(
                    map(response => this.transformToDropdownOptions(response)),
                    shareReplay(1) // Cache the result
                );
            this.districtsCache.set(cacheKey, districts$);
        }

        return this.districtsCache.get(cacheKey)!;
    }

    /**
     * Load cities for a specific state or district
     * Results are cached to avoid redundant API calls
     * @param params - Parameters for loading cities
     */
    loadCities(params: {
        stateName?: string;
        districtName?: string;
        countryName?: string;
    }): Observable<DropdownOption[]> {
        const { stateName, districtName, countryName } = params;

        if (!stateName && !districtName) {
            return of([]);
        }

        // Create cache key from all parameters
        const cacheKey = `${(stateName || '').toLowerCase()}_${(districtName || '').toLowerCase()}_${(countryName || '').toLowerCase()}`;

        if (!this.citiesCache.has(cacheKey)) {
            let queryParams = '';

            if (countryName) {
                queryParams += `country=${encodeURIComponent(countryName)}`;
            }

            if (stateName) {
                queryParams += queryParams ? '&' : '';
                queryParams += `state=${encodeURIComponent(stateName)}`;
            }

            if (districtName) {
                queryParams += queryParams ? '&' : '';
                queryParams += `district=${encodeURIComponent(districtName)}`;
            }

            const cities$ = this.dataService
                .get<any>(`v1/options/cities?${queryParams}`)
                .pipe(
                    map(response => this.transformToDropdownOptions(response)),
                    shareReplay(1) // Cache the result
                );
            this.citiesCache.set(cacheKey, cities$);
        }

        return this.citiesCache.get(cacheKey)!;
    }

    /**
     * Clear all caches
     * Useful when data needs to be refreshed
     */
    clearCache(): void {
        this.countriesCache$ = undefined;
        this.statesCache.clear();
        this.districtsCache.clear();
        this.citiesCache.clear();
    }

    /**
     * Clear specific cache
     * @param type - Type of cache to clear
     */
    clearSpecificCache(type: 'countries' | 'states' | 'districts' | 'cities'): void {
        switch (type) {
            case 'countries':
                this.countriesCache$ = undefined;
                break;
            case 'states':
                this.statesCache.clear();
                break;
            case 'districts':
                this.districtsCache.clear();
                break;
            case 'cities':
                this.citiesCache.clear();
                break;
        }
    }

    /**
     * Transform API response to dropdown options
     * Handles both key-value map and array formats
     */
    private transformToDropdownOptions(response: any): DropdownOption[] {
        const data = response?.data || response?.results || response?.options || response;

        // Handle key-value map format: { "1": "Option Label", "2": "Another Label" }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return Object.entries(data)
                .map(([key, val]) => ({
                    id: String(key),
                    label: String(val),
                    value: String(key)
                }))
                .filter(opt => opt.id !== '' && opt.id !== 'undefined');
        }

        // Handle array format: [ { id: 1, name: "Label" }, ... ]
        return (Array.isArray(data) ? data : [])
            .map((item: any) => {
                const id = item.id !== undefined ? item.id : item.value;
                const label = item.name || item.label || item.title || item.text || '';
                return {
                    id: id !== undefined ? String(id) : '',
                    label: label,
                    value: id !== undefined ? String(id) : ''
                };
            })
            .filter(opt => opt.id !== '' && opt.id !== 'undefined');
    }

    /**
     * Get location label by ID from cached data
     * @param type - Type of location (country, state, district, city)
     * @param id - ID of the location
     * @param parentContext - Parent context for hierarchical lookups
     */
    getLocationLabel(
        type: 'country' | 'state' | 'district' | 'city',
        id: string,
        parentContext?: { countryName?: string; stateName?: string; districtName?: string }
    ): Observable<string> {
        switch (type) {
            case 'country':
                return this.loadCountries().pipe(
                    map(options => options.find(opt => opt.value === id)?.label || '')
                );
            case 'state':
                if (!parentContext?.countryName) {
                    return of('');
                }
                return this.loadStates(parentContext.countryName).pipe(
                    map(options => options.find(opt => opt.value === id)?.label || '')
                );
            case 'district':
                if (!parentContext?.stateName) {
                    return of('');
                }
                return this.loadDistricts(parentContext.stateName, parentContext.countryName).pipe(
                    map(options => options.find(opt => opt.value === id)?.label || '')
                );
            case 'city':
                return this.loadCities({
                    stateName: parentContext?.stateName,
                    districtName: parentContext?.districtName,
                    countryName: parentContext?.countryName
                }).pipe(
                    map(options => options.find(opt => opt.value === id)?.label || '')
                );
            default:
                return of('');
        }
    }
}
