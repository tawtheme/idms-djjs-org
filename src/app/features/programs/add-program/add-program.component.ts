import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
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
    BreadcrumbComponent,
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

  // Form data
  name = '';
  programCoordinator = '';
  initiative = '';
  project = '';
  branch = '';
  chooseSewa = '';
  startDateTime: Date | null = null;
  endDateTime: Date | null = null;
  status = 'Active';
  repeats = 'Once';
  remarks = '';

  isSubmitting = false;

  // Dropdown options
  programCoordinatorOptions: DropdownOption[] = [];
  initiativeOptions: DropdownOption[] = [];
  projectOptions: DropdownOption[] = [];
  branchOptions: DropdownOption[] = [];

  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 'Active' },
    { id: '2', label: 'Inactive', value: 'Inactive' }
  ];

  readonly repeatsOptions: DropdownOption[] = [
    { id: '1', label: 'Once', value: 'Once' },
    { id: '2', label: 'Daily', value: 'Daily' },
    { id: '3', label: 'Weekly', value: 'Weekly' },
    { id: '4', label: 'Monthly', value: 'Monthly' },
    { id: '5', label: 'Yearly', value: 'Yearly' }
  ];

  ngOnInit(): void {
    this.duplicateFromId = this.route.snapshot.queryParamMap.get('duplicateFrom');
    if (this.duplicateFromId) {
      this.breadcrumbs = [
        { label: 'Programs', route: '/programs/programs-list' },
        { label: 'Duplicate Program', route: '/programs/add-program' }
      ];
    }
    this.loadDropdownOptions();
  }

  private loadDropdownOptions(): void {
    let optionsLoaded = 0;
    const totalOptions = 4;

    const checkAndLoadDuplicate = () => {
      optionsLoaded++;
      if (optionsLoaded === totalOptions && this.duplicateFromId) {
        this.loadDuplicateData(this.duplicateFromId);
      }
    };

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

    this.dataService.get<any>('v1/options/coordinators').pipe(
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
    this.dataService.get<any>(`v1/programs/view/${programId}`).pipe(
      catchError((err) => {
        console.error('Error loading program for duplication:', err);
        return of(null);
      })
    ).subscribe((response) => {
      if (!response) return;
      const data = response.data || response;

      // Pre-fill all fields except name, startDateTime, and endDateTime
      this.programCoordinator = data.user?.id ? String(data.user.id) : (data.coordinator_id ? String(data.coordinator_id) : '');
      this.initiative = data.initiative?.id ? String(data.initiative.id) : '';
      this.project = data.project?.id ? String(data.project.id) : '';
      this.branch = data.branch?.id ? String(data.branch.id) : '';
      this.chooseSewa = data.choose_sewa || '';
      this.status = data.status === 1 ? 'Active' : (data.status === 2 ? 'Inactive' : (data.status || 'Active'));
      this.repeats = data.repeats || 'Once';
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
      this.chooseSewa.trim() &&
      this.startDateTime &&
      this.endDateTime
    );
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    const payload = {
      name: this.name.trim(),
      coordinator_id: this.programCoordinator,
      initiative_id: this.initiative,
      project_id: this.project,
      branch_id: this.branch,
      choose_sewa: this.chooseSewa.trim(),
      start_date_time: this.startDateTime?.toISOString(),
      end_date_time: this.endDateTime?.toISOString(),
      status: this.status,
      repeats: this.repeats,
      remarks: this.remarks.trim()
    };

    const apiCall = this.duplicateFromId
      ? this.dataService.post(`v1/programs/duplicate/${this.duplicateFromId}`, payload)
      : this.dataService.post('v1/programs', payload);

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

  onStatusChange(values: any[] | null): void {
    if (values && values.length > 0) this.status = values[0];
  }

  onRepeatsChange(values: any[] | null): void {
    if (values && values.length > 0) this.repeats = values[0];
  }

  onStartDateTimeChange(date: Date | null): void {
    this.startDateTime = date;
  }

  onEndDateTimeChange(date: Date | null): void {
    this.endDateTime = date;
  }
}
