import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DataService } from '../../data.service';
import { DropdownOption } from '../../shared/components/dropdown/dropdown.component';

@Injectable({
    providedIn: 'root'
})
export class OptionsService {
    private dataService = inject(DataService);

    /**
     * Generic method to fetch options from an endpoint and map them to DropdownOption format.
     * @param endpoint The API endpoint (relative to base API URL)
     * @param params Optional query parameters
     * @param labelKey The property to use as the label (default: 'name')
     * @param valueKey The property to use as the value (default: 'id')
     */
    getOptions(
        endpoint: string,
        params: any = {},
        labelKey: string = 'name',
        valueKey: string = 'id'
    ): Observable<DropdownOption[]> {
        return this.dataService.get<any>(endpoint, { params }).pipe(
            map(res => {
                // Handle different response structures: raw array, { data: [] }, { results: [] }
                const data = Array.isArray(res) ? res : (res.data || res.results || res || []);

                if (!Array.isArray(data)) {
                    console.warn(`Expected array from ${endpoint} but got`, data);
                    return [];
                }

                return data.map((item: any) => ({
                    id: String(item[valueKey] || item.id), // Ensure ID is string for DropdownOption
                    label: item[labelKey] || item.name || item.title || item.label || 'Unknown',
                    value: item[valueKey] !== undefined ? item[valueKey] : item.id,
                    description: item.description,
                    // usage of optional properties if they exist in source
                    disabled: item.disabled
                }));
            })
        );
    }

    // --- Core Location Options ---
    getBranches(params?: any) { return this.getOptions('v1/options/branches', params); }
    getParentBranches(params?: any) { return this.getOptions('v1/options/parent/branches', params); }
    getCountries(params?: any) { return this.getOptions('v1/options/countries', params); }
    getStates(params?: any) { return this.getOptions('v1/options/states', params); }
    getCities(params?: any) { return this.getOptions('v1/options/cities', params); }
    getDistricts(params?: any) { return this.getOptions('v1/options/districts', params); }
    getLocationViaPincode(pincode: string) { return this.dataService.get<any>('v1/locationViaPincode', { params: { pincode } }); }

    // --- Program & Sewa Options ---
    getProgramSewas(params?: any) { return this.getOptions('v1/options/programSewas', params); }
    getSewas(params?: any) { return this.getOptions('v1/sewas', params); }
    getPrograms(params?: any) { return this.getOptions('v1/options/programs', params); }
    getProgramDates(params?: any) { return this.getOptions('v1/options/programDates', params); }
    getSewasByType(type: string, params: any = {}) { return this.getOptions('v1/options/sewasByType', { ...params, sewa_type: type }); }

    // --- Volunteer & User Options ---
    getDepartmentsHeads(params?: any) { return this.getOptions('v1/options/departments/heads', params); }
    getVolunteersAttendanceCount(params?: any) { return this.getOptions('v1/options/volunteersAttendanceCount', params); }
    getSkills(params?: any) { return this.getOptions('v1/options/skills', params); }
    getDegrees(params?: any) { return this.getOptions('v1/options/degrees', params); }
    getProfessions(params?: any) { return this.getOptions('v1/options/professions', params); }
    getLanguages(params?: any) { return this.getOptions('v1/options/languages', params); }
    getDressCodes(params?: any) { return this.getOptions('v1/options/dressCodes', params); }
    getBanks(params?: any) { return this.getOptions('v1/options/banks', params); }
    getCastes(params?: any) { return this.getOptions('v1/options/castes', params); }
    getNewspapers(params?: any) { return this.getOptions('v1/options/newspapers', params); }
    getRoles(params?: any) { return this.getOptions('v1/options/roles', params); }
    getUsersPensionEligible(params?: any) { return this.getOptions('v1/options/users/pension-eligible', params); }
    getProgramCoordinators(params?: any) { return this.getOptions('v1/options/programCordinators', params); }

    // --- Ashram / Specialized Options ---
    getAshramAdhaarAreas(params?: any) { return this.getOptions('v1/options/ashramAdhaarAreas', params); }
    getAshramWeaponTypes(params?: any) { return this.getOptions('v1/options/ashramWeaponTypes', params); }
    getAshramTechnicalQualifications(params?: any) { return this.getOptions('v1/options/ashramTechnicalQualifications', params); }

    // --- Organization Options ---
    getProjects(params?: any) { return this.getOptions('v1/options/projects', params); }
    getInitiatives(params?: any) { return this.getOptions('v1/options/initiatives', params); }

    // --- Reports ---
    getVolunteerAttendanceCountReport(params?: any) {
        // This is a report, might not be options, but adding as requested
        return this.dataService.get<any>('v1/reports/volunteer_attendance_count', { params });
    }

}
