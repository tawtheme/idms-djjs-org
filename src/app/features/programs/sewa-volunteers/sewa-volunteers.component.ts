import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

export interface UnallocatedVolunteer {
  id: number;
  uniqueId?: string;
  name: string;
  image?: string;
  phone?: string;
  hasAssignedSewa: boolean;
  assignedSewaName?: string;
}

export interface AllocatedVolunteer {
  id: number;
  uniqueId?: string;
  psvId?: string;
  badgeNo?: string;
  name: string;
  image?: string;
  head?: string;
  subHead?: string;
  headChecked: boolean;
  subHeadChecked: boolean;
  isRegular: boolean;
  sewa?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    LoadingComponent,
    EmptyStateComponent,
    IconComponent
  ],
  selector: 'app-sewa-volunteers',
  templateUrl: './sewa-volunteers.component.html',
  styleUrls: ['./sewa-volunteers.component.scss']
})
export class SewaVolunteersComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;
  private dataService = inject(DataService);
  private snackbar = inject(SnackbarService);

  // Filters
  selectedProgram: string[] = ['None'];
  selectedSewa: string[] = [];
  selectedGender: string[] = ['None'];
  selectedSewaAssignment: string[] = ['2'];

  // Filter options
  programOptions: DropdownOption[] = [
    { id: '0', label: 'None', value: 'None' }
    // TODO: Load actual program options from API
  ];

  sewaOptions: DropdownOption[] = [
    // TODO: Load actual sewa options from API
  ];

  genderOptions: DropdownOption[] = [
    { id: '0', label: 'None', value: 'None' },
    { id: '1', label: 'MALE', value: 'MALE' },
    { id: '2', label: 'FEMALE', value: 'FEMALE' },
    { id: '3', label: 'OTHER', value: 'OTHER' }
  ];

  sewaAssignmentOptions: DropdownOption[] = [
    { id: '2', label: 'Unassigned Volunteers', value: '2' },
    { id: '1', label: 'All Volunteers', value: '1' }
  ];

  // Unallocated Volunteers
  unallocatedVolunteers: UnallocatedVolunteer[] = [];
  allUnallocatedVolunteers: UnallocatedVolunteer[] = [];
  selectedUnallocated = new Set<number>();
  unallocatedSearchTerm = '';
  unallocatedPageSize = 50;
  unallocatedCurrentPage = 1;
  unallocatedTotalItems = 0;
  unallocatedSortField = 'id';
  unallocatedSortDirection: 'asc' | 'desc' = 'asc';
  isLoadingUnallocated = true;
  isLoadingMoreUnallocated = false;
  errorUnallocated: string | null = null;

  // Allocated Volunteers
  allocatedVolunteers: AllocatedVolunteer[] = [];
  allAllocatedVolunteers: AllocatedVolunteer[] = [];
  selectedAllocated = new Set<number>();
  allocatedSearchTerm = '';
  allocatedPageSize = 50;
  allocatedCurrentPage = 1;
  allocatedTotalItems = 0;
  allocatedSortField = '';
  allocatedSortDirection: 'asc' | 'desc' = 'asc';
  isLoadingAllocated = true;
  isLoadingMoreAllocated = false;
  errorAllocated: string | null = null;

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSizeDropdownOptions: DropdownOption[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs' },
    { label: 'Sewa Volunteers', route: '/programs/sewa-volunteers' }
  ];

  Math = Math;

  constructor() {
    // Initialize empty arrays - data will be loaded from API
    this.allUnallocatedVolunteers = [];
    this.allAllocatedVolunteers = [];

    // Initialize page size dropdown options
    this.pageSizeDropdownOptions = this.pageSizeOptions.map(s => ({
      id: String(s),
      label: `${s} entries`,
      value: s
    }));

  }

  ngOnInit(): void {
    this.loadActivePrograms();
    this.loadUnallocatedFromApi();
    this.loadAllocatedFromApi();
  }

  loadActivePrograms(): void {
    this.dataService.get<any>('v1/programs/active-for-attendance?action=assign_sewa').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const programs = response?.data?.programs || response?.data || [];
      const items = (Array.isArray(programs) ? programs : []).map((p: any) => ({
        id: String(p.id),
        label: p.name || p.program_name || '',
        value: String(p.id)
      }));
      this.programOptions = [
        { id: '0', label: 'None', value: 'None' },
        ...items
      ];
    });
  }

  // Filter change handlers
  onProgramChange(): void {
    const programId = this.selectedProgram[0];
    this.selectedSewa = [];
    this.sewaOptions = [];
    if (programId && programId !== 'None') {
      this.loadProgramSewas(programId);
    }
    this.applyFilters();
  }

  loadProgramSewas(programId: string): void {
    this.dataService.get<any>(`v1/options/programSewas?program_id=${programId}`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const sewas = response?.data?.sewas || response?.data || [];
      this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
        id: String(s.id),
        label: s.name || s.sewa_name || '',
        value: String(s.id)
      }));
    });
  }

  onSewaChange(): void {
    this.applyFilters();
  }

  onGenderChange(): void {
    this.applyFilters();
  }

  onSewaAssignmentChange(): void {
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    this.unallocatedCurrentPage = 1;
    this.allocatedCurrentPage = 1;
    this.loadUnallocatedFromApi();
    this.loadAllocatedFromApi();
  }

  private buildFilterParams(pageSize: number, currentPage: number): HttpParams {
    let params = new HttpParams()
      .set('per_page', pageSize.toString())
      .set('page', currentPage.toString());

    const programId = this.selectedProgram[0];
    if (programId && programId !== 'None') {
      params = params.set('program_id', programId);
    }

    if (this.selectedSewa.length > 0) {
      params = params.set('sewa_id', String(this.selectedSewa[0]));
    }

    const gender = this.selectedGender[0];
    if (gender && gender !== 'None') {
      params = params.set('gender', gender);
    }

    return params;
  }

  loadUnallocatedFromApi(append = false): void {
    if (append) {
      this.isLoadingMoreUnallocated = true;
    } else {
      this.isLoadingUnallocated = true;
    }
    this.errorUnallocated = null;
    const assignmentValue = this.selectedSewaAssignment[0] || '2';
    let params = this.buildFilterParams(this.unallocatedPageSize, this.unallocatedCurrentPage)
      .set('filter_by_sewa_assignment', assignmentValue);
    if (this.unallocatedSearchTerm.trim()) {
      params = params.set('search', this.unallocatedSearchTerm.trim());
    }

    this.dataService.get<any>('v1/program_sewa_volunteers/unassign', { params }).pipe(
      catchError((err) => {
        this.errorUnallocated = err?.error?.message || 'Failed to load volunteers';
        return of({ data: [] });
      }),
      finalize(() => {
        this.isLoadingUnallocated = false;
        this.isLoadingMoreUnallocated = false;
      })
    ).subscribe((response) => {
      const records = response?.data?.records || response?.data || [];
      const newRecords = (Array.isArray(records) ? records : []).map((v: any) => ({
        id: v.id,
        uniqueId: v.unique_id || '',
        name: v.name || v.volunteer_name || '',
        image: v.image || v.user_image || '',
        phone: v.phone || v.mobile || '',
        hasAssignedSewa: v.is_assigned === true || v.is_assigned === 1,
        assignedSewaName: v.assigned_sewa?.name || ''
      }));
      if (append) {
        this.unallocatedVolunteers = [...this.unallocatedVolunteers, ...newRecords];
      } else {
        this.unallocatedVolunteers = newRecords;
      }
      this.unallocatedTotalItems = response?.total || response?.meta?.total || this.unallocatedVolunteers.length;
    });
  }

  loadMoreUnallocated(): void {
    this.unallocatedCurrentPage++;
    this.loadUnallocatedFromApi(true);
  }

  get hasMoreUnallocated(): boolean {
    return this.unallocatedVolunteers.length < this.unallocatedTotalItems;
  }

  loadAllocatedFromApi(append = false): void {
    if (append) {
      this.isLoadingMoreAllocated = true;
    } else {
      this.isLoadingAllocated = true;
    }
    this.errorAllocated = null;
    let params = this.buildFilterParams(this.allocatedPageSize, this.allocatedCurrentPage)
      .set('filter_by_sewa_assignment', 'assigned');
    if (this.allocatedSearchTerm.trim()) {
      params = params.set('search', this.allocatedSearchTerm.trim());
    }

    this.dataService.get<any>('v1/program-sewa-volunteers/assigned', { params }).pipe(
      catchError((err) => {
        this.errorAllocated = err?.error?.message || 'Failed to load volunteers';
        return of({ data: [] });
      }),
      finalize(() => {
        this.isLoadingAllocated = false;
        this.isLoadingMoreAllocated = false;
      })
    ).subscribe((response) => {
      const records = response?.data?.records || response?.data || [];
      const newRecords = (Array.isArray(records) ? records : []).map((v: any) => {
        const psv = (v.user_program_sewa_volunteers && v.user_program_sewa_volunteers[0]) || {};
        const badgeId = psv.program_sewa_volunteer_badge?.badge_id;
        return {
          id: v.id,
          uniqueId: v.unique_id || '',
          psvId: psv.id || '',
          badgeNo: badgeId != null ? String(badgeId) : (v.badge_no || v.badge_number || ''),
          name: v.name || v.volunteer_name || '',
          image: v.image || v.user_image || '',
          head: psv.head != null ? String(psv.head) : (v.head || v.sewa_head || ''),
          subHead: psv.sub_head != null ? String(psv.sub_head) : (v.sub_head || v.sewa_sub_head || ''),
          headChecked: Number(psv.head) === 1,
          subHeadChecked: Number(psv.sub_head) === 1,
          isRegular: !!v.is_regular,
          sewa: psv.program_sewa?.sewa?.name || v.sewa || v.sewa_name || ''
        };
      });
      if (append) {
        this.allocatedVolunteers = [...this.allocatedVolunteers, ...newRecords];
      } else {
        this.allocatedVolunteers = newRecords;
      }
      this.allocatedTotalItems = response?.total || response?.meta?.total || this.allocatedVolunteers.length;
    });
  }

  loadMoreAllocated(): void {
    this.allocatedCurrentPage++;
    this.loadAllocatedFromApi(true);
  }

  get hasMoreAllocated(): boolean {
    return this.allocatedVolunteers.length < this.allocatedTotalItems;
  }

  // Unallocated Volunteers Methods
  applyUnallocatedFilter() {
    let filtered = [...this.allUnallocatedVolunteers];

    // Apply search filter
    if (this.unallocatedSearchTerm.trim()) {
      const search = this.unallocatedSearchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.phone?.toLowerCase().includes(search) ||
        v.id.toString().includes(search)
      );
    }

    // Apply program filter
    if (this.selectedProgram.length > 0 && !this.selectedProgram.includes('None')) {
      // TODO: Filter by program when program data is available
    }

    // Apply sewa filter
    if (this.selectedSewa.length > 0) {
      // TODO: Filter by sewa when sewa data is available
    }

    // Apply gender filter
    if (this.selectedGender.length > 0 && !this.selectedGender.includes('None')) {
      // TODO: Filter by gender when gender data is available in unallocated volunteers
    }

    // Apply sewa assignment filter
    if (this.selectedSewaAssignment.length > 0) {
      if (this.selectedSewaAssignment.includes('Unassigned Volunteers')) {
        // Show only unassigned volunteers (already filtered)
      } else if (this.selectedSewaAssignment.includes('Assigned Volunteers')) {
        // Show only assigned volunteers - move to allocated section
        filtered = [];
      }
    }

    if (this.unallocatedSortField) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[this.unallocatedSortField];
        const bVal = (b as any)[this.unallocatedSortField];
        if (aVal < bVal) return this.unallocatedSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.unallocatedSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.unallocatedVolunteers = filtered;
    this.unallocatedTotalItems = filtered.length;
    this.unallocatedCurrentPage = 1;
  }

  sortUnallocated(field: string) {
    if (this.unallocatedSortField === field) {
      this.unallocatedSortDirection = this.unallocatedSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.unallocatedSortField = field;
      this.unallocatedSortDirection = 'asc';
    }
    this.applyUnallocatedFilter();
  }

  getUnallocatedSortIcon(field: string): string {
    if (this.unallocatedSortField !== field) return 'unfold_more';
    return this.unallocatedSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  get pagedUnallocated(): UnallocatedVolunteer[] {
    return this.unallocatedVolunteers;
  }

  toggleSelectUnallocated(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedUnallocated.has(id)) {
      this.selectedUnallocated.delete(id);
    } else {
      this.selectedUnallocated.add(id);
    }
  }

  get selectableUnallocated(): UnallocatedVolunteer[] {
    return this.pagedUnallocated.filter(v => !v.hasAssignedSewa);
  }

  toggleSelectAllUnallocated(event: Event) {
    event.stopPropagation();
    if (this.isAllUnallocatedSelected()) {
      this.selectedUnallocated.clear();
    } else {
      this.selectableUnallocated.forEach(v => this.selectedUnallocated.add(v.id));
    }
  }

  isAllUnallocatedSelected(): boolean {
    return this.selectableUnallocated.length > 0 &&
           this.selectableUnallocated.every(v => this.selectedUnallocated.has(v.id));
  }

  isUnallocatedIndeterminate(): boolean {
    const selectedCount = this.selectableUnallocated.filter(v => this.selectedUnallocated.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.selectableUnallocated.length;
  }

  onUnallocatedPageChange(page: number) {
    this.unallocatedCurrentPage = page;
    this.loadUnallocatedFromApi();
  }

  onUnallocatedPageSizeChange(size: number) {
    this.unallocatedPageSize = size;
    this.unallocatedCurrentPage = 1;
    this.loadUnallocatedFromApi();
  }

  getUnallocatedPageSizeSelected(): DropdownOption[] {
    return [this.pageSizeDropdownOptions.find(o => o.value === this.unallocatedPageSize)!];
  }

  allocateVolunteers() {
    const ids = Array.from(this.selectedUnallocated).map(id => String(id));
    if (ids.length === 0) {
      alert('Please select at least one volunteer to allocate.');
      return;
    }

    const programId = this.selectedProgram[0];
    if (!programId || programId === 'None') {
      alert('Please select a program before allocating.');
      return;
    }

    const sewaId = this.selectedSewa[0];
    if (!sewaId) {
      alert('Please select a sewa before allocating.');
      return;
    }

    const body = {
      program_id: String(programId),
      sewa_id: String(sewaId),
      ids
    };

    this.dataService.post<any>('v1/program-sewa-volunteers/bulk-assign', body).pipe(
      catchError((err) => {
        alert(err?.error?.message || 'Failed to allocate volunteers.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.selectedUnallocated.clear();
      this.loadUnallocatedFromApi();
      this.loadAllocatedFromApi();
    });
  }

  // Allocated Volunteers Methods
  applyAllocatedFilter() {
    let filtered = [...this.allAllocatedVolunteers];

    // Apply search filter
    if (this.allocatedSearchTerm.trim()) {
      const search = this.allocatedSearchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.badgeNo?.toLowerCase().includes(search) ||
        v.head?.toLowerCase().includes(search) ||
        v.subHead?.toLowerCase().includes(search) ||
        v.sewa?.toLowerCase().includes(search) ||
        v.id.toString().includes(search)
      );
    }

    // Apply program filter
    if (this.selectedProgram.length > 0 && !this.selectedProgram.includes('None')) {
      // TODO: Filter by program when program data is available
    }

    // Apply sewa filter
    if (this.selectedSewa.length > 0) {
      filtered = filtered.filter(v => 
        v.sewa && this.selectedSewa.some(sewa => 
          v.sewa?.toLowerCase().includes(sewa.toLowerCase())
        )
      );
    }

    // Apply gender filter
    if (this.selectedGender.length > 0 && !this.selectedGender.includes('None')) {
      // TODO: Filter by gender when gender data is available in allocated volunteers
    }

    // Apply sewa assignment filter
    if (this.selectedSewaAssignment.length > 0) {
      if (this.selectedSewaAssignment.includes('Assigned Volunteers')) {
        // Show only assigned volunteers (already filtered)
      } else if (this.selectedSewaAssignment.includes('Unassigned Volunteers')) {
        // Show only unassigned volunteers - move to unallocated section
        filtered = [];
      }
    }

    this.allocatedVolunteers = filtered;
    this.allocatedTotalItems = filtered.length;
    this.allocatedCurrentPage = 1;
  }

  get pagedAllocated(): AllocatedVolunteer[] {
    return this.allocatedVolunteers;
  }

  toggleSelectAllocated(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedAllocated.has(id)) {
      this.selectedAllocated.delete(id);
    } else {
      this.selectedAllocated.add(id);
    }
  }

  toggleSelectAllAllocated(event: Event) {
    event.stopPropagation();
    if (this.isAllAllocatedSelected()) {
      this.selectedAllocated.clear();
    } else {
      this.pagedAllocated.forEach(v => this.selectedAllocated.add(v.id));
    }
  }

  isAllAllocatedSelected(): boolean {
    return this.pagedAllocated.length > 0 &&
           this.pagedAllocated.every(v => this.selectedAllocated.has(v.id));
  }

  isAllocatedIndeterminate(): boolean {
    const selectedCount = this.pagedAllocated.filter(v => this.selectedAllocated.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedAllocated.length;
  }

  onAllocatedPageChange(page: number) {
    this.allocatedCurrentPage = page;
    this.loadAllocatedFromApi();
  }

  onAllocatedPageSizeChange(size: number) {
    this.allocatedPageSize = size;
    this.allocatedCurrentPage = 1;
    this.loadAllocatedFromApi();
  }

  getAllocatedPageSizeSelected(): DropdownOption[] {
    return [this.pageSizeDropdownOptions.find(o => o.value === this.allocatedPageSize)!];
  }

  // Unassign modal state
  showUnassignModal = false;
  unassignReason = '';
  unassignRemarks = '';
  unassignError: string | null = null;
  isUnassigning = false;

  toggleHead(volunteer: AllocatedVolunteer, event: Event): void {
    event.stopPropagation();
    this.callHeadApi(volunteer, 'head', !volunteer.headChecked);
  }

  toggleSubHead(volunteer: AllocatedVolunteer, event: Event): void {
    event.stopPropagation();
    this.callHeadApi(volunteer, 'sub-head', !volunteer.subHeadChecked);
  }

  private callHeadApi(volunteer: AllocatedVolunteer, type: 'head' | 'sub-head', checked: boolean): void {
    const programId = this.selectedProgram[0];
    const sewaId = this.selectedSewa[0];
    if (!programId || programId === 'None' || !sewaId || !volunteer.psvId) {
      alert('Program and Sewa must be selected.');
      return;
    }

    const body = {
      program_id: String(programId),
      sewa_id: String(sewaId),
      program_sewa_volunteer_id: volunteer.psvId,
      action: checked ? '1' : '0'
    };

    const label = type === 'head' ? 'Head' : 'Sub Head';
    this.dataService.post<any>(`v1/program-sewa-volunteers/${type}`, body).pipe(
      catchError((err) => {
        this.snackbar.showError(err?.error?.message || `Failed to update ${label}.`);
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      if (type === 'head') {
        volunteer.headChecked = checked;
        if (checked) volunteer.subHeadChecked = false;
      } else {
        volunteer.subHeadChecked = checked;
        if (checked) volunteer.headChecked = false;
      }
      if (checked) {
        this.snackbar.showSuccess(`${volunteer.name} assigned as ${label}.`);
      } else {
        this.snackbar.showWarning(`${volunteer.name} removed from ${label}.`);
      }
    });
  }

  unassignVolunteers() {
    if (this.selectedAllocated.size === 0) {
      alert('Please select at least one volunteer to unassign.');
      return;
    }
    this.unassignReason = '';
    this.unassignRemarks = '';
    this.unassignError = null;
    this.showUnassignModal = true;
  }

  closeUnassignModal(): void {
    this.showUnassignModal = false;
  }

  confirmUnassign(): void {
    if (!this.unassignReason.trim()) {
      this.unassignError = 'Reason is required.';
      return;
    }
    const programId = this.selectedProgram[0];
    if (!programId || programId === 'None') {
      this.unassignError = 'Please select a program.';
      return;
    }
    const sewaId = this.selectedSewa[0];
    if (!sewaId) {
      this.unassignError = 'Please select a sewa.';
      return;
    }

    const body = {
      program_id: String(programId),
      sewa_id: String(sewaId),
      reason: this.unassignReason.trim(),
      remarks: this.unassignRemarks.trim(),
      ids: Array.from(this.selectedAllocated).map(id => String(id))
    };

    this.isUnassigning = true;
    this.unassignError = null;
    this.dataService.post<any>('v1/program-sewa-volunteers/bulk-unassign', body).pipe(
      catchError((err) => {
        this.unassignError = err?.error?.message || 'Failed to unassign volunteers.';
        return of(null);
      }),
      finalize(() => this.isUnassigning = false)
    ).subscribe((response) => {
      if (response === null) return;
      this.selectedAllocated.clear();
      this.showUnassignModal = false;
      this.loadUnallocatedFromApi();
      this.loadAllocatedFromApi();
    });
  }

  trackById(_index: number, item: UnallocatedVolunteer | AllocatedVolunteer): number {
    return item.id;
  }
}
