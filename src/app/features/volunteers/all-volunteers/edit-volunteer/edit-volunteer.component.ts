import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../../shared/components/datepicker/datepicker.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FileUploadComponent, FileUploadConfig } from '../../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DataService } from '../../../../data.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { sanitizeMobile, mobileError, emailError, blockNonDigitKey } from '../../../../shared/utils/validators';

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
    BreadcrumbComponent,
    DropdownComponent,
    DatepickerComponent,
    LoadingComponent,
    IconComponent,
    FileUploadComponent,
    CameraUploadComponent,
    ModalComponent
  ],
  selector: 'app-edit-volunteer',
  templateUrl: './edit-volunteer.component.html',
  styleUrls: ['./edit-volunteer.component.scss']
})
export class EditVolunteerComponent implements OnInit {
  @ViewChild('volunteerForm') volunteerForm!: NgForm;

  private dataService = inject(DataService);
  private snackbarService = inject(SnackbarService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tabs: TabDef[] = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'address', label: 'Address Details' },
    { id: 'personal', label: 'Personal & Family Details' },
    { id: 'idproofs', label: 'Id Proofs' },
    { id: 'spiritual', label: 'User Spiritual Detail' },
    { id: 'education', label: 'Education & Work Details' },
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
    { id: 'Sewadar', label: 'Sewadar', value: 'Sewadar' },
    { id: 'Coordinator', label: 'Coordinator', value: 'Coordinator' },
    { id: 'Head', label: 'Head', value: 'Head' }
  ];
  selectedLevel: any[] = [];

  rolesOptions: DropdownOption[] = [];
  selectedRoles: any[] = [];

  // Profile image
  profileImage: File | null = null;
  profileImagePreview: string | null = null;
  profileImageDate: string | null = null;
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
    { id: 'single', label: 'Single', value: 'single' },
    { id: 'married', label: 'Married', value: 'married' },
    { id: 'divorced', label: 'Divorced', value: 'divorced' },
    { id: 'widowed', label: 'Widowed', value: 'widowed' }
  ];
  occupationOptions: DropdownOption[] = [
    { id: 'service', label: 'Service', value: 'service' },
    { id: 'business', label: 'Business', value: 'business' },
    { id: 'self_employed', label: 'Self Employed', value: 'self_employed' },
    { id: 'homemaker', label: 'Homemaker', value: 'homemaker' },
    { id: 'retired', label: 'Retired', value: 'retired' },
    { id: 'other', label: 'Other', value: 'other' }
  ];
  occupationLocationOptions: DropdownOption[] = [
    { id: 'india', label: 'India', value: 'india' },
    { id: 'abroad', label: 'Abroad', value: 'abroad' }
  ];
  occupationTypeOptions: DropdownOption[] = [
    { id: 'government', label: 'Government', value: 'government' },
    { id: 'private', label: 'Private', value: 'private' },
    { id: 'public_sector', label: 'Public Sector', value: 'public_sector' },
    { id: 'self', label: 'Self', value: 'self' }
  ];
  occupationStatusOptions: DropdownOption[] = [
    { id: 'working', label: 'Working', value: 'working' },
    { id: 'not_working', label: 'Not Working', value: 'not_working' },
    { id: 'retired', label: 'Retired', value: 'retired' }
  ];
  siblingsCountOptions: DropdownOption[] = [
    { id: '0', label: '0', value: '0' },
    { id: '1', label: '1', value: '1' },
    { id: '2', label: '2', value: '2' },
    { id: '3', label: '3', value: '3' },
    { id: '4', label: '4', value: '4' },
    { id: '5+', label: '5+', value: '5+' }
  ];

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
      mediaId: '' as string,
      mediaIsNew: false
    }
  };

  homeReasonOptions: DropdownOption[] = [
    { id: 'permanent', label: 'Permanent', value: 'permanent' },
    { id: 'temporary', label: 'Temporary', value: 'temporary' },
    { id: 'rented', label: 'Rented', value: 'rented' },
    { id: 'owned', label: 'Owned', value: 'owned' }
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

  idProofFileConfig: FileUploadConfig = {
    multiple: false,
    accept: 'image/*',
    maxSizeMb: 5,
    maxFiles: 1,
    dropText: 'Drag & drop image here or',
    buttonText: 'Browse',
    showFileListHeader: false
  };

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
        this.dataService.post('v1/users/delete-aadhaar-media', { id: aad.mediaId }).pipe(
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
      if (e.target?.result) this.idProofs[key].preview = e.target.result as string;
    };
    reader.readAsDataURL(file);
    if (key === 'aadhaar') this.idProofs.aadhaar.mediaIsNew = true;
    if (key === 'voter') this.idProofs.voter.mediaIsNew = true;
    if (key === 'license') this.idProofs.license.mediaIsNew = true;
    this.closeIdProofModal();
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

  degreeOptions: DropdownOption[] = [
    { id: '10', label: '10th', value: '10th' },
    { id: '12', label: '12th', value: '12th' },
    { id: 'diploma', label: 'Diploma', value: 'Diploma' },
    { id: 'graduate', label: 'Graduate', value: 'Graduate' },
    { id: 'postgraduate', label: 'Post Graduate', value: 'Post Graduate' },
    { id: 'phd', label: 'PhD', value: 'PhD' }
  ];

  // User Work Experience
  work = {
    profession: '',
    work_experience: '',
    experience_period: '',
    remarks: ''
  };

  professionOptions: DropdownOption[] = [];
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
    major_illness: string;
    note: string;
    docs: Array<{ name: string; data: string }>;
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
  selectedSewas: any[] = [];
  selectedCorrespondingBranch: any[] = [];
  selectedTaskBranch: any[] = [];

  genderOptions: DropdownOption[] = [
    { id: 'MALE', label: 'MALE', value: 'MALE' },
    { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
    { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
  ];
  selectedGender: any[] = [];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Volunteers', route: '/volunteers' },
    { label: 'Edit Volunteer', route: '' }
  ];

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
        this.loadPermanentAddress();
        this.loadCorrespondenceAddress();
        break;
      case 'personal':
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
      const l = root?.user_driving_license_details ?? root?.driving_license_details ?? root?.user ?? root;

      this.idProofs.license.license_number = l?.driving_license_number || l?.license_number || this.idProofs.license.license_number;
      this.idProofs.license.holder_name = l?.license_holder_name || l?.holder_name || this.idProofs.license.holder_name;
      this.idProofs.license.state = l?.license_state || l?.state || this.idProofs.license.state;
      this.idProofs.license.license_type = l?.license_type || this.idProofs.license.license_type;
      if (l?.date_of_issue) this.idProofs.license.date_of_issue = new Date(l.date_of_issue);
      if (l?.expiry_date) this.idProofs.license.expiry_date = new Date(l.expiry_date);

      const media = Array.isArray(l?.user_driving_license_enclosed) ? l.user_driving_license_enclosed[0] : l?.media;
      if (media) {
        this.idProofs.license.preview = media?.full_path || media?.url || media?.path || media || null;
        this.idProofs.license.mediaId = String(media?.id || '');
        this.idProofs.license.mediaIsNew = false;
      }
    });
  }

  private loadElectoralDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/electoral_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const e = root?.user_electoral_details ?? root?.electoral_details ?? root?.user ?? root;

      this.idProofs.voter.voter_number = e?.voter_number || this.idProofs.voter.voter_number;
      this.idProofs.voter.name = e?.voter_name || e?.name || this.idProofs.voter.name;
      this.idProofs.voter.port_number = e?.part_number || e?.port_number || this.idProofs.voter.port_number;
      this.idProofs.voter.serial_number = e?.serial_number || this.idProofs.voter.serial_number;
      this.idProofs.voter.address = e?.voter_address || this.idProofs.voter.address;
      if (e?.voter_home_reason) {
        this.idProofs.voter.home_reason = e.voter_home_reason;
        this.selectedVoterHomeReason = [e.voter_home_reason];
      }
      this.idProofs.voter.mobile_linked = e?.voter_mobile_linked || this.idProofs.voter.mobile_linked;
      this.idProofs.voter.remarks = e?.voter_remarks || this.idProofs.voter.remarks;
      this.idProofs.voter.ashram_voter_area_id = e?.ashram_voter_area_id || e?.ashram_voter_area?.id || this.idProofs.voter.ashram_voter_area_id;

      const media = Array.isArray(e?.user_electoral_enclosed) ? e.user_electoral_enclosed[0] : e?.media;
      if (media) {
        this.idProofs.voter.preview = media?.full_path || media?.url || media?.path || media || null;
        this.idProofs.voter.mediaId = String(media?.id || '');
        this.idProofs.voter.mediaIsNew = false;
      }
    });
  }

  private loadAadhaarDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/aadhaar_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const a = root?.user_aadhaar_details ?? root?.aadhaar_details ?? root?.user ?? root;

      this.idProofs.aadhaar.number = a?.aadhaar_number || this.idProofs.aadhaar.number;
      this.idProofs.aadhaar.name = a?.aadhaar_name || this.idProofs.aadhaar.name;
      this.idProofs.aadhaar.address = a?.aadhaar_address || this.idProofs.aadhaar.address;
      if (a?.home_reason) {
        this.idProofs.aadhaar.home_reason = a.home_reason;
        this.selectedAadhaarHomeReason = [a.home_reason];
      }
      this.idProofs.aadhaar.mobile_linked = a?.mobile_linked || this.idProofs.aadhaar.mobile_linked;
      if (a?.renewal_date) this.idProofs.aadhaar.renewal_date = new Date(a.renewal_date);
      this.idProofs.aadhaar.remarks = a?.remarks || this.idProofs.aadhaar.remarks;
      this.idProofs.aadhaar.ashram_area_id = a?.ashram_area_id || a?.ashram_area?.id || this.idProofs.aadhaar.ashram_area_id;

      const media = Array.isArray(a?.adhaar_media) ? a.adhaar_media[0] : (Array.isArray(a?.aadhaar_media) ? a.aadhaar_media[0] : a?.media);
      if (media) {
        this.idProofs.aadhaar.preview = media?.full_path || media?.url || media?.path || media || null;
        this.idProofs.aadhaar.mediaId = String(media?.id || '');
        this.idProofs.aadhaar.mediaIsNew = false;
      }
    });
  }

  private loadMedicalDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/medical_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const m = root?.user_medical_details ?? root?.medical_details ?? root?.user ?? root;

      if (m?.blood_group) {
        this.medical.blood_group = m.blood_group;
        this.selectedBloodGroup = [m.blood_group];
      }
      if (m?.note) this.medical.notes = m.note;
      else if (m?.medical_notes) this.medical.notes = m.medical_notes;

      const histories = m?.user_medical_histories || m?.medical_histories || [];
      if (Array.isArray(histories) && histories.length) {
        this.medicalHistories = histories.map((h: any) => ({
          id: String(h?.id || ''),
          major_illness: h?.major_illness !== undefined && h?.major_illness !== null ? String(h.major_illness) : '',
          note: h?.note || h?.notes || '',
          docs: this.normalizeDocs(h?.docs || h?.medical_history_media || h?.medical_docs)
        }));
      }
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
        this.selectedSkills = skills.map((s: any) => String(s?.id || s?.name || s)).filter(Boolean);
      }
    });
  }

  private loadEducationDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/education_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const list = root?.user_education_details
        ?? root?.education_details
        ?? root?.user_qualifications
        ?? root?.qualifications
        ?? root;
      const arr = Array.isArray(list) ? list : Object.values(list || {});
      if (!arr.length) return;
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
    });
  }

  private loadSpiritualDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/spiritual_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const s = root?.user_spiritual_details ?? root?.spiritual_details ?? root?.user ?? root;

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
      this.personal.siblings_brother = (f?.brother_siblings ?? this.personal.siblings_brother) + '';
      this.personal.siblings_sister = (f?.sister_siblings ?? this.personal.siblings_sister) + '';
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
    });
  }

  private loadEmergencyDetails(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/emergency_contact_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const e = root?.user_emergency_contact ?? root?.emergency_contact_details ?? root?.user ?? root;

      this.emergency.name = e?.emergency_name || e?.name || this.emergency.name;
      this.emergency.phone = e?.emergency_phone || e?.phone || this.emergency.phone;
      this.emergency.email = e?.emergency_email || e?.email || this.emergency.email;
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
    });
  }

  private loadCorrespondenceAddress(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/correspondence_address`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const a = root?.correspondence_address ?? root?.user_correspondence_address ?? root?.address ?? root;

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
      this.copyAddress = a?.copy_address === 1 || a?.copy_address === '1' || a?.copy_address === true;
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
    });
  }

  /**
   * Loads user images from /v1/users/{id}/images and seeds the profile preview.
   */
  private loadUserImages(): void {
    this.dataService.get<any>(`v1/users/${this.userId}/images`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const data = response?.data || response || {};
      const list = Array.isArray(data) ? data : (Array.isArray(data?.images) ? data.images : (Array.isArray(data?.user_images) ? data.user_images : []));
      const first = list?.[0];
      const url = first?.full_path || first?.url || first?.path || first;
      if (url && typeof url === 'string') {
        this.profileImagePreview = url;
      }
      const date = first?.date || first?.uploaded_at || first?.created_at || first?.updated_at;
      if (date) this.profileImageDate = String(date);
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

  addQualification(): void {
    this.qualifications.push({ id: '', degree: '', name: '', remarks: '', selectedDegree: [] });
  }

  removeQualification(index: number): void {
    const q = this.qualifications[index];
    if (q?.id && this.userId) {
      // Existing row — call delete API first
      this.dataService.post('v1/users/delete-education', { user_id: this.userId, id: q.id }).pipe(
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

  // Address-tab extras
  copyAddress: boolean = false;

  private emptyAddress() {
    return {
      address_1: '', address_2: '', country: '', state: '', city: '', pincode: '',
      district: '', home_branch: '', task_branch: '', department: '',
      branch_id: '', post_office: '', tehsil: ''
    };
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
    this.profileImageDate = null;
  }

  private normalizeDocs(input: any): Array<{ name: string; data: string }> {
    if (!Array.isArray(input)) return [];
    return input.map((d: any) => ({
      name: d?.name || d?.file_name || d?.original_name || 'document',
      data: d?.full_path || d?.url || d?.data || ''
    }));
  }

  addMedicalHistory(): void {
    this.medicalHistories.push({ id: '', major_illness: '', note: '', docs: [] });
  }

  removeMedicalHistory(index: number): void {
    const h = this.medicalHistories[index];
    if (h?.id && this.userId) {
      this.dataService.post('v1/users/delete-medical-history', { user_id: this.userId, id: h.id }).pipe(
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

  removeHistoryDoc(historyIndex: number, docIndex: number): void {
    this.medicalHistories[historyIndex]?.docs.splice(docIndex, 1);
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
      major_illness: this.medicalHistories.map(h => h.major_illness ? Number(h.major_illness) : null),
      medical_history_media: this.medicalHistories.map(() => ''),
      medical_history_id: this.medicalHistories.map(h => h.id || ''),
      delete_medical_history_docs: ''
    };

    this.dataService.put('v1/users/update-medical', payload).pipe(
      catchError((error: any) => {
        const msg = error?.error?.message || error?.message || 'Failed to update medical details.';
        this.error = msg;
        this.snackbarService.showError(msg);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) this.finishSave();
      else this.isSaving = false;
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

  /**
   * Uploads the captured/selected profile image via /v1/users/store-image.
   * Form fields: user_id, cropped_images (file), date (string).
   */
  private uploadProfileImage() {
    const formData = new FormData();
    formData.append('user_id', String(this.userId));
    formData.append('cropped_images', this.profileImage as File, (this.profileImage as File).name || 'profile.jpg');
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
