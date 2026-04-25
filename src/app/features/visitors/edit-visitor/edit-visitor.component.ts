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
import { SnackbarService } from '../../../shared/services/snackbar.service';

type TabKey = 'personal' | 'family' | 'address' | 'spiritual' | 'education' | 'medical';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbComponent, LoadingComponent, IconComponent],
  selector: 'app-edit-visitor',
  templateUrl: './edit-visitor.component.html',
  styleUrls: ['./edit-visitor.component.scss']
})
export class EditVisitorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private snackbar = inject(SnackbarService);

  isLoading = true;
  error: string | null = null;
  user: any = null;
  activeTab: TabKey = 'personal';

  isSaving: Record<TabKey, boolean> = {
    personal: false, family: false, address: false,
    spiritual: false, education: false, medical: false
  };
  saveError: string | null = null;

  personalForm: any = {};
  familyForm: any = {};
  addressForm: any = {};
  spiritualForm: any = {};
  educationRows: any[] = [];
  educationDeleteDocs: string[] = [];
  medicalForm: any = { blood_group: '' };
  medicalIllnessRows: any[] = [];
  medicalDeleteDocs: string[] = [];

  levelOptions = ['Visitor', 'Volunteer', 'Preacher', 'Desiring Devotee'];
  statusOptions = ['Active', 'Inactive', 'On Leave', 'Resigned'];

  tabs: Tab[] = [
    { key: 'personal', label: 'Personal', icon: 'person' },
    { key: 'family', label: 'Family', icon: 'people' },
    { key: 'address', label: 'Address', icon: 'location_on' },
    { key: 'spiritual', label: 'Spiritual & Skills', icon: 'favorite' },
    { key: 'education', label: 'Education', icon: 'assignment' },
    { key: 'medical', label: 'Medical', icon: 'info' }
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Visitors', route: '/visitors' },
    { label: 'Edit Visitor' }
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
        this.error = err?.error?.message || err?.message || 'Failed to load visitor details.';
        return of(null);
      }),
      finalize(() => (this.isLoading = false))
    ).subscribe((response) => {
      const user = response?.data?.user || response?.user || response?.data || null;
      this.user = user;
      if (user) this.hydrateForms(user);
    });
  }

  private hydrateForms(user: any): void {
    const profile = user.user_profile || {};
    const perm = user.user_permanent_address || {};

    this.personalForm = {
      name: user.name || '',
      former_name: user.former_name || '',
      nickname: user.nickname || '',
      phone: user.phone || '',
      alternate_phone: user.alternate_phone || '',
      email: user.email || '',
      personal_email: user.personal_email || '',
      level: user.level || '',
      start_date: user.start_date || '',
      valid_upto: user.valid_upto || '',
      current_status: user.current_status || '',
      remarks: user.remarks || ''
    };

    this.familyForm = {
      father_name: profile.father_name || '',
      father_phone: profile.father_phone || '',
      father_email: profile.father_email || '',
      mother_name: profile.mother_name || '',
      mother_phone: profile.mother_phone || '',
      mother_email: profile.mother_email || '',
      spouse_name: profile.spouse_name || '',
      brother_siblings: profile.brother_siblings ?? null,
      sister_siblings: profile.sister_siblings ?? null,
      earning_members: profile.earning_members ?? null,
      family_devotees: profile.family_devotees || '',
      remarks: profile.remarks || ''
    };

    this.addressForm = {
      address_1: perm.address_1 || '',
      address_2: perm.address_2 || '',
      country: perm.country || '',
      state: perm.state || '',
      district: perm.district || '',
      city: perm.city || '',
      pincode: perm.pincode || '',
      tehsil: perm.tehsil || '',
      post_office: perm.post_office || ''
    };

    const spiritual = user.user_spiritual_detail || {};
    this.spiritualForm = {
      date_of_initiation: spiritual.date_of_initiation || '',
      place_of_initiation: spiritual.place_of_initiation || '',
      initiation_branch_id: spiritual.initiation_branch_id || spiritual.initiation_branch?.id || '',
      date_of_joining: spiritual.date_of_joining || '',
      joining_branch_id: spiritual.joining_branch_id || spiritual.joining_branch?.id || '',
      dress_code_id: spiritual.dress_code_id || spiritual.dress_code?.id || '',
      dress_code_ordained_date: spiritual.dress_code_ordained_date || '',
      date_of_registration: spiritual.date_of_registration || '',
      gyan_agya_date: spiritual.gyan_agya_date || '',
      name_changing_date: spiritual.name_changing_date || ''
    };

    const eduList: any[] = Array.isArray(user.user_educations) ? user.user_educations : [];
    this.educationRows = eduList.length
      ? eduList.map((e) => ({
          user_education_id: e.id || '',
          degree_id: e.degree_id || e.degree?.id || '',
          name: e.name || e.institute || '',
          remarks: e.remarks || '',
          existing_docs: Array.isArray(e.user_doc_urls) ? e.user_doc_urls : []
        }))
      : [this.makeEmptyEducationRow()];
    this.educationDeleteDocs = [];

    const medical = user.user_medical || {};
    this.medicalForm = {
      blood_group: medical.blood_group || ''
    };
    const illnesses: any[] = Array.isArray(medical.major_illness) ? medical.major_illness
      : Array.isArray(user.user_major_illnesses) ? user.user_major_illnesses : [];
    this.medicalIllnessRows = illnesses.length
      ? illnesses.map((m: any) => ({
          medical_history_id: m.id || m.medical_history_id || '',
          major_illness: m.major_illness ?? m.illness_id ?? null,
          note: m.note || ''
        }))
      : [this.makeEmptyMedicalRow()];
    this.medicalDeleteDocs = [];
  }

  makeEmptyEducationRow(): any {
    return { user_education_id: '', degree_id: '', name: '', remarks: '', existing_docs: [] };
  }

  makeEmptyMedicalRow(): any {
    return { medical_history_id: '', major_illness: null, note: '' };
  }

  addEducationRow(): void {
    this.educationRows.push(this.makeEmptyEducationRow());
  }

  removeEducationRow(index: number): void {
    const row = this.educationRows[index];
    if (row?.user_education_id) {
      this.educationDeleteDocs.push(row.user_education_id);
    }
    this.educationRows.splice(index, 1);
    if (this.educationRows.length === 0) {
      this.educationRows.push(this.makeEmptyEducationRow());
    }
  }

  addMedicalRow(): void {
    this.medicalIllnessRows.push(this.makeEmptyMedicalRow());
  }

  removeMedicalRow(index: number): void {
    const row = this.medicalIllnessRows[index];
    if (row?.medical_history_id) {
      this.medicalDeleteDocs.push(row.medical_history_id);
    }
    this.medicalIllnessRows.splice(index, 1);
    if (this.medicalIllnessRows.length === 0) {
      this.medicalIllnessRows.push(this.makeEmptyMedicalRow());
    }
  }

  setActiveTab(key: TabKey): void {
    this.activeTab = key;
    this.saveError = null;
  }

  goBack(): void {
    this.router.navigate(['/visitors']);
  }

  get primaryImage(): string {
    const first = this.user?.user_images?.[0];
    return first?.full_path || '/assets/img/placeholder.svg';
  }

  savePersonal(): void {
    if (!this.user) return;
    this.isSaving.personal = true;
    this.saveError = null;

    const payload = this.cleanPayload({ ...this.personalForm });

    this.dataService.put<any>(`v1/users/basic/update/${this.user.id}`, payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update personal details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.personal = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Personal details updated.');
        this.loadUser(this.user.id);
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
        const msg = err?.error?.message || err?.message || 'Failed to update family details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.family = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Family details updated.');
        this.loadUser(this.user.id);
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
        const msg = err?.error?.message || err?.message || 'Failed to update permanent address.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.address = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Address updated.');
        this.loadUser(this.user.id);
      }
    });
  }

  saveSpiritual(): void {
    if (!this.user) return;
    this.isSaving.spiritual = true;
    this.saveError = null;

    const payload = this.cleanPayload({ user_id: this.user.id, ...this.spiritualForm });

    this.dataService.put<any>('v1/users/update-spiritual', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update spiritual details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.spiritual = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Spiritual details updated.');
        this.loadUser(this.user.id);
      }
    });
  }

  saveEducation(): void {
    if (!this.user) return;
    this.isSaving.education = true;
    this.saveError = null;

    const rows = this.educationRows.filter(r => r.degree_id || r.name || r.remarks || r.user_education_id);
    const payload: Record<string, any> = {
      user_id: this.user.id,
      user_education_id: rows.map(r => r.user_education_id || ''),
      degree_id: rows.map(r => r.degree_id || ''),
      name: rows.map(r => r.name || ''),
      remarks: rows.map(r => r.remarks || ''),
      delete_education_docs: this.educationDeleteDocs.join(',')
    };

    this.dataService.put<any>('v1/users/update-education', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update education details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.education = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Education updated.');
        this.educationDeleteDocs = [];
        this.loadUser(this.user.id);
      }
    });
  }

  saveMedical(): void {
    if (!this.user) return;
    this.isSaving.medical = true;
    this.saveError = null;

    const rows = this.medicalIllnessRows.filter(r => r.major_illness !== null && r.major_illness !== '');
    const payload: Record<string, any> = {
      user_id: this.user.id,
      blood_group: this.medicalForm.blood_group || '',
      medical_history_id: rows.map(r => r.medical_history_id || ''),
      major_illness: rows.map(r => Number(r.major_illness)),
      note: rows.map(r => r.note || ''),
      delete_medical_history_docs: this.medicalDeleteDocs.join(',')
    };

    this.dataService.put<any>('v1/users/update-medical', payload).pipe(
      catchError((err) => {
        const msg = err?.error?.message || err?.message || 'Failed to update medical details.';
        this.saveError = msg;
        this.snackbar.showError(msg);
        return of(null);
      }),
      finalize(() => (this.isSaving.medical = false))
    ).subscribe((response) => {
      if (response) {
        this.snackbar.showSuccess('Medical info updated.');
        this.medicalDeleteDocs = [];
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
}
