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
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { FileUploadComponent, FileUploadConfig } from '../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../shared/components/camera-upload/camera-upload.component';
import { DataService } from '../../../data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
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
    BreadcrumbComponent,
    DropdownComponent,
    DatepickerComponent,
    FileUploadComponent,
    CameraUploadComponent
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

  isLoading = false;
  error: string | null = null;

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

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Visitors', route: '/visitors' },
    { label: 'Create Visitor', route: '/visitors/create' }
  ];

  /**
   * Handles gender selection change from dropdown
   * @param event - Selected gender option from dropdown
   */
  onGenderChange(event: DropdownOption[]): void {
    this.selectedGender = event;
    this.form.gender = event[0]?.value || '';
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
    if (this.form.copyAsWhatsapp) {
      this.form.whatsappNumber = this.form.phone;
    }
  }

  /**
   * Handles file selection from file upload component
   * @param files - Array of selected files
   */
  onFilesSelected(files: File[]): void {
    if (files?.length > 0) {
      this.profileImage = files[0];
      this.createImagePreview(this.profileImage);
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
    if (this.visitorForm?.valid) {
      this.onSubmit();
    } else if (this.visitorForm) {
      // Mark all fields as touched to show validation errors
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
      // Validate that the selected value is either 'upload' or 'capture'
      if (selectedValue === 'upload' || selectedValue === 'capture') {
        this.selectedImageType = selectedValue;
        this.clearImage(); // Clear previous image when switching methods
      } else {
        this.selectedImageType = null;
      }
    } else {
      this.selectedImageType = null;
    }
  }

  /**
   * Handles image captured from camera component
   * @param file - The captured image file
   */
  onImageCaptured(file: File): void {
    this.profileImage = file;
    this.createImagePreview(file);
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
    // Validate required fields
    if (!this.isFormValid()) {
      const errorMessage = 'Name, Phone, Gender, Purpose of Visit, Start Date, and Valid Upto are required fields.';
      this.error = errorMessage;
      this.snackbarService.showError(errorMessage);
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Build and send payload
    const payload = this.buildPayload();
    
    this.dataService.post('v1/visitors', payload).pipe(
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
      }
    });
  }

  /**
   * Validates required form fields
   * @returns true if all required fields are filled
   */
  private isFormValid(): boolean {
    return !!(
      this.form.name &&
      this.form.phone &&
      this.form.gender &&
      this.form.purposeOfVisit &&
      this.form.startDate &&
      this.form.validUpto
    );
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
    return {
      name: this.form.name,
      phone: this.form.phone,
      email: this.form.email || null,
      whatsapp_number: this.form.whatsappNumber || null,
      aadhaar_number: this.form.aadhaarNumber || null,
      purpose_of_visit: this.form.purposeOfVisit,
      start_date: this.formatDate(this.form.startDate),
      valid_upto: this.formatDate(this.form.validUpto),
      user_profile: {
        gender: this.form.gender,
        sewa_interest: this.form.sewaInterest ? 1 : 0,
        dob: this.formatDate(this.form.dob),
        father_name: this.form.fatherName || null,
        mother_name: this.form.motherName || null,
        spouse_name: this.form.spouseName || null
      },
      user_address: {
        address_1: this.form.address,
        city: null,
        state: null,
        country: 'India',
        type: 'correspondence'
      }
    };
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
  private handleSubmitSuccess(): void {
    this.snackbarService.showSuccess('Visitor created successfully!');
    this.visitorCreated.emit();
    this.onReset();
  }
}

