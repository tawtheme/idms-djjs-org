/**
 * Create Visitor Component
 * 
 * This component handles the creation of new visitors through a form interface.
 * It supports both file upload and live camera capture for profile images.
 * The form data is submitted to the API via DataService.
 */

import { Component, Input, Output, EventEmitter, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { FileUploadComponent, FileUploadConfig } from '../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DataService } from '../../../data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { isMobileValid, isEmailValid, sanitizeMobile, mobileError, emailError, blockNonDigitKey } from '../../../shared/utils/validators';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Form data structure for creating a visitor
 */
export interface CreateVisitorForm {
  name: string;
  phone: string;
  gender: string;
  dob: Date | null;
  spouseName: string;
  fatherName: string;
  motherName: string;
  address: string;
  purposeOfVisit: string;
  startDate: Date | null;
  validUpto: Date | null;
  whatsappNumber: string;
  email: string;
  aadhaarNumber: string;
  copyAsWhatsapp: boolean;
  sewaInterest: boolean;
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
  selector: 'app-create-visitor',
  templateUrl: './create-visitor.component.html',
  styleUrls: ['./create-visitor.component.scss']
})
export class CreateVisitorComponent {
  @ViewChild('visitorForm') visitorForm!: NgForm;
  @Output() visitorCreated = new EventEmitter<void>();
  @Input() hideBreadcrumbs: boolean = false;
  @Input() hideFormActions: boolean = false;

  private dataService = inject(DataService);
  private snackbarService = inject(SnackbarService);
  private router = inject(Router);

  isLoading = false;
  error: string | null = null;

  // Duplicate-user detection
  existingUsers: { id: string; unique_id: number; level?: string; name?: string }[] = [];
  showProceedToggle = false;
  proceedForcefully = false;

