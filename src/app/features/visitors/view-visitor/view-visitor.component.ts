import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from '../../../data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface UserDocUrl { id: string; path: string; }

interface UserImage { id: string; full_path?: string; image?: string; }

interface UserAddress {
  address_1?: string;
  address_2?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  district?: string;
  tehsil?: string;
  post_office?: string;
  home_branch?: { id: string; name: string };
  working_branch?: { id: string; name: string };
}

interface UserAadhaar {
  name?: string;
  aadhaar_number?: string;
  address?: string;
  user_doc_urls?: UserDocUrl[];
}

interface UserProfile {
  gender?: string;
  dob?: string;
  age?: number;
  marital_status?: string;
  birth_place?: string;
  birth_state?: string;
  birth_country?: string;
  height_in_ft?: number;
  height_in_inches?: number;
  weight?: number;
  caste?: string;
  taken_gyan?: number;
  identification_mark?: string;
  disablility?: string;
  remarks?: string;
  father_name?: string;
  father_phone?: string;
  father_email?: string;
  father_address?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  mother_address?: string;
  mother_occupation?: string;
  spouse_name?: string;
  brother_name?: string;
  sister_name?: string;
  earning_members?: number;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_email?: string;
  profession?: string;
  experience?: string;
  experience_period?: string;
  relation_of?: Record<string, string>;
}

interface UserDetail {
  id: string;
  name: string;
  unique_id: number;
  level?: string;
  phone?: string;
  alternate_phone?: string;
  personal_email?: string;
  official_email?: string;
  remarks?: string;
  start_date?: string;
  valid_upto?: string;
  user_images?: UserImage[];
  user_correspondence_address?: UserAddress;
  user_permanent_address?: UserAddress;
  user_medical?: any;
  user_profile?: UserProfile;
  user_educations?: any[];
  user_technical_qualifications?: any[];
  user_spiritual_detail?: any;
  user_skills?: any[];
  user_aadhaar?: UserAadhaar;
  user_ration?: any;
  user_driving_license?: any;
  user_electoral?: any;
  user_passport?: any;
  user_pension?: any;
  user_pan_card?: any;
}

