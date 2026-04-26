/**
 * Create Volunteer Component
 * 
 * This component handles the creation of new volunteers through a form interface.
 * It supports both file upload and live camera capture for profile images.
 * The form data is submitted to the API via DataService.
 */

import { Component, Input, Output, EventEmitter, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';
import { FileUploadComponent, FileUploadConfig } from '../../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DataService } from '../../../../data.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { sanitizeMobile, mobileError, emailError, blockNonDigitKey } from '../../../../shared/utils/validators';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Form data structure for creating a volunteer
 */
export interface CreateVolunteerForm {
  name: string;
  phone: string;
  dob: Date | null;
  spouseName: string;
  fatherName: string;
  motherName: string;
  whatsappNumber: string;
  email: string;
  aadhaarNumber: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownComponent,
    DatepickerComponent,
    FileUploadComponent,
    CameraUploadComponent,
    ModalComponent
  ],
  selector: 'app-create-volunteer',
  templateUrl: './create-volunteer.component.html',
  styleUrls: ['./create-volunteer.component.scss']
})
export class CreateVolunteerComponent implements OnInit {
  @ViewChild('volunteerForm') volunteerForm!: NgForm;
  @Output() volunteerCreated = new EventEmitter<void>();
  @Input() hideBreadcrumbs: boolean = false;
  @Input() hideFormActions: boolean = false;

  private dataService = inject(DataService);
  private snackbarService = inject(SnackbarService);
  private router = inject(Router);

  isLoading = false;
  error: string | null = null;

  form: CreateVolunteerForm = {
    name: '',
    phone: '',
    dob: null,
    spouseName: '',
    fatherName: '',
    motherName: '',
    whatsappNumber: '',
    email: '',
    aadhaarNumber: ''
  };

  copyAsWhatsapp: boolean = false;

  phoneInputWarning: string = '';
  whatsappInputWarning: string = '';
  private phoneWarningTimer?: ReturnType<typeof setTimeout>;
  private whatsappWarningTimer?: ReturnType<typeof setTimeout>;

  // Profile image
  profileImage: File | null = null;
  profileImagePreview: string | null = null;
  imageOptions: DropdownOption[] = [
    { id: '1', label: 'Upload from local', value: 'upload' },
    { id: '2', label: 'Capture live photo', value: 'capture' }
  ];
  selectedImage: any[] = [];
  selectedImageType: 'upload' | 'capture' | null = null;
  imageModalOpen: boolean = false;
  fileUploadConfig: FileUploadConfig = {
    multiple: false,
    accept: 'image/*',
    maxSizeMb: 5,
    maxFiles: 1,
    dropText: 'Drag & drop image here or',
    buttonText: 'Browse',
    showFileListHeader: false
  };

  // Sewa & Branch
  sewaOptions: DropdownOption[] = [];
  branchOptions: DropdownOption[] = [];
  selectedSewas: any[] = [];
  selectedCorrespondingBranch: any[] = [];
  selectedTaskBranch: any[] = [];

  ngOnInit(): void {
    this.loadBranches();
    this.loadSewas();
  }