  get today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  get validUptoMin(): Date {
    if (this.form.startDate) {
      const d = new Date(this.form.startDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return this.today;
  }

  form: CreateVisitorForm = {
    name: '',
    phone: '',
    gender: '',
    dob: null,
    spouseName: '',
    fatherName: '',
    motherName: '',
    address: '',
    purposeOfVisit: '',
    startDate: null,
    validUpto: null,
    whatsappNumber: '',
    email: '',
    aadhaarNumber: '',
    copyAsWhatsapp: false,
    sewaInterest: false
  };

  profileImage: File | null = null;
  profileImagePreview: string | null = null;

  fileUploadConfig: FileUploadConfig = {
    multiple: false,
    accept: 'image/*',
    maxSizeMb: 5,
    maxFiles: 1,
    dropText: 'Drag & drop image here or',
    buttonText: 'Browse',
    showFileListHeader: false
  };

  genderOptions: DropdownOption[] = [
    { id: '1', label: 'Male', value: 'MALE' },
    { id: '2', label: 'Female', value: 'FEMALE' },
    { id: '3', label: 'Other', value: 'OTHER' }
  ];

  selectedGender: any[] = [];

  imageOptions: DropdownOption[] = [
    { id: '1', label: 'Upload from local', value: 'upload' },
    { id: '2', label: 'Capture live photo', value: 'capture' }
  ];

  selectedImage: any[] = [];
  selectedImageType: 'upload' | 'capture' | null = null;
  imageModalOpen: boolean = false;

  phoneInputWarning: string = '';
  whatsappInputWarning: string = '';
  private phoneWarningTimer?: ReturnType<typeof setTimeout>;
  private whatsappWarningTimer?: ReturnType<typeof setTimeout>;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Visitors', route: '/visitors' },
    { label: 'Create Visitor', route: '/visitors/create' }
  ];

  /**
   * Handles gender selection change from dropdown
   * @param event - Selected gender option from dropdown
   */
  onGenderChange(event: string[]): void {
    this.selectedGender = event;
    this.form.gender = event?.[0] || '';
  }

  /**
   * Updates date of birth field
   */
  onDobChange(date: Date | null): void {
    this.form.dob = date;
  }

  /**
   * Updates start date field
   */
  onStartDateChange(date: Date | null): void {
    this.form.startDate = date;
    if (date && this.form.validUpto && this.form.validUpto < date) {
      this.form.validUpto = null;
    }
  }

  /**
   * Updates valid until date field
   */
  onValidUptoChange(date: Date | null): void {
    this.form.validUpto = date;
  }

  /**
   * Syncs WhatsApp number with phone number if copy option is enabled
   */
  onPhoneChange(): void {
    this.form.phone = sanitizeMobile(this.form.phone);
    this.phoneInputWarning = '';
    if (this.form.copyAsWhatsapp) {
      this.form.whatsappNumber = this.form.phone;
    }
  }

  onWhatsappChange(): void {
    this.form.whatsappNumber = sanitizeMobile(this.form.whatsappNumber);
    this.whatsappInputWarning = '';
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

  isMobileValid(value: string): boolean { return isMobileValid(value); }
  isEmailValid(value: string): boolean { return isEmailValid(value); }

  get phoneError(): string {
    return mobileError(this.form.phone);
  }

  get whatsappError(): string {
    return mobileError(this.form.whatsappNumber);
  }

  get emailError(): string {
    return emailError(this.form.email);
  }

  /**
   * Handles file selection from file upload component
   * @param files - Array of selected files
   */
  onFilesSelected(files: File[]): void {
    if (files?.length > 0) {
      this.profileImage = files[0];
      this.createImagePreview(this.profileImage);
      this.imageModalOpen = false;
    }
  }

  /**
   * Handles file rejection (e.g., file too large, wrong type)
   * @param rejection - Rejection details with file and reason
   */
  onFileRejected(rejection: { file: File; reason: string }): void {
    const errorMessage = `File rejected: ${rejection.reason}`;
    this.error = errorMessage;
    this.snackbarService.showError(errorMessage);
  }

  /**
   * Handles file removal from file upload component
   * @param file - The file that was removed
   */
  onFileRemoved(file: File): void {
    if (this.profileImage === file) {
      this.clearImage();
    }
  }

  /**
   * Handles image removal from camera capture component
   */
  onCameraImageRemoved(): void {
    this.clearImage();
    this.selectedImage = [];
    this.selectedImageType = null;
  }

  /**
   * Clears the selected profile image and preview
   */
  private clearImage(): void {
    this.profileImage = null;
    this.profileImagePreview = null;
  }

  /**
   * Validates and submits the form
   * Called from side panel footer button
   */
  submitForm(): void {
    const validationError = this.getValidationError();
    if (!validationError) {
      this.onSubmit();
      return;
    }
    this.error = validationError;
    this.snackbarService.showError(validationError);
    if (this.visitorForm) {
      Object.keys(this.visitorForm.controls).forEach(key => {
        this.visitorForm.controls[key].markAsTouched();
      });
    }
  }

  /**
   * Handles image upload method selection (upload from local or capture live)
   * @param selection - Selected option from dropdown
   */
  onImageChange(selection: string[]): void {
    this.selectedImage = selection;

    if (selection?.length > 0) {
      const selectedValue = selection[0];
      if (selectedValue === 'upload' || selectedValue === 'capture') {
        this.selectedImageType = selectedValue;
        this.clearImage();
        this.imageModalOpen = true;
      } else {
        this.selectedImageType = null;
      }
    } else {
      this.selectedImageType = null;
    }
  }

  closeImageModal(): void {
    this.imageModalOpen = false;
  }

  reopenImageModal(): void {
    if (this.selectedImageType) {
      this.imageModalOpen = true;
    }
  }

  /**
   * Handles image captured from camera component
   * @param file - The captured image file
   */
  onImageCaptured(file: File): void {
    this.profileImage = file;
    this.createImagePreview(file);
    this.imageModalOpen = false;
  }

  /**
   * Creates a preview of the selected image file
   * @param file - The image file to preview
   */
  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.profileImagePreview = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Resets the entire form to initial state
   */
  onReset(): void {
    this.resetForm();
    this.selectedGender = [];
    this.selectedImage = [];
    this.selectedImageType = null;
    this.clearImage();
    this.error = null;
    this.existingUsers = [];
    this.showProceedToggle = false;
    this.proceedForcefully = false;
  }

  /**
   * Resets form fields to empty/default values
   */
  private resetForm(): void {
    this.form = {
      name: '',
      phone: '',
      gender: '',
      dob: null,
      spouseName: '',
      fatherName: '',
      motherName: '',
      address: '',
      purposeOfVisit: '',
      startDate: null,
      validUpto: null,
      whatsappNumber: '',
      email: '',
      aadhaarNumber: '',
      copyAsWhatsapp: false,
      sewaInterest: false
    };
  }

  /**
   * Validates and submits the visitor form to the API
   */
  onSubmit(): void {
    const validationError = this.getValidationError();
    if (validationError) {
      this.error = validationError;
      this.snackbarService.showError(validationError);
      return;
    }

    this.isLoading = true;
    this.error = null;

    const payload = this.buildPayload();

    this.dataService.post<any>('v1/visitor/create', payload).pipe(
      catchError((error) => {
        const body = (error as any)?.error;
        if (this.handleDuplicateResponse(body)) {
          return of(null);
        }
        this.handleSubmitError(error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response: any) => {
      if (!response) return;
      if (this.handleDuplicateResponse(response)) return;
      this.handleSubmitSuccess(response);
    });
  }

  private extractVisitorId(response: any): string | null {
    const buckets = [response, response?.data, response?.data?.data, response?.result];
    for (const b of buckets) {
      if (!b || typeof b !== 'object') continue;
      const id = b.uuid || b.id || b.visitor_id || b.user_id;
      if (id) return String(id);
    }
    return null;
  }

  private handleDuplicateResponse(response: any): boolean {
    if (!response || typeof response !== 'object') return false;

    // Search the response (and common nested wrappers) for the two flags.
    const buckets: any[] = [
      response,
      response?.data,
      response?.data?.data,
      response?.error,
      response?.error?.data,
      response?.errors,
      response?.error?.errors,
      response?.data?.errors
    ];
    let toggleFlag: any = undefined;
    let users: any = undefined;
    for (const b of buckets) {
      if (!b || typeof b !== 'object') continue;
      if (toggleFlag === undefined && 'isShowToggel' in b) toggleFlag = b.isShowToggel;
      if (users === undefined && 'viewExistUsers' in b) users = b.viewExistUsers;
      if (toggleFlag !== undefined && users !== undefined) break;
    }

    const showToggle = toggleFlag === 1 || toggleFlag === '1' || toggleFlag === true;

    if (!showToggle || !Array.isArray(users) || !users.length) return false;

    this.existingUsers = users;
    this.showProceedToggle = true;
    this.error = null;
    return true;
  }

  /**
   * Validates required form fields
   * @returns true if all required fields are filled
   */
  private isFormValid(): boolean {
    return !this.getValidationError();
  }

  private getValidationError(): string {
    const missing: string[] = [];
    if (!this.form.name) missing.push('Name');
    if (!this.form.phone) missing.push('Phone');
    if (!this.form.gender) missing.push('Gender');
    if (!this.form.purposeOfVisit) missing.push('Purpose of Visit');
    if (!this.form.startDate) missing.push('Start Date');
    if (!this.form.validUpto) missing.push('Valid Upto');
    if (missing.length) {
      return `${this.joinList(missing)} ${missing.length === 1 ? 'is' : 'are'} required.`;
    }
    if (!this.isMobileValid(this.form.phone)) {
      return 'Enter a valid 10-digit phone number.';
    }
    if (this.form.whatsappNumber && !this.isMobileValid(this.form.whatsappNumber)) {
      return 'Enter a valid 10-digit Whatsapp number.';
    }
    if (this.form.email && !this.isEmailValid(this.form.email)) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  private joinList(items: string[]): string {
    if (items.length <= 1) return items.join('');
    if (items.length === 2) return items.join(' and ');
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
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
      phone: this.form.phone ? Number(this.form.phone) : null,
      alternate_phone: this.form.whatsappNumber ? Number(this.form.whatsappNumber) : null,
      email: this.form.email || null,
      aadhaar_number: this.form.aadhaarNumber || null,
      dob: this.formatDate(this.form.dob),
      father_name: this.form.fatherName || null,
      mother_name: this.form.motherName || null,
      spouse_name: this.form.spouseName || null,
      gender: this.form.gender,
      address_1: this.form.address || null,
      remarks: this.form.purposeOfVisit,
      start_date: this.formatDate(this.form.startDate),
      valid_upto: this.formatDate(this.form.validUpto),
      proceed_forcefully: this.proceedForcefully ? 1 : 0
    };

    if (this.profileImagePreview) {
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
      'Failed to create visitor. Please try again.';
    
    this.error = errorMessage;
    this.snackbarService.showError(errorMessage);
  }

  /**
   * Handles successful form submission
   */
  private handleSubmitSuccess(response: any): void {
    this.snackbarService.showSuccess('Visitor created successfully!');
    this.visitorCreated.emit();
    const newId = this.extractVisitorId(response);
    this.onReset();
    if (!this.hideFormActions) {
      if (newId) {
        this.router.navigate(['/visitors', newId, 'edit']);
      } else {
        this.router.navigateByUrl('/visitors');
      }
    }
  }
}