type TabKey = 'personal' | 'family' | 'address' | 'spiritual' | 'education' | 'documents' | 'medical';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbComponent, LoadingComponent, IconComponent],
  selector: 'app-view-visitor',
  templateUrl: './view-visitor.component.html',
  styleUrls: ['./view-visitor.component.scss']
})
export class ViewVisitorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);

  isLoading = true;
  error: string | null = null;
  user: UserDetail | null = null;
  activeTab: TabKey = 'personal';

  editMode: Record<'personal' | 'family' | 'address', boolean> = {
    personal: false,
    family: false,
    address: false
  };
  isSaving: Record<'personal' | 'family' | 'address', boolean> = {
    personal: false,
    family: false,
    address: false
  };
  saveError: string | null = null;

  personalForm: any = {};
  familyForm: any = {};
  addressForm: any = {};

  levelOptions = ['Visitor', 'Volunteer', 'Preacher', 'Desiring Devotee'];
  statusOptions = ['Active', 'Inactive', 'On Leave', 'Resigned'];
  needsApprovalOptions = [
    { value: 0, label: 'No' },
    { value: 1, label: 'Yes' }
  ];

  tabs: Tab[] = [
    { key: 'personal', label: 'Personal', icon: 'person' },
    { key: 'family', label: 'Family', icon: 'people' },
    { key: 'address', label: 'Address', icon: 'location_on' },
    { key: 'spiritual', label: 'Spiritual & Skills', icon: 'favorite' },
    { key: 'education', label: 'Education', icon: 'assignment' },
    { key: 'documents', label: 'Documents', icon: 'insert_drive_file' },
    { key: 'medical', label: 'Medical', icon: 'info' }
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Manage Visitors', route: '/visitors' },
    { label: 'All Visitors', route: '/visitors' },
    { label: 'View', route: '' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid visitor id.';
      this.isLoading = false;
      return;
    }
    this.loadUser(id);
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>(`v1/users/${id}/view`).pipe(
      catchError((err) => {
        console.error('Error loading visitor:', err);
        this.error = err.error?.message || err.message || 'Failed to load visitor details.';
        return of(null);
      }),
      finalize(() => (this.isLoading = false))
    ).subscribe((response) => {
      const user = response?.data?.user || response?.user || null;
      this.user = user;
    });
  }

  setActiveTab(key: TabKey): void {
    this.activeTab = key;
  }

  goBack(): void {
    this.router.navigate(['/visitors']);
  }

  get primaryImage(): string {
    const first = this.user?.user_images?.[0];
    return first?.full_path || '/assets/img/placeholder.svg';
  }

  get relationLabel(): string {
    const rel = this.user?.user_profile?.relation_of;
    if (!rel) return '';
    return Object.entries(rel)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }

  formatHeight(profile?: UserProfile): string {
    if (!profile) return '';
    const ft = profile.height_in_ft;
    const inch = profile.height_in_inches;
    if (!ft && !inch) return '';
    return `${ft || 0}' ${inch || 0}"`;
  }

  isEmptySection(value: any): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // ----- Edit mode -----
  enterEdit(section: 'personal' | 'family' | 'address'): void {
    if (!this.user) return;
    this.saveError = null;
    if (section === 'personal') {
      this.personalForm = {
        name: this.user.name || '',
        former_name: (this.user as any).former_name || '',
        nickname: (this.user as any).nickname || '',
        phone: this.user.phone || '',
        alternate_phone: this.user.alternate_phone || '',
        email: (this.user as any).email || '',
        personal_email: this.user.personal_email || '',
        level: this.user.level || '',
        start_date: this.user.start_date || '',
        valid_upto: this.user.valid_upto || '',
        current_status: (this.user as any).current_status || '',
        date_of_reinstatement: (this.user as any).date_of_reinstatement || '',
        date_of_leaving: (this.user as any).date_of_leaving || '',
        date_of_expired: (this.user as any).date_of_expired || '',
        remarks: this.user.remarks || '',
        needs_approval: (this.user as any).needs_approval ?? 0
      };
    } else if (section === 'family') {
      const p = this.user.user_profile || {};
      this.familyForm = {
        father_name: p.father_name || '',
        father_email: p.father_email || '',
        father_phone: p.father_phone || '',
        father_occupation_id: (p as any).father_occupation_id || '',
        father_occupation_location_id: (p as any).father_occupation_location_id || '',
        father_occupation_type: (p as any).father_occupation_type ?? null,
        father_occupation_status: (p as any).father_occupation_status ?? null,
        mother_name: p.mother_name || '',
        mother_email: p.mother_email || '',
        mother_phone: p.mother_phone || '',
        mother_occupation_id: (p as any).mother_occupation_id || '',
        mother_occupation_location_id: (p as any).mother_occupation_location_id || '',
        mother_occupation_type: (p as any).mother_occupation_type ?? null,
        mother_occupation_status: (p as any).mother_occupation_status ?? null,
        spouse_name: p.spouse_name || '',
        brother_siblings: (p as any).brother_siblings ?? null,
        sister_siblings: (p as any).sister_siblings ?? null,
        earning_members: p.earning_members ?? null,
        family_devotees: (p as any).family_devotees || '',
        inlaws_members: (p as any).inlaws_members || '',
        remarks: p.remarks || ''
      };
    } else if (section === 'address') {
      const a = this.user.user_permanent_address || {} as any;
      this.addressForm = {
        address_1: a.address_1 || '',
        address_2: a.address_2 || '',
        country: a.country || '',
        state: a.state || '',
        district: a.district || '',
        city: a.city || '',
        pincode: a.pincode || '',
        tehsil: a.tehsil || '',
        post_office: a.post_office || ''
      };
    }
    this.editMode[section] = true;
  }

  cancelEdit(section: 'personal' | 'family' | 'address'): void {
    this.editMode[section] = false;
    this.saveError = null;
  }

  savePersonal(): void {
    if (!this.user) return;
    this.isSaving.personal = true;
    this.saveError = null;

    const payload = this.cleanPayload({ ...this.personalForm });

    this.dataService.put<any>(`v1/users/basic/update/${this.user.id}`, payload).pipe(
      catchError((err) => {
        console.error('Error updating personal:', err);
        this.saveError = err.error?.message || err.message || 'Failed to update personal details.';
        return of(null);
      }),
      finalize(() => (this.isSaving.personal = false))
    ).subscribe((response) => {
      if (response) {
        this.editMode.personal = false;
        this.loadUser(this.user!.id);
      }
    });
  }

  saveFamily(): void {
    if (!this.user) return;
    this.isSaving.family = true;
    this.saveError = null;

    const payload = this.cleanPayload({ user_id: this.user.id, ...this.familyForm });

    this.dataService.put<any>('v1/users/update-family', payload).pipe(
      catchError((err) => {
        console.error('Error updating family:', err);
        this.saveError = err.error?.message || err.message || 'Failed to update family details.';
        return of(null);
      }),
      finalize(() => (this.isSaving.family = false))
    ).subscribe((response) => {
      if (response) {
        this.editMode.family = false;
        this.loadUser(this.user!.id);
      }
    });
  }

  saveAddress(): void {
    if (!this.user) return;
    this.isSaving.address = true;
    this.saveError = null;

    const payload = this.cleanPayload({ user_id: this.user.id, ...this.addressForm });

    this.dataService.put<any>('v1/users/update-permanent/address', payload).pipe(
      catchError((err) => {
        console.error('Error updating address:', err);
        this.saveError = err.error?.message || err.message || 'Failed to update permanent address.';
        return of(null);
      }),
      finalize(() => (this.isSaving.address = false))
    ).subscribe((response) => {
      if (response) {
        this.editMode.address = false;
        this.loadUser(this.user!.id);
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
}
