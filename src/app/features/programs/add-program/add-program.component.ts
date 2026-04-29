import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-add-program',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DropdownComponent,
    DatepickerComponent
  ],
  templateUrl: './add-program.component.html',
  styleUrls: ['./add-program.component.scss']
})
export class AddProgramComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs/programs-list' },
    { label: 'Add New Program', route: '/programs/add-program' }
  ];

  // Duplicate mode
  duplicateFromId: string | null = null;
  // Edit mode
  editProgramId: string | null = null;

  // Form data
  name = '';
  programCoordinator = '';
  initiative = '';
  project = '';
  branch = '';
  chooseSewa: string[] = [];
  startDateTime: Date | null = null;
  endDateTime: Date | null = null;
  repeatEndDate: Date | null = null;
  status = 'Active';
  repeats = 'once';
  remarks = '';

  isSubmitting = false;
  isLoading = false;

  // Dropdown options
  programCoordinatorOptions: DropdownOption[] = [];
  initiativeOptions: DropdownOption[] = [];
  projectOptions: DropdownOption[] = [];
  branchOptions: DropdownOption[] = [];
  sewaOptions: DropdownOption[] = [];

  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  readonly repeatsOptions: DropdownOption[] = [
    { id: '1', label: 'Once', value: 'once' },
    { id: '2', label: 'Weekly', value: 'weekly' },
    { id: '3', label: 'Monthly', value: 'monthly' }
  ];

  ngOnInit(): void {
    this.duplicateFromId = this.route.snapshot.queryParamMap.get('duplicateFrom');
    this.editProgramId = this.route.snapshot.paramMap.get('id');
    if (this.editProgramId) {
      this.breadcrumbs = [
        { label: 'Programs', route: '/programs/programs-list' },
        { label: 'Edit Program', route: '/programs/edit-program' }
      ];
    } else if (this.duplicateFromId) {
      this.breadcrumbs = [
        { label: 'Programs', route: '/programs/programs-list' },
        { label: 'Duplicate Program', route: '/programs/add-program' }
      ];
    }
    this.loadDropdownOptions();
  }

  private loadDropdownOptions(): void {
    let optionsLoaded = 0;
    const totalOptions = 5;

    const checkAndLoadDuplicate = () => {
      optionsLoaded++;
      if (optionsLoaded === totalOptions) {
        const sourceId = this.editProgramId || this.duplicateFromId;
        if (sourceId) {
          this.loadDuplicateData(sourceId);
        }
      }
    };

    this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'Volunteer' } }).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const sewas = response?.data?.sewas || response?.data || response || [];
      this.sewaOptions = (Array.isArray(sewas) ? sewas : []).map((s: any) => ({
        id: String(s.id),
        label: s.name || s.sewa_name || '',
        value: String(s.id)
      }));
      checkAndLoadDuplicate();
    });

    this.dataService.get<any>('v1/options/branches').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response || [];
      this.branchOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: String(item.id)
      }));
      checkAndLoadDuplicate();
    });

    this.dataService.get<any>('v1/options/programCordinators').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response || [];
      this.programCoordinatorOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: String(item.id)
      }));
      checkAndLoadDuplicate();
    });

    this.dataService.get<any>('v1/options/initiatives').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response || [];
      this.initiativeOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: String(item.id)
      }));
      checkAndLoadDuplicate();
    });

    this.dataService.get<any>('v1/options/projects').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response || [];
      this.projectOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: String(item.id)
      }));
      checkAndLoadDuplicate();
    });
  }

  private loadDuplicateData(programId: string): void {
    this.isLoading = true;
    this.dataService.get<any>(`v1/programs/${programId}`, { params: { actionType: 'edit' } }).pipe(
      catchError((err) => {
        console.error('Error loading program for duplication:', err);
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoading = false;
      if (!response) return;
      const data = response.data || response;

      this.name = data.name || '';
      this.programCoordinator = data.user_id ? String(data.user_id) : '';
      this.initiative = data.initiative_id ? String(data.initiative_id) : '';
      this.project = data.project_id ? String(data.project_id) : '';
      this.branch = data.branch_id ? String(data.branch_id) : '';
      this.chooseSewa = Array.isArray(data.program_sewas)
        ? data.program_sewas.map((s: any) => String(s.sewa_id || s.sewa?.id)).filter(Boolean)
        : [];
      this.startDateTime = data.start_date_time ? new Date(data.start_date_time) : null;
      this.endDateTime = data.end_date_time ? new Date(data.end_date_time) : null;
      this.status = data.status === 1 ? 'Active' : (data.status === 2 ? 'Inactive' : (data.status || 'Active'));
      this.repeats = (data.repeats || 'once').toLowerCase();
      this.repeatEndDate = data.repeat_ends ? new Date(data.repeat_ends) : null;
      this.remarks = data.remarks || '';
    });
  }

get isFormValid(): boolean {
    return !!(
      this.name.trim() &&
      this.programCoordinator &&
      this.initiative &&
      this.project &&
      this.branch &&
      this.chooseSewa.length > 0 &&
      this.startDateTime &&
      this.endDateTime &&
      (!this.isRecurring || this.repeatEndDate)
    );
  }

  get isRecurring(): boolean {
    return this.repeats === 'weekly' || this.repeats === 'monthly';
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    const payload: any = {
      name: this.name.trim(),
      user_id: this.programCoordinator,
      initiative_id: this.initiative,
      project_id: this.project,
      branch_id: this.branch,
      sewa_id: this.chooseSewa,
      start_date_time: this.formatDateOnly(this.startDateTime),
      end_date_time: this.formatDateOnly(this.endDateTime),
      status: this.status === 'Active' ? 1 : 2,
      repeats: this.repeats,
      repeat_ends: this.isRecurring ? this.formatDateOnly(this.repeatEndDate) : null,
      remarks: this.remarks.trim()
    };

    const apiCall = this.editProgramId
      ? this.dataService.put(`v1/programs/${this.editProgramId}`, payload)
      : (this.duplicateFromId
        ? this.dataService.post(`v1/programs/duplicate/${this.duplicateFromId}`, payload)
        : this.dataService.post('v1/programs/store', payload));

    apiCall.pipe(
      catchError((err) => {
        console.error('Error saving program:', err);
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe((response) => {
      this.isSubmitting = false;
      if (response === null) return;
      this.router.navigate(['/programs/programs-list']);
    });
  }

  private formatDateOnly(date: Date | null): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onCancel(): void {
    this.router.navigate(['/programs/programs-list']);
  }

  // Dropdown change handlers
  onProgramCoordinatorChange(values: any[] | null): void {
    this.programCoordinator = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onInitiativeChange(values: any[] | null): void {
    this.initiative = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onProjectChange(values: any[] | null): void {
    this.project = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onBranchChange(values: any[] | null): void {
    this.branch = values && values.length > 0 && values[0] !== '' ? values[0] : '';
  }

  onChooseSewaChange(values: any[] | null): void {
    this.chooseSewa = Array.isArray(values) ? values.filter(v => v !== '' && v != null).map(String) : [];
  }

  onStatusChange(values: any[] | null): void {
    if (values && values.length > 0) this.status = values[0];
  }

  onRepeatsChange(values: any[] | null): void {
    if (values && values.length > 0) this.repeats = values[0];
    if (!this.isRecurring) {
      this.repeatEndDate = null;
    }
  }

  onStartDateTimeChange(date: Date | null): void {
    this.startDateTime = date;
    if (date && this.endDateTime && this.endDateTime < date) {
      this.endDateTime = null;
    }
    if (this.endDateTime && this.repeatEndDate && this.repeatEndDate < this.endDateTime) {
      this.repeatEndDate = null;
    }
  }

  onEndDateTimeChange(date: Date | null): void {
    this.endDateTime = date;
    if (date && this.repeatEndDate && this.repeatEndDate < date) {
      this.repeatEndDate = null;
    }
  }

  onRepeatEndDateChange(date: Date | null): void {
    this.repeatEndDate = date;
  }

  get today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  get endDateMin(): Date {
    if (this.startDateTime) {
      const d = new Date(this.startDateTime);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return this.today;
  }

  get repeatEndDateMin(): Date {
    if (this.endDateTime) {
      const d = new Date(this.endDateTime);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return this.endDateMin;
  }
}