  private loadBranches(): void {
    this.dataService.get<any>('v1/options/branches').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = Array.isArray(response) ? response : (response?.data || response?.results || []);
      this.branchOptions = (Array.isArray(data) ? data : []).map((b: any) => ({
        id: String(b.id),
        label: b.name || b.label || b.title || '',
        value: String(b.id)
      }));
    });
  }

  private loadSewas(): void {
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

  onDobChange(date: Date | null): void {
    this.form.dob = date;
  }

  onPhoneChange(): void {
    this.form.phone = sanitizeMobile(this.form.phone);
    this.phoneInputWarning = '';
    if (this.copyAsWhatsapp) {
      this.form.whatsappNumber = this.form.phone;
    }
  }

  onWhatsappChange(): void {
    this.form.whatsappNumber = sanitizeMobile(this.form.whatsappNumber);
    this.whatsappInputWarning = '';
  }

  onCopyAsWhatsappChange(): void {
    if (this.copyAsWhatsapp) {
      this.form.whatsappNumber = this.form.phone;
    }
  }

  onImageChange(selection: string[]): void {
    this.selectedImage = selection;
    if (selection?.length > 0) {
      const v = selection[0];
      if (v === 'upload' || v === 'capture') {
        this.selectedImageType = v;
        this.clearImage();
        this.imageModalOpen = true;
      } else {
        this.selectedImageType = null;
      }
    } else {
      this.selectedImageType = null;
    }
  }

  closeImageModal(): void { this.imageModalOpen = false; }

  reopenImageModal(): void {
    if (this.selectedImageType) this.imageModalOpen = true;
  }

  onFilesSelected(files: File[]): void {
    if (files?.length > 0) {
      this.profileImage = files[0];
      this.createImagePreview(this.profileImage);
      this.imageModalOpen = false;
    }
  }

  onFileRejected(rejection: { file: File; reason: string }): void {
    this.snackbarService.showError(`File rejected: ${rejection.reason}`);
  }

  onFileRemoved(file: File): void {
    if (this.profileImage === file) this.clearImage();
  }

  onCameraImageRemoved(): void {
    this.clearImage();
    this.selectedImage = [];
    this.selectedImageType = null;
  }

  onImageCaptured(file: File): void {
    this.profileImage = file;
    this.createImagePreview(file);
    this.imageModalOpen = false;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) this.profileImagePreview = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }

  private clearImage(): void {
    this.profileImage = null;
    this.profileImagePreview = null;
  }

  blockNonDigit(event: KeyboardEvent, field: 'phone' | 'whatsapp'): void {
    const blocked = blockNonDigitKey(event);
    if (!blocked) return;
    if (field === 'phone') {
      this.phoneInputWarning = blocked;
      clearTimeout(this.phoneWarningTimer);
      this.phoneWarningTimer = setTimeout(() => (this.phoneInputWarning = ''), 2000);
    } else {
      this.whatsappInputWarning = blocked;
      clearTimeout(this.whatsappWarningTimer);
      this.whatsappWarningTimer = setTimeout(() => (this.whatsappInputWarning = ''), 2000);
    }
  }

  get phoneError(): string {
    return mobileError(this.form.phone);
  }

  get whatsappError(): string {
    return mobileError(this.form.whatsappNumber);
  }

  get emailError(): string {
    return emailError(this.form.email);
  }

  submitForm(): void {
    if (this.isFormValid()) {
      this.onSubmit();
    } else {
      const errorMessage = 'Name and Mobile Number are required fields.';
      this.error = errorMessage;
      this.snackbarService.showError(errorMessage);
      if (this.volunteerForm) {
        Object.keys(this.volunteerForm.controls).forEach(key => {
          this.volunteerForm.controls[key].markAsTouched();
        });
      }
    }
  }

  /**
   * Resets the entire form to initial state
   */
  onReset(): void {
    this.resetForm();
    this.selectedSewas = [];
    this.selectedCorrespondingBranch = [];
    this.selectedTaskBranch = [];
    this.selectedImage = [];
    this.selectedImageType = null;
    this.clearImage();
    this.error = null;
  }

  private resetForm(): void {
    this.form = {
      name: '',
      phone: '',
      dob: null,
      spouseName: '',
      fatherName: '',
      motherName: '',
      whatsappNumber: '',
      email: '',
      aadhaarNumber: ''
    };
  }

  /**
   * Validates and submits the volunteer form to the API
   */
  onSubmit(): void {
    // Validate required fields
    if (!this.isFormValid()) {
      const errorMessage = 'Name and Mobile Number are required fields.';
      this.error = errorMessage;
      this.snackbarService.showError(errorMessage);
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Build and send payload
    const payload = this.buildPayload();
    
    this.dataService.post('v1/volunteer/create', payload).pipe(
      catchError((error) => {
        this.handleSubmitError(error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      if (response) {
        this.handleSubmitSuccess();
      } else {
        // If response is null, error was already handled in catchError
        // But ensure loading state is cleared
        this.isLoading = false;
      }
    });
  }

  /**
   * Validates required form fields
   * @returns true if all required fields are filled
   */
  private isFormValid(): boolean {
    if (!this.form.name || !this.form.phone) return false;
    if (this.phoneError) return false;
    if (this.form.whatsappNumber && this.whatsappError) return false;
    if (this.form.email && this.emailError) return false;
    return true;
  }

  /**
   * Formats a Date object to YYYY-MM-DD string format
   * @param date - Date object to format
   * @returns Formatted date string or null
   */
  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Builds the API request payload from form data
   * @returns Formatted payload object
   */
  private buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: this.form.name,
      phone: this.form.phone,
      alternate_phone: this.form.whatsappNumber || '',
      email: this.form.email || '',
      home_branch: this.selectedCorrespondingBranch[0] || '',
      working_branch: this.selectedTaskBranch[0] || '',
      aadhaar_number: this.form.aadhaarNumber || '',
      dob: this.formatDate(this.form.dob),
      father_name: this.form.fatherName || '',
      mother_name: this.form.motherName || '',
      spouse_name: this.form.spouseName || '',
      sewas: this.selectedSewas || []
    };

    if (this.profileImage && this.profileImagePreview) {
      const key = this.selectedImageType === 'capture' ? 'capture_user_image' : 'user_image';
      payload[key] = this.profileImagePreview;
    }

    return payload;
  }

  /**
   * Handles form submission error
   * @param error - Error object from API
   */
  private handleSubmitError(error: unknown): void {
    const apiError = error as { error?: { message?: string; error?: string }; message?: string };
    const errorMessage = 
      apiError.error?.message || 
      apiError.error?.error || 
      apiError.message || 
      'Failed to create volunteer. Please try again.';
    
    this.error = errorMessage;
    this.snackbarService.showError(errorMessage);
  }

  /**
   * Handles successful form submission
   */
  private handleSubmitSuccess(): void {
    this.snackbarService.showSuccess('Volunteer created successfully!');
    this.volunteerCreated.emit();
    this.onReset();
    if (!this.hideFormActions) {
      this.router.navigateByUrl('/volunteers');
    }
  }
}

