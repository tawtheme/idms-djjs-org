import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FileUploadComponent, FileUploadConfig } from '../../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DataService } from '../../../../data.service';
import { LocationService } from '../../../../core/services/location.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { sanitizeMobile, mobileError, emailError, blockNonDigitKey } from '../../../../shared/utils/validators';
import { ImagePreviewDirective } from '../../../../shared/directives/image-preview.directive';

type TabId =
    | 'basic'
    | 'address'
    | 'personal'
    | 'idproofs'
    | 'education'
    | 'medical'
    | 'spiritual'
    | 'sewa'
    | 'program'
    | 'donation';

type IdProofKey = 'aadhaar' | 'voter' | 'license';

interface TabDef { id: TabId; label: string; }

@Component({
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DropdownComponent,
        DatepickerComponent,
        IconComponent,
        FileUploadComponent,
        CameraUploadComponent,
        ModalComponent,
        ImagePreviewDirective
    ],
    selector: 'app-edit-volunteer',
    templateUrl: './edit-volunteer.component.html',
    styleUrls: ['./edit-volunteer.component.scss']
})
export class EditVolunteerComponent implements OnInit {
    @ViewChild('volunteerForm') volunteerForm!: NgForm;

    private dataService = inject(DataService);
    private locationService = inject(LocationService);
    private snackbarService = inject(SnackbarService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    tabs: TabDef[] = [
        { id: 'basic', label: 'Basic Information' },
        { id: 'address', label: 'Address Details' },
        { id: 'personal', label: 'Personal & Family' },
        { id: 'idproofs', label: 'Id Proofs' },
        { id: 'spiritual', label: 'Spiritual Detail' },
        { id: 'education', label: 'Education & Work' },
        { id: 'medical', label: 'Medical' },
        { id: 'sewa', label: 'Sewa Tracking' },
        { id: 'program', label: 'Program Journey' },
        { id: 'donation', label: 'Donations' }
    ];
    activeTab: TabId = 'basic';

    userId: string | null = null;
    isLoading = false;
    isSaving = false;
    error: string | null = null;

    // Basic
    basic = {
        unique_id: '' as string | number,
        name: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        personal_email: '',
        aadhaarNumber: '',
        dob: null as Date | null
    };

    levelOptions: DropdownOption[] = [
        { id: 'Volunteer', label: 'Volunteer', value: 'Volunteer' },
        { id: 'Preacher', label: 'Preacher', value: 'Preacher' },
        { id: 'Desiring Devotee', label: 'Desiring Devotee', value: 'Desiring Devotee' }
    ];
    selectedLevel: any[] = [];

    rolesOptions: DropdownOption[] = [];
    selectedRoles: any[] = [];

    // Profile image
    profileImage: File | null = null;
    profileImagePreview: string | null = null;
    profileImageDate: string | null = null;
    profileImages: Array<{ id: string | number; url: string; date: string }> = [];
    aadhaarImages: Array<{ id: string | number; url: string; date: string }> = [];
    voterImages: Array<{ id: string | number; url: string; date: string }> = [];
    licenseImages: Array<{ id: string | number; url: string; date: string }> = [];
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

    copyAsWhatsapp: boolean = false;
    phoneInputWarning = '';
    whatsappInputWarning = '';
    permanentPincodeError = '';
    correspondencePincodeError = '';

    onPincodeChange(kind: 'permanent' | 'correspondence', value: string): void {
        const cleaned = (value || '').replace(/\D/g, '').slice(0, 6);
        if (kind === 'permanent') {
            this.permanent.pincode = cleaned;
            this.permanentPincodeError = this.validatePincode(cleaned);
        } else {
            this.correspondence.pincode = cleaned;
            this.correspondencePincodeError = this.validatePincode(cleaned);
        }
    }

    private validatePincode(value: string): string {
        if (!value) return 'Pincode is required.';
        if (!/^\d{6}$/.test(value)) return 'Pincode must be 6 digits.';
        return '';
    }
    private phoneWarningTimer?: ReturnType<typeof setTimeout>;
    private whatsappWarningTimer?: ReturnType<typeof setTimeout>;

    // Address (permanent + correspondence)
    permanent = this.emptyAddress();
    correspondence = this.emptyAddress();

    // Personal & family
    personal = {
        gender: '',
        marital_status: '',
        father_name: '',
        father_email: '',
        father_mobile: '',
        father_occupation: '',
        father_occupation_location: '',
        father_occupation_type: '',
        father_occupation_status: '',
        mother_name: '',
        mother_email: '',
        mother_mobile: '',
        mother_occupation: '',
        mother_occupation_location: '',
        mother_occupation_type: '',
        mother_occupation_status: '',
        spouse_name: '',
        siblings_brother: '',
        siblings_sister: '',
        earning_members: '',
        family_members_at_home: '',
        samarpit_member: '',
        remarks: ''
    };

    // Selected values for personal-tab dropdowns
    selectedMaritalStatus: any[] = [];
    selectedFatherOccupation: any[] = [];
    selectedFatherOccupationLocation: any[] = [];
    selectedFatherOccupationType: any[] = [];
    selectedFatherOccupationStatus: any[] = [];
    selectedMotherOccupation: any[] = [];
    selectedMotherOccupationLocation: any[] = [];
    selectedMotherOccupationType: any[] = [];
    selectedMotherOccupationStatus: any[] = [];
    selectedSiblingsBrother: any[] = [];
    selectedSiblingsSister: any[] = [];

    // Static dropdown options (placeholders until APIs are wired)
    maritalStatusOptions: DropdownOption[] = [
        { id: 'Married', label: 'Married', value: 'Married' },
        { id: 'Single', label: 'Single', value: 'Single' },
        { id: 'Divorced', label: 'Divorced', value: 'Divorced' },
        { id: 'Separated', label: 'Separated', value: 'Separated' }
    ];
    occupationOptions: DropdownOption[] = [
        { id: 'service', label: 'Service', value: 'service' },
        { id: 'business', label: 'Business', value: 'business' },
        { id: 'self_employed', label: 'Self Employed', value: 'self_employed' },
        { id: 'homemaker', label: 'Homemaker', value: 'homemaker' },
        { id: 'retired', label: 'Retired', value: 'retired' },
        { id: 'other', label: 'Other', value: 'other' }
    ];
    occupationLocationOptions: DropdownOption[] = [];
    occupationTypeOptions: DropdownOption[] = [
        { id: '1', label: 'Government', value: '1' },
        { id: '2', label: 'Semi-Government / PSU', value: '2' },
        { id: '3', label: 'Private', value: '3' },
        { id: '4', label: 'Contract / Ad-hoc', value: '4' },
        { id: '5', label: 'Self-Employed / Business', value: '5' },
        { id: '6', label: 'Unemployed / Others', value: '6' }
    ];
    occupationStatusOptions: DropdownOption[] = [
        { id: '1', label: 'Working', value: '1' },
        { id: '2', label: 'Retired', value: '2' },
        { id: '3', label: 'Pensioner', value: '3' },
        { id: '4', label: 'Unemployed', value: '4' },
        { id: '5', label: 'Student', value: '5' },
        { id: '6', label: 'Expired', value: '6' }
    ];
    siblingsCountOptions: DropdownOption[] = Array.from({ length: 10 }, (_, i) => {
        const v = String(i + 1);
        return { id: v, label: v, value: v };
    });

    emergency = { name: '', phone: '', email: '' };

    // Id Proofs (Aadhaar, Voter, Driving License)
    idProofs = {
        aadhaar: {
            number: '',
            name: '',
            address: '' as 'Ashram' | 'Home' | '',
            home_reason: '',
            mobile_linked: '',
            renewal_date: null as Date | null,
            remarks: '',
            ashram_area_id: '',
            file: null as File | null,
            preview: null as string | null,
            files: [] as File[],
            previews: [] as string[],
            mediaId: '' as string,            // existing media row id (for delete API)
            mediaIsNew: false                  // true when user just attached a new file
        },
        voter: {
            voter_number: '',
            name: '',
            port_number: '',
            serial_number: '',
            address: '' as 'Ashram' | 'Home' | '',
            home_reason: '',
            mobile_linked: '',
            remarks: '',
            ashram_voter_area_id: '',
            file: null as File | null,
            preview: null as string | null,
            files: [] as File[],
            previews: [] as string[],
            mediaId: '' as string,
            mediaIsNew: false
        },
        license: {
            license_number: '',
            holder_name: '',
            state: '',
            license_type: '',
            date_of_issue: null as Date | null,
            expiry_date: null as Date | null,
            file: null as File | null,
            preview: null as string | null,
            files: [] as File[],
            previews: [] as string[],
            mediaId: '' as string,
            mediaIsNew: false
        }
    };

    homeReasonOptions: DropdownOption[] = [
        { id: 'Pension', label: 'Pension', value: 'Pension' },
        { id: 'Self Denied', label: 'Self Denied', value: 'Self Denied' },
        { id: 'Property Issue', label: 'Property Issue', value: 'Property Issue' },
        { id: 'Abroad', label: 'Abroad', value: 'Abroad' },
        { id: 'Ration scheme', label: 'Ration scheme', value: 'Ration scheme' },
        { id: 'Miscellaneous', label: 'Miscellaneous', value: 'Miscellaneous' },
        { id: 'Pending', label: 'Pending', value: 'Pending' }
    ];
    voterHomeReasonOptions: DropdownOption[] = [
        { id: 'Pension', label: 'Pension', value: 'Pension' },
        { id: 'Denied', label: 'Self Denied', value: 'Denied' },
        { id: 'Ration scheme', label: 'Ration scheme', value: 'Ration scheme' }
    ];
    selectedAadhaarHomeReason: any[] = [];
    selectedVoterHomeReason: any[] = [];

    // Id Proof upload modal state
    idProofModalOpen = false;
    idProofActiveKey: IdProofKey | null = null;
    idProofUploadType: 'upload' | 'capture' | null = null;
    idProofUploadOptions: DropdownOption[] = [
        { id: '1', label: 'Upload from local', value: 'upload' },
        { id: '2', label: 'Capture live photo', value: 'capture' }
    ];
    selectedIdProofUploadType: any[] = [];

    get idProofFileConfig(): FileUploadConfig {
        const multi = this.idProofActiveKey === 'aadhaar' || this.idProofActiveKey === 'voter' || this.idProofActiveKey === 'license';
        const allowPdf = this.idProofActiveKey === 'aadhaar';
        return {
            multiple: multi,
            accept: allowPdf ? 'image/*,.pdf' : 'image/*',
            maxSizeMb: 5,
            maxFiles: multi ? 10 : 1,
            dropText: allowPdf ? 'Drag & drop image or PDF here or' : 'Drag & drop image here or',
            buttonText: 'Browse',
            showFileListHeader: multi
        };
    }

    openIdProofModal(key: IdProofKey): void {
        this.idProofActiveKey = key;
        this.idProofUploadType = null;
        this.selectedIdProofUploadType = [];
        this.idProofModalOpen = true;
    }

    closeIdProofModal(): void {
        this.idProofModalOpen = false;
        this.idProofActiveKey = null;
        this.idProofUploadType = null;
        this.selectedIdProofUploadType = [];
    }

    onIdProofUploadTypeChange(values: any[]): void {
        this.selectedIdProofUploadType = values || [];
        const v = values?.[0];
        this.idProofUploadType = (v === 'upload' || v === 'capture') ? v : null;
    }

    onIdProofFilesSelected(files: File[]): void {
        if (!this.idProofActiveKey || !files?.length) return;
        if (this.idProofActiveKey === 'aadhaar' || this.idProofActiveKey === 'voter' || this.idProofActiveKey === 'license') {
            const key = this.idProofActiveKey;
            files.forEach(f => this.applyIdProofFile(key, f));
            this.closeIdProofModal();
            return;
        }
        this.applyIdProofFile(this.idProofActiveKey, files[0]);
    }

    onIdProofImageCaptured(file: File): void {
        if (!this.idProofActiveKey) return;
        this.applyIdProofFile(this.idProofActiveKey, file);
    }

    removeIdProof(key: IdProofKey): void {
        if (key === 'aadhaar') {
            const aad = this.idProofs.aadhaar;
            // Existing media on the server — call delete API
            if (aad.mediaId && !aad.mediaIsNew) {
                this.dataService.delete('v1/users/delete-aadhaar-media', { body: { id: aad.mediaId } }).pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err?.error?.message || 'Failed to delete Aadhaar document.');
                        return of(null);
                    })
                ).subscribe((response) => {
                    if (response !== null) {
                        aad.file = null;
                        aad.preview = null;
                        aad.mediaId = '';
                        aad.mediaIsNew = false;
                    }
                });
                return;
            }
        }
        this.idProofs[key].file = null;
        this.idProofs[key].preview = null;
        if (key === 'aadhaar') {
            this.idProofs.aadhaar.mediaIsNew = false;
        }
    }

    private applyIdProofFile(key: IdProofKey, file: File): void {
        this.idProofs[key].file = file;
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const dataUrl = e.target?.result as string | undefined;
            if (!dataUrl) return;
            this.idProofs[key].preview = dataUrl;
            if (key === 'aadhaar') {
                this.idProofs.aadhaar.files = [...this.idProofs.aadhaar.files, file];
                this.idProofs.aadhaar.previews = [...this.idProofs.aadhaar.previews, dataUrl];
            }
            if (key === 'voter') {
                this.idProofs.voter.files = [...this.idProofs.voter.files, file];
                this.idProofs.voter.previews = [...this.idProofs.voter.previews, dataUrl];
            }
            if (key === 'license') {
                this.idProofs.license.files = [...this.idProofs.license.files, file];
                this.idProofs.license.previews = [...this.idProofs.license.previews, dataUrl];
            }
        };
        reader.readAsDataURL(file);
        if (key === 'aadhaar') this.idProofs.aadhaar.mediaIsNew = true;
        if (key === 'voter') this.idProofs.voter.mediaIsNew = true;
        if (key === 'license') this.idProofs.license.mediaIsNew = true;
        if (key !== 'aadhaar' && key !== 'voter' && key !== 'license') this.closeIdProofModal();
    }

    removeAadhaarPreview(index: number): void {
        const a = this.idProofs.aadhaar;
        a.files = a.files.filter((_, i) => i !== index);
        a.previews = a.previews.filter((_, i) => i !== index);
        if (a.previews.length === 0) {
            a.file = null;
            a.preview = null;
            a.mediaIsNew = false;
        } else {
            a.file = a.files[0] || null;
            a.preview = a.previews[0] || null;
        }
    }

    removeVoterPreview(index: number): void {
        const v = this.idProofs.voter;
        v.files = v.files.filter((_, i) => i !== index);
        v.previews = v.previews.filter((_, i) => i !== index);
        if (v.previews.length === 0) {
            v.file = null;
            v.preview = null;
            v.mediaIsNew = false;
        } else {
            v.file = v.files[0] || null;
            v.preview = v.previews[0] || null;
        }
    }

    removeLicensePreview(index: number): void {
        const l = this.idProofs.license;
        l.files = l.files.filter((_, i) => i !== index);
        l.previews = l.previews.filter((_, i) => i !== index);
        if (l.previews.length === 0) {
            l.file = null;
            l.preview = null;
            l.mediaIsNew = false;
        } else {
            l.file = l.files[0] || null;
            l.preview = l.previews[0] || null;
        }
    }

    triggerLicenseImageUpload(): void {
        this.idProofActiveKey = 'license';
        this.idProofUploadType = 'upload';
        this.idProofModalOpen = true;
    }

    triggerLicenseImageCapture(): void {
        this.idProofActiveKey = 'license';
        this.idProofUploadType = 'capture';
        this.idProofModalOpen = true;
    }

    deleteLicenseImage(image: { id: string | number; url: string; date: string }): void {
        if (!image?.id) {
            this.licenseImages = this.licenseImages.filter(i => i !== image);
            return;
        }
        this.dataService.delete('v1/users/delete-user-doc', { body: { id: image.id } }).pipe(
            catchError((err) => {
                this.snackbarService.showError(err?.error?.message || 'Failed to delete Driving License document.');
                return of(null);
            })
        ).subscribe((response) => {
            if (response === null) return;
            this.licenseImages = this.licenseImages.filter(i => i.id !== image.id);
            this.snackbarService.showSuccess('Driving License document deleted.');
        });
    }

    licenseTypeOptions: DropdownOption[] = [
        { id: 'Car', label: 'Car', value: 'Car' },
        { id: 'HTV', label: 'HTV', value: 'HTV' },
        { id: 'LTV', label: 'LTV', value: 'LTV' },
        { id: 'LMV', label: 'LMV', value: 'LMV' },
        { id: 'MCWG', label: 'MCWG', value: 'MCWG' },
        { id: 'MCWOG', label: 'MCWOG', value: 'MCWOG' }
    ];

    onAadhaarHomeReasonChange(values: any[]): void {
        this.selectedAadhaarHomeReason = values || [];
        this.idProofs.aadhaar.home_reason = values?.[0] || '';
    }

    onVoterHomeReasonChange(values: any[]): void {
        this.selectedVoterHomeReason = values || [];
        this.idProofs.voter.home_reason = values?.[0] || '';
    }

    onLicenseDateChange(field: 'date_of_issue' | 'expiry_date', date: Date | null): void {
        this.idProofs.license[field] = date;
    }

    // Education & work
    // User Education — multiple qualifications
    qualifications: Array<{ id: string; degree: string; name: string; remarks: string; selectedDegree: any[] }> = [
        { id: '', degree: '', name: '', remarks: '', selectedDegree: [] }
    ];

    degreeOptions: DropdownOption[] = [];

    // User Work Experience
    work = {
        profession: '',
        work_experience: '',
        experience_period: '',
        remarks: ''
    };

    professionOptions: DropdownOption[] = [];
    experiencePeriodOptions: DropdownOption[] = [
        { id: '1', label: 'Year', value: '1' },
        { id: '2', label: 'Month', value: '2' },
        { id: '3', label: 'Day', value: '3' }
    ];
    selectedProfession: any[] = [];
    skillOptions: DropdownOption[] = [];
    selectedSkills: any[] = [];

    // Medical
    medical = {
        blood_group: '',
        notes: '',
        docs: [] as Array<{ name: string; data: string }>
    };

    medicalHistories: Array<{
        id: string;
        major_illness: string | number | boolean;
        note: string;
        docs: Array<{ id?: string; name: string; data: string }>;
    }> = [];

    bloodGroupOptions: DropdownOption[] = [
        { id: 'A+', label: 'A+', value: 'A+' },
        { id: 'A-', label: 'A-', value: 'A-' },
        { id: 'B+', label: 'B+', value: 'B+' },
        { id: 'B-', label: 'B-', value: 'B-' },
        { id: 'O+', label: 'O+', value: 'O+' },
        { id: 'O-', label: 'O-', value: 'O-' },
        { id: 'AB+', label: 'AB+', value: 'AB+' },
        { id: 'AB-', label: 'AB-', value: 'AB-' }
    ];
    selectedBloodGroup: any[] = [];

    medicalDocsConfig: FileUploadConfig = {
        multiple: true,
        accept: 'image/*,.pdf',
        maxSizeMb: 10,
        maxFiles: 10,
        dropText: 'Drag & drop docs here or',
        buttonText: 'Browse',
        showFileListHeader: false
    };

    // Spiritual
    spiritual = {
        date_of_initiation: null as Date | null,
        years_of_spiritual_initiation: '',
        place_of_initiation: '',
        initiation_branch: '',
        date_of_joining: null as Date | null,
        date_of_registration: null as Date | null,
        place_of_joining: '',
        dress_code: '',
        dress_code_ordained_date: null as Date | null,
        gyan_agya_date: null as Date | null,
        name_changing_date: null as Date | null
    };
    selectedInitiationBranch: any[] = [];

    // Read-only tabs (Sewa Tracking / Program Journey / Donations)
    sewaBranches: any[] = [];
    sewaLoading = false;
    sewaError: string | null = null;

    programRows: any[] = [];
    programLoading = false;
    programError: string | null = null;

    donationRows: any[] = [];
    donationLoading = false;
    donationError: string | null = null;

    // Sewa & Branch dropdowns
    sewaOptions: DropdownOption[] = [];
    branchOptions: DropdownOption[] = [];

    // Location dropdowns (one set per address scope)
    countryOptions: DropdownOption[] = [];
    licenseStateOptions: DropdownOption[] = [];
    licenseErrors: { license_number?: string; holder_name?: string; state?: string; license_type?: string } = {};
    aadhaarErrors: { number?: string; name?: string } = {};
    voterErrors: { voter_number?: string; name?: string } = {};
    permStateOptions: DropdownOption[] = [];
    permDistrictOptions: DropdownOption[] = [];
    permCityOptions: DropdownOption[] = [];
    corrStateOptions: DropdownOption[] = [];
    corrDistrictOptions: DropdownOption[] = [];
    corrCityOptions: DropdownOption[] = [];
    selectedSewas: any[] = [];
    selectedCorrespondingBranch: any[] = [];
    selectedTaskBranch: any[] = [];

    genderOptions: DropdownOption[] = [
        { id: 'MALE', label: 'MALE', value: 'MALE' },
        { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
        { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
    ];
    selectedGender: any[] = [];

    /** Tracks which tabs have already triggered their data fetches. */
    private loadedTabs = new Set<TabId>();

    ngOnInit(): void {
        this.userId = this.route.snapshot.paramMap.get('id');
        if (this.userId) this.loadTabData(this.activeTab);
    }

    /** Lazily fetches the data needed for the given tab — first visit only. */
    private loadTabData(tab: TabId): void {
        if (!this.userId || this.loadedTabs.has(tab)) return;
        this.loadedTabs.add(tab);

        switch (tab) {
            case 'basic':
                this.loadSewas();
                this.loadRoles();
                this.loadBasicDetails();
                this.loadUserImages();
                break;
            case 'address':
                this.loadBranches();
                this.loadCountries();
                this.loadPermanentAddress();
                this.loadCorrespondenceAddress();
                break;
            case 'personal':
                this.loadProfessions();
                this.loadOccupationLocationCountries();
                this.loadPersonalDetails();
                this.loadFamilyDetails();
                this.loadEmergencyDetails();
                break;
            case 'spiritual':
                this.loadBranches();
                this.loadSpiritualDetails();
                break;
            case 'education':
                this.loadProfessions();
                this.loadSkills();
                this.loadDegrees();
                this.loadEducationDetails();
                this.loadWorkExperience();
                break;
            case 'medical':
                this.loadMedicalDetails();
                break;
            case 'idproofs':
                this.loadAadhaarDetails();
                this.loadElectoralDetails();
                this.loadDrivingLicenseDetails();
                this.loadLicenseStates();
                break;
            case 'sewa':
                this.loadSewaTab();
                break;
            case 'program':
                this.loadProgramTab();
                break;
            case 'donation':
                this.loadDonationTab();
                break;
        }
    }

    private loadDrivingLicenseDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/driving_license_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const l = root?.user_driving_license ?? root?.user_driving_license_details ?? root?.driving_license_details ?? root?.user ?? root;

            this.idProofs.license.license_number = l?.driving_license_number || l?.license_number || this.idProofs.license.license_number;
            this.idProofs.license.holder_name = l?.license_holder_name || l?.holder_name || l?.name || this.idProofs.license.holder_name;
            this.idProofs.license.state = l?.license_state || l?.state || this.idProofs.license.state;
            this.idProofs.license.license_type = l?.license_type || l?.type || this.idProofs.license.license_type;
            const issueRaw = l?.date_of_issue;
            if (issueRaw && issueRaw !== '0000-00-00' && !String(issueRaw).startsWith('0000-')) {
                const d = new Date(issueRaw);
                if (!isNaN(d.getTime())) this.idProofs.license.date_of_issue = d;
            }
            const expiryRaw = l?.expiry_date;
            if (expiryRaw && expiryRaw !== '0000-00-00' && !String(expiryRaw).startsWith('0000-')) {
                const d = new Date(expiryRaw);
                if (!isNaN(d.getTime())) this.idProofs.license.expiry_date = d;
            }

            const docs = l?.user_driving_license_enclosed || l?.user_doc_urls || (l?.media ? [l.media] : []);
            const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
            this.licenseImages = list.map((m: any) => ({
                id: m?.id ?? m?.media_id ?? '',
                url: m?.full_path || m?.url || m?.path || (typeof m === 'string' ? m : ''),
                date: m?.date || m?.uploaded_at || m?.created_at || m?.updated_at || ''
            })).filter((x: any) => this.isRealImageRow(x));

            const media = list[0];
            if (media) {
                this.idProofs.license.preview = media?.full_path || media?.url || media?.path || media || null;
                this.idProofs.license.mediaId = String(media?.id || '');
                this.idProofs.license.mediaIsNew = false;
            }
            this.snapshotSection('license');
        });
    }

    private loadElectoralDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/electoral_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const e = root?.user_electoral ?? root?.user_electoral_details ?? root?.electoral_details ?? root?.user ?? root;

            this.idProofs.voter.voter_number = e?.voter_number || this.idProofs.voter.voter_number;
            this.idProofs.voter.name = e?.name || e?.voter_name || this.idProofs.voter.name;
            this.idProofs.voter.port_number = e?.part_number || e?.port_number || this.idProofs.voter.port_number;
            this.idProofs.voter.serial_number = e?.serial_number || this.idProofs.voter.serial_number;
            this.idProofs.voter.address = e?.address || e?.voter_address || this.idProofs.voter.address;
            const voterHomeReason = e?.home_reason || e?.voter_home_reason;
            if (voterHomeReason) {
                this.idProofs.voter.home_reason = voterHomeReason;
                this.selectedVoterHomeReason = [voterHomeReason];
            }
            this.idProofs.voter.mobile_linked = e?.mobile_linked || e?.voter_mobile_linked || this.idProofs.voter.mobile_linked;
            this.idProofs.voter.remarks = e?.remarks || e?.voter_remarks || this.idProofs.voter.remarks;
            this.idProofs.voter.ashram_voter_area_id = e?.ashram_voter_area_id || e?.area_id || e?.ashram_voter_area?.id || this.idProofs.voter.ashram_voter_area_id;

            const docs = e?.user_doc_urls || e?.user_electoral_enclosed || (e?.media ? [e.media] : []);
            const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
            this.voterImages = list.map((m: any) => ({
                id: m?.id ?? m?.media_id ?? '',
                url: m?.path || m?.full_path || m?.url || (typeof m === 'string' ? m : ''),
                date: m?.date || m?.uploaded_at || m?.created_at || m?.updated_at || ''
            })).filter((x: any) => this.isRealImageRow(x));

            const media = list[0];
            if (media) {
                this.idProofs.voter.preview = media?.path || media?.full_path || media?.url || media || null;
                this.idProofs.voter.mediaId = String(media?.id || '');
                this.idProofs.voter.mediaIsNew = false;
            }
            this.snapshotSection('electoral');
        });
    }

    private loadAadhaarDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/aadhaar_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const a = root?.user_aadhaar ?? root?.user_aadhaar_details ?? root?.aadhaar_details ?? root?.user ?? root;

            this.idProofs.aadhaar.number = a?.aadhaar_number || this.idProofs.aadhaar.number;
            this.idProofs.aadhaar.name = a?.name || a?.aadhaar_name || this.idProofs.aadhaar.name;
            this.idProofs.aadhaar.address = a?.address || a?.aadhaar_address || this.idProofs.aadhaar.address;
            if (a?.home_reason) {
                this.idProofs.aadhaar.home_reason = a.home_reason;
                this.selectedAadhaarHomeReason = [a.home_reason];
            }
            this.idProofs.aadhaar.mobile_linked = a?.mobile_linked || this.idProofs.aadhaar.mobile_linked;
            if (a?.renewal_date) this.idProofs.aadhaar.renewal_date = new Date(a.renewal_date);
            this.idProofs.aadhaar.remarks = a?.remarks || this.idProofs.aadhaar.remarks;
            this.idProofs.aadhaar.ashram_area_id = a?.area_id || a?.ashram_area_id || a?.ashram_area?.id || this.idProofs.aadhaar.ashram_area_id;

            const docs = a?.user_doc_urls || a?.adhaar_media || a?.aadhaar_media || (a?.media ? [a.media] : []);
            const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
            this.aadhaarImages = list.map((m: any) => ({
                id: m?.id ?? m?.media_id ?? '',
                url: m?.path || m?.full_path || m?.url || (typeof m === 'string' ? m : ''),
                date: m?.date || m?.uploaded_at || m?.created_at || m?.updated_at || ''
            })).filter((x: any) => this.isRealImageRow(x));

            const media = list[0];
            if (media) {
                this.idProofs.aadhaar.preview = media?.path || media?.full_path || media?.url || media || null;
                this.idProofs.aadhaar.mediaId = String(media?.id || '');
                this.idProofs.aadhaar.mediaIsNew = false;
            }
            this.snapshotSection('aadhaar');
        });
    }

    private isRealImageRow(x: { id: any; url: any; date: any }): boolean {
        if (!x.id) return false;
        if (typeof x.url !== 'string') return false;
        const url = x.url.trim().toLowerCase();
        if (!url) return false;
        // Skip server-side placeholder images so empty rows aren't shown
        if (url.includes('no_image') || url.includes('no-image') || url.includes('placeholder')) return false;
        return true;
    }

    triggerVoterImageUpload(): void {
        this.idProofActiveKey = 'voter';
        this.idProofUploadType = 'upload';
        this.idProofModalOpen = true;
    }

    triggerVoterImageCapture(): void {
        this.idProofActiveKey = 'voter';
        this.idProofUploadType = 'capture';
        this.idProofModalOpen = true;
    }

    deleteVoterImage(image: { id: string | number; url: string; date: string }): void {
        if (!image?.id) {
            this.voterImages = this.voterImages.filter(i => i !== image);
            return;
        }
        this.dataService.delete('v1/users/delete-user-doc', { body: { id: image.id } }).pipe(
            catchError((err) => {
                this.snackbarService.showError(err?.error?.message || 'Failed to delete Electoral document.');
                return of(null);
            })
        ).subscribe((response) => {
            if (response === null) return;
            this.voterImages = this.voterImages.filter(i => i.id !== image.id);
            this.snackbarService.showSuccess('Electoral document deleted.');
        });
    }

    triggerAadhaarImageUpload(): void {
        this.idProofActiveKey = 'aadhaar';
        this.idProofUploadType = 'upload';
        this.idProofModalOpen = true;
    }

    triggerAadhaarImageCapture(): void {
        this.idProofActiveKey = 'aadhaar';
        this.idProofUploadType = 'capture';
        this.idProofModalOpen = true;
    }

    deleteAadhaarImage(image: { id: string | number; url: string; date: string }): void {
        if (!image?.id) {
            this.aadhaarImages = this.aadhaarImages.filter(i => i !== image);
            return;
        }
        this.dataService.delete('v1/users/delete-aadhaar-media', { body: { id: image.id } }).pipe(
            catchError((err) => {
                this.snackbarService.showError(err?.error?.message || 'Failed to delete Aadhaar document.');
                return of(null);
            })
        ).subscribe((response) => {
            if (response === null) return;
            this.aadhaarImages = this.aadhaarImages.filter(i => i.id !== image.id);
            this.snackbarService.showSuccess('Aadhaar document deleted.');
        });
    }

    private loadMedicalDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/medical_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const m = root?.user_medical ?? root?.user_medical_details ?? root?.medical_details ?? root?.user ?? root;

            if (m?.blood_group) {
                this.medical.blood_group = m.blood_group;
                this.selectedBloodGroup = [m.blood_group];
            }
            this.medical.notes = m?.notes ?? m?.note ?? m?.medical_notes ?? m?.remarks ?? this.medical.notes;

            const histories = m?.user_medical_histories || m?.medical_histories || [];
            if (Array.isArray(histories) && histories.length) {
                this.medicalHistories = histories.map((h: any) => ({
                    id: String(h?.id || ''),
                    major_illness: h?.major_illness !== undefined && h?.major_illness !== null ? String(h.major_illness) : '',
                    note: h?.note || h?.notes || '',
                    docs: this.normalizeDocs(h?.user_doc_urls || h?.docs || h?.medical_history_media || h?.medical_docs)
                }));
            }
            this.snapshotSection('medical');
        });
    }

    private loadProfessions(): void {
        this.dataService.get<any>('v1/options/professions').pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const data = response?.data?.professions || response?.data || response || [];
            this.professionOptions = (Array.isArray(data) ? data : []).map((p: any) => ({
                id: String(p.id ?? p.value ?? p.name),
                label: p.name || p.label || p.title || '',
                value: String(p.id ?? p.value ?? p.name)
            }));
        });
    }

    private loadWorkExperience(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/work_experience`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const w = root?.user_work_experience ?? root?.work_experience ?? root?.user ?? root;

            const profId = w?.profession_id || w?.profession?.id;
            if (profId) this.selectedProfession = [String(profId)];

            if (w?.experience !== undefined && w?.experience !== null) this.work.work_experience = String(w.experience);
            if (w?.experience_period) this.work.experience_period = String(w.experience_period);
            if (w?.profession_skill_remarks) this.work.remarks = String(w.profession_skill_remarks);

            const skills = w?.skills || [];
            if (Array.isArray(skills) && skills.length) {
                this.selectedSkills = skills.map((s: any) => String(s?.skill_id || s?.id || s?.name || s)).filter(Boolean);
            }
            this.snapshotSection('work');
        });
    }

    private loadEducationDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/education_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const list = root?.user_education
                ?? root?.user_education_details
                ?? root?.education_details
                ?? root?.user_qualifications
                ?? root?.qualifications
                ?? root;
            const arr = Array.isArray(list) ? list : Object.values(list || {});
            if (arr.length) {
                this.qualifications = arr.map((q: any) => {
                    const deg = q?.degree?.id || q?.degree_id || q?.degree || '';
                    return {
                        id: String(q?.id || ''),
                        degree: deg ? String(deg) : '',
                        name: q?.name || '',
                        remarks: q?.remarks || '',
                        selectedDegree: deg ? [String(deg)] : []
                    };
                });
            }
            this.snapshotSection('education');
        });
    }

    private loadSpiritualDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/spiritual_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const s = root?.user_spiritual ?? root?.user_spiritual_details ?? root?.spiritual_details ?? root?.user ?? root;

            if (s?.date_of_initiation) this.spiritual.date_of_initiation = new Date(s.date_of_initiation);
            if (s?.place_of_initiation) this.spiritual.place_of_initiation = s.place_of_initiation;
            if (s?.initiation_branch_id) this.selectedInitiationBranch = [String(s.initiation_branch_id)];
            else if (s?.initiation_branch?.id) this.selectedInitiationBranch = [String(s.initiation_branch.id)];

            if (s?.date_of_joining) this.spiritual.date_of_joining = new Date(s.date_of_joining);
            if (s?.joining_branch_id) this._joiningBranchId = String(s.joining_branch_id);
            else if (s?.joining_branch?.id) this._joiningBranchId = String(s.joining_branch.id);

            if (s?.dress_code_id) this._dressCodeId = String(s.dress_code_id);
            else if (s?.dress_code?.id) this._dressCodeId = String(s.dress_code.id);

            if (s?.dress_code_ordained_date) this.spiritual.dress_code_ordained_date = new Date(s.dress_code_ordained_date);
            if (s?.date_of_registration) this.spiritual.date_of_registration = new Date(s.date_of_registration);
            if (s?.gyan_agya_date) this.spiritual.gyan_agya_date = new Date(s.gyan_agya_date);
            if (s?.name_changing_date) this.spiritual.name_changing_date = new Date(s.name_changing_date);
            if (s?.years_of_spiritual_initiation !== undefined && s?.years_of_spiritual_initiation !== null) {
                this.spiritual.years_of_spiritual_initiation = String(s.years_of_spiritual_initiation);
            }
            this.snapshotSection('spiritual');
        });
    }

    // IDs preserved for save (not currently shown in the UI)
    private _joiningBranchId: string = '';
    private _dressCodeId: string = '';

    private loadPersonalDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/personal_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const p = root?.user_personal_details ?? root?.personal_details ?? root?.user ?? root;

            if (p?.gender) {
                this.personal.gender = p.gender;
                this.selectedGender = [p.gender];
            }
            if (p?.dob && !this.basic.dob) this.basic.dob = new Date(p.dob);
            if (p?.marital_status) {
                this.personal.marital_status = p.marital_status;
                this.selectedMaritalStatus = [p.marital_status];
            }
            this.snapshotSection('personal');
        });
    }

    private loadFamilyDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/family_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const f = root?.user_family_details ?? root?.family_details ?? root?.user ?? root;

            this.personal.father_name = f?.father_name || this.personal.father_name;
            this.personal.father_email = f?.father_email || this.personal.father_email;
            this.personal.father_mobile = f?.father_phone || this.personal.father_mobile;
            this.personal.mother_name = f?.mother_name || this.personal.mother_name;
            this.personal.mother_email = f?.mother_email || this.personal.mother_email;
            this.personal.mother_mobile = f?.mother_phone || this.personal.mother_mobile;
            this.personal.spouse_name = f?.spouse_name || this.personal.spouse_name;
            this.personal.siblings_brother = (f?.brother_siblings ?? this.personal.siblings_brother ?? '') + '';
            this.personal.siblings_sister = (f?.sister_siblings ?? this.personal.siblings_sister ?? '') + '';
            this.selectedSiblingsBrother = this.personal.siblings_brother ? [this.personal.siblings_brother] : [];
            this.selectedSiblingsSister = this.personal.siblings_sister ? [this.personal.siblings_sister] : [];
            this.personal.earning_members = (f?.earning_members ?? this.personal.earning_members) + '';
            this.personal.samarpit_member = f?.family_devotees || this.personal.samarpit_member;
            this.personal.family_members_at_home = f?.inlaws_members || this.personal.family_members_at_home;
            this.personal.remarks = f?.remarks || this.personal.remarks;

            if (f?.father_occupation_id) this.selectedFatherOccupation = [String(f.father_occupation_id)];
            if (f?.mother_occupation_id) this.selectedMotherOccupation = [String(f.mother_occupation_id)];
            if (f?.father_occupation_location_id) this.selectedFatherOccupationLocation = [String(f.father_occupation_location_id)];
            if (f?.mother_occupation_location_id) this.selectedMotherOccupationLocation = [String(f.mother_occupation_location_id)];
            if (f?.father_occupation_type !== undefined && f?.father_occupation_type !== null) this.selectedFatherOccupationType = [String(f.father_occupation_type)];
            if (f?.mother_occupation_type !== undefined && f?.mother_occupation_type !== null) this.selectedMotherOccupationType = [String(f.mother_occupation_type)];
            if (f?.father_occupation_status !== undefined && f?.father_occupation_status !== null) this.selectedFatherOccupationStatus = [String(f.father_occupation_status)];
            if (f?.mother_occupation_status !== undefined && f?.mother_occupation_status !== null) this.selectedMotherOccupationStatus = [String(f.mother_occupation_status)];
            this.snapshotSection('family');
        });
    }

    private loadEmergencyDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/emergency_contact_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const e = root?.user_emergency_details ?? root?.user_emergency_contact ?? root?.emergency_contact_details ?? root?.user ?? root;

            this.emergency.name = e?.emergency_name || e?.name || this.emergency.name;
            this.emergency.phone = e?.emergency_phone || e?.phone || this.emergency.phone;
            this.emergency.email = e?.emergency_email || e?.email || this.emergency.email;
            this.snapshotSection('emergency');
        });
    }

    private loadPermanentAddress(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/permanent_address`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const a = root?.permanent_address ?? root?.user_permanent_address ?? root?.address ?? root;

            this.permanent.address_1 = (a?.permanent_address ?? a?.address_1) || this.permanent.address_1;
            this.permanent.address_2 = (a?.permanent_address_2 ?? a?.address_2) || this.permanent.address_2;
            this.permanent.country = (a?.permanent_country ?? a?.country?.name ?? a?.country) || this.permanent.country;
            this.permanent.state = (a?.permanent_state ?? a?.state?.name ?? a?.state) || this.permanent.state;
            this.permanent.city = (a?.permanent_city ?? a?.city?.name ?? a?.city) || this.permanent.city;
            this.permanent.pincode = (a?.permanent_pincode ?? a?.pincode) || this.permanent.pincode;
            this.permanent.district = (a?.permanent_district ?? a?.district?.name ?? a?.district) || this.permanent.district;
            if (this.permanent.country) this.loadStatesFor('permanent');
            if (this.permanent.state) this.loadDistrictsFor('permanent');
            if (this.permanent.state || this.permanent.district) this.loadCitiesFor('permanent');
            this.snapshotSection('permanent');
        });
    }

    private loadCorrespondenceAddress(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/correspondence_address`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const root = response?.data ?? response ?? {};
            const a = root?.correspondence_address ?? root?.user_correspondence_address ?? root?.user_address ?? root?.address ?? root;

            this.correspondence.address_1 = (a?.address_1) || this.correspondence.address_1;
            this.correspondence.address_2 = (a?.address_2) || this.correspondence.address_2;
            this.correspondence.country = (a?.country?.name ?? a?.country) || this.correspondence.country;
            this.correspondence.state = (a?.state?.name ?? a?.state) || this.correspondence.state;
            this.correspondence.city = (a?.city?.name ?? a?.city) || this.correspondence.city;
            this.correspondence.pincode = (a?.pincode) || this.correspondence.pincode;
            this.correspondence.district = (a?.district?.name ?? a?.district) || this.correspondence.district;
            this.correspondence.branch_id = (a?.branch_id ?? a?.branch?.id) || this.correspondence.branch_id;
            this.correspondence.home_branch = (a?.home_branch?.id ?? a?.home_branch_id ?? a?.home_branch) || this.correspondence.home_branch;
            this.correspondence.post_office = (a?.post_office) || this.correspondence.post_office;
            this.correspondence.tehsil = (a?.tehsil) || this.correspondence.tehsil;
            const same = root?.addresses_are_same ?? a?.addresses_are_same ?? a?.copy_address;
            this.copyAddress = same === 1 || same === '1' || same === true;
            if (this.correspondence.country) this.loadStatesFor('correspondence');
            if (this.correspondence.state) this.loadDistrictsFor('correspondence');
            if (this.correspondence.state || this.correspondence.district) this.loadCitiesFor('correspondence');
            this.snapshotSection('correspondence');
        });
    }

    /**
     * Loads basic details from /v1/users/{id}/basic_details and prefills the
     * Basic Information tab. Each value is only applied when present in the
     * response, so it doesn't overwrite already-loaded data with blanks.
     */
    private loadBasicDetails(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/basic_details`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            // Try common nesting patterns
            const root = response?.data ?? response ?? {};
            const user = root?.user_basic_details ?? root?.user ?? root?.basic_details ?? root?.user_basic ?? root;

            const pick = (...keys: string[]) => {
                for (const k of keys) {
                    const v = user?.[k];
                    if (v !== undefined && v !== null && v !== '') return v;
                }
                return undefined;
            };

            const uniqueId = pick('unique_id', 'uniqueId');
            if (uniqueId !== undefined) this.basic.unique_id = uniqueId;

            const name = pick('name');
            if (name !== undefined) this.basic.name = String(name);

            const phone = pick('phone', 'mobile', 'mobile_number');
            if (phone !== undefined) this.basic.phone = String(phone);

            const wa = pick('alternate_phone', 'whatsapp_number', 'whatsapp');
            if (wa !== undefined) this.basic.whatsappNumber = String(wa);

            this.copyAsWhatsapp = !!this.basic.phone && this.basic.phone === this.basic.whatsappNumber;

            const email = pick('email');
            if (email !== undefined) this.basic.email = String(email);

            const personalEmail = pick('personal_email');
            if (personalEmail !== undefined) this.basic.personal_email = String(personalEmail);

            const level = pick('level');
            if (level !== undefined) this.selectedLevel = [String(level)];

            const roles = (user?.roles ?? user?.user_roles) || [];
            if (Array.isArray(roles) && roles.length) {
                this.selectedRoles = roles.map((r: any) => String(r?.id ?? r?.pivot?.role_id ?? r?.name ?? r)).filter(Boolean);
            }

            const sewas = (user?.sewas ?? user?.user_sewas) || [];
            if (Array.isArray(sewas) && sewas.length) {
                this.selectedSewas = sewas.map((s: any) => String(s?.sewa?.id ?? s?.sewa_id ?? s?.id ?? s)).filter(Boolean);
            }
            this.snapshotSection('basic');
        });
    }

    /**
     * Loads user images from /v1/users/{id}/images and populates the gallery.
     */
    private loadUserImages(): void {
        this.dataService.get<any>(`v1/users/${this.userId}/images`).pipe(
            catchError(() => of(null))
        ).subscribe((response) => {
            if (!response) return;
            const data = response?.data || response || {};
            const list = Array.isArray(data) ? data : (Array.isArray(data?.images) ? data.images : (Array.isArray(data?.user_images) ? data.user_images : []));
            this.profileImages = (list || []).map((img: any) => ({
                id: img?.id ?? img?.image_id ?? '',
                url: img?.full_path || img?.url || img?.path || (typeof img === 'string' ? img : ''),
                date: img?.date || img?.uploaded_at || img?.created_at || img?.updated_at || ''
            })).filter((x: any) => this.isRealImageRow(x));

            const first = this.profileImages[0];
            if (first) {
                this.profileImagePreview = first.url;
                this.profileImageDate = first.date || null;
            }
        });
    }

    triggerProfileImageUpload(): void {
        this.selectedImageType = 'upload';
        this.clearImage();
        this.imageModalOpen = true;
    }

    triggerProfileImageCapture(): void {
        this.selectedImageType = 'capture';
        this.clearImage();
        this.imageModalOpen = true;
    }

    deleteProfileImage(image: { id: string | number; url: string; date: string }): void {
        if (!image?.id) {
            this.profileImages = this.profileImages.filter(i => i !== image);
            return;
        }
        this.dataService.delete('v1/users/delete-user-image', { body: { id: image.id } }).pipe(
            catchError((err) => {
                this.snackbarService.showError(err?.error?.message || 'Failed to delete image.');
                return of(null);
            })
        ).subscribe((response) => {
            if (response === null) return;
            this.profileImages = this.profileImages.filter(i => i.id !== image.id);
            this.snackbarService.showSuccess('Image deleted.');
        });
    }

    private loadSkills(): void {
        this.dataService.get<any>('v1/options/skills').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = response?.data?.skills || response?.data || response || [];
            this.skillOptions = (Array.isArray(data) ? data : []).map((s: any) => ({
                id: String(s.id ?? s.value ?? s.name),
                label: s.name || s.label || s.title || '',
                value: String(s.id ?? s.value ?? s.name)
            }));
        });
    }

    private loadDegrees(): void {
        this.dataService.get<any>('v1/options/degrees').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const data = response?.data?.degrees || response?.data || response || [];
            this.degreeOptions = (Array.isArray(data) ? data : []).map((d: any) => ({
                id: String(d.id ?? d.value ?? d.name),
                label: d.name || d.label || d.title || '',
                value: String(d.id ?? d.value ?? d.name)
            }));
        });
    }

    addQualification(): void {
        this.qualifications.push({ id: '', degree: '', name: '', remarks: '', selectedDegree: [] });
    }

    removeQualification(index: number): void {
        const q = this.qualifications[index];
        if (q?.id && this.userId) {
            // Existing row — call delete API first
            this.dataService.delete('v1/users/delete-education', { body: { user_id: this.userId, id: q.id } }).pipe(
                catchError((err) => {
                    this.snackbarService.showError(err?.error?.message || 'Failed to delete qualification.');
                    return of(null);
                })
            ).subscribe((response) => {
                if (response !== null) {
                    this.qualifications.splice(index, 1);
                    if (this.qualifications.length === 0) this.addQualification();
                }
            });
        } else {
            this.qualifications.splice(index, 1);
            if (this.qualifications.length === 0) this.addQualification();
        }
    }

    onQualDegreeChange(index: number, values: any[]): void {
        const q = this.qualifications[index];
        if (!q) return;
        q.selectedDegree = values;
        q.degree = values?.[0] || '';
    }

    private loadRoles(): void {
        this.dataService.get<any>('v1/options/roles').pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const roles = response?.data?.roles || response?.data || response || [];
            this.rolesOptions = (Array.isArray(roles) ? roles : []).map((r: any) => ({
                id: String(r.id ?? r.value ?? r.name),
                label: r.name || r.label || r.title || '',
                value: String(r.id ?? r.value ?? r.name)
            }));
        });
    }

    setTab(id: TabId): void {
        this.activeTab = id;
        this.loadTabData(id);
    }

    /** Read-only tabs (sewa/program/donation) hide the Save bar. */
    get isEditableTab(): boolean {
        return !['sewa', 'program', 'donation'].includes(this.activeTab);
    }

    /** First letters of first/last word in the name, avatar fallback. */
    get nameInitials(): string {
        const parts = (this.basic.name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'V';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    get activeTabLabel(): string {
        return this.tabs.find(t => t.id === this.activeTab)?.label || '';
    }

    /** Whole years between Date of Initiation and today. */
    get yearsSinceInitiation(): string {
        const start = this.spiritual.date_of_initiation;
        if (!start || isNaN(new Date(start).getTime())) return '';
        const s = new Date(start);
        const now = new Date();
        let years = now.getFullYear() - s.getFullYear();
        const beforeAnniversary =
            now.getMonth() < s.getMonth() ||
            (now.getMonth() === s.getMonth() && now.getDate() < s.getDate());
        if (beforeAnniversary) years--;
        return years >= 0 ? String(years) : '';
    }

    /** Tabs split into nav groups for the sidebar. */
    get profileTabs(): TabDef[] {
        const editable: TabId[] = ['basic', 'address', 'personal', 'idproofs', 'spiritual', 'education', 'medical'];
        return this.tabs.filter(t => editable.includes(t.id));
    }
    get activityTabs(): TabDef[] {
        const activity: TabId[] = ['sewa', 'program', 'donation'];
        return this.tabs.filter(t => activity.includes(t.id));
    }

    // Address-tab extras
    copyAddress: boolean = false;

    private emptyAddress() {
        return {
            address_1: '', address_2: '', country: '', state: '', city: '', pincode: '',
            district: '', home_branch: '', task_branch: '', department: '',
            branch_id: '', post_office: '', tehsil: ''
        };
    }

    /**
     * The address API returns names (e.g. "India", "Punjab") rather than ids,
     * and the save payload also uses names. So we remap LocationService options
     * (which are id-keyed) to use the label as both id and value — that lets the
     * dropdown bind directly to the name strings already stored in the model.
     */
    private toNameOptions(options: DropdownOption[]): DropdownOption[] {
        return options.map(o => ({ id: o.label, label: o.label, value: o.label }));
    }

    private loadCountries(): void {
        this.locationService.loadCountries().subscribe(opts => {
            this.countryOptions = this.toNameOptions(opts);
        });
    }

    private loadOccupationLocationCountries(): void {
        this.locationService.loadCountries().subscribe(opts => {
            this.occupationLocationOptions = opts;
        });
    }

    private loadStatesFor(scope: 'permanent' | 'correspondence'): void {
        const country = this[scope].country;
        if (!country) {
            if (scope === 'permanent') this.permStateOptions = []; else this.corrStateOptions = [];
            return;
        }
        this.locationService.loadStates(country).subscribe(opts => {
            const mapped = this.toNameOptions(opts);
            if (scope === 'permanent') this.permStateOptions = mapped; else this.corrStateOptions = mapped;
        });
    }

    private loadDistrictsFor(scope: 'permanent' | 'correspondence'): void {
        const state = this[scope].state;
        const country = this[scope].country;
        if (!state) {
            if (scope === 'permanent') this.permDistrictOptions = []; else this.corrDistrictOptions = [];
            return;
        }
        this.locationService.loadDistricts(state, country).subscribe(opts => {
            const mapped = this.toNameOptions(opts);
            if (scope === 'permanent') this.permDistrictOptions = mapped; else this.corrDistrictOptions = mapped;
        });
    }

    private loadCitiesFor(scope: 'permanent' | 'correspondence'): void {
        const { state, district, country } = this[scope];
        if (!state && !district) {
            if (scope === 'permanent') this.permCityOptions = []; else this.corrCityOptions = [];
            return;
        }
        this.locationService.loadCities({
            stateName: state,
            districtName: district,
            countryName: country
        }).subscribe(opts => {
            const mapped = this.toNameOptions(opts);
            if (scope === 'permanent') this.permCityOptions = mapped; else this.corrCityOptions = mapped;
        });
    }

    onCountrySelect(scope: 'permanent' | 'correspondence', value: string): void {
        this[scope].country = value;
        this[scope].state = '';
        this[scope].district = '';
        this[scope].city = '';
        if (scope === 'permanent') {
            this.permStateOptions = []; this.permDistrictOptions = []; this.permCityOptions = [];
        } else {
            this.corrStateOptions = []; this.corrDistrictOptions = []; this.corrCityOptions = [];
        }
        this.loadStatesFor(scope);
    }

    onStateSelect(scope: 'permanent' | 'correspondence', value: string): void {
        this[scope].state = value;
        this[scope].district = '';
        this[scope].city = '';
        if (scope === 'permanent') {
            this.permDistrictOptions = []; this.permCityOptions = [];
        } else {
            this.corrDistrictOptions = []; this.corrCityOptions = [];
        }
        this.loadDistrictsFor(scope);
    }

    onDistrictSelect(scope: 'permanent' | 'correspondence', value: string): void {
        this[scope].district = value;
        this[scope].city = '';
        if (scope === 'permanent') this.permCityOptions = []; else this.corrCityOptions = [];
        this.loadCitiesFor(scope);
    }

    onCitySelect(scope: 'permanent' | 'correspondence', value: string): void {
        this[scope].city = value;
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

    private loadVolunteer(): void {
        this.isLoading = true;
        this.error = null;
        this.dataService.get<any>(`v1/users/${this.userId}`).pipe(
            catchError((err) => {
                console.error('Error loading volunteer:', err);
                this.error = err?.error?.message || err?.message || 'Failed to load volunteer.';
                return of(null);
            }),
            finalize(() => { this.isLoading = false; })
        ).subscribe((response) => {
            if (!response) return;
            const user = response?.data?.user || response?.data || response || {};
            const profile = user?.user_profile || {};
            const addresses = Array.isArray(user?.user_address) ? user.user_address : (user?.user_address ? [user.user_address] : []);
            const perm = addresses[0] || {};
            const corr = addresses[1] || {};
            const ec = (Array.isArray(user?.user_emergency_contacts) ? user.user_emergency_contacts[0] : user?.user_emergency_contacts) || {};

            // Basic info comes from /v1/users/{id}/basic_details — only fill from
            // the legacy endpoint when basic_details didn't already populate it.
            if (!this.basic.unique_id) this.basic.unique_id = user?.unique_id || '';
            if (!this.basic.name) this.basic.name = user?.name || '';
            if (!this.basic.phone) this.basic.phone = user?.phone || '';
            if (!this.basic.whatsappNumber) this.basic.whatsappNumber = user?.alternate_phone || user?.whatsapp_number || '';
            this.copyAsWhatsapp = !!this.basic.phone && this.basic.phone === this.basic.whatsappNumber;
            if (!this.basic.email) this.basic.email = user?.email || '';
            if (!this.basic.personal_email) this.basic.personal_email = user?.personal_email || profile?.personal_email || '';
            if (!this.basic.aadhaarNumber) this.basic.aadhaarNumber = user?.aadhaar_number || '';
            if (!this.basic.dob) {
                this.basic.dob = profile?.dob ? new Date(profile.dob) : (profile?.date_of_birth ? new Date(profile.date_of_birth) : null);
            }

            const lvl = user?.level || profile?.level || '';
            if (!this.selectedLevel.length && lvl) this.selectedLevel = [lvl];

            // Image preview comes from /v1/users/{id}/images — only fall back here
            if (!this.profileImagePreview) {
                const imgs = Array.isArray(user?.user_images) ? user.user_images : [];
                this.profileImagePreview = imgs.length ? (imgs[0]?.full_path || null) : null;
            }

            const roles = Array.isArray(user?.roles) ? user.roles : (Array.isArray(user?.user_roles) ? user.user_roles : []);
            this.selectedRoles = roles.map((r: any) => String(r?.id || r?.name || r)).filter(Boolean);

            this.permanent = this.flattenAddress(perm);
            this.correspondence = this.flattenAddress(corr);

            this.personal = {
                gender: profile?.gender || '',
                marital_status: profile?.marital_status || '',
                father_name: profile?.father_name || '',
                father_email: profile?.father_email || '',
                father_mobile: profile?.father_mobile || '',
                father_occupation: profile?.father_occupation || '',
                father_occupation_location: profile?.father_occupation_location || '',
                father_occupation_type: profile?.father_occupation_type || '',
                father_occupation_status: profile?.father_occupation_status || '',
                mother_name: profile?.mother_name || '',
                mother_email: profile?.mother_email || '',
                mother_mobile: profile?.mother_mobile || '',
                mother_occupation: profile?.mother_occupation || '',
                mother_occupation_location: profile?.mother_occupation_location || '',
                mother_occupation_type: profile?.mother_occupation_type || '',
                mother_occupation_status: profile?.mother_occupation_status || '',
                spouse_name: profile?.spouse_name || '',
                siblings_brother: profile?.siblings_brother || profile?.brother_name || '',
                siblings_sister: profile?.siblings_sister || profile?.sister_name || '',
                earning_members: profile?.earning_members || '',
                family_members_at_home: profile?.family_members_at_home || '',
                samarpit_member: profile?.samarpit_member || '',
                remarks: profile?.remarks || ''
            };
            this.selectedGender = this.personal.gender ? [this.personal.gender] : [];
            this.selectedMaritalStatus = this.personal.marital_status ? [this.personal.marital_status] : [];
            this.selectedFatherOccupation = this.personal.father_occupation ? [this.personal.father_occupation] : [];
            this.selectedFatherOccupationLocation = this.personal.father_occupation_location ? [this.personal.father_occupation_location] : [];
            this.selectedFatherOccupationType = this.personal.father_occupation_type ? [this.personal.father_occupation_type] : [];
            this.selectedFatherOccupationStatus = this.personal.father_occupation_status ? [this.personal.father_occupation_status] : [];
            this.selectedMotherOccupation = this.personal.mother_occupation ? [this.personal.mother_occupation] : [];
            this.selectedMotherOccupationLocation = this.personal.mother_occupation_location ? [this.personal.mother_occupation_location] : [];
            this.selectedMotherOccupationType = this.personal.mother_occupation_type ? [this.personal.mother_occupation_type] : [];
            this.selectedMotherOccupationStatus = this.personal.mother_occupation_status ? [this.personal.mother_occupation_status] : [];
            this.selectedSiblingsBrother = this.personal.siblings_brother ? [this.personal.siblings_brother] : [];
            this.selectedSiblingsSister = this.personal.siblings_sister ? [this.personal.siblings_sister] : [];

            this.emergency = {
                name: ec?.name || '',
                phone: ec?.phone || ec?.mobile || '',
                email: ec?.email || ''
            };

            const quals = Array.isArray(user?.user_qualifications) ? user.user_qualifications : (Array.isArray(profile?.qualifications) ? profile.qualifications : []);
            this.qualifications = quals.length
                ? quals.map((q: any) => {
                    const deg = q?.degree?.name || q?.degree || '';
                    return { degree: deg, name: q?.name || '', remarks: q?.remarks || '', selectedDegree: deg ? [deg] : [] };
                })
                : [{ degree: '', name: '', remarks: '', selectedDegree: [] }];

            this.work = {
                profession: profile?.profession?.name || profile?.profession || '',
                work_experience: profile?.work_experience || profile?.company || profile?.organization || '',
                experience_period: profile?.experience_period || '',
                remarks: profile?.work_remarks || ''
            };

            const skills = Array.isArray(profile?.skills) ? profile.skills : (Array.isArray(user?.user_skills) ? user.user_skills : []);
            this.selectedSkills = skills.map((s: any) => String(s?.id || s?.name || s)).filter(Boolean);
            if (!this.skillOptions.length && skills.length) {
                this.skillOptions = skills.map((s: any) => ({
                    id: String(s?.id || s?.name || s),
                    label: s?.name || String(s),
                    value: String(s?.id || s?.name || s)
                }));
            }

            this.medical = {
                blood_group: profile?.blood_group || '',
                notes: profile?.medical_notes || profile?.notes || '',
                docs: this.normalizeDocs(profile?.medical_docs || user?.user_medical_docs)
            };
            this.selectedBloodGroup = this.medical.blood_group ? [this.medical.blood_group] : [];

            const histories = Array.isArray(user?.user_medical_histories) ? user.user_medical_histories : (Array.isArray(profile?.medical_histories) ? profile.medical_histories : []);
            this.medicalHistories = histories.map((h: any) => ({
                id: String(h?.id || ''),
                major_illness: h?.major_illness !== undefined && h?.major_illness !== null ? String(h.major_illness) : (h?.title || ''),
                note: h?.note || h?.notes || '',
                docs: this.normalizeDocs(h?.docs || h?.medical_docs)
            }));

            this.spiritual = {
                date_of_initiation: this.toDate(profile?.date_of_initiation || profile?.diksha_date),
                years_of_spiritual_initiation: profile?.years_of_spiritual_initiation || '',
                place_of_initiation: profile?.place_of_initiation || profile?.diksha_place || '',
                initiation_branch: profile?.initiation_branch?.name || profile?.initiation_branch || '',
                date_of_joining: this.toDate(profile?.date_of_joining),
                date_of_registration: this.toDate(profile?.date_of_registration),
                place_of_joining: profile?.place_of_joining || '',
                dress_code: profile?.dress_code?.name || profile?.dress_code || '',
                dress_code_ordained_date: this.toDate(profile?.dress_code_ordained_date),
                gyan_agya_date: this.toDate(profile?.gyan_agya_date),
                name_changing_date: this.toDate(profile?.name_changing_date)
            };
            const initiationBranchId = profile?.initiation_branch?.id || profile?.initiation_branch_id || '';
            this.selectedInitiationBranch = initiationBranchId ? [String(initiationBranchId)] : [];

            const homeBranchId = perm?.home_branch?.id || perm?.home_branch_id || user?.home_branch?.id || user?.home_branch || '';
            const taskBranchId = perm?.task_branch?.id || perm?.task_branch_id || user?.working_branch?.id || user?.working_branch || '';
            this.selectedCorrespondingBranch = homeBranchId ? [String(homeBranchId)] : [];
            this.selectedTaskBranch = taskBranchId ? [String(taskBranchId)] : [];

            const userSewas = Array.isArray(user?.user_sewas) ? user.user_sewas : [];
            this.selectedSewas = userSewas.map((us: any) => String(us?.sewa?.id || us?.sewa_id || '')).filter(Boolean);
        });
    }

    private flattenAddress(a: any) {
        return {
            address_1: a?.address_1 || '',
            address_2: a?.address_2 || '',
            country: a?.country?.name || a?.country || '',
            state: a?.state?.name || a?.state || '',
            city: a?.city?.name || a?.city || '',
            pincode: a?.pincode || a?.pin_code || '',
            district: a?.district?.name || a?.district || '',
            home_branch: a?.home_branch?.name || a?.corresponding_branch || '',
            task_branch: a?.task_branch?.name || a?.task_branch || '',
            department: a?.department?.name || a?.department || '',
            branch_id: a?.branch_id || a?.branch?.id || '',
            post_office: a?.post_office || '',
            tehsil: a?.tehsil || ''
        };
    }

    private toDate(v: any): Date | null {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }

    // Sewa tab (read-only)
    private loadSewaTab(): void {
        this.sewaLoading = true;
        this.dataService.get<any>(`v1/users/${this.userId}/sewa_tracking/view`).pipe(
            catchError((err) => { this.sewaError = err?.message || 'Failed'; return of(null); })
        ).subscribe((response) => {
            this.sewaLoading = false;
            if (!response) return;
            const data = response?.data?.refineUserSewaDatas || response?.refineUserSewaDatas || {};
            this.sewaBranches = Object.values(data).map((b: any) => ({
                branchName: b?.name || '',
                sewaGroups: Object.values(b?.sewaDatas || {}).map((s: any) => ({
                    sewaName: s?.sewaName || '',
                    rows: (Array.isArray(s?.sewaTracks) ? s.sewaTracks : []).map((t: any) => ({
                        sewaName: t?.sewa?.name || s?.sewaName || '',
                        badgeId: t?.badge_id ?? '',
                        allocatedDate: t?.created_at || '',
                        unallocatedDate: t?.status === 0 ? (t?.updated_at || '') : '',
                        reason: t?.reason || ''
                    }))
                }))
            }));
        });
    }

    private loadProgramTab(): void {
        this.programLoading = true;
        this.dataService.get<any>(`v1/users/${this.userId}/program_journey/view`).pipe(
            catchError((err) => { this.programError = err?.message || 'Failed'; return of(null); })
        ).subscribe((response) => {
            this.programLoading = false;
            if (!response) return;
            const list = response?.data?.user?.user_program_sewa_volunteers || [];
            this.programRows = (Array.isArray(list) ? list : []).map((p: any) => {
                const program = p?.program_sewa?.program || {};
                const sewa = p?.program_sewa?.sewa || {};
                const att = (program?.program_attendances || [])[0] || {};
                return {
                    programName: program?.name || '',
                    sewaName: sewa?.name || '',
                    status: att?.status ? String(att.status) : '',
                    checkIn: att?.check_in || '',
                    checkOut: att?.check_out || '',
                    startDate: program?.start_date_time || '',
                    endDate: program?.end_date_time || ''
                };
            });
        });
    }

    private loadDonationTab(): void {
        this.donationLoading = true;
        this.dataService.get<any>(`v1/users/${this.userId}/donation/view`).pipe(
            catchError((err) => { this.donationError = err?.message || 'Failed'; return of(null); })
        ).subscribe((response) => {
            this.donationLoading = false;
            if (!response) return;
            const list = response?.data?.user?.user_donations || [];
            this.donationRows = (Array.isArray(list) ? list : []).map((d: any) => ({
                programName: d?.program?.name || d?.program_name || '',
                amount: d?.amount ?? d?.donation_amount ?? '',
                date: d?.donation_date || d?.created_at || d?.date || ''
            }));
        });
    }

    // Input handlers
    onDobChange(date: Date | null): void { this.basic.dob = date; }

    get computedAge(): string {
        const dob = this.basic.dob;
        if (!dob) return '';
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 0 ? String(age) : '';
    }

    onPhoneChange(): void {
        this.basic.phone = sanitizeMobile(this.basic.phone);
        this.phoneInputWarning = '';
        if (this.copyAsWhatsapp) this.basic.whatsappNumber = this.basic.phone;
    }

    onWhatsappChange(): void {
        this.basic.whatsappNumber = sanitizeMobile(this.basic.whatsappNumber);
        this.whatsappInputWarning = '';
    }

    onCopyAsWhatsappChange(): void {
        if (this.copyAsWhatsapp) this.basic.whatsappNumber = this.basic.phone;
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

    onImageChange(selection: string[]): void {
        this.selectedImage = selection;
        if (!selection?.length) {
            this.selectedImageType = null;
            return;
        }
        const v = selection[0];
        if (v !== 'upload' && v !== 'capture') {
            this.selectedImageType = null;
            return;
        }
        if (this.selectedImageType === v && this.imageModalOpen) {
            return;
        }
        this.selectedImageType = v;
        this.clearImage();
        this.imageModalOpen = true;
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
            this.selectedImage = [];
            this.uploadProfileImageNow();
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
        this.selectedImage = [];
        this.uploadProfileImageNow();
    }

    private uploadProfileImageNow(): void {
        if (!this.profileImage || !this.userId) return;
        this.uploadProfileImage().subscribe((response) => {
            if (response) {
                this.snackbarService.showSuccess('Profile image uploaded.');
                this.loadUserImages();
            }
        });
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
        this.profileImageDate = null;
    }

    private normalizeDocs(input: any): Array<{ id?: string; name: string; data: string }> {
        if (!Array.isArray(input)) return [];
        return input.map((d: any) => {
            const url = d?.path || d?.full_path || d?.url || d?.data || '';
            const name = d?.name || d?.file_name || d?.original_name || (url ? url.split('/').pop() : '') || 'document';
            const id = d?.id ? String(d.id) : undefined;
            return { id, name, data: url };
        });
    }

    addMedicalHistory(): void {
        this.medicalHistories.unshift({ id: '', major_illness: '', note: '', docs: [] });
    }

    removeMedicalHistory(index: number): void {
        const h = this.medicalHistories[index];
        if (h?.id && this.userId) {
            this.dataService.delete('v1/users/delete-medical-history', { body: { user_id: this.userId, id: h.id } }).pipe(
                catchError((err) => {
                    this.snackbarService.showError(err?.error?.message || 'Failed to delete medical history.');
                    return of(null);
                })
            ).subscribe((response) => {
                if (response !== null) this.medicalHistories.splice(index, 1);
            });
        } else {
            this.medicalHistories.splice(index, 1);
        }
    }

    onMedicalDocsSelected(files: File[]): void {
        files.forEach((f) => this.fileToBase64(f).then((data) => this.medical.docs.push({ name: f.name, data })));
    }

    removeMedicalDoc(index: number): void {
        this.medical.docs.splice(index, 1);
    }

    onHistoryDocsSelected(historyIndex: number, files: File[]): void {
        const history = this.medicalHistories[historyIndex];
        if (!history) return;
        files.forEach((f) => this.fileToBase64(f).then((data) => history.docs.push({ name: f.name, data })));
    }

    onMedicalDocsInputChange(historyIndex: number, input: HTMLInputElement): void {
        if (!input.files?.length) return;
        const files = Array.from(input.files);
        this.onHistoryDocsSelected(historyIndex, files);
        input.value = '';
    }

    isPdf(value?: string | null): boolean {
        if (!value) return false;
        const v = value.toLowerCase();
        return v.startsWith('data:application/pdf') || v.endsWith('.pdf') || v.includes('.pdf?');
    }

    downloadDoc(doc: { id?: string; name: string; data: string }): void {
        if (!doc?.data) return;
        const triggerDownload = (href: string, revoke?: boolean) => {
            const a = document.createElement('a');
            a.href = href;
            a.download = doc.name || this.fileNameFromUrl(doc.data) || 'document';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
            if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
        };

        if (/^https?:/i.test(doc.data)) {
            // Cross-origin URLs ignore the download attribute; fetch as blob to force download.
            fetch(doc.data, { mode: 'cors' })
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.blob();
                })
                .then((blob) => triggerDownload(URL.createObjectURL(blob), true))
                .catch(() => {
                    this.snackbarService.showError('Failed to download document.');
                });
            return;
        }
        triggerDownload(doc.data);
    }

    private fileNameFromUrl(url: string): string {
        try {
            const path = url.split('?')[0];
            return path.substring(path.lastIndexOf('/') + 1) || '';
        } catch { return ''; }
    }

    removeHistoryDoc(historyIndex: number, docIndex: number): void {
        const history = this.medicalHistories[historyIndex];
        if (!history) return;
        const removed = history.docs[docIndex];
        if (removed?.id) this.queueMedicalDocDelete(removed.id);
        history.docs.splice(docIndex, 1);
    }

    private medicalDocDeleteKey(): string {
        return `delete_medical_history_docs:${this.userId || 'anon'}`;
    }

    private queueMedicalDocDelete(id: string): void {
        try {
            const key = this.medicalDocDeleteKey();
            const raw = localStorage.getItem(key);
            const list: string[] = raw ? raw.split(',').filter(Boolean) : [];
            if (!list.includes(id)) list.push(id);
            localStorage.setItem(key, list.join(','));
        } catch { /* localStorage may be unavailable */ }
    }

    private getQueuedMedicalDocDeletes(): string {
        try {
            return localStorage.getItem(this.medicalDocDeleteKey()) || '';
        } catch {
            return '';
        }
    }

    private clearQueuedMedicalDocDeletes(): void {
        try { localStorage.removeItem(this.medicalDocDeleteKey()); } catch { /* ignore */ }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => resolve((e.target?.result as string) || '');
            reader.readAsDataURL(file);
        });
    }

    onGenderChange(values: any[]): void {
        this.selectedGender = values;
        this.personal.gender = values?.[0] || '';
    }

    onSpiritualDateChange(field: keyof typeof this.spiritual, date: Date | null): void {
        (this.spiritual as any)[field] = date;
    }

    get phoneError(): string { return mobileError(this.basic.phone); }
    get whatsappError(): string { return mobileError(this.basic.whatsappNumber); }
    get emailError(): string { return emailError(this.basic.email); }
    get personalEmailError(): string { return emailError(this.basic.personal_email); }
    get fatherEmailError(): string { return emailError(this.personal.father_email); }
    get motherEmailError(): string { return emailError(this.personal.mother_email); }
    get emergencyEmailError(): string { return emailError(this.emergency.email); }
    get emergencyPhoneError(): string { return mobileError(this.emergency.phone); }

    onCancel(): void {
        this.router.navigate(['/volunteers']);
    }

    onSubmit(): void {
        if (!this.isFormValid()) {
            const msg = 'Please fix the errors before saving.';
            this.error = msg;
            this.snackbarService.showError(msg);
            return;
        }

        this.isSaving = true;
        this.error = null;

        if (this.activeTab === 'address') {
            this.saveAddressTab();
            return;
        }
        if (this.activeTab === 'personal') {
            this.savePersonalTab();
            return;
        }
        if (this.activeTab === 'spiritual') {
            this.saveSpiritualTab();
            return;
        }
        if (this.activeTab === 'education') {
            this.saveEducationTab();
            return;
        }
        if (this.activeTab === 'medical') {
            this.saveMedicalTab();
            return;
        }
        if (this.activeTab === 'idproofs') {
            this.saveIdProofsTab();
            return;
        }

        // Per-tab endpoints: basic uses /users/basic/update/{id}; others fall back to legacy
        const isBasic = this.activeTab === 'basic';
        const url = isBasic
            ? `v1/users/basic/update/${this.userId}`
            : `v1/users/${this.userId}`;
        const payload = isBasic ? this.buildBasicPayload() : this.buildPayload();

        this.dataService.put(url, payload).pipe(
            catchError((error) => {
                const apiError = error as { error?: { message?: string }; message?: string };
                const msg = apiError.error?.message || apiError.message || 'Failed to update volunteer.';
                this.error = msg;
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (!response) {
                this.isSaving = false;
                return;
            }
            // On basic tab, also upload the profile image if a new file was selected
            if (isBasic && this.profileImage && this.userId) {
                this.uploadProfileImage().subscribe({
                    next: () => this.finishSave(),
                    error: () => this.finishSave()
                });
            } else {
                this.finishSave();
            }
        });
    }

    private savePersonalTab(): void {
        const personalPayload: Record<string, unknown> = {
            user_id: this.userId,
            gender: this.personal.gender || null,
            dob: this.formatDate(this.basic.dob),
            marital_status: this.personal.marital_status || this.selectedMaritalStatus[0] || null,
            known_languages: [],
            birth_place: null,
            birth_state: null,
            birth_country: null,
            height_in_ft: null,
            height_in_inches: null,
            weight: null,
            caste_id: null,
            identification_mark: null,
            disablility: null,
            caste_detail: null,
            legal_history: null,
            father_signature: null,
            mother_signature: null,
            guardian_signature: null
        };

        const familyPayload: Record<string, unknown> = {
            user_id: this.userId,
            father_name: this.personal.father_name || null,
            father_email: this.personal.father_email || null,
            father_phone: this.personal.father_mobile ? Number(this.personal.father_mobile) : null,
            father_occupation_id: this.selectedFatherOccupation[0] || null,
            mother_name: this.personal.mother_name || null,
            mother_email: this.personal.mother_email || null,
            mother_phone: this.personal.mother_mobile ? Number(this.personal.mother_mobile) : null,
            mother_occupation_id: this.selectedMotherOccupation[0] || null,
            spouse_name: this.personal.spouse_name || null,
            brother_siblings: this.personal.siblings_brother ? Number(this.personal.siblings_brother) : null,
            sister_siblings: this.personal.siblings_sister ? Number(this.personal.siblings_sister) : null,
            earning_members: this.personal.earning_members ? Number(this.personal.earning_members) : null,
            family_devotees: this.personal.samarpit_member || null,
            inlaws_members: this.personal.family_members_at_home || null,
            mother_occupation_location_id: this.selectedMotherOccupationLocation[0] || null,
            father_occupation_location_id: this.selectedFatherOccupationLocation[0] || null,
            father_occupation_type: this.selectedFatherOccupationType[0] ? Number(this.selectedFatherOccupationType[0]) : null,
            mother_occupation_type: this.selectedMotherOccupationType[0] ? Number(this.selectedMotherOccupationType[0]) : null,
            father_occupation_status: this.selectedFatherOccupationStatus[0] ? Number(this.selectedFatherOccupationStatus[0]) : null,
            mother_occupation_status: this.selectedMotherOccupationStatus[0] ? Number(this.selectedMotherOccupationStatus[0]) : null,
            remarks: this.personal.remarks || null
        };

        const emergencyPayload: Record<string, unknown> = {
            user_id: this.userId,
            emergency_name: this.emergency.name || null,
            emergency_email: this.emergency.email || null,
            emergency_phone: this.emergency.phone ? Number(this.emergency.phone) : null
        };

        const wrapErr = (label: string) => catchError((error: any) => {
            const msg = error?.error?.message || error?.message || `Failed to update ${label}.`;
            this.error = msg;
            this.snackbarService.showError(msg);
            return of(null);
        });

        forkJoin({
            personal: this.dataService.put('v1/users/update-personal', personalPayload).pipe(wrapErr('personal details')),
            family: this.dataService.put('v1/users/update-family', familyPayload).pipe(wrapErr('family details')),
            emergency: this.dataService.put('v1/users/update-emergency', emergencyPayload).pipe(wrapErr('emergency contact'))
        }).subscribe({
            next: (results) => {
                if (results.personal || results.family || results.emergency) this.finishSave();
                else this.isSaving = false;
            },
            error: () => { this.isSaving = false; }
        });
    }

    private saveIdProofsTab(): void {
        const aad = this.idProofs.aadhaar;
        const aadhaarPayload: Record<string, unknown> = {
            user_id: this.userId,
            aadhaar_number: aad.number || '',
            aadhaar_name: aad.name || '',
            aadhaar_address: aad.address || '',
            home_reason: aad.home_reason || '',
            mobile_linked: aad.mobile_linked || '',
            renewal_date: this.formatDate(aad.renewal_date),
            remarks: aad.remarks || '',
            ashram_area_id: aad.ashram_area_id || '',
            adhaar_media: [],
            aadhaar_cropped_image: aad.mediaIsNew && aad.preview ? aad.preview : ''
        };

        const v = this.idProofs.voter;
        const electoralPayload: Record<string, unknown> = {
            user_id: this.userId,
            voter_number: v.voter_number || '',
            voter_name: v.name || '',
            part_number: v.port_number || '',
            serial_number: v.serial_number || '',
            voter_mobile_linked: v.mobile_linked || '',
            voter_address: v.address || '',
            voter_home_reason: v.home_reason || '',
            voter_remarks: v.remarks || '',
            ashram_voter_area_id: v.ashram_voter_area_id || '',
            user_electoral_enclosed: v.mediaIsNew && v.preview ? [v.preview] : []
        };

        const wrapErr = (label: string) => catchError((error: any) => {
            const msg = error?.error?.message || error?.message || `Failed to update ${label}.`;
            this.error = msg;
            this.snackbarService.showError(msg);
            return of(null);
        });

        const l = this.idProofs.license;
        const licensePayload: Record<string, unknown> = {
            user_id: this.userId,
            driving_license_number: l.license_number || '',
            license_holder_name: l.holder_name || '',
            license_state: l.state || '',
            license_type: l.license_type || '',
            date_of_issue: this.formatDate(l.date_of_issue),
            expiry_date: this.formatDate(l.expiry_date),
            user_driving_license_enclosed: l.mediaIsNew && l.preview ? [l.preview] : []
        };

        forkJoin({
            aadhaar: this.dataService.put('v1/users/update-aadhaar', aadhaarPayload).pipe(wrapErr('Aadhaar details')),
            electoral: this.dataService.put('v1/users/update-electoral', electoralPayload).pipe(wrapErr('Electoral details')),
            license: this.dataService.put('v1/users/update-driving-license', licensePayload).pipe(wrapErr('Driving License details'))
        }).subscribe({
            next: (results) => {
                if (results.aadhaar || results.electoral || results.license) this.finishSave();
                else this.isSaving = false;
            },
            error: () => { this.isSaving = false; }
        });
    }

    private saveMedicalTab(): void {
        const payload: Record<string, unknown> = {
            user_id: this.userId,
            blood_group: this.selectedBloodGroup[0] || this.medical.blood_group || '',
            note: this.medicalHistories.map(h => h.note || ''),
            major_illness: this.medicalHistories.map(h => (h.major_illness == 1 || h.major_illness === true || h.major_illness === '1') ? 1 : 0),
            medical_history_media: this.medicalHistories.map(h => (h.docs || []).map(d => d.data).filter(Boolean)),
            medical_history_id: this.medicalHistories.map(h => h.id || ''),
            delete_medical_history_docs: this.getQueuedMedicalDocDeletes()
        };

        this.dataService.put('v1/users/update-medical', payload).pipe(
            catchError((error: any) => {
                const msg = error?.error?.message || error?.message || 'Failed to update medical details.';
                this.error = msg;
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (response) {
                this.clearQueuedMedicalDocDeletes();
                this.finishSave();
            } else {
                this.isSaving = false;
            }
        });
    }

    private saveEducationTab(): void {
        const educationPayload: Record<string, unknown> = {
            user_id: this.userId,
            remarks: this.qualifications.map(q => q.remarks || ''),
            degree_id: this.qualifications.map(q => q.degree || ''),
            name: this.qualifications.map(q => q.name || ''),
            education_media: this.qualifications.map(() => ''),
            delete_education_docs: '',
            user_education_id: this.qualifications.map(q => q.id || '')
        };

        const workPayload: Record<string, unknown> = {
            user_id: this.userId,
            profession_id: this.selectedProfession[0] || null,
            experience: this.work.work_experience || '',
            experience_period: this.work.experience_period || '',
            skills: this.selectedSkills || [],
            profession_skill_remarks: this.work.remarks || ''
        };

        const wrapErr = (label: string) => catchError((error: any) => {
            const msg = error?.error?.message || error?.message || `Failed to update ${label}.`;
            this.error = msg;
            this.snackbarService.showError(msg);
            return of(null);
        });

        forkJoin({
            education: this.dataService.put('v1/users/update-education', educationPayload).pipe(wrapErr('education')),
            work: this.dataService.put('v1/users/update-work', workPayload).pipe(wrapErr('work experience'))
        }).subscribe({
            next: (results) => {
                if (results.education || results.work) this.finishSave();
                else this.isSaving = false;
            },
            error: () => { this.isSaving = false; }
        });
    }

    private saveSpiritualTab(): void {
        const payload: Record<string, unknown> = {
            user_id: this.userId,
            date_of_initiation: this.formatDate(this.spiritual.date_of_initiation),
            place_of_initiation: this.spiritual.place_of_initiation || null,
            initiation_branch_id: this.selectedInitiationBranch[0] || null,
            date_of_joining: this.formatDate(this.spiritual.date_of_joining),
            joining_branch_id: this._joiningBranchId || null,
            dress_code_id: this._dressCodeId || null,
            dress_code_ordained_date: this.formatDate(this.spiritual.dress_code_ordained_date),
            date_of_registration: this.formatDate(this.spiritual.date_of_registration),
            gyan_agya_date: this.formatDate(this.spiritual.gyan_agya_date),
            name_changing_date: this.formatDate(this.spiritual.name_changing_date)
        };

        this.dataService.put('v1/users/update-spiritual', payload).pipe(
            catchError((error: any) => {
                const msg = error?.error?.message || error?.message || 'Failed to update spiritual details.';
                this.error = msg;
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (response) this.finishSave();
            else this.isSaving = false;
        });
    }

    private saveAddressTab(): void {
        this.permanentPincodeError = this.validatePincode(this.permanent.pincode || '');
        this.correspondencePincodeError = this.validatePincode(this.correspondence.pincode || '');
        if (this.permanentPincodeError || this.correspondencePincodeError) {
            this.snackbarService.showError('Please enter valid 6-digit pincodes.');
            this.isSaving = false;
            return;
        }
        const permanentPayload: Record<string, unknown> = {
            user_id: this.userId,
            permanent_address: this.permanent.address_1 || '',
            permanent_address_2: this.permanent.address_2 || '',
            permanent_country: this.permanent.country || '',
            permanent_state: this.permanent.state || '',
            permanent_city: this.permanent.city || '',
            permanent_pincode: this.permanent.pincode || '',
            permanent_district: this.permanent.district || ''
        };

        const correspondencePayload: Record<string, unknown> = {
            user_id: this.userId,
            address_1: this.correspondence.address_1 || '',
            address_2: this.correspondence.address_2 || '',
            country: this.correspondence.country || '',
            state: this.correspondence.state || '',
            city: this.correspondence.city || '',
            pincode: this.correspondence.pincode || '',
            district: this.correspondence.district || '',
            branch_id: this.correspondence.branch_id || '',
            home_branch: this.correspondence.home_branch || '',
            post_office: this.correspondence.post_office || '',
            tehsil: this.correspondence.tehsil || '',
            copy_address: this.copyAddress ? 1 : 0
        };

        const wrapErr = (label: string) => catchError((error: any) => {
            const msg = error?.error?.message || error?.message || `Failed to update ${label} address.`;
            this.error = msg;
            this.snackbarService.showError(msg);
            return of(null);
        });

        forkJoin({
            permanent: this.dataService.put('v1/users/update-permanent/address', permanentPayload).pipe(wrapErr('permanent')),
            correspondence: this.dataService.put('v1/users/update-correspondence/address', correspondencePayload).pipe(wrapErr('correspondence'))
        }).subscribe({
            next: ({ permanent, correspondence }) => {
                if (permanent || correspondence) this.finishSave();
                else this.isSaving = false;
            },
            error: () => { this.isSaving = false; }
        });
    }

    private finishSave(): void {
        this.isSaving = false;
        this.snackbarService.showSuccess('Volunteer updated successfully');
        this.router.navigate(['/volunteers']);
    }

    /** Tracks which inline section save is in flight, so its button can show a spinner. */
    savingSection: string | null = null;

    private sectionBaselines: Record<string, string> = {};

    private getSectionState(key: string): unknown {
        switch (key) {
            case 'basic':
                return {
                    basic: this.basic,
                    level: this.selectedLevel,
                    roles: this.selectedRoles,
                    sewas: this.selectedSewas,
                    copyAsWhatsapp: this.copyAsWhatsapp
                };
            case 'permanent':
                return { permanent: this.permanent };
            case 'correspondence':
                return {
                    correspondence: this.correspondence,
                    copyAddress: this.copyAddress,
                    correspondingBranch: this.selectedCorrespondingBranch,
                    taskBranch: this.selectedTaskBranch
                };
            case 'personal':
                return {
                    gender: this.personal.gender,
                    marital_status: this.personal.marital_status,
                    dob: this.basic.dob,
                    selectedGender: this.selectedGender,
                    selectedMaritalStatus: this.selectedMaritalStatus
                };
            case 'family':
                return {
                    father_name: this.personal.father_name,
                    father_email: this.personal.father_email,
                    father_mobile: this.personal.father_mobile,
                    father_occupation: this.personal.father_occupation,
                    father_occupation_location: this.personal.father_occupation_location,
                    father_occupation_type: this.personal.father_occupation_type,
                    father_occupation_status: this.personal.father_occupation_status,
                    mother_name: this.personal.mother_name,
                    mother_email: this.personal.mother_email,
                    mother_mobile: this.personal.mother_mobile,
                    mother_occupation: this.personal.mother_occupation,
                    mother_occupation_location: this.personal.mother_occupation_location,
                    mother_occupation_type: this.personal.mother_occupation_type,
                    mother_occupation_status: this.personal.mother_occupation_status,
                    spouse_name: this.personal.spouse_name,
                    siblings_brother: this.personal.siblings_brother,
                    siblings_sister: this.personal.siblings_sister,
                    earning_members: this.personal.earning_members,
                    family_members_at_home: this.personal.family_members_at_home,
                    samarpit_member: this.personal.samarpit_member,
                    remarks: this.personal.remarks,
                    selectedFatherOccupation: this.selectedFatherOccupation,
                    selectedFatherOccupationLocation: this.selectedFatherOccupationLocation,
                    selectedFatherOccupationType: this.selectedFatherOccupationType,
                    selectedFatherOccupationStatus: this.selectedFatherOccupationStatus,
                    selectedMotherOccupation: this.selectedMotherOccupation,
                    selectedMotherOccupationLocation: this.selectedMotherOccupationLocation,
                    selectedMotherOccupationType: this.selectedMotherOccupationType,
                    selectedMotherOccupationStatus: this.selectedMotherOccupationStatus,
                    selectedSiblingsBrother: this.selectedSiblingsBrother,
                    selectedSiblingsSister: this.selectedSiblingsSister
                };
            case 'emergency':
                return { emergency: this.emergency };
            case 'spiritual':
                return {
                    spiritual: this.spiritual,
                    selectedInitiationBranch: this.selectedInitiationBranch,
                    joiningBranchId: this._joiningBranchId,
                    dressCodeId: this._dressCodeId
                };
            case 'education':
                return { qualifications: this.qualifications };
            case 'work':
                return {
                    work: this.work,
                    selectedProfession: this.selectedProfession,
                    selectedSkills: this.selectedSkills
                };
            case 'aadhaar': {
                const a = this.idProofs.aadhaar;
                return {
                    number: a.number,
                    name: a.name,
                    address: a.address,
                    home_reason: a.home_reason,
                    mobile_linked: a.mobile_linked,
                    renewal_date: a.renewal_date,
                    remarks: a.remarks,
                    ashram_area_id: a.ashram_area_id,
                    mediaIsNew: a.mediaIsNew,
                    mediaId: a.mediaId,
                    files: a.files.length,
                    previews: a.previews.length,
                    file: !!a.file,
                    selectedAadhaarHomeReason: this.selectedAadhaarHomeReason
                };
            }
            case 'electoral': {
                const v = this.idProofs.voter;
                return {
                    voter_number: v.voter_number,
                    name: v.name,
                    port_number: v.port_number,
                    serial_number: v.serial_number,
                    address: v.address,
                    home_reason: v.home_reason,
                    mobile_linked: v.mobile_linked,
                    remarks: v.remarks,
                    ashram_voter_area_id: v.ashram_voter_area_id,
                    mediaIsNew: v.mediaIsNew,
                    mediaId: v.mediaId,
                    files: v.files.length,
                    previews: v.previews.length,
                    file: !!v.file,
                    selectedVoterHomeReason: this.selectedVoterHomeReason
                };
            }
            case 'license': {
                const l = this.idProofs.license;
                return {
                    license_number: l.license_number,
                    holder_name: l.holder_name,
                    state: l.state,
                    license_type: l.license_type,
                    date_of_issue: l.date_of_issue,
                    expiry_date: l.expiry_date,
                    mediaIsNew: l.mediaIsNew,
                    mediaId: l.mediaId,
                    files: l.files.length,
                    previews: l.previews.length,
                    file: !!l.file
                };
            }
            case 'medical':
                return {
                    blood_group: this.medical.blood_group,
                    notes: this.medical.notes,
                    docs: this.medical.docs.length,
                    selectedBloodGroup: this.selectedBloodGroup,
                    histories: this.medicalHistories.map(h => ({
                        id: h.id,
                        major_illness: h.major_illness,
                        note: h.note,
                        docs: (h.docs || []).length
                    }))
                };
            default:
                return null;
        }
    }

    snapshotSection(key: string): void {
        this.sectionBaselines[key] = JSON.stringify(this.getSectionState(key));
    }

    isSectionDirty(key: string): boolean {
        const base = this.sectionBaselines[key];
        if (base === undefined) return false;
        if (key === 'medical' && this.getQueuedMedicalDocDeletes()) return true;
        return JSON.stringify(this.getSectionState(key)) !== base;
    }

    /**
     * Generic per-section PUT helper. Runs the request, manages the section's
     * loading flag, surfaces a snackbar on success/failure. Does NOT navigate
     * away — section saves stay on the page so the user can keep editing.
     */
    private putSection(sectionKey: string, label: string, url: string, payload: Record<string, unknown>): void {
        if (this.savingSection) return;
        this.savingSection = sectionKey;
        this.dataService.put(url, payload).pipe(
            catchError((error: any) => {
                const msg = error?.error?.message || error?.message || `Failed to update ${label}.`;
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (response) {
                this.snackbarService.showSuccess(`${label} updated`);
                this.snapshotSection(sectionKey);
                // Reload from server so newly-saved rows pick up their backend ids
                // and we don't re-create duplicates on the next save.
                this.reloadSection(sectionKey);
            }
            this.savingSection = null;
        });
    }

    private reloadSection(sectionKey: string): void {
        switch (sectionKey) {
            case 'permanent': this.loadPermanentAddress(); break;
            case 'correspondence': this.loadCorrespondenceAddress(); break;
            case 'personal': this.loadPersonalDetails(); break;
            case 'family': this.loadFamilyDetails(); break;
            case 'emergency': this.loadEmergencyDetails(); break;
            case 'aadhaar': this.loadAadhaarDetails(); break;
            case 'electoral': this.loadElectoralDetails(); break;
            case 'license': this.loadDrivingLicenseDetails(); break;
            case 'education':
                this.qualifications = [];
                this.loadEducationDetails();
                break;
            case 'work': this.loadWorkExperience(); break;
            case 'spiritual': this.loadSpiritualDetails(); break;
        }
    }

    saveBasicSection(): void {
        if (!this.isFormValid()) {
            this.snackbarService.showError('Please fix the errors before saving.');
            return;
        }
        this.savingSection = 'basic';
        this.dataService.put(`v1/users/basic/update/${this.userId}`, this.buildBasicPayload()).pipe(
            catchError((error: any) => {
                const msg = error?.error?.message || error?.message || 'Failed to update basic information.';
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (!response) { this.savingSection = null; return; }
            this.snapshotSection('basic');
            const finishBasic = () => {
                this.snackbarService.showSuccess('Basic information updated');
                this.savingSection = null;
                // Reload from server so the form reflects the persisted state.
                this.loadBasicDetails();
                this.loadUserImages();
            };
            if (this.profileImage && this.userId) {
                this.uploadProfileImage().subscribe({
                    next: finishBasic,
                    error: finishBasic
                });
            } else {
                finishBasic();
            }
        });
    }

    savePermanentSection(): void {
        this.permanentPincodeError = this.validatePincode(this.permanent.pincode || '');
        if (this.permanentPincodeError) {
            this.snackbarService.showError(this.permanentPincodeError);
            return;
        }
        this.putSection('permanent', 'Permanent address', 'v1/users/update-permanent/address', {
            user_id: this.userId,
            permanent_address: this.permanent.address_1 || '',
            permanent_address_2: this.permanent.address_2 || '',
            permanent_country: this.permanent.country || '',
            permanent_state: this.permanent.state || '',
            permanent_city: this.permanent.city || '',
            permanent_pincode: this.permanent.pincode || '',
            permanent_district: this.permanent.district || ''
        });
    }

    saveCorrespondenceSection(): void {
        this.correspondencePincodeError = this.validatePincode(this.correspondence.pincode || '');
        if (this.correspondencePincodeError) {
            this.snackbarService.showError(this.correspondencePincodeError);
            return;
        }
        this.putSection('correspondence', 'Correspondence address', 'v1/users/update-correspondence/address', {
            user_id: this.userId,
            address_1: this.correspondence.address_1 || '',
            address_2: this.correspondence.address_2 || '',
            country: this.correspondence.country || '',
            state: this.correspondence.state || '',
            city: this.correspondence.city || '',
            pincode: this.correspondence.pincode || '',
            district: this.correspondence.district || '',
            branch_id: this.correspondence.branch_id || '',
            home_branch: this.correspondence.home_branch || '',
            post_office: this.correspondence.post_office || '',
            tehsil: this.correspondence.tehsil || '',
            copy_address: this.copyAddress ? 1 : 0
        });
    }

    savePersonalSection(): void {
        this.putSection('personal', 'Personal details', 'v1/users/update-personal', {
            user_id: this.userId,
            gender: this.personal.gender || null,
            dob: this.formatDate(this.basic.dob),
            marital_status: this.personal.marital_status || this.selectedMaritalStatus[0] || null,
            known_languages: [],
            birth_place: null,
            birth_state: null,
            birth_country: null,
            height_in_ft: null,
            height_in_inches: null,
            weight: null,
            caste_id: null,
            identification_mark: null,
            disablility: null,
            caste_detail: null,
            legal_history: null,
            father_signature: null,
            mother_signature: null,
            guardian_signature: null
        });
    }

    saveFamilySection(): void {
        this.putSection('family', 'Family details', 'v1/users/update-family', {
            user_id: this.userId,
            father_name: this.personal.father_name || null,
            father_email: this.personal.father_email || null,
            father_phone: this.personal.father_mobile ? Number(this.personal.father_mobile) : null,
            father_occupation_id: this.selectedFatherOccupation[0] || null,
            mother_name: this.personal.mother_name || null,
            mother_email: this.personal.mother_email || null,
            mother_phone: this.personal.mother_mobile ? Number(this.personal.mother_mobile) : null,
            mother_occupation_id: this.selectedMotherOccupation[0] || null,
            spouse_name: this.personal.spouse_name || null,
            brother_siblings: this.personal.siblings_brother ? Number(this.personal.siblings_brother) : null,
            sister_siblings: this.personal.siblings_sister ? Number(this.personal.siblings_sister) : null,
            earning_members: this.personal.earning_members ? Number(this.personal.earning_members) : null,
            family_devotees: this.personal.samarpit_member || null,
            inlaws_members: this.personal.family_members_at_home || null,
            mother_occupation_location_id: this.selectedMotherOccupationLocation[0] || null,
            father_occupation_location_id: this.selectedFatherOccupationLocation[0] || null,
            father_occupation_type: this.selectedFatherOccupationType[0] ? Number(this.selectedFatherOccupationType[0]) : null,
            mother_occupation_type: this.selectedMotherOccupationType[0] ? Number(this.selectedMotherOccupationType[0]) : null,
            father_occupation_status: this.selectedFatherOccupationStatus[0] ? Number(this.selectedFatherOccupationStatus[0]) : null,
            mother_occupation_status: this.selectedMotherOccupationStatus[0] ? Number(this.selectedMotherOccupationStatus[0]) : null,
            remarks: this.personal.remarks || null
        });
    }

    saveEmergencySection(): void {
        this.putSection('emergency', 'Emergency contact', 'v1/users/update-emergency', {
            user_id: this.userId,
            emergency_name: this.emergency.name || null,
            emergency_email: this.emergency.email || null,
            emergency_phone: this.emergency.phone ? Number(this.emergency.phone) : null
        });
    }

    private validateAadhaarSection(): boolean {
        const a = this.idProofs.aadhaar;
        const errors: typeof this.aadhaarErrors = {};
        if (!a.number?.trim()) errors.number = 'Aadhaar Number is required.';
        if (!a.name?.trim()) errors.name = 'Name is required.';
        this.aadhaarErrors = errors;
        return Object.keys(errors).length === 0;
    }

    saveAadhaarSection(): void {
        if (!this.validateAadhaarSection()) {
            this.snackbarService.showError('Please fix the highlighted errors.');
            return;
        }
        const a = this.idProofs.aadhaar;
        const newPreviews = a.mediaIsNew ? (a.previews?.length ? a.previews : (a.preview ? [a.preview] : [])) : [];
        this.putSection('aadhaar', 'Aadhaar details', 'v1/users/update-aadhaar', {
            user_id: this.userId,
            aadhaar_number: a.number || '',
            aadhaar_name: a.name || '',
            aadhaar_address: a.address || '',
            home_reason: a.home_reason || '',
            mobile_linked: a.mobile_linked || '',
            renewal_date: this.formatDate(a.renewal_date),
            remarks: a.remarks || '',
            ashram_area_id: a.ashram_area_id || '',
            adhaar_media: newPreviews,
            aadhaar_cropped_image: newPreviews[0] || ''
        });
    }

    private validateVoterSection(): boolean {
        const v = this.idProofs.voter;
        const errors: typeof this.voterErrors = {};
        if (!v.voter_number?.trim()) errors.voter_number = 'Voter Number is required.';
        if (!v.name?.trim()) errors.name = 'Name is required.';
        this.voterErrors = errors;
        return Object.keys(errors).length === 0;
    }

    saveElectoralSection(): void {
        if (!this.validateVoterSection()) {
            this.snackbarService.showError('Please fix the highlighted errors.');
            return;
        }
        const v = this.idProofs.voter;
        const newPreviews = v.mediaIsNew ? (v.previews?.length ? v.previews : (v.preview ? [v.preview] : [])) : [];
        this.putSection('electoral', 'Electoral details', 'v1/users/update-electoral', {
            user_id: this.userId,
            voter_number: v.voter_number || '',
            voter_name: v.name || '',
            part_number: v.port_number || '',
            serial_number: v.serial_number || '',
            voter_mobile_linked: v.mobile_linked || '',
            voter_address: v.address || '',
            voter_home_reason: v.home_reason || '',
            voter_remarks: v.remarks || '',
            ashram_voter_area_id: v.ashram_voter_area_id || '',
            user_electoral_enclosed: newPreviews
        });
    }

    private loadLicenseStates(): void {
        if (this.licenseStateOptions.length > 0) return;
        this.dataService.get<any>('v1/options/states', { params: { country: 'India' } }).pipe(
            catchError(() => of({ data: [] }))
        ).subscribe((response) => {
            const list = response?.data?.states || response?.data || response?.results || response || [];
            this.licenseStateOptions = (Array.isArray(list) ? list : []).map((s: any) => {
                const name = s?.name ?? s?.label ?? s;
                return { id: String(name), label: String(name), value: String(name) };
            });
        });
    }

    private validateLicenseSection(): boolean {
        const l = this.idProofs.license;
        const errors: typeof this.licenseErrors = {};
        if (!l.license_number?.trim()) errors.license_number = 'License Number is required.';
        if (!l.holder_name?.trim()) errors.holder_name = 'License Holder Name is required.';
        if (!l.state?.trim()) errors.state = 'State is required.';
        if (!l.license_type?.trim()) errors.license_type = 'License Type is required.';
        this.licenseErrors = errors;
        return Object.keys(errors).length === 0;
    }

    saveLicenseSection(): void {
        if (!this.validateLicenseSection()) {
            this.snackbarService.showError('Please fix the highlighted errors.');
            return;
        }
        const l = this.idProofs.license;
        const newPreviews = l.mediaIsNew ? (l.previews?.length ? l.previews : (l.preview ? [l.preview] : [])) : [];
        this.putSection('license', 'Driving license', 'v1/users/update-driving-license', {
            user_id: this.userId,
            driving_license_number: l.license_number || '',
            license_holder_name: l.holder_name || '',
            license_state: l.state || '',
            license_type: l.license_type || '',
            date_of_issue: this.formatDate(l.date_of_issue),
            expiry_date: this.formatDate(l.expiry_date),
            user_driving_license_enclosed: newPreviews
        });
    }

    saveEducationSection(): void {
        this.putSection('education', 'Education', 'v1/users/update-education', {
            user_id: this.userId,
            remarks: this.qualifications.map(q => q.remarks || ''),
            degree_id: this.qualifications.map(q => q.degree || ''),
            name: this.qualifications.map(q => q.name || ''),
            education_media: this.qualifications.map(() => ''),
            delete_education_docs: '',
            user_education_id: this.qualifications.map(q => q.id || '')
        });
    }

    saveWorkSection(): void {
        this.putSection('work', 'Work experience', 'v1/users/update-work', {
            user_id: this.userId,
            profession_id: this.selectedProfession[0] || null,
            experience: this.work.work_experience || '',
            experience_period: this.work.experience_period || '',
            skills: this.selectedSkills || [],
            profession_skill_remarks: this.work.remarks || ''
        });
    }

    saveSpiritualSection(): void {
        this.putSection('spiritual', 'Spiritual details', 'v1/users/update-spiritual', {
            user_id: this.userId,
            date_of_initiation: this.formatDate(this.spiritual.date_of_initiation),
            place_of_initiation: this.spiritual.place_of_initiation || null,
            initiation_branch_id: this.selectedInitiationBranch[0] || null,
            date_of_joining: this.formatDate(this.spiritual.date_of_joining),
            joining_branch_id: this._joiningBranchId || null,
            dress_code_id: this._dressCodeId || null,
            dress_code_ordained_date: this.formatDate(this.spiritual.dress_code_ordained_date),
            date_of_registration: this.formatDate(this.spiritual.date_of_registration),
            gyan_agya_date: this.formatDate(this.spiritual.gyan_agya_date),
            name_changing_date: this.formatDate(this.spiritual.name_changing_date)
        });
    }

    saveMedicalSection(): void {
        if (this.savingSection) return;
        this.savingSection = 'medical';
        const queuedDeletes = this.getQueuedMedicalDocDeletes();
        const payload = {
            user_id: this.userId,
            blood_group: this.selectedBloodGroup[0] || this.medical.blood_group || '',
            note: this.medicalHistories.map(h => h.note || ''),
            major_illness: this.medicalHistories.map(h => (h.major_illness == 1 || h.major_illness === true || h.major_illness === '1') ? 1 : 0),
            medical_history_media: this.medicalHistories.map(h => (h.docs || []).map(d => d.data).filter(Boolean)),
            medical_history_id: this.medicalHistories.map(h => h.id || ''),
            delete_medical_history_docs: queuedDeletes
        };

        this.dataService.put('v1/users/update-medical', payload).pipe(
            catchError((error: any) => {
                const msg = error?.error?.message || error?.message || 'Failed to update Medical details.';
                this.snackbarService.showError(msg);
                return of(null);
            })
        ).subscribe((response) => {
            if (response) {
                this.snackbarService.showSuccess('Medical details updated');
                this.clearQueuedMedicalDocDeletes();
                // Reload from server so newly-saved rows pick up their backend ids
                // and we don't re-create duplicates on the next save.
                this.medicalHistories = [];
                this.loadMedicalDetails();
            }
            this.savingSection = null;
        });
    }

    /**
     * Uploads the captured/selected profile image via /v1/users/store-image.
     * Form fields: user_id, cropped_image (file), date (YYYY-MM-DD).
     */
    private uploadProfileImage() {
        const file = this.profileImage as File;
        const formData = new FormData();
        formData.append('user_id', String(this.userId));
        formData.append('cropped_image', file, file?.name || 'profile.jpg');
        formData.append('date', this.formatDate(new Date()) || '');

        return this.dataService.post('v1/users/store-image', formData).pipe(
            catchError((error) => {
                console.error('Error uploading profile image:', error);
                this.snackbarService.showError('Failed to upload profile image.');
                return of(null);
            })
        );
    }

    /**
     * Builds the payload for /v1/users/basic/update/{id}.
     * Sends matched form fields; fields not present in the UI are sent as null.
     */
    private buildBasicPayload(): Record<string, unknown> {
        return {
            name: this.basic.name || null,
            former_name: null,
            nickname: null,
            roles: this.selectedRoles?.length ? this.selectedRoles : null,
            sewas: this.selectedSewas?.length ? this.selectedSewas : null,
            phone: this.basic.phone || null,
            alternate_phone: this.basic.whatsappNumber || null,
            email: this.basic.email || null,
            personal_email: this.basic.personal_email || null,
            date_of_reinstatement: null,
            date_of_leaving: null,
            date_of_expired: null,
            level: this.selectedLevel[0] || null,
            start_date: null,
            valid_upto: null,
            current_status: null,
            remarks: null,
            needs_approval: null
        };
    }

    private isFormValid(): boolean {
        if (!this.basic.name || !this.basic.phone) return false;
        if (this.phoneError) return false;
        if (this.basic.whatsappNumber && this.whatsappError) return false;
        if (this.basic.email && this.emailError) return false;
        if (this.basic.personal_email && this.personalEmailError) return false;
        if (this.personal.father_email && this.fatherEmailError) return false;
        if (this.personal.mother_email && this.motherEmailError) return false;
        if (this.emergency.email && this.emergencyEmailError) return false;
        if (this.emergency.phone && this.emergencyPhoneError) return false;
        return true;
    }

    private formatDate(date: Date | null): string | null {
        if (!date) return null;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private buildPayload(): Record<string, unknown> {
        const payload: Record<string, unknown> = {
            name: this.basic.name,
            phone: this.basic.phone,
            alternate_phone: this.basic.whatsappNumber || '',
            email: this.basic.email || '',
            personal_email: this.basic.personal_email || '',
            home_branch: this.selectedCorrespondingBranch[0] || '',
            working_branch: this.selectedTaskBranch[0] || '',
            aadhaar_number: this.basic.aadhaarNumber || '',
            dob: this.formatDate(this.basic.dob),
            father_name: this.personal.father_name || '',
            mother_name: this.personal.mother_name || '',
            spouse_name: this.personal.spouse_name || '',
            sewas: this.selectedSewas || [],
            level: this.selectedLevel[0] || '',
            roles: this.selectedRoles || [],
            user_profile: {
                gender: this.personal.gender || '',
                father_name: this.personal.father_name,
                father_email: this.personal.father_email,
                father_occupation: this.personal.father_occupation,
                mother_name: this.personal.mother_name,
                mother_email: this.personal.mother_email,
                mother_occupation: this.personal.mother_occupation,
                spouse_name: this.personal.spouse_name,
                siblings_sister: this.personal.siblings_sister,
                earning_members: this.personal.earning_members,
                profession: this.work.profession || '',
                work_experience: this.work.work_experience || '',
                experience_period: this.work.experience_period || '',
                work_remarks: this.work.remarks || '',
                skills: this.selectedSkills || [],
                blood_group: this.selectedBloodGroup[0] || this.medical.blood_group || '',
                medical_notes: this.medical.notes || '',
                medical_docs: this.medical.docs,
                date_of_initiation: this.formatDate(this.spiritual.date_of_initiation),
                years_of_spiritual_initiation: this.spiritual.years_of_spiritual_initiation,
                place_of_initiation: this.spiritual.place_of_initiation,
                initiation_branch: this.selectedInitiationBranch[0] || this.spiritual.initiation_branch || '',
                date_of_joining: this.formatDate(this.spiritual.date_of_joining),
                date_of_registration: this.formatDate(this.spiritual.date_of_registration),
                place_of_joining: this.spiritual.place_of_joining,
                dress_code: this.spiritual.dress_code,
                dress_code_ordained_date: this.formatDate(this.spiritual.dress_code_ordained_date),
                gyan_agya_date: this.formatDate(this.spiritual.gyan_agya_date),
                name_changing_date: this.formatDate(this.spiritual.name_changing_date)
            },
            user_address: [this.permanent, this.correspondence],
            user_emergency_contacts: [this.emergency],
            user_medical_histories: this.medicalHistories,
            user_qualifications: this.qualifications.map(q => ({ degree: q.degree, name: q.name, remarks: q.remarks }))
        };

        if (this.profileImage && this.profileImagePreview) {
            const key = this.selectedImageType === 'capture' ? 'capture_user_image' : 'user_image';
            payload[key] = this.profileImagePreview;
        }

        return payload;
    }
}
