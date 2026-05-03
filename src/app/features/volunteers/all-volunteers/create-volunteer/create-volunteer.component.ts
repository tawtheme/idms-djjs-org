import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';
import { FileUploadComponent, FileUploadConfig } from '../../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { VolunteerViewComponent } from '../volunteer-view/volunteer-view.component';
import { DataService } from '../../../../data.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { sanitizeMobile, mobileError, emailError, blockNonDigitKey } from '../../../../shared/utils/validators';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

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
    branchRemarks: string;
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
        ModalComponent,
        SidePanelComponent,
        VolunteerViewComponent
    ],
    selector: 'app-create-volunteer',
    templateUrl: './create-volunteer.component.html',
    styleUrls: ['./create-volunteer.component.scss']
})
export class CreateVolunteerComponent implements OnInit {
    @Output() volunteerCreated = new EventEmitter<void>();
    @Input() hideFormActions: boolean = false;

    private dataService = inject(DataService);
    private snackbarService = inject(SnackbarService);
    private router = inject(Router);

    isLoading = false;
    error: string | null = null;

    existingUsers: { id: string; unique_id: number; level?: string; name?: string }[] = [];
    showProceedToggle = false;
    proceedForcefully = false;

    duplicateViewPanelOpen = false;
    duplicateViewUserId: string | null = null;

    openDuplicateView(user: { id: string }): void {
        if (!user?.id) return;
        this.duplicateViewUserId = String(user.id);
        this.duplicateViewPanelOpen = true;
    }

    closeDuplicateView(): void {
        this.duplicateViewPanelOpen = false;
        this.duplicateViewUserId = null;
    }

    form: CreateVolunteerForm = {
        name: '',
        phone: '',
        dob: null,
        spouseName: '',
        fatherName: '',
        motherName: '',
        whatsappNumber: '',
        email: '',
        aadhaarNumber: '',
        branchRemarks: ''
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
    programOptions: DropdownOption[] = [];
    selectedSewas: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedTaskBranch: any[] = [];
    selectedProgram: any[] = [];
    sewaModeOptions: DropdownOption[] = [
        { id: '1', label: 'Regular', value: 1 },
        { id: '0', label: 'Annual', value: 0 }
    ];
    sewaHeadOptions: DropdownOption[] = [
        { id: '1', label: 'Header', value: 1 },
        { id: '2', label: 'Subhead', value: 2 }
    ];
    selectedSewaMode: any[] = [];
    selectedSewaHead: any[] = [];

    readonly minAgeYears = 13;
    readonly dobMaxDate: Date = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - this.minAgeYears);
        return d;
    })();

    get ageDisplay(): string {
        if (!this.form.dob) return '';
        const today = new Date();
        let age = today.getFullYear() - this.form.dob.getFullYear();
        const monthDiff = today.getMonth() - this.form.dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.form.dob.getDate())) {
            age--;
        }
        return age >= 0 ? `${age} years` : '';
    }

    ngOnInit(): void {
        this.loadBranches();
        this.loadSewas();
        this.loadPrograms();
    }

    private loadPrograms(): void {
        this.dataService.get<any>('v1/programs/active-for-attendance', { params: { action: 'assign_sewa' } }).pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = response?.data || response?.results || response || [];
            this.programOptions = (Array.isArray(data) ? data : []).map((p: any) => ({
                id: String(p.id),
                label: p.name || p.program_name || '',
                value: String(p.id)
            }));
        });
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

    private loadSewas(programId?: string): void {
        const request$ = programId
            ? this.dataService.get<any>('v1/options/programSewas', { params: { program_id: programId } })
            : this.dataService.get<any>('v1/options/sewasByType', { params: { sewa_type: 'volunteer' } });

        request$.pipe(
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

    onProgramChange(values: any[]): void {
        this.selectedProgram = values;
        this.selectedSewas = [];
        this.loadSewas(values[0]);
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

    onReset(): void {
        this.resetForm();
        this.selectedSewas = [];
        this.selectedSewaMode = [];
        this.selectedSewaHead = [];
        this.selectedProgram = [];
        this.selectedCorrespondingBranch = [];
        this.selectedTaskBranch = [];
        this.selectedImage = [];
        this.selectedImageType = null;
        this.clearImage();
        this.error = null;
        this.existingUsers = [];
        this.showProceedToggle = false;
        this.proceedForcefully = false;
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
            aadhaarNumber: '',
            branchRemarks: ''
        };
    }

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

        this.dataService.post('v1/volunteers/create', payload).pipe(
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

    private extractVolunteerId(response: any): string | null {
        const buckets = [response, response?.data, response?.data?.data, response?.result];
        for (const b of buckets) {
            if (!b || typeof b !== 'object') continue;
            const id = b.uuid || b.id || b.user_id || b.volunteer_id;
            if (id) return String(id);
        }
        return null;
    }

    private handleDuplicateResponse(response: any): boolean {
        if (!response || typeof response !== 'object') return false;

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

    private getValidationError(): string | null {
        if (!this.form.name) return 'Name is required.';
        if (!this.form.phone) return 'Mobile Number is required.';
        if (this.phoneError) return this.phoneError;
        if (this.form.whatsappNumber && this.whatsappError) return this.whatsappError;
        if (this.form.email && this.emailError) return this.emailError;
        if (!this.form.aadhaarNumber) return 'Aadhaar Number is required.';
        if (!this.form.dob) return 'Date of Birth is required.';
        if (this.form.dob > this.dobMaxDate) return `Volunteer must be at least ${this.minAgeYears} years old.`;
        if (!this.form.fatherName && !this.form.motherName && !this.form.spouseName) {
            return 'Provide at least one of Father, Mother, or Spouse name.';
        }
        if (!this.selectedCorrespondingBranch[0]) return 'Corresponding Branch is required.';
        if (!this.selectedTaskBranch[0]) return 'Task Branch is required.';
        return null;
    }

    private formatDate(date: Date | null): string | null {
        if (!date) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private buildPayload(): Record<string, unknown> {
        const payload: Record<string, unknown> = {
            name: this.form.name,
            phone: this.form.phone,
            alternate_phone: this.form.whatsappNumber,
            email: this.form.email,
            home_branch: this.selectedCorrespondingBranch[0],
            working_branch: this.selectedTaskBranch[0],
            branch_remarks: this.form.branchRemarks,
            aadhaar_number: this.form.aadhaarNumber,
            dob: this.formatDate(this.form.dob),
            father_name: this.form.fatherName,
            mother_name: this.form.motherName,
            spouse_name: this.form.spouseName,
            program_id: this.selectedProgram[0],
            sewa_id: this.selectedSewas[0],
            sewa_mode: this.selectedSewaMode[0],
            sewa_head: this.selectedSewaHead[0],
            proceed_forcefully: this.proceedForcefully ? 1 : 0
        };

        if (this.profileImage && this.profileImagePreview) {
            const key = this.selectedImageType === 'capture' ? 'capture_user_image' : 'user_image';
            payload[key] = this.profileImagePreview;
        }

        return payload;
    }

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

    private handleSubmitSuccess(response: any): void {
        this.snackbarService.showSuccess('Volunteer created successfully!');
        this.volunteerCreated.emit();
        const newId = this.extractVolunteerId(response);
        this.onReset();
        if (!this.hideFormActions) {
            if (newId) {
                this.router.navigate(['/volunteers', newId, 'edit']);
            } else {
                this.router.navigateByUrl('/volunteers');
            }
        }
    }
}

