import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from '../../../data.service';
import { LocationService } from '../../../core/services/location.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { FileUploadComponent, FileUploadConfig } from '../../../shared/components/file-upload/file-upload.component';
import { CameraUploadComponent } from '../../../shared/components/camera-upload/camera-upload.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { emailError } from '../../../shared/utils/validators';
import { ImagePreviewDirective } from '../../../shared/directives/image-preview.directive';

type TabKey = 'basic' | 'address' | 'personal' | 'idproofs';
type IdProofKey = 'aadhaar' | 'voter' | 'license';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, IconComponent, FileUploadComponent, CameraUploadComponent, ModalComponent, DropdownComponent, DatepickerComponent, ImagePreviewDirective],
  selector: 'app-edit-visitor',
  templateUrl: './edit-visitor.component.html',
  styleUrls: ['./edit-visitor.component.scss']
})
export class EditVisitorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private snackbar = inject(SnackbarService);
  private locationService = inject(LocationService);

  countryOptions: DropdownOption[] = [];
  stateOptions: DropdownOption[] = [];
  districtOptions: DropdownOption[] = [];
  cityOptions: DropdownOption[] = [];

  isLoading = true;
  error: string | null = null;
  user: any = null;
  activeTab: TabKey = 'basic';

  isSaving: Record<TabKey, boolean> = { basic: false, address: false, personal: false, idproofs: false };
  private sectionBaselines: Record<string, string> = {};

  private getSectionState(key: string): unknown {
    switch (key) {
      case 'basic': return { ...this.basicForm };
      case 'permanent': return { ...this.addressForm };
      case 'personalDetails': return {
        gender: this.personalForm?.gender,
        dob: this.personalForm?.dob,
        marital_status: this.personalForm?.marital_status,
        birth_place: this.personalForm?.birth_place,
        height_in_ft: this.personalForm?.height_in_ft,
        height_in_inches: this.personalForm?.height_in_inches,
        weight: this.personalForm?.weight,
        identification_mark: this.personalForm?.identification_mark
      };
      case 'family': return {
        father_name: this.personalForm?.father_name,
        father_email: this.personalForm?.father_email,
        father_mobile: this.personalForm?.father_mobile,
        father_occupation: this.personalForm?.father_occupation,
        mother_name: this.personalForm?.mother_name,
        mother_email: this.personalForm?.mother_email,
        mother_mobile: this.personalForm?.mother_mobile,
        mother_occupation: this.personalForm?.mother_occupation,
        spouse_name: this.personalForm?.spouse_name,
        siblings_brother: this.personalForm?.siblings_brother,
        siblings_sister: this.personalForm?.siblings_sister,
        earning_members: this.personalForm?.earning_members,
        family_members_at_home: this.personalForm?.family_members_at_home,
        samarpit_member: this.personalForm?.samarpit_member,
        remarks: this.personalForm?.remarks
      };
      case 'aadhaar': {
        const a = this.idProofs?.aadhaar || ({} as any);
        return {
          number: a.number,
          name: a.name,
          address: a.address,
          home_reason: a.home_reason,
          mobile_linked: a.mobile_linked,
          renewal_date: a.renewal_date,
          remarks: a.remarks,
          ashram_area_id: a.ashram_area_id,
          filesCount: (a.files || []).length,
          previewsCount: (a.previews || []).length,
          hasCropped: !!a.croppedImage,
          imagesCount: (this.aadhaarImages || []).length
        };
      }
      default: return null;
    }
  }

  snapshotSection(key: string): void {
    this.sectionBaselines[key] = JSON.stringify(this.getSectionState(key));
  }

  isSectionDirty(key: string): boolean {
    const base = this.sectionBaselines[key];
    if (base === undefined) return false;
    return JSON.stringify(this.getSectionState(key)) !== base;
  }

  isSavingSection: Record<string, boolean> = {
    permanent: false,
    personalDetails: false,
    family: false,
    aadhaar: false,
    electoral: false,
    license: false
  };
  saveError: string | null = null;
  permanentPincodeError = '';

  basicForm: any = {};
  addressForm: any = {};
  personalForm: any = {};

  // Profile image
  profileImages: Array<{ id: string | number; url: string; date: string }> = [];
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;
  imageModalOpen = false;
  selectedImageType: 'upload' | 'capture' | null = null;
  fileUploadConfig: FileUploadConfig = {
    multiple: false,
    accept: 'image/*',
    maxSizeMb: 5,
    maxFiles: 1,
    dropText: 'Drag & drop image here or',
    buttonText: 'Browse',
    showFileListHeader: false
  };

  levelOptions = ['Visitor', 'Volunteer', 'Preacher', 'Desiring Devotee'];
  genderOptions = ['MALE', 'FEMALE', 'OTHER'];
  maritalStatusOptions = ['Married', 'Single', 'Divorced', 'Separated'];

  professionOptions: DropdownOption[] = [];
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

  get fatherEmailError(): string { return emailError(this.personalForm.father_email); }
  get motherEmailError(): string { return emailError(this.personalForm.mother_email); }

  profileTabs: { id: TabKey; label: string }[] = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'address', label: 'Address Details' },
    { id: 'personal', label: 'Personal & Family Details' },
    { id: 'idproofs', label: 'Id Proofs' }
  ];

  // Id Proofs (Aadhaar, Voter, Driving License)
  idProofs = {
    aadhaar: {
      number: '',
      name: '',
      address: '' as 'Ashram' | 'Home' | '',
      home_reason: '',
      mobile_linked: '',
      renewal_date: '' as string,
      remarks: '',
      ashram_area_id: '',
      file: null as File | null,
      preview: null as string | null,
      files: [] as File[],
      previews: [] as string[],
      croppedImage: null as string | null,
      mediaId: '' as string,
      mediaIsNew: false
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
      date_of_issue: '' as string,
      expiry_date: '' as string,
      file: null as File | null,
      preview: null as string | null,
      files: [] as File[],
      previews: [] as string[],
      mediaId: '' as string,
      mediaIsNew: false
    }
  };

  aadhaarImages: Array<{ id: string | number; url: string; date: string }> = [];
  voterImages: Array<{ id: string | number; url: string; date: string }> = [];
  licenseImages: Array<{ id: string | number; url: string; date: string }> = [];

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

  licenseTypeOptions: DropdownOption[] = [
    { id: 'Car', label: 'Car', value: 'Car' },
    { id: 'HTV', label: 'HTV', value: 'HTV' },
    { id: 'LTV', label: 'LTV', value: 'LTV' },
    { id: 'LMV', label: 'LMV', value: 'LMV' },
    { id: 'MCWG', label: 'MCWG', value: 'MCWG' },
    { id: 'MCWOG', label: 'MCWOG', value: 'MCWOG' }
  ];
  licenseStateOptions: DropdownOption[] = [];

  aadhaarErrors: { number?: string; name?: string } = {};
  voterErrors: { voter_number?: string; name?: string } = {};
  licenseErrors: { license_number?: string; holder_name?: string; state?: string; license_type?: string } = {};

  // Id Proof upload modal state
  idProofModalOpen = false;
  idProofActiveKey: IdProofKey | null = null;
  idProofUploadType: 'upload' | 'capture' | null = null;
  idProofUploadOptions: DropdownOption[] = [
    { id: '1', label: 'Upload from local', value: 'upload' },
    { id: '2', label: 'Capture live photo', value: 'capture' }
  ];
  selectedIdProofUploadType: any[] = [];
  private idProofsLoaded = false;

  get idProofFileConfig(): FileUploadConfig {
    const multi = this.idProofActiveKey === 'aadhaar' || this.idProofActiveKey === 'voter' || this.idProofActiveKey === 'license';
    return {
      multiple: multi,
      accept: 'image/*,application/pdf',
      maxSizeMb: 5,
      maxFiles: multi ? 10 : 1,
      dropText: 'Drag & drop image or PDF here or',
      buttonText: 'Browse',
      showFileListHeader: multi
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid visitor id.';
      this.isLoading = false;
      return;
    }
    this.loadCountries();
    this.loadUser(id);
  }

  private toNameOptions(options: DropdownOption[]): DropdownOption[] {
    return options.map(o => ({ id: o.label, label: o.label, value: o.label }));
  }

  private loadCountries(): void {
    this.locationService.loadCountries().subscribe(opts => {
      this.countryOptions = this.toNameOptions(opts);
    });
  }

  private loadStates(): void {
    const country = this.addressForm.country;
    if (!country) { this.stateOptions = []; return; }
    this.locationService.loadStates(country).subscribe(opts => {
      this.stateOptions = this.toNameOptions(opts);
    });
  }

  private loadDistricts(): void {
    const state = this.addressForm.state;
    const country = this.addressForm.country;
    if (!state) { this.districtOptions = []; return; }
    this.locationService.loadDistricts(state, country).subscribe(opts => {
      this.districtOptions = this.toNameOptions(opts);
    });
  }

  private loadCities(): void {
    const { state, district, country } = this.addressForm;
    if (!state && !district) { this.cityOptions = []; return; }
    this.locationService.loadCities({
      stateName: state,
      districtName: district,
      countryName: country
    }).subscribe(opts => {
      this.cityOptions = this.toNameOptions(opts);
    });
  }

  onCountrySelect(value: string): void {
    this.addressForm.country = value;
    this.addressForm.state = '';
    this.addressForm.district = '';
    this.addressForm.city = '';
    this.stateOptions = [];
    this.districtOptions = [];
    this.cityOptions = [];
    this.loadStates();
  }

  onStateSelect(value: string): void {
    this.addressForm.state = value;
    this.addressForm.district = '';
    this.addressForm.city = '';
    this.districtOptions = [];
    this.cityOptions = [];
    this.loadDistricts();
  }

  onDistrictSelect(value: string): void {
    this.addressForm.district = value;
    this.addressForm.city = '';
    this.cityOptions = [];
    this.loadCities();
  }

  onCitySelect(value: string): void {
    this.addressForm.city = value;
  }

  onPincodeChange(value: string): void {
    const cleaned = (value || '').replace(/\D/g, '').slice(0, 6);
    this.addressForm.pincode = cleaned;
    this.permanentPincodeError = this.validatePincode(cleaned);
  }

  private validatePincode(value: string): string {
    if (!value) return 'Pincode is required.';
    if (!/^\d{6}$/.test(value)) return 'Pincode must be 6 digits.';
    return '';
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const s = String(value);
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatYmd(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onStartDateChange(date: Date | null): void {
    this.basicForm.start_date = this.formatYmd(date);
  }

  onValidUptoChange(date: Date | null): void {
    this.basicForm.valid_upto = this.formatYmd(date);
  }

  onDobChange(date: Date | null): void {
    this.personalForm.dob = this.formatYmd(date);
  }

  get computedAge(): string {
    const d = this.toDate(this.personalForm.dob);
    if (!d) return '';
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 ? String(age) : '';
  }

  onAadhaarRenewalDateChange(date: Date | null): void {
    this.idProofs.aadhaar.renewal_date = this.formatYmd(date);
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>(`v1/users/${id}/view`).pipe(
      catchError((err) => {
        console.error('Error loading visitor:', err);
        this.error = err?.error?.message || err?.message || 'Failed to load visitor details.';
        return of(null);
      }),
      finalize(() => (this.isLoading = false))
    ).subscribe((response) => {
      const user = response?.data?.user || response?.user || response?.data || null;
      this.user = user;
      if (user) {
        this.hydrateForms(user);
        this.loadUserImages();
      }
    });
  }

  private loadUserImages(): void {
    if (!this.user?.id) return;
    this.dataService.get<any>(`v1/users/${this.user.id}/images`).pipe(
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
      }
    });
  }

  private isRealImageRow(x: { id: any; url: any; date: any }): boolean {
    if (!x.id) return false;
    if (typeof x.url !== 'string') return false;
    const url = x.url.trim().toLowerCase();
    if (!url) return false;
    if (url.includes('no_image') || url.includes('no-image') || url.includes('placeholder')) return false;
    return true;
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

  closeImageModal(): void { this.imageModalOpen = false; }

  onFilesSelected(files: File[]): void {
    if (files?.length > 0) {
      this.profileImageFile = files[0];
      this.createImagePreview(this.profileImageFile);
      this.imageModalOpen = false;
      this.uploadProfileImageNow();
    }
  }

  onFileRejected(rejection: { file: File; reason: string }): void {
    this.snackbar.showError(`File rejected: ${rejection.reason}`);
  }

  onFileRemoved(file: File): void {
    if (this.profileImageFile === file) this.clearImage();
  }

  onCameraImageRemoved(): void {
    this.clearImage();
    this.selectedImageType = null;
  }

  onImageCaptured(file: File): void {
    this.profileImageFile = file;
    this.createImagePreview(file);
    this.imageModalOpen = false;
    this.uploadProfileImageNow();
  }

  private uploadProfileImageNow(): void {
    if (!this.profileImageFile || !this.user?.id) return;
    const file = this.profileImageFile;
    const formData = new FormData();
    formData.append('user_id', String(this.user.id));
    formData.append('cropped_image', file, file.name || 'profile.jpg');
    formData.append('date', this.formatDate(new Date()) || '');

    this.dataService.post('v1/users/store-image', formData).pipe(
      catchError((error) => {
        console.error('Error uploading profile image:', error);
        this.snackbar.showError('Failed to upload profile image.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Profile image uploaded.');
        this.loadUserImages();
      }
    });
  }

  deleteProfileImage(image: { id: string | number; url: string; date: string }): void {
    if (!image?.id) {
      this.profileImages = this.profileImages.filter(i => i !== image);
      return;
    }
    this.dataService.delete('v1/users/delete-user-image', { body: { id: image.id } }).pipe(
      catchError((err) => {
        this.snackbar.showError(err?.error?.message || 'Failed to delete image.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.profileImages = this.profileImages.filter(i => i.id !== image.id);
      this.snackbar.showSuccess('Image deleted.');
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
    this.profileImageFile = null;
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private hydrateForms(user: any): void {
    const profile = user.user_profile || {};
    const perm = user.user_permanent_address || {};

    this.basicForm = {
      name: user.name || '',
      personal_email: user.personal_email || '',
      official_email: user.official_email || '',
      phone: user.phone || '',
      level: user.level || '',
      remarks: user.remarks || '',
      start_date: user.start_date || '',
      valid_upto: user.valid_upto || ''
    };

    this.addressForm = {
      address_1: perm.address_1 || '',
      address_2: perm.address_2 || '',
      country: perm.country?.name || perm.country || '',
      state: perm.state?.name || perm.state || '',
      city: perm.city?.name || perm.city || '',
      pincode: perm.pincode || '',
      district: perm.district?.name || perm.district || ''
    };
    if (this.addressForm.country) this.loadStates();
    if (this.addressForm.state) this.loadDistricts();
    if (this.addressForm.state || this.addressForm.district) this.loadCities();

    this.personalForm = {
      gender: profile.gender || '',
      dob: profile.dob || '',
      marital_status: profile.marital_status || '',
      birth_place: profile.birth_place || '',
      height_in_ft: profile.height_in_ft ?? '',
      height_in_inches: profile.height_in_inches ?? '',
      weight: profile.weight ?? '',
      identification_mark: profile.identification_mark || '',
      father_name: profile.father_name || '',
      father_email: profile.father_email || '',
      father_mobile: profile.father_phone || '',
      father_occupation: '',
      mother_name: profile.mother_name || '',
      mother_email: profile.mother_email || '',
      mother_mobile: profile.mother_phone || '',
      mother_occupation: '',
      spouse_name: profile.spouse_name || '',
      siblings_brother: '',
      siblings_sister: '',
      earning_members: '',
      family_members_at_home: '',
      samarpit_member: '',
      remarks: ''
    };

    this.snapshotSection('basic');
    this.snapshotSection('permanent');
    this.snapshotSection('personalDetails');
    this.snapshotSection('family');
  }

  setTab(id: TabKey): void {
    this.activeTab = id;
    this.saveError = null;
    if (id === 'idproofs' && !this.idProofsLoaded && this.user?.id) {
      this.idProofsLoaded = true;
      this.loadAadhaarDetails();
    }
    if (id === 'personal' && !this.personalLoaded && this.user?.id) {
      this.personalLoaded = true;
      this.loadProfessions();
      this.loadOccupationLocationCountries();
      this.loadFamilyDetails();
    }
  }

  private personalLoaded = false;

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

  private loadOccupationLocationCountries(): void {
    this.locationService.loadCountries().subscribe(opts => {
      this.occupationLocationOptions = opts;
    });
  }

  private loadFamilyDetails(): void {
    if (!this.user?.id) return;
    this.dataService.get<any>(`v1/users/${this.user.id}/family_details`).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (!response) return;
      const root = response?.data ?? response ?? {};
      const f = root?.user_family_details ?? root?.family_details ?? root?.user ?? root;

      this.personalForm.father_name = f?.father_name || this.personalForm.father_name;
      this.personalForm.father_email = f?.father_email || this.personalForm.father_email;
      this.personalForm.father_mobile = f?.father_phone || this.personalForm.father_mobile;
      this.personalForm.mother_name = f?.mother_name || this.personalForm.mother_name;
      this.personalForm.mother_email = f?.mother_email || this.personalForm.mother_email;
      this.personalForm.mother_mobile = f?.mother_phone || this.personalForm.mother_mobile;
      this.personalForm.spouse_name = f?.spouse_name || this.personalForm.spouse_name;
      this.personalForm.siblings_brother = (f?.brother_siblings ?? this.personalForm.siblings_brother ?? '') + '';
      this.personalForm.siblings_sister = (f?.sister_siblings ?? this.personalForm.siblings_sister ?? '') + '';
      this.selectedSiblingsBrother = this.personalForm.siblings_brother ? [this.personalForm.siblings_brother] : [];
      this.selectedSiblingsSister = this.personalForm.siblings_sister ? [this.personalForm.siblings_sister] : [];
      this.personalForm.earning_members = (f?.earning_members ?? this.personalForm.earning_members ?? '') + '';
      this.personalForm.samarpit_member = f?.family_devotees || this.personalForm.samarpit_member;
      this.personalForm.family_members_at_home = f?.inlaws_members || this.personalForm.family_members_at_home;
      this.personalForm.remarks = f?.remarks || this.personalForm.remarks;

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

  get activeTabLabel(): string {
    return this.profileTabs.find((t) => t.id === this.activeTab)?.label || '';
  }

  goBack(): void {
    this.router.navigate(['/visitors']);
  }

  onClose(): void { this.goBack(); }

  display(value: any): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  get nameInitials(): string {
    const name = this.user?.name || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n.charAt(0).toUpperCase())
      .join('');
  }

  get profileImage(): string {
    const first = this.user?.user_images?.[0];
    return first?.full_path || first?.image || '';
  }

  get primaryImage(): string {
    const first = this.user?.user_images?.[0];
    return first?.full_path || '/assets/img/placeholder.svg';
  }

  saveBasic(): void {
    if (!this.user) return;
    this.isSaving.basic = true;
    this.saveError = null;

    const payload = this.cleanPayload({ ...this.basicForm });

    this.dataService.put<any>(`v1/users/basic/update/${this.user.id}`, payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update basic details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.basic = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Basic details updated.');
        this.loadUser(this.user.id);
      }
    });
  }

  savePermanentAddress(): void {
    if (!this.user) return;
    this.permanentPincodeError = this.validatePincode(this.addressForm.pincode || '');
    if (this.permanentPincodeError) {
      this.snackbar.showError(this.permanentPincodeError);
      return;
    }
    this.isSavingSection['permanent'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
      permanent_address: this.addressForm.address_1 || '',
      permanent_address_2: this.addressForm.address_2 || '',
      permanent_country: this.addressForm.country || '',
      permanent_state: this.addressForm.state || '',
      permanent_city: this.addressForm.city || '',
      permanent_pincode: this.addressForm.pincode || '',
      permanent_district: this.addressForm.district || ''
    };

    this.dataService.put<any>('v1/users/update-permanent/address', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update permanent address.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['permanent'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Permanent address updated.');
        this.loadUser(this.user.id);
      }
    });
  }

  savePersonalDetails(): void {
    if (!this.user) return;
    this.isSavingSection['personalDetails'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
      gender: this.personalForm.gender || null,
      dob: this.personalForm.dob || null,
      marital_status: this.personalForm.marital_status || null
    };

    this.dataService.put<any>('v1/users/update-personal', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update personal details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['personalDetails'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Personal details updated.');
        this.loadUser(this.user.id);
      }
    });
  }

  saveFamilyDetails(): void {
    if (!this.user) return;
    this.isSavingSection['family'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
      father_name: this.personalForm.father_name || null,
      father_email: this.personalForm.father_email || null,
      father_phone: this.personalForm.father_mobile ? Number(this.personalForm.father_mobile) : null,
      father_occupation_id: this.selectedFatherOccupation[0] || null,
      mother_name: this.personalForm.mother_name || null,
      mother_email: this.personalForm.mother_email || null,
      mother_phone: this.personalForm.mother_mobile ? Number(this.personalForm.mother_mobile) : null,
      mother_occupation_id: this.selectedMotherOccupation[0] || null,
      spouse_name: this.personalForm.spouse_name || null,
      brother_siblings: this.personalForm.siblings_brother ? Number(this.personalForm.siblings_brother) : null,
      sister_siblings: this.personalForm.siblings_sister ? Number(this.personalForm.siblings_sister) : null,
      earning_members: this.personalForm.earning_members !== '' && this.personalForm.earning_members !== null && this.personalForm.earning_members !== undefined ? Number(this.personalForm.earning_members) : null,
      family_devotees: this.personalForm.samarpit_member || null,
      inlaws_members: this.personalForm.family_members_at_home || null,
      mother_occupation_location_id: this.selectedMotherOccupationLocation[0] || null,
      father_occupation_location_id: this.selectedFatherOccupationLocation[0] || null,
      father_occupation_type: this.selectedFatherOccupationType[0] ? Number(this.selectedFatherOccupationType[0]) : null,
      mother_occupation_type: this.selectedMotherOccupationType[0] ? Number(this.selectedMotherOccupationType[0]) : null,
      father_occupation_status: this.selectedFatherOccupationStatus[0] ? Number(this.selectedFatherOccupationStatus[0]) : null,
      mother_occupation_status: this.selectedMotherOccupationStatus[0] ? Number(this.selectedMotherOccupationStatus[0]) : null,
      remarks: this.personalForm.remarks || null
    };

    this.dataService.put<any>('v1/users/update-family', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update family details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['family'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Family details updated.');
        this.loadUser(this.user.id);
      }
    });
  }

private cleanPayload(payload: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === '' || v === null || v === undefined) continue;
      out[k] = v;
    }
    return out;
  }

  // ===== Id Proofs =====
  private isRealMediaRow(x: { id: any; url: any; date: any }): boolean {
    if (!x.id) return false;
    if (typeof x.url !== 'string') return false;
    const url = x.url.trim().toLowerCase();
    if (!url) return false;
    if (url.includes('no_image') || url.includes('no-image') || url.includes('placeholder')) return false;
    return true;
  }

  private loadAadhaarDetails(): void {
    if (!this.user?.id) return;
    this.dataService.get<any>(`v1/users/${this.user.id}/aadhaar_details`).pipe(
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
      if (a?.renewal_date && a.renewal_date !== '0000-00-00' && !String(a.renewal_date).startsWith('0000-')) {
        this.idProofs.aadhaar.renewal_date = String(a.renewal_date).slice(0, 10);
      }
      this.idProofs.aadhaar.remarks = a?.remarks || this.idProofs.aadhaar.remarks;
      this.idProofs.aadhaar.ashram_area_id = a?.area_id || a?.ashram_area_id || a?.ashram_area?.id || this.idProofs.aadhaar.ashram_area_id;

      const docs = a?.user_doc_urls || a?.adhaar_media || a?.aadhaar_media || (a?.media ? [a.media] : []);
      const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
      this.aadhaarImages = list.map((m: any) => ({
        id: m?.id ?? m?.media_id ?? '',
        url: m?.path || m?.full_path || m?.url || (typeof m === 'string' ? m : ''),
        date: m?.date || m?.uploaded_at || m?.created_at || m?.updated_at || ''
      })).filter((x: any) => this.isRealMediaRow(x));

      const media = list[0];
      if (media) {
        this.idProofs.aadhaar.preview = media?.path || media?.full_path || media?.url || media || null;
        this.idProofs.aadhaar.mediaId = String(media?.id || '');
        this.idProofs.aadhaar.mediaIsNew = false;
      }
      this.snapshotSection('aadhaar');
    });
  }

  private loadElectoralDetails(): void {
    if (!this.user?.id) return;
    this.dataService.get<any>(`v1/users/${this.user.id}/electoral_details`).pipe(
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
      })).filter((x: any) => this.isRealMediaRow(x));

      const media = list[0];
      if (media) {
        this.idProofs.voter.preview = media?.path || media?.full_path || media?.url || media || null;
        this.idProofs.voter.mediaId = String(media?.id || '');
        this.idProofs.voter.mediaIsNew = false;
      }
    });
  }

  private loadDrivingLicenseDetails(): void {
    if (!this.user?.id) return;
    this.dataService.get<any>(`v1/users/${this.user.id}/driving_license_details`).pipe(
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
        this.idProofs.license.date_of_issue = String(issueRaw).slice(0, 10);
      }
      const expiryRaw = l?.expiry_date;
      if (expiryRaw && expiryRaw !== '0000-00-00' && !String(expiryRaw).startsWith('0000-')) {
        this.idProofs.license.expiry_date = String(expiryRaw).slice(0, 10);
      }

      const docs = l?.user_driving_license_enclosed || l?.user_doc_urls || (l?.media ? [l.media] : []);
      const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
      this.licenseImages = list.map((m: any) => ({
        id: m?.id ?? m?.media_id ?? '',
        url: m?.full_path || m?.url || m?.path || (typeof m === 'string' ? m : ''),
        date: m?.date || m?.uploaded_at || m?.created_at || m?.updated_at || ''
      })).filter((x: any) => this.isRealMediaRow(x));

      const media = list[0];
      if (media) {
        this.idProofs.license.preview = media?.full_path || media?.url || media?.path || media || null;
        this.idProofs.license.mediaId = String(media?.id || '');
        this.idProofs.license.mediaIsNew = false;
      }
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
    const key = this.idProofActiveKey;
    files.forEach(f => this.applyIdProofFile(key, f, 'upload'));
    this.closeIdProofModal();
  }

  onIdProofImageCaptured(file: File): void {
    if (!this.idProofActiveKey) return;
    this.applyIdProofFile(this.idProofActiveKey, file, 'capture');
    this.closeIdProofModal();
  }

  private applyIdProofFile(key: IdProofKey, file: File, source: 'upload' | 'capture'): void {
    this.idProofs[key].file = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const dataUrl = e.target?.result as string | undefined;
      if (!dataUrl) return;
      this.idProofs[key].preview = dataUrl;
      if (source === 'capture' && key === 'aadhaar') {
        this.idProofs.aadhaar.croppedImage = dataUrl;
      } else {
        this.idProofs[key].files = [...this.idProofs[key].files, file];
        this.idProofs[key].previews = [...this.idProofs[key].previews, dataUrl];
      }
    };
    reader.readAsDataURL(file);
    this.idProofs[key].mediaIsNew = true;
  }

  removeAadhaarCroppedImage(): void {
    this.idProofs.aadhaar.croppedImage = null;
  }

  isPdf(value?: string | null): boolean {
    if (!value) return false;
    const v = value.toLowerCase();
    return v.startsWith('data:application/pdf') || v.endsWith('.pdf') || v.includes('.pdf?');
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

  deleteAadhaarImage(image: { id: string | number; url: string; date: string }): void {
    if (!image?.id) {
      this.aadhaarImages = this.aadhaarImages.filter(i => i !== image);
      return;
    }
    this.dataService.delete('v1/users/delete-aadhaar-media', { body: { id: image.id } }).pipe(
      catchError((err) => {
        this.snackbar.showError(err?.error?.message || 'Failed to delete Aadhaar document.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.aadhaarImages = this.aadhaarImages.filter(i => i.id !== image.id);
      this.snackbar.showSuccess('Aadhaar document deleted.');
    });
  }

  deleteVoterImage(image: { id: string | number; url: string; date: string }): void {
    if (!image?.id) {
      this.voterImages = this.voterImages.filter(i => i !== image);
      return;
    }
    this.dataService.delete('v1/users/delete-user-doc', { body: { id: image.id } }).pipe(
      catchError((err) => {
        this.snackbar.showError(err?.error?.message || 'Failed to delete Electoral document.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.voterImages = this.voterImages.filter(i => i.id !== image.id);
      this.snackbar.showSuccess('Electoral document deleted.');
    });
  }

  deleteLicenseImage(image: { id: string | number; url: string; date: string }): void {
    if (!image?.id) {
      this.licenseImages = this.licenseImages.filter(i => i !== image);
      return;
    }
    this.dataService.delete('v1/users/delete-user-doc', { body: { id: image.id } }).pipe(
      catchError((err) => {
        this.snackbar.showError(err?.error?.message || 'Failed to delete Driving License document.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response === null) return;
      this.licenseImages = this.licenseImages.filter(i => i.id !== image.id);
      this.snackbar.showSuccess('Driving License document deleted.');
    });
  }

  onAadhaarHomeReasonChange(values: any[]): void {
    this.selectedAadhaarHomeReason = values || [];
    this.idProofs.aadhaar.home_reason = values?.[0] || '';
  }

  onVoterHomeReasonChange(values: any[]): void {
    this.selectedVoterHomeReason = values || [];
    this.idProofs.voter.home_reason = values?.[0] || '';
  }

  saveAadhaarSection(): void {
    if (!this.user) return;
    const aad = this.idProofs.aadhaar;
    const errors: typeof this.aadhaarErrors = {};
    if (!aad.number?.trim()) errors.number = 'Aadhaar Number is required.';
    if (!aad.name?.trim()) errors.name = 'Name is required.';
    this.aadhaarErrors = errors;
    if (Object.keys(errors).length) return;

    this.isSavingSection['aadhaar'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
      aadhaar_number: aad.number || '',
      aadhaar_name: aad.name || '',
      aadhaar_address: aad.address || '',
      home_reason: aad.home_reason || '',
      mobile_linked: aad.mobile_linked || '',
      renewal_date: aad.renewal_date || null,
      remarks: aad.remarks || '',
      ashram_area_id: aad.ashram_area_id || '',
      adhaar_media: aad.previews.length ? [...aad.previews] : [],
      aadhaar_cropped_image: aad.croppedImage || ''
    };

    this.dataService.put<any>('v1/users/update-aadhaar', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update Aadhaar details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['aadhaar'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Aadhaar details updated.');
        this.idProofs.aadhaar.mediaIsNew = false;
        this.idProofs.aadhaar.files = [];
        this.idProofs.aadhaar.previews = [];
        this.idProofs.aadhaar.croppedImage = null;
        this.loadAadhaarDetails();
      }
    });
  }

  saveElectoralSection(): void {
    if (!this.user) return;
    const v = this.idProofs.voter;
    const errors: typeof this.voterErrors = {};
    if (!v.voter_number?.trim()) errors.voter_number = 'Voter Number is required.';
    if (!v.name?.trim()) errors.name = 'Name is required.';
    this.voterErrors = errors;
    if (Object.keys(errors).length) return;

    this.isSavingSection['electoral'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
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

    this.dataService.put<any>('v1/users/update-electoral', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update Electoral details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['electoral'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Electoral details updated.');
        this.idProofs.voter.mediaIsNew = false;
        this.idProofs.voter.files = [];
        this.idProofs.voter.previews = [];
        this.loadElectoralDetails();
      }
    });
  }

  saveLicenseSection(): void {
    if (!this.user) return;
    const l = this.idProofs.license;
    const errors: typeof this.licenseErrors = {};
    if (!l.license_number?.trim()) errors.license_number = 'License Number is required.';
    if (!l.holder_name?.trim()) errors.holder_name = 'License Holder Name is required.';
    if (!l.state?.trim()) errors.state = 'State is required.';
    if (!l.license_type?.trim()) errors.license_type = 'License Type is required.';
    this.licenseErrors = errors;
    if (Object.keys(errors).length) return;

    this.isSavingSection['license'] = true;
    this.saveError = null;

    const payload: Record<string, unknown> = {
      user_id: this.user.id,
      driving_license_number: l.license_number || '',
      license_holder_name: l.holder_name || '',
      license_state: l.state || '',
      license_type: l.license_type || '',
      date_of_issue: l.date_of_issue || null,
      expiry_date: l.expiry_date || null,
      user_driving_license_enclosed: l.mediaIsNew && l.preview ? [l.preview] : []
    };

    this.dataService.put<any>('v1/users/update-driving-license', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update Driving License details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSavingSection['license'] = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Driving License details updated.');
        this.idProofs.license.mediaIsNew = false;
        this.idProofs.license.files = [];
        this.idProofs.license.previews = [];
        this.loadDrivingLicenseDetails();
      }
    });
  }
}
