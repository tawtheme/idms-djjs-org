import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataService } from '../../../../data.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ImagePreviewService } from '../../../../shared/services/image-preview.service';
import { ImagePreviewDirective } from '../../../../shared/directives/image-preview.directive';

type TabId =
  | 'basic'
  | 'address'
  | 'personal'
  | 'idproofs'
  | 'education'
  | 'medical'
  | 'spiritual'
  | 'assignSewa'
  | 'sewa'
  | 'program'
  | 'donation';

interface TabDef { id: TabId; label: string; }

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, ImagePreviewDirective],
  selector: 'app-volunteer-view',
  templateUrl: './volunteer-view.component.html',
  styleUrls: ['./volunteer-view.component.scss']
})
export class VolunteerViewComponent implements OnInit, OnChanges {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  imagePreviewService = inject(ImagePreviewService);

  /** When set, the component renders for the given user id without consulting the route. */
  @Input() userIdInput: string | null = null;
  /** Hide the route-aware close button when embedded in a side panel (panel handles close). */
  @Input() embedded = false;
  @Output() closed = new EventEmitter<void>();

  tabs: TabDef[] = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'address', label: 'Address Details' },
    { id: 'personal', label: 'Personal & Family' },
    { id: 'idproofs', label: 'Id Proofs' },
    { id: 'spiritual', label: 'Spiritual Detail' },
    { id: 'education', label: 'Education & Work' },
    { id: 'medical', label: 'Medical' },
    { id: 'assignSewa', label: 'Assign Sewa' },
    { id: 'sewa', label: 'Sewa Tracking' },
    { id: 'program', label: 'Program Journey' },
    { id: 'donation', label: 'Donations' }
  ];

  activeTab: TabId = 'basic';

  userId: string | null = null;
  user: any = null;
  isLoading = false;
  error: string | null = null;

  // Per-section data captured from per-endpoint loads
  basic: any = {};
  permanent: any = {};
  correspondence: any = {};
  personal: any = {};
  family: any = {};
  emergency: any = {};
  aadhaar: any = {};
  voter: any = {};
  license: any = {};
  qualifications: any[] = [];
  work: any = {};
  workSkills: string[] = [];
  spiritual: any = {};
  medical: any = { blood_group: '', histories: [] as any[] };
  assignSewa: any = {};
  sewaStatusList: { name: string; badge_id: string }[] = [];

  // Occupation lookup (loaded once and reused for father/mother occupation labels)
  professionOptions: { id: string; name: string }[] = [];

  // Tracking tabs (existing)
  sewaBranches: any[] = [];
  sewaLoading = false;
  sewaError: string | null = null;

  programRows: any[] = [];
  programLoading = false;
  programError: string | null = null;

  donationRows: any[] = [];
  donationLoading = false;
  donationError: string | null = null;

  private loadedTabs = new Set<TabId>();

  ngOnInit(): void {
    this.userId = this.userIdInput || this.route.snapshot.paramMap.get('id');
    if (this.userId) this.bootstrap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userIdInput'] && !changes['userIdInput'].firstChange) {
      this.userId = this.userIdInput;
      if (this.userId) {
        this.loadedTabs.clear();
        this.bootstrap();
      }
    }
  }

  private bootstrap(): void {
    this.loadUser();
    this.loadSewa();
    this.loadProgram();
    this.loadDonation();
    this.loadAssignSewa();
    this.loadSewaStatus();
    this.loadProfessions();
    this.loadedTabs.add('sewa');
    this.loadedTabs.add('program');
    this.loadedTabs.add('donation');
    this.loadedTabs.add('assignSewa');
  }

  private loadProfessions(): void {
    if (this.professionOptions.length) return;
    this.dataService.get<any>('v1/options/professions').pipe(
      catchError(() => of(null))
    ).subscribe((response: any) => {
      if (!response) return;
      const data = response?.data?.professions || response?.data || response || [];
      this.professionOptions = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: String(p.id ?? p.value ?? p.name),
        name: p.name || p.label || p.title || ''
      }));
    });
  }

  /** Resolve an occupation id (or nested object) to a display name. */
  getOccupationName(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return String(value?.name || value?.label || '—');
    const match = this.professionOptions.find(p => p.id === String(value));
    return match?.name || String(value);
  }

  loadUser(): void {
    this.isLoading = true;
    this.error = null;
    this.dataService.get<any>(`v1/users/${this.userId}/view`).pipe(
      catchError((err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load volunteer.';
        return of(null);
      })
    ).subscribe((response) => {
      this.isLoading = false;
      const user = response?.data?.user || response?.user || response?.data || null;
      this.user = user;
      if (user) this.populateFromView(user);
    });
  }

  /** Single-shot population of every section from /v1/users/{id}/view payload. */
  private populateFromView(u: any): void {
    this.basic = {
      name: u?.name,
      unique_id: u?.unique_id,
      phone: u?.phone,
      whatsapp_number: u?.whatsapp_number || u?.alternate_phone,
      email: u?.email || u?.official_email,
      personal_email: u?.personal_email,
      level: u?.level,
      roles: u?.roles
    };

    this.permanent = u?.user_permanent_address || {};
    this.correspondence = u?.user_correspondence_address || {};

    const profile = u?.user_profile || {};
    this.personal = profile;
    this.family = profile;
    this.emergency = {
      emergency_name: profile?.emergency_name,
      emergency_phone: profile?.emergency_phone,
      emergency_email: profile?.emergency_email
    };

    this.aadhaar = u?.user_aadhaar || {};
    this.voter = u?.user_electoral || {};
    this.license = u?.user_driving_license || {};

    const eduList = Array.isArray(u?.user_educations) ? u.user_educations : [];
    this.qualifications = eduList.map((q: any) => ({
      degree: q?.degree?.name || q?.degree_id || '',
      name: q?.name || q?.institute || '',
      remarks: q?.remarks || ''
    }));

    const skills = Array.isArray(u?.user_skills) ? u.user_skills : [];
    this.workSkills = skills.map((s: any) => s?.skill?.name || s?.name || s?.skill_id || '').filter(Boolean);
    this.work = {
      profession: profile?.profession,
      profession_id: profile?.profession_id,
      experience: profile?.experience,
      experience_period: profile?.experience_period,
      profession_skill_remarks: profile?.profession_skill_remarks
    };

    this.spiritual = u?.user_spiritual_detail || {};

    const m = u?.user_medical || {};
    const histories = m?.user_medical_histories || m?.medical_histories || m?.major_illness || [];
    this.medical = {
      blood_group: m?.blood_group || '',
      histories: (Array.isArray(histories) ? histories : []).map((h: any) => ({
        major_illness: h?.major_illness !== undefined && h?.major_illness !== null ? String(h.major_illness) : '',
        note: h?.note || h?.notes || '',
        docs: Array.isArray(h?.user_doc_urls) ? h.user_doc_urls : []
      }))
    };

    // Profile/address/personal/etc are now populated; suppress re-fetch via per-tab loaders.
    (['basic','address','personal','idproofs','education','spiritual','medical'] as TabId[])
      .forEach(t => this.loadedTabs.add(t));
  }

  setTab(id: TabId): void {
    this.activeTab = id;
    this.loadTab(id);
  }

  scrollToSection(id: TabId): void {
    this.activeTab = id;
    this.loadTab(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private loadTab(id: TabId): void {
    if (!this.userId || this.loadedTabs.has(id)) return;
    // Detail tabs (basic/address/personal/idproofs/education/spiritual/medical) are populated
    // from /v1/users/{id}/view in loadUser; only tracking tabs need their own endpoints.
    if (id === 'sewa' || id === 'program' || id === 'donation') {
      this.loadedTabs.add(id);
      if (id === 'sewa') this.loadSewa();
      else if (id === 'program') this.loadProgram();
      else if (id === 'donation') this.loadDonation();
    } else if (id === 'assignSewa') {
      this.loadedTabs.add(id);
      this.loadAssignSewa();
    }
  }

  private loadSewaStatus(): void {
    if (!this.userId) return;
    this.get(`v1/users/${this.userId}/basic_details`).subscribe((res: any) => {
      if (!res) return;
      const root = res?.data ?? res ?? {};
      const user = root?.user_basic_details ?? root?.user ?? root?.basic_details ?? root?.user_basic ?? root;
      const sewas = (user?.user_sewas ?? user?.sewas) || [];
      if (!Array.isArray(sewas) || !sewas.length) return;
      this.sewaStatusList = sewas
        .map((item: any) => {
          const s = item?.sewa;
          const name = (s && typeof s === 'object' && !Array.isArray(s))
            ? (s?.name || '')
            : (Array.isArray(s) ? s.map((x: any) => x?.name).filter(Boolean).join(', ') : (item?.name || ''));
          const badge = item?.badge_id ?? item?.badge_no ?? item?.badge_number ?? '';
          return { name, badge_id: badge !== null && badge !== undefined ? String(badge) : '' };
        })
        .filter((x: { name: string; badge_id: string }) => x.name || x.badge_id);
    });
  }

  private loadAssignSewa(): void {
    this.get(`v1/users/${this.userId}/user_sewa`).subscribe((res: any) => {
      if (!res) return;
      const r = res?.data ?? res ?? {};
      const list = Array.isArray(r?.user_sewas) ? r.user_sewas : [];
      const a = list[0] || r?.user_sewa || r?.user_manage_sewas || r?.manage_sewas || r?.user_profile || r || {};
      const rawSewaHead = a?.sewa_head;
      let sewaHead: any = '';
      if (rawSewaHead !== undefined && rawSewaHead !== null && String(rawSewaHead).trim() !== '') {
        sewaHead = rawSewaHead;
      } else if (Number(a?.head) > 0) {
        sewaHead = '1';
      } else if (Number(a?.sub_head) > 0) {
        sewaHead = '2';
      }
      this.assignSewa = {
        program: a?.program || a?.active_program || null,
        program_id: a?.program_id ?? '',
        sewa: a?.sewa || null,
        sewa_id: a?.sewa_id ?? '',
        sewa_mode: a?.sewa_mode,
        sewa_head: sewaHead,
        badge_id: a?.badge_id ?? a?.badge_no ?? a?.badge_number ?? '',
        branch_remarks: a?.branch_remarks || a?.remarks || ''
      };
    });
  }

  private get<T = any>(path: string) {
    return this.dataService.get<T>(path).pipe(catchError(() => of(null)));
  }

  private loadBasic(): void {
    this.get(`v1/users/${this.userId}/basic_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.basic = r?.user_basic_details ?? r?.basic_details ?? r?.user ?? r ?? {};
    });
  }

  private loadPermanent(): void {
    this.get(`v1/users/${this.userId}/permanent_address`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.permanent = r?.user_permanent_address ?? r?.permanent_address ?? r?.user_address ?? r?.address ?? r ?? {};
    });
  }

  private loadCorrespondence(): void {
    this.get(`v1/users/${this.userId}/correspondence_address`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.correspondence = r?.user_address ?? r?.user_correspondence_address ?? r?.correspondence_address ?? r?.address ?? r ?? {};
    });
  }

  private loadPersonal(): void {
    this.get(`v1/users/${this.userId}/personal_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.personal = r?.user_personal_details ?? r?.user_profile ?? r?.user ?? r ?? {};
    });
  }

  private loadFamily(): void {
    this.get(`v1/users/${this.userId}/family_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.family = r?.user_family_details ?? r?.family_details ?? r?.user ?? r ?? {};
    });
  }

  private loadEmergency(): void {
    this.get(`v1/users/${this.userId}/emergency_contact_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.emergency = r?.user_emergency_details ?? r?.user_emergency_contact ?? r?.emergency_contact_details ?? r ?? {};
    });
  }

  private loadAadhaar(): void {
    this.get(`v1/users/${this.userId}/aadhaar_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.aadhaar = r?.user_aadhaar ?? r?.user_aadhaar_details ?? r?.aadhaar_details ?? r ?? {};
    });
  }

  private loadElectoral(): void {
    this.get(`v1/users/${this.userId}/electoral_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.voter = r?.user_electoral ?? r?.user_electoral_details ?? r?.electoral_details ?? r ?? {};
    });
  }

  private loadLicense(): void {
    this.get(`v1/users/${this.userId}/driving_license_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.license = r?.user_driving_license ?? r?.user_driving_license_details ?? r?.driving_license_details ?? r ?? {};
    });
  }

  private loadEducation(): void {
    this.get(`v1/users/${this.userId}/education_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      const list = r?.user_education ?? r?.user_education_details ?? r?.education_details ?? r?.qualifications ?? r;
      const arr = Array.isArray(list) ? list : Object.values(list || {});
      this.qualifications = arr.map((q: any) => ({
        degree: q?.degree?.name || q?.degree_id || '',
        name: q?.name || '',
        remarks: q?.remarks || ''
      }));
    });
  }

  private loadWork(): void {
    this.get(`v1/users/${this.userId}/work_experience`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      const w = r?.user_work_experience ?? r?.work_experience ?? r ?? {};
      this.work = w;
      const skills = Array.isArray(w?.skills) ? w.skills : [];
      this.workSkills = skills.map((s: any) => s?.skill?.name || s?.name || s?.skill_id || '').filter(Boolean);
    });
  }

  private loadSpiritual(): void {
    this.get(`v1/users/${this.userId}/spiritual_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      this.spiritual = r?.user_spiritual ?? r?.user_spiritual_details ?? r?.spiritual_details ?? r ?? {};
    });
  }

  private loadMedical(): void {
    this.get(`v1/users/${this.userId}/medical_details`).subscribe((res: any) => {
      const r = res?.data ?? res ?? {};
      const m = r?.user_medical ?? r?.user_medical_details ?? r?.medical_details ?? r ?? {};
      const histories = m?.user_medical_histories || m?.medical_histories || [];
      this.medical = {
        blood_group: m?.blood_group || '',
        histories: (Array.isArray(histories) ? histories : []).map((h: any) => ({
          major_illness: h?.major_illness !== undefined && h?.major_illness !== null ? String(h.major_illness) : '',
          note: h?.note || h?.notes || '',
          docs: Array.isArray(h?.user_doc_urls) ? h.user_doc_urls : []
        }))
      };
    });
  }

  // -- Tracking tabs (kept from before) ---------------------------------
  loadSewa(): void {
    if (!this.userId) return;
    this.sewaLoading = true;
    this.dataService.get<any>(`v1/users/${this.userId}/sewa_tracking/view`).pipe(
      catchError((err) => { this.sewaError = err?.message || 'Failed'; return of(null); })
    ).subscribe((response) => {
      this.sewaLoading = false;
      if (!response) return;
      const data = response?.data?.refineUserSewaDatas || response?.refineUserSewaDatas || {};
      this.sewaBranches = Object.values(data).map((b: any) => ({
        branchName: b?.name || '',
        search: '',
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

  filterSewaRows(rows: any[], term: string): any[] {
    const t = (term || '').trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r =>
      String(r.sewaName || '').toLowerCase().includes(t) ||
      String(r.badgeId || '').toLowerCase().includes(t) ||
      String(r.allocatedDate || '').toLowerCase().includes(t) ||
      String(r.unallocatedDate || '').toLowerCase().includes(t) ||
      String(r.reason || '').toLowerCase().includes(t)
    );
  }

  groupHasMatches(group: any, term: string): boolean {
    return this.filterSewaRows(group.rows || [], term).length > 0;
  }

  loadProgram(): void {
    if (!this.userId) return;
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

  loadDonation(): void {
    if (!this.userId) return;
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

  onClose(): void {
    if (this.embedded) {
      this.closed.emit();
    } else {
      this.router.navigate(['/volunteers']);
    }
  }

  // -- Header / nav helpers --------------------------------------------
  get nameInitials(): string {
    const parts = (this.user?.name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'V';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get activeTabLabel(): string {
    return this.tabs.find(t => t.id === this.activeTab)?.label || '';
  }

  get profileTabs(): TabDef[] {
    const editable: TabId[] = ['basic', 'address', 'personal', 'idproofs', 'spiritual', 'education', 'medical', 'assignSewa'];
    return this.tabs.filter(t => editable.includes(t.id));
  }

  get activityTabs(): TabDef[] {
    const activity: TabId[] = ['sewa', 'program', 'donation'];
    return this.tabs.filter(t => activity.includes(t.id));
  }

  get profileImage(): string | null {
    const imgs = this.user?.user_images || [];
    return imgs.length ? (imgs[0]?.full_path || null) : null;
  }

  /** Display helper: returns "—" placeholder for empty values. */
  display(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  /** Map sewa_mode (1=Regular, 0=Annual) to a label. */
  formatSewaMode(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    const s = String(value);
    if (s === '1') return 'Regular';
    if (s === '0') return 'Annual';
    return String(value);
  }

  /** Map sewa_head (1=Head, 2=Subhead) to a label. */
  formatSewaHead(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    const s = String(value);
    if (s === '1') return 'Head';
    if (s === '2') return 'Subhead';
    return String(value);
  }

  /** Map a 0/1 (or boolean/yes-no) flag to "Yes"/"No". Returns "—" if empty. */
  formatYesNo(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    const s = String(value).trim().toLowerCase();
    if (s === '1' || s === 'true' || s === 'yes' || s === 'y') return 'Yes';
    if (s === '0' || s === 'false' || s === 'no' || s === 'n') return 'No';
    return String(value);
  }

  /** Map experience_period code to a human-readable label. 1=Year, 2=Month, 3=Day. */
  formatExperiencePeriod(value: any, count?: any): string {
    if (value === null || value === undefined || value === '') return '—';
    const map: Record<string, string> = { '1': 'Year', '2': 'Month', '3': 'Day' };
    const label = map[String(value)];
    if (!label) return String(value);
    const n = Number(count);
    return Number.isFinite(n) && n !== 1 ? `${label}s` : label;
  }

  /** Calculate age in years from a date-of-birth value. Returns "—" if invalid/empty. */
  calculateAge(dob: any): string {
    if (!dob) return '—';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '—';
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    if (age < 0) return '—';
    return `${age} years`;
  }

  downloadDoc(doc: any): void {
    const url: string = doc?.path || doc?.url || doc?.data || '';
    if (!url) return;
    const name: string = doc?.name || doc?.file_name || this.fileNameFromUrl(url) || 'document';
    const trigger = (href: string, revoke?: boolean) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
    };
    if (/^https?:/i.test(url)) {
      fetch(url, { mode: 'cors' })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
        .then(blob => trigger(URL.createObjectURL(blob), true))
        .catch(() => { window.open(url, '_blank', 'noopener'); });
      return;
    }
    trigger(url);
  }

  private fileNameFromUrl(url: string): string {
    const path = url.split('?')[0];
    return path.substring(path.lastIndexOf('/') + 1) || '';
  }

  docName(doc: any): string {
    return doc?.name || doc?.file_name || doc?.original_name || this.fileNameFromUrl(doc?.path || doc?.url || doc?.data || '') || 'document';
  }

}
