import { Component, HostListener, ElementRef, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, finalize, switchMap, tap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { SewaTrackingModalComponent } from './sewa-tracking-modal/sewa-tracking-modal.component';
import { CreateVolunteerComponent } from './create-volunteer/create-volunteer.component';
import { SidePanelComponent } from '../../../shared/components/side-panel/side-panel.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DataService } from '../../../data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { HeaderActionsService } from '../../../services/header-actions.service';

export interface Volunteer {
    id: number;
    image?: string;
    name: string;
    age?: number;
    relationName: string;
    gender?: string;
    uid?: string;
    badgeNo?: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        cityName?: string;
        districtName?: string;
        stateName?: string;
        correspondingBranch?: string;
        taskBranch?: string;
        mobileNumber?: string;
    };
    regularSewa?: {
        tracking?: string;
        sewaName?: string;
        count?: number;
    };
    userSewas?: Array<{
        allocationDate?: string;
        sewaName: string;
        branchName: string;
        badgeId: number | string;
    }>;
    enterBy?: string;
    sewaInterest: boolean;
    sewaAllocated?: boolean;
    sewaMode?: string;
    roleId?: string;
    branchId?: string;
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        PagerComponent,
        EmptyStateComponent,
        MenuDropdownComponent,
        DropdownComponent,
        SewaTrackingModalComponent,
        CreateVolunteerComponent,
        SidePanelComponent,
        ModalComponent,
        IconComponent,
        DatepickerComponent
    ],
    selector: 'app-all-volunteers',
    templateUrl: './all-volunteers.component.html',
    styleUrls: ['./all-volunteers.component.scss']
})
export class AllVolunteersComponent implements OnInit, OnDestroy {
    @ViewChild('exportWrapper') exportWrapper!: ElementRef;
    @ViewChild('createVolunteerComponent') createVolunteerComponent!: CreateVolunteerComponent;

    private dataService = inject(DataService);
    private headerActions = inject(HeaderActionsService);
    private router = inject(Router);

    volunteers: Volunteer[] = [];
    allVolunteers: Volunteer[] = [];

    // Loading and error states
    isLoading = true; // Start with true to show loader on initial load
    error: string | null = null;

    // Selection
    selectedVolunteers = new Set<number>();

    // Filters
    searchTerm = ''; // Legacy combined search (still used by some logic)
    selectedGender: any[] = [];
    genderOptions: DropdownOption[] = [];
    selectedTaskBranch: any[] = [];
    taskBranchOptions: DropdownOption[] = [];
    sortOrder: any[] = [];
    sortOrderOptions: DropdownOption[] = [];

    // Individual text filter fields (per design)
    filterFields = {
        badgeNo: '',
        name: '',
        relationName: '',
        mobileNo: '',
        uid: ''
    };

    // Split sort: Sort By (field) + Order By (direction)
    sortByField: any[] = [];
    orderByDirection: any[] = [];
    sortByOptions: DropdownOption[] = [];
    orderByOptions: DropdownOption[] = [];

    // Filter panel toggle (open by default)
    filtersExpanded = true;

    // Create Volunteer Modal
    createVolunteerModalOpen = false;

    // Sewa Interest reason modal
    sewaReasonModalOpen = false;
    sewaReasonVolunteer: (Volunteer & { uuid?: string }) | null = null;
    sewaReasonForm = { reason: '', remarks: '' };
    sewaReasonOptions: DropdownOption[] = [
        { id: 'none', label: 'None', value: 'None' },
        { id: 'lack_of_time', label: 'Lack of time', value: 'Lack of time' },
        { id: 'health', label: 'Health reasons', value: 'Health reasons' },
        { id: 'personal', label: 'Personal reasons', value: 'Personal reasons' },
        { id: 'other', label: 'Other', value: 'Other' }
    ];
    selectedSewaReason: any[] = [];
    isSubmittingSewaReason = false;

    // Inline filter options (previously in more-filters modal)
    correspondingBranchOptions: DropdownOption[] = [];
    branchSearchTypeOptions: DropdownOption[] = [];
    sewaOptions: DropdownOption[] = [];
    sewaInterestOptions: DropdownOption[] = [
        { id: 'none', label: 'None', value: 'none' },
        { id: '1', label: 'Interested', value: '1' },
        { id: '0', label: 'Not Interested', value: '0' }
    ];
    sewaAllocatedOptions: DropdownOption[] = [
        { id: 'none', label: 'None', value: 'none' },
        { id: '1', label: 'Allocated', value: '1' },
        { id: '0', label: 'UnAllocated', value: '0' }
    ];
    sewaModeOptions: DropdownOption[] = [
        { id: 'none', label: 'None', value: 'none' },
        { id: '1', label: 'Regular', value: '1' },
        { id: '0', label: 'Annual', value: '0' }
    ];

