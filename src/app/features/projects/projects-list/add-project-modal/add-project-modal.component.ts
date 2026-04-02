import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DropdownComponent
  ],
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.scss']
})
export class AddProjectModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  private dataService = inject(DataService);

  // Form data
  name = '';
  selectedProjectHead: any[] = [];
  selectedInitiative: any[] = [];
  description = '';
  status = 1; // Default active

  // Dropdown options
  projectHeadOptions: DropdownOption[] = [];
  initiativeOptions: DropdownOption[] = [];
  readonly statusOptions: DropdownOption[] = [
    { id: '1', label: 'Active', value: 1 },
    { id: '2', label: 'Inactive', value: 0 }
  ];

  // Loading state
  isSubmitting = false;

  ngOnInit(): void {
    this.loadProjectHeadOptions();
    this.loadInitiativeOptions();
  }

  private loadProjectHeadOptions(): void {
    this.dataService.get<any>('v1/options/departments/heads').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response.data || response.results || []);
      this.projectHeadOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name || item.label || '',
        value: item.id
      }));
    });
  }

  private loadInitiativeOptions(): void {
    this.dataService.get<any>('v1/options/initiatives').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response.data || response.results || []);
      this.initiativeOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name || item.label || '',
        value: item.id
      }));
    });
  }

  get footerButtons(): Array<{
    text: string;
    type: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    action?: string;
  }> {
    return [
      { text: 'Cancel', type: 'secondary', action: 'cancel' },
      { text: 'Submit', type: 'primary', disabled: !this.isFormValid || this.isSubmitting, action: 'submit' }
    ];
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;

    const payload = {
      name: this.name.trim(),
      user_id: this.selectedProjectHead[0],
      initiative_id: this.selectedInitiative[0],
      description: this.description.trim(),
      status: this.status
    };

    this.dataService.post<any>('v1/projects/store', payload).pipe(
      catchError((err) => {
        console.error('Error creating project:', err);
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe((response) => {
      this.isSubmitting = false;
      if (response === null) return;
      this.resetForm();
      this.submit.emit();
      this.close.emit();
    });
  }

  onFooterAction(action: string): void {
    if (action === 'submit') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.onClose();
    }
  }

  onProjectHeadChange(values: any[] | null): void {
    this.selectedProjectHead = values || [];
  }

  onInitiativeChange(values: any[] | null): void {
    this.selectedInitiative = values || [];
  }

  onStatusChange(values: any[] | null): void {
    if (values && values.length > 0) {
      this.status = values[0];
    }
  }

  get isFormValid(): boolean {
    return !!(
      this.name.trim() &&
      this.selectedProjectHead.length > 0 &&
      this.selectedInitiative.length > 0 &&
      this.description.trim()
    );
  }

  private resetForm(): void {
    this.name = '';
    this.selectedProjectHead = [];
    this.selectedInitiative = [];
    this.description = '';
    this.status = 1;
  }
}