    moreFilters: any = {
        correspondingBranch: [],
        branchSearchType: [],
        sewa: [],
        sewaInterest: [],
        sewaAllocated: [],
        sewaMode: []
    };

    // Pagination
    pageSizeOptions: number[] = [20, 50, 100];
    pageSize = 20;
    currentPage = 1;
    totalItems = 0;

    // Server-side search debounce
    private search$ = new Subject<void>();

    breadcrumbs: BreadcrumbItem[] = [
        { label: 'Manage Volunteers', route: '/volunteers' },
        { label: 'All Volunteers', route: '/volunteers' }
    ];

    constructor() {
        this.buildFilterOptions();
    }

    ngOnInit(): void {
        this.search$.pipe(
            debounceTime(300),
            switchMap(() => this.fetchVolunteers$())
        ).subscribe();

        this.loadVolunteers();
        this.loadSewaOptions();
        this.loadBranches();
        this.loadRoles();
        this.headerActions.set({
            label: 'Create Volunteer',
            icon: 'add',
            type: 'primary',
            onClick: () => this.openCreateVolunteerModal()
        });
    }

    ngOnDestroy(): void {
        this.headerActions.clear();
    }

    loadSewaOptions(): void {
        this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } }).pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const sewas = response?.data?.sewas || response?.data || response || [];
            this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
                id: String(s.id),
                label: s.name || s.sewa_name || '',
                value: String(s.id)
            }));
        });
    }

    loadBranches(): void {
        this.dataService.get<any>('v1/options/branches').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
            const options: DropdownOption[] = (Array.isArray(data) ? data : []).map((branch: any) => ({
                id: String(branch.id),
                label: branch.name || branch.label || branch.title || '',
                value: String(branch.id)
            }));
            this.taskBranchOptions = options;
            this.correspondingBranchOptions = options;
        });
    }

    /**
     * Loads volunteers from the API using current filter/sort/pagination state.
     */
    loadVolunteers(): void {
        this.fetchVolunteers$().subscribe();
    }

    private isMeaningful(v: any): boolean {
        return v !== undefined && v !== null && v !== '' && v !== 'none';
    }

    private buildVolunteersQueryParams(): { [key: string]: string | number } {
        const params: { [key: string]: string | number } = {
            page: this.currentPage,
            per_page: this.pageSize
        };

        const setIfMeaningful = (key: string, value: any) => {
            if (this.isMeaningful(value)) params[key] = value;
        };

        setIfMeaningful('branch_id', this.selectedTaskBranch[0]);
        setIfMeaningful('home_branch', this.moreFilters.correspondingBranch[0]);
        setIfMeaningful('branch_type', this.moreFilters.branchSearchType[0]);
        setIfMeaningful('sewa_id', this.moreFilters.sewa[0]);
        setIfMeaningful('badge_id', (this.filterFields.badgeNo || '').trim());
        setIfMeaningful('gender', this.selectedGender[0]);
        setIfMeaningful('name', (this.filterFields.name || '').trim());
        setIfMeaningful('relation_name', (this.filterFields.relationName || '').trim());
        setIfMeaningful('mobile_number', (this.filterFields.mobileNo || '').trim());
        setIfMeaningful('unique_id', (this.filterFields.uid || '').trim());
        // For these three, 'none' is a valid value the API expects (not skipped).
        const setIfPresent = (key: string, value: any) => {
            if (value !== undefined && value !== null && value !== '') params[key] = value;
        };
        setIfPresent('sewa_interest', this.moreFilters.sewaInterest[0]);
        setIfPresent('sewa_assigned', this.moreFilters.sewaAllocated[0]);
        setIfPresent('sewa_mode', this.moreFilters.sewaMode[0]);
        setIfMeaningful('sortByColumn', this.sortByField[0]);
        setIfMeaningful('orderBy', this.orderByDirection[0]);

        return params;
    }

    private fetchVolunteers$() {
        this.isLoading = true;
        this.error = null;

        return this.dataService.get<any>('v1/volunteers', { params: this.buildVolunteersQueryParams() }).pipe(
            catchError((error) => {
                console.error('Error loading volunteers:', error);
                this.error = error.error?.message || error.message || 'Failed to load volunteers. Please try again.';
                return of({ data: [] });
            }),
            finalize(() => {
                this.isLoading = false;
            })
        ).pipe(
            tap((response: any) => this.applyVolunteersResponse(response))
        );
    }

    private formatAllocationDate(value: any): string {
        if (!value) return '';
        const str = String(value).trim();
        // Try parsing "DD/MM/YYYY hh:mm am/pm" first
        const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i);
        let date: Date;
        if (m) {
            const [, dd, mm, yyyy, hh, min, ampm] = m;
            let hour = parseInt(hh, 10) % 12;
            if (ampm.toLowerCase() === 'pm') hour += 12;
            date = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), hour, parseInt(min, 10));
        } else {
            const parsed = new Date(str);
            if (isNaN(parsed.getTime())) return str; // fallback to raw string
            date = parsed;
        }
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        let hour = date.getHours();
        const minute = date.getMinutes().toString().padStart(2, '0');
        const ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12 || 12;
        return `${day} ${month}, ${year} at ${hour}:${minute}${ampm}`;
    }

    private applyVolunteersResponse(response: any): void {
        const volunteersData = response?.data || response?.volunteers || response?.results || response || [];
        const meta = response?.meta || response?.pagination || {};
        this.totalItems = Number(meta.total ?? response?.total ?? (Array.isArray(volunteersData) ? volunteersData.length : 0));

        this.volunteers = (Array.isArray(volunteersData) ? volunteersData : []).map((item: any) => {
            const firstImage = item.user_image?.full_path || (item.user_images && item.user_images.length > 0 ? item.user_images[0].full_path : null);
            const relationOf = item.user_profile?.relation_of || {};
            const relationName = Object.entries(relationOf)
                .filter(([, value]) => value != null && String(value).trim() !== '')
                .map(([key, value]) => `${key.split('_')[0]} ${value}`)
                .join(', ');

            const userAddress = item.user_address || {};
            const addressArray = Array.isArray(userAddress) ? userAddress : [userAddress];
            const primaryAddress = addressArray[0] || {};

            const regularSewa = item.regular_sewa || {};
            const sewaArray = Array.isArray(regularSewa) ? regularSewa : [regularSewa];
            const primarySewa = sewaArray[0] || {};

            const rolesRaw = Array.isArray(item.roles) ? item.roles : (Array.isArray(item.user_roles) ? item.user_roles : []);
            const firstRole = rolesRaw[0];
            const roleId = firstRole
                ? String(firstRole.pivot?.role_id ?? firstRole.id ?? '')
                : (item.role_id != null ? String(item.role_id) : '');

            const branchId = primaryAddress.working_branch?.id != null
                ? String(primaryAddress.working_branch.id)
                : (primaryAddress.task_branch_id != null ? String(primaryAddress.task_branch_id)
                    : (primaryAddress.branch_id != null ? String(primaryAddress.branch_id) : ''));

            const userSewasRaw = Array.isArray(item.user_sewas) ? item.user_sewas : [];
            const userSewas = userSewasRaw.map((us: any) => ({
                sewaName: us?.sewa?.name || '',
                branchName: us?.branch?.name || '',
                badgeId: us?.badge_id ?? '',
                allocationDate: this.formatAllocationDate(us?.created_at)
            }));

            const volunteer: Volunteer & { uuid?: string } = {
                id: item.unique_id,
                uuid: item.id,
                image: firstImage,
                name: item.name || '',
                age: item.user_profile?.age || null,
                relationName: relationName || item.user_profile?.relation_name || '',
                gender: item.user_profile?.gender ?
                    item.user_profile.gender.charAt(0).toUpperCase() + item.user_profile.gender.slice(1).toLowerCase() : '',
                uid: item.uid || item.user_profile?.uid || '',
                badgeNo: item.badge_no || item.badge_number || '',
                address: {
                    street: primaryAddress.address_1 || primaryAddress.street || '',
                    city: primaryAddress.city || '',
                    state: primaryAddress.state || '',
                    pincode: primaryAddress.pincode || primaryAddress.pin_code || '',
                    cityName: primaryAddress.city ? `City : ${primaryAddress.city}` : '',
                    districtName: primaryAddress.district ? `District : ${primaryAddress.district}` : '',
                    stateName: primaryAddress.state ? `State : ${primaryAddress.state}` : '',
                    correspondingBranch: primaryAddress.home_branch?.name
                        ? `Corresponding Branch : ${primaryAddress.home_branch.name}`
                        : (primaryAddress.corresponding_branch ? `Corresponding Branch : ${primaryAddress.corresponding_branch}` : ''),
                    taskBranch: primaryAddress.working_branch?.name
                        ? `Task Branch : ${primaryAddress.working_branch.name}`
                        : (primaryAddress.task_branch ? `Task Branch : ${primaryAddress.task_branch}` : ''),
                    mobileNumber: item.phone ? `Mobile Number : ${item.phone}` : ''
                },
                regularSewa: primarySewa.tracking || primarySewa.sewa_name || primarySewa.count ? {
                    tracking: primarySewa.tracking || '',
                    sewaName: primarySewa.sewa_name || primarySewa.name || '',
                    count: primarySewa.count || primarySewa.sewa_count || null
                } : undefined,
                userSewas,
                enterBy: item.user_created_by?.name || '',
                sewaInterest: item.user_profile?.sewa_interest === 1 || item.sewa_interest === true,
                sewaAllocated: item.sewa_allocated === true || item.sewa_allocated === 1,
                sewaMode: item.sewa_mode || primarySewa.mode || '',
                roleId: roleId || undefined,
                branchId: branchId || undefined
            };

            return volunteer;
        });

        this.allVolunteers = this.volunteers;
    }

    /**
     * Builds filter options
     */
    private buildFilterOptions(): void {
        this.genderOptions = [
            { id: 'MALE', label: 'MALE', value: 'MALE' },
            { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
            { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
        ];

        this.sortOrderOptions = [
            { id: '0', label: 'None', value: '' },
            { id: '1', label: 'Name (ASC)', value: 'name:asc' },
            { id: '2', label: 'Name (DESC)', value: 'name:desc' },
            { id: '3', label: 'Id (ASC)', value: 'id:asc' },
            { id: '4', label: 'Id (DESC)', value: 'id:desc' }
        ];

        this.sortByOptions = [
            { id: 'address_1', label: 'Address', value: 'address_1' },
            { id: 'dob', label: 'Age', value: 'dob' },
            { id: 'badge_id', label: 'Badge No', value: 'badge_id' },
            { id: 'created_at', label: 'Created date', value: 'created_at' },
            { id: 'city', label: 'City', value: 'city' },
            { id: 'created_by', label: 'Enter By', value: 'created_by' },
            { id: 'father_name', label: 'Father Name', value: 'father_name' },
            { id: 'gender', label: 'Gender', value: 'gender' },
            { id: 'home_branch', label: 'Home Branch', value: 'home_branch' },
            { id: 'unique_id', label: 'Id', value: 'unique_id' },
            { id: 'mother_name', label: 'Mother Name', value: 'mother_name' },
            { id: 'name', label: 'Name', value: 'name' },
            { id: 'phone', label: 'Mobile', value: 'phone' },
            { id: 'spouse_name', label: 'Spouse Name', value: 'spouse_name' },
            { id: 'regular_sewa', label: 'Sewa Name', value: 'regular_sewa' }
        ];

        this.orderByOptions = [
            { id: 'ASC', label: 'ASC', value: 'ASC' },
            { id: 'DESC', label: 'DESC', value: 'DESC' }
        ];

        this.taskBranchOptions = [];
        this.correspondingBranchOptions = [];

        this.branchSearchTypeOptions = [
            { id: 'both', label: 'In Both', value: 'both' }
        ];

        this.sewaOptions = [];
    }

    get filteredVolunteers(): Volunteer[] {
        return this.volunteers;
    }

    get pagedVolunteers(): Volunteer[] {
        // Server-side pagination — current page is already the response page
        return this.volunteers;
    }

    trackById(_: number, v: Volunteer): number {
        return v.id;
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.search$.next();
    }

    resetFilter(): void {
        this.searchTerm = '';
        this.filterFields = { badgeNo: '', name: '', relationName: '', mobileNo: '', uid: '' };
        this.sortByField = [];
        this.orderByDirection = [];
        this.selectedGender = [];
        this.selectedTaskBranch = [];
        this.sortOrder = [];
        this.moreFilters = {
            correspondingBranch: [],
            branchSearchType: [],
            sewa: [],
            sewaInterest: [],
            sewaAllocated: [],
            sewaMode: []
        };
        this.currentPage = 1;
        this.loadVolunteers();
    }

    sortBy(field: string): void {
        // Map UI column ids to API column names
        const columnMap: { [key: string]: string } = {
            id: 'unique_id',
            name: 'name',
            relationName: 'father_name',
            enterBy: 'created_by'
        };
        const apiField = columnMap[field] || field;

        const currentField = this.sortByField[0];
        const currentDir = this.orderByDirection[0] || 'ASC';
        const nextDir = currentField === apiField && currentDir === 'ASC' ? 'DESC' : 'ASC';

        this.sortByField = [apiField];
        this.orderByDirection = [nextDir];
        this.onSearchChange();
    }

    getSortDirection(field: string): 'asc' | 'desc' | null {
        const columnMap: { [key: string]: string } = {
            id: 'unique_id',
            name: 'name',
            relationName: 'father_name',
            enterBy: 'created_by'
        };
        const apiField = columnMap[field] || field;
        if (this.sortByField[0] !== apiField) return null;
        return (this.orderByDirection[0] === 'DESC') ? 'desc' : 'asc';
    }

    // Pagination event handlers
    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadVolunteers();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = Math.max(20, size);
        this.currentPage = 1;
        this.loadVolunteers();
    }

    // Selection handlers
    toggleSelectAll(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked) {
            this.pagedVolunteers.forEach(v => this.selectedVolunteers.add(v.id));
        } else {
            this.pagedVolunteers.forEach(v => this.selectedVolunteers.delete(v.id));
        }
    }

    toggleSelectVolunteer(id: number, event: Event): void {
        event.stopPropagation();
        if (this.selectedVolunteers.has(id)) {
            this.selectedVolunteers.delete(id);
        } else {
            this.selectedVolunteers.add(id);
        }
    }

    isAllSelected(): boolean {
        return this.pagedVolunteers.length > 0 &&
            this.pagedVolunteers.every(v => this.selectedVolunteers.has(v.id));
    }

    isIndeterminate(): boolean {
        const selectedCount = this.pagedVolunteers.filter(v => this.selectedVolunteers.has(v.id)).length;
        return selectedCount > 0 && selectedCount < this.pagedVolunteers.length;
    }

    // Action handlers
    getActionOptions(volunteer: Volunteer): MenuOption[] {
        return [
            { id: 'view', label: 'View', value: 'view', icon: 'visibility' },
            { id: 'edit', label: 'Edit', value: 'edit', icon: 'edit' },
            { id: 'convert_desiring', label: 'Convert to Desiring Devotee', value: 'convert_desiring', icon: 'swap_horiz' },
            { id: 'change_role', label: 'Change Role', value: 'change_role', icon: 'trending_up' },
            { id: 'change_branch', label: 'Change Branch', value: 'change_branch', icon: 'trending_up' },
            { id: 'generate_password', label: 'Generate Password', value: 'generate_password', icon: 'bolt' }
        ];
    }

    onAction(volunteer: Volunteer, action: any): void {
        if (!action) return;
        const actionId = typeof action === 'string' ? action : (action.value || action.id);

        switch (actionId) {
            case 'view': this.viewDetails(volunteer); break;
            case 'edit': this.editVolunteer(volunteer); break;
            case 'convert_desiring': this.convertToDesiringDevotee(volunteer); break;
            case 'change_role': this.changeRole(volunteer); break;
            case 'change_branch': this.changeBranch(volunteer); break;
            case 'generate_password': this.generatePassword(volunteer); break;
        }
    }

    // Convert to Desiring Devotee confirmation modal state
    desiringConfirmModalOpen = false;
    desiringConfirmVolunteer: Volunteer | null = null;
    isSubmittingDesiring = false;

    // Probation dates modal state
    probationModalOpen = false;
    probationVolunteer: Volunteer | null = null;
    probationStartDate: Date | null = null;
    probationEndDate: Date | null = null;
    probationError: string | null = null;

    convertToDesiringDevotee(volunteer: Volunteer): void {
        this.desiringConfirmVolunteer = volunteer;
        this.desiringConfirmModalOpen = true;
    }

    closeDesiringConfirmModal(): void {
        this.desiringConfirmModalOpen = false;
        this.desiringConfirmVolunteer = null;
    }

    confirmConvertToDesiringDevotee(): void {
        const volunteer = this.desiringConfirmVolunteer;
        if (!volunteer) return;
        // Move from confirmation modal to probation dates modal
        this.probationVolunteer = volunteer;
        this.probationStartDate = null;
        this.probationEndDate = null;
        this.probationError = null;
        this.desiringConfirmModalOpen = false;
        this.desiringConfirmVolunteer = null;
        this.probationModalOpen = true;
    }

    closeProbationModal(): void {
        if (this.isSubmittingDesiring) return;
        this.probationModalOpen = false;
        this.probationVolunteer = null;
        this.probationStartDate = null;
        this.probationEndDate = null;
        this.probationError = null;
    }

    private toIsoDate(d: Date | null): string {
        if (!d) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    submitDesiringConversion(): void {
        const volunteer = this.probationVolunteer;
        if (!volunteer || this.isSubmittingDesiring) return;

        if (!this.probationStartDate) {
            this.probationError = 'Probation Start Date is required.';
            return;
        }
        if (!this.probationEndDate) {
            this.probationError = 'Probation End Date is required.';
            return;
        }
        if (this.probationEndDate.getTime() < this.probationStartDate.getTime()) {
            this.probationError = 'Probation End Date cannot be before Start Date.';
            return;
        }

        const original = this.allVolunteers.find(v => v.id === volunteer.id) as (Volunteer & { uuid?: string }) | undefined;
        const userId = (volunteer as Volunteer & { uuid?: string }).uuid || original?.uuid || String(volunteer.id);

        const payload = {
            user_id: userId,
            probation_start_date: this.toIsoDate(this.probationStartDate),
            probation_end_date: this.toIsoDate(this.probationEndDate)
        };

        this.isSubmittingDesiring = true;
        this.probationError = null;
        this.dataService.put('v1/volunteers/convert-to-desiring-devotees', payload).pipe(
            catchError((error) => {
                console.error('Error converting to desiring devotee:', error);
                this.probationError = error?.error?.message || 'Failed to convert to desiring devotee.';
                return of(null);
            }),
            finalize(() => {
                this.isSubmittingDesiring = false;
            })
        ).subscribe((response) => {
            if (response !== null) {
                this.probationModalOpen = false;
                this.probationVolunteer = null;
                this.probationStartDate = null;
                this.probationEndDate = null;
                this.loadVolunteers();
            }
        });
    }

    // Change Role modal
    changeRoleModalOpen = false;
    changeRoleVolunteer: Volunteer | null = null;
    roleOptions: DropdownOption[] = [];
    selectedRole: any[] = [];
    isSubmittingRole = false;
    changeRoleConfirmOpen = false;

    changeRole(volunteer: Volunteer): void {
        this.changeRoleVolunteer = volunteer;
        this.selectedRole = volunteer.roleId ? [volunteer.roleId] : [];
        this.changeRoleModalOpen = true;
        if (this.roleOptions.length === 0) {
            this.loadRoles();
        }
    }

    loadRoles(): void {
        this.dataService.get<any>('v1/options/roles').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const roles = response?.data?.roles || response?.data || response?.results || response || [];
            this.roleOptions = (Array.isArray(roles) ? roles : []).map((r: any) => ({
                id: String(r.id ?? r.value ?? r.name),
                label: r.name || r.label || r.title || '',
                value: String(r.id ?? r.value ?? r.name)
            }));
        });
    }

    closeChangeRoleModal(): void {
        this.changeRoleModalOpen = false;
        this.changeRoleVolunteer = null;
        this.selectedRole = [];
    }

    openChangeRoleConfirm(): void {
        if (!this.selectedRole || this.selectedRole.length === 0) {
            alert('Please select a role.');
            return;
        }
        this.changeRoleConfirmOpen = true;
    }

    closeChangeRoleConfirm(): void {
        this.changeRoleConfirmOpen = false;
    }

    confirmChangeRole(): void {
        const volunteer = this.changeRoleVolunteer;
        if (!volunteer || this.isSubmittingRole) return;

        const original = this.allVolunteers.find(v => v.id === volunteer.id) as (Volunteer & { uuid?: string }) | undefined;
        const userId = (volunteer as Volunteer & { uuid?: string }).uuid || original?.uuid || String(volunteer.id);

        const payload = {
            user_id: userId,
            roles: this.selectedRole.map((r: any) => String(r))
        };

        this.isSubmittingRole = true;
        this.dataService.put('v1/users/change-role', payload).pipe(
            catchError((error) => {
                console.error('Error updating role:', error);
                alert('Failed to update role. Please try again.');
                return of(null);
            }),
            finalize(() => {
                this.isSubmittingRole = false;
            })
        ).subscribe((response) => {
            if (response !== null) {
                this.closeChangeRoleConfirm();
                this.closeChangeRoleModal();
                this.loadVolunteers();
            }
        });
    }

    // Change Branch modal
    changeBranchModalOpen = false;
    changeBranchVolunteer: Volunteer | null = null;
    selectedBranch: any[] = [];
    isSubmittingBranch = false;
    changeBranchConfirmOpen = false;

    changeBranch(volunteer: Volunteer): void {
        this.changeBranchVolunteer = volunteer;
        this.selectedBranch = volunteer.branchId ? [volunteer.branchId] : [];
        this.changeBranchModalOpen = true;
    }

    closeChangeBranchModal(): void {
        this.changeBranchModalOpen = false;
        this.changeBranchVolunteer = null;
        this.selectedBranch = [];
    }

    openChangeBranchConfirm(): void {
        if (!this.selectedBranch || this.selectedBranch.length === 0) {
            alert('Please select a branch.');
            return;
        }
        this.changeBranchConfirmOpen = true;
    }

    closeChangeBranchConfirm(): void {
        this.changeBranchConfirmOpen = false;
    }

    confirmChangeBranch(): void {
        const volunteer = this.changeBranchVolunteer;
        if (!volunteer || this.isSubmittingBranch) return;

        const original = this.allVolunteers.find(v => v.id === volunteer.id) as (Volunteer & { uuid?: string }) | undefined;
        const userId = (volunteer as Volunteer & { uuid?: string }).uuid || original?.uuid || String(volunteer.id);

        const payload = {
            user_id: userId,
            branch_id: this.selectedBranch[0]
        };

        this.isSubmittingBranch = true;
        this.dataService.put('v1/users/change-branch', payload).pipe(
            catchError((error) => {
                console.error('Error updating branch:', error);
                alert('Failed to update branch. Please try again.');
                return of(null);
            }),
            finalize(() => {
                this.isSubmittingBranch = false;
            })
        ).subscribe((response) => {
            if (response !== null) {
                this.closeChangeBranchConfirm();
                this.closeChangeBranchModal();
                this.loadVolunteers();
            }
        });
    }

    getSelectedRoleLabel(): string {
        if (!this.selectedRole || this.selectedRole.length === 0) return '';
        const opt = this.roleOptions.find(o => String(o.value) === String(this.selectedRole[0]));
        return opt?.label || '';
    }

    getSelectedBranchLabel(): string {
        if (!this.selectedBranch || this.selectedBranch.length === 0) return '';
        const opt = this.taskBranchOptions.find(o => String(o.value) === String(this.selectedBranch[0]));
        return opt?.label || '';
    }

    // Generate Password modal
    generatedPasswordModalOpen = false;
    generatedPassword: string = '';
    isGeneratingPassword = false;

    generatePassword(volunteer: Volunteer): void {
        if (this.isGeneratingPassword) return;

        const original = this.allVolunteers.find(v => v.id === volunteer.id) as (Volunteer & { uuid?: string }) | undefined;
        const userId = (volunteer as Volunteer & { uuid?: string }).uuid || original?.uuid || String(volunteer.id);

        this.isGeneratingPassword = true;
        this.dataService.put<any>('v1/users/update-password', { user_id: userId }).pipe(
            catchError((error) => {
                console.error('Error generating password:', error);
                alert('Failed to generate password. Please try again.');
                return of(null);
            }),
            finalize(() => {
                this.isGeneratingPassword = false;
            })
        ).subscribe((response) => {
            if (response === null) return;
            const password = response?.data?.password
                || response?.password
                || response?.data?.new_password
                || response?.new_password
                || '';
            this.generatedPassword = password;
            this.generatedPasswordModalOpen = true;
        });
    }

    closeGeneratedPasswordModal(): void {
        this.generatedPasswordModalOpen = false;
        this.generatedPassword = '';
    }

    viewDetails(volunteer: Volunteer): void {
        const uuid = (volunteer as any).uuid || volunteer.id;
        this.router.navigate(['/volunteers', uuid, 'view']);
    }

    editVolunteer(volunteer: Volunteer): void {
        const uuid = (volunteer as any).uuid || volunteer.id;
        this.router.navigate(['/volunteers', uuid, 'edit']);
    }

    deleteVolunteer(volunteer: Volunteer): void {
        if (confirm(`Are you sure you want to delete ${volunteer.name}?`)) {
            // Find the original volunteer data to get UUID if available
            const originalVolunteer = this.allVolunteers.find(v => v.id === volunteer.id);
            const volunteerUuid = (originalVolunteer as any)?.uuid || volunteer.id;

            this.dataService.delete(`v1/volunteers/${volunteerUuid}`).pipe(
                catchError((error) => {
                    console.error('Error deleting volunteer:', error);
                    alert('Failed to delete volunteer. Please try again.');
                    return of(null);
                })
            ).subscribe(() => {
                this.loadVolunteers();
            });
        }
    }

    // Toggle Sewa Interest
    toggleSewaInterest(volunteer: Volunteer, event: Event): void {
        event.stopPropagation();
        if (volunteer.sewaInterest) {
            this.openSewaReasonModal(volunteer);
        } else {
            this.commitSewaInterest(volunteer, 1);
        }
    }

    private openSewaReasonModal(volunteer: Volunteer): void {
        this.sewaReasonVolunteer = volunteer as Volunteer & { uuid?: string };
        this.sewaReasonForm = { reason: '', remarks: '' };
        this.selectedSewaReason = [];
        this.sewaReasonModalOpen = true;
    }

    closeSewaReasonModal(): void {
        this.sewaReasonModalOpen = false;
        this.sewaReasonVolunteer = null;
    }

    onSewaReasonChange(event: string[]): void {
        this.selectedSewaReason = event;
        this.sewaReasonForm.reason = event?.[0] || '';
    }

    submitSewaReason(): void {
        if (!this.sewaReasonVolunteer) return;
        const volunteer = this.sewaReasonVolunteer;
        this.isSubmittingSewaReason = true;
        this.commitSewaInterest(volunteer, 0, this.sewaReasonForm.reason, this.sewaReasonForm.remarks)
            .add(() => {
                this.isSubmittingSewaReason = false;
                this.closeSewaReasonModal();
            });
    }

    private commitSewaInterest(volunteer: Volunteer, value: 0 | 1, reason: string = '', remarks: string = '') {
        const previous = volunteer.sewaInterest;
        volunteer.sewaInterest = value === 1;

        const original = this.allVolunteers.find(v => v.id === volunteer.id) as (Volunteer & { uuid?: string }) | undefined;
        const userId = (volunteer as Volunteer & { uuid?: string }).uuid || original?.uuid || String(volunteer.id);

        const payload = {
            user_id: userId,
            sewa_interest: value,
            reason: reason || '',
            remarks: remarks || ''
        };

        return this.dataService.put('v1/users/update-sewa-interest', payload).pipe(
            catchError((error) => {
                console.error('Error updating sewa interest:', error);
                volunteer.sewaInterest = previous;
                alert('Failed to update sewa interest. Please try again.');
                return of(null);
            })
        ).subscribe();
    }

    // Format address
    formatAddress(address: Volunteer['address']): string {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.cityName) parts.push(address.cityName);
        if (address.stateName) parts.push(address.stateName);
        if (address.correspondingBranch) parts.push(address.correspondingBranch);
        if (address.taskBranch) parts.push(address.taskBranch);
        if (address.mobileNumber) parts.push(address.mobileNumber);
        return parts.join('\n');
    }

    // Export functionality
    exportMenuOpen = false;

    // Sewa Tracking Modal
    sewaTrackingModalOpen = false;
    selectedVolunteerForSewa: Volunteer | null = null;

    getExportOptions(): MenuOption[] {
        return [
            {
                id: 'export',
                label: 'Export selected records',
                value: 'export',
                icon: 'download'
            },
            {
                id: 'print',
                label: 'Print selected records',
                value: 'print',
                icon: 'print'
            }
        ];
    }

    toggleExportMenu(): void {
        this.exportMenuOpen = !this.exportMenuOpen;
    }

    onExportAction(action: any): void {
        if (!action) return;
        const actionId = typeof action === 'string' ? action : (action.value || action.id);

        this.exportMenuOpen = false;

        if (actionId === 'export') {
            this.exportSelectedRecords();
        } else if (actionId === 'print') {
            this.printSelectedRecords();
        }
    }

    exportSelectedRecords(): void {
        if (this.selectedVolunteers.size === 0) {
            alert('Please select at least one record to export.');
            return;
        }
        console.log('Export selected records');
    }

    printSelectedRecords(): void {
        if (this.selectedVolunteers.size === 0) {
            alert('Please select at least one record to print.');
            return;
        }
        console.log('Print selected records');
    }

    // Open Sewa Tracking Modal
    openSewaTrackingModal(volunteer: Volunteer, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.selectedVolunteerForSewa = volunteer;
        this.sewaTrackingModalOpen = true;
    }

    closeSewaTrackingModal(): void {
        this.sewaTrackingModalOpen = false;
        this.selectedVolunteerForSewa = null;
    }

    getSelectedUserId(): string | null {
        return (this.selectedVolunteerForSewa as any)?.uuid || null;
    }

    getBranchName(): string {
        return this.selectedVolunteerForSewa?.address?.correspondingBranch?.replace('Corresponding branch : ', '') ||
            this.selectedVolunteerForSewa?.address?.taskBranch?.replace('Task branch : ', '') ||
            'NURMAHAL';
    }

    toggleFiltersPanel(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    totalActiveFiltersCount(): number {
        let count = 0;
        if (this.selectedGender.length > 0) count++;
        if (this.selectedTaskBranch.length > 0) count++;
        if (this.sortOrder.length > 0 && this.sortOrder[0]) count++;
        if (this.sortByField.length > 0) count++;
        if (this.orderByDirection.length > 0) count++;
        if (this.filterFields.badgeNo) count++;
        if (this.filterFields.name) count++;
        if (this.filterFields.relationName) count++;
        if (this.filterFields.mobileNo) count++;
        if (this.filterFields.uid) count++;
        count += this.activeMoreFiltersCount();
        return count;
    }

    // Filter state helpers
    hasActiveMoreFilters(): boolean {
        return this.activeMoreFiltersCount() > 0;
    }

    activeMoreFiltersCount(): number {
        return Object.values(this.moreFilters).filter((v: any) => Array.isArray(v) && v.length > 0).length;
    }

    hasAnyActiveFilter(): boolean {
        const anyTextField = !!(this.filterFields.badgeNo || this.filterFields.name ||
            this.filterFields.relationName || this.filterFields.mobileNo || this.filterFields.uid);
        return !!this.searchTerm || anyTextField ||
            this.sortByField.length > 0 || this.orderByDirection.length > 0 ||
            this.selectedGender.length > 0 ||
            this.selectedTaskBranch.length > 0 ||
            (this.sortOrder.length > 0 && !!this.sortOrder[0]) ||
            this.hasActiveMoreFilters();
    }

    clearMoreFilters(): void {
        this.moreFilters = {
            correspondingBranch: [],
            branchSearchType: [],
            sewa: [],
            sewaInterest: [],
            sewaAllocated: [],
            sewaMode: []
        };
        this.onSearchChange();
    }

    // Create Volunteer Modal Methods
    createVolunteerFooterButtons = [
        {
            text: 'Cancel',
            type: 'secondary' as const,
            action: 'cancel'
        },
        {
            text: 'Submit',
            type: 'primary' as const,
            action: 'submit'
        }
    ];

    openCreateVolunteerModal(): void {
        this.createVolunteerModalOpen = true;
    }

    closeCreateVolunteerModal(): void {
        this.createVolunteerModalOpen = false;
    }

    onFooterAction(action: string): void {
        if (action === 'cancel') {
            this.closeCreateVolunteerModal();
        } else if (action === 'submit') {
            // Trigger form submission in create-volunteer component
            if (this.createVolunteerComponent) {
                this.createVolunteerComponent.submitForm();
            }
        }
    }

    onVolunteerCreated(): void {
        this.closeCreateVolunteerModal();
        this.loadVolunteers(); // Reload the volunteers list
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
            this.exportMenuOpen = false;
        }
    }
}

