import { Component, HostListener, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CreateVisitorComponent } from './create-visitor/create-visitor.component';
import { DataService } from '../../data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SnackbarService } from '../../shared/services/snackbar.service';

export interface Visitor {
  id: number; // Display ID (unique_id)
  uuid?: string; // UUID for API calls
  image?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  validUpto: string;
  purposeToVisit: string;
  sewaInterest: boolean;
  gender?: string;
  relationName?: string;
  uid?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BreadcrumbComponent,
    PagerComponent,
    EmptyStateComponent,
    LoadingComponent,
    MenuDropdownComponent,
    DropdownComponent,
    SidePanelComponent,
    ModalComponent,
    ConfirmationDialogComponent,
    CreateVisitorComponent,
    IconComponent
  ],
  selector: 'app-visitors',
  templateUrl: './visitors.component.html',
  styleUrls: ['./visitors.component.scss']
})
export class VisitorsComponent implements OnInit {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;
  @ViewChild('createVisitorComponent') createVisitorComponent!: CreateVisitorComponent;

  private dataService = inject(DataService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  visitors: Visitor[] = [];
  allVisitors: Visitor[] = [];

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  // Create Visitor Modal
  createVisitorModalOpen = false;

  // Convert-to-Volunteer confirmation
  convertConfirmOpen = false;
  visitorToConvert: Visitor | null = null;
  isConverting = false;

  // Server-side export
  isExporting = false;

  // Print Visitor Card modal
  printCardModalOpen = false;
  printedCards: any[] = [];
  isLoadingPrintCards = false;
  logoPath = 'assets/img/logo.png';

  // Sewa Interest reason modal
  sewaReasonModalOpen = false;
  sewaReasonVisitor: Visitor | null = null;
  sewaReasonForm = { reason: '', remarks: '' };
  sewaReasonOptions: DropdownOption[] = [
    { id: 'change_sewa', label: 'Change Sewa', value: 'Change Sewa' },
    { id: 'dead', label: 'Dead', value: 'Dead' },
    { id: 'left', label: 'Left', value: 'Left' },
    { id: 'migrated', label: 'Migrated', value: 'Migrated' },
    { id: 'married', label: 'Married', value: 'Married' },
    { id: 'not_regular', label: 'Not Regular', value: 'Not Regular' },
    { id: 'other', label: 'Other', value: 'Other' }
  ];
  selectedSewaReason: any[] = [];
  isSubmittingSewaReason = false;

  // Selection
  selectedVisitors = new Set<number>();

  // Filters
  searchTerm = ''; // Handles Name, Mobile No., Relation Name, UID
  nameFilter = '';
  relationNameFilter = '';
  mobileFilter = '';
  uidFilter = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  sortOrder: any[] = [];
  sortOrderOptions: DropdownOption[] = [];
  sortByColumn: any[] = [];
  sortByColumnOptions: DropdownOption[] = [];

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Visitors', route: '/visitors' }
  ];

  constructor() {
    this.buildFilterOptions();
  }

  ngOnInit(): void {
    this.loadVisitors();
  }

  buildFilterOptions(): void {
    // Build filter options
    this.genderOptions = [
      { id: '', label: 'None', value: '' },
      { id: 'MALE', label: 'MALE', value: 'MALE' },
      { id: 'FEMALE', label: 'FEMALE', value: 'FEMALE' },
      { id: 'OTHER', label: 'OTHER', value: 'OTHER' }
    ];

    this.sortOrderOptions = [
      { id: '', label: 'None', value: '' },
      { id: 'ASC', label: 'ASC', value: 'ASC' },
      { id: 'DESC', label: 'DESC', value: 'DESC' }
    ];

    this.sortByColumnOptions = [
      { id: '', label: 'None', value: '' },
      { id: 'address_1', label: 'Address', value: 'address_1' },
      { id: 'dob', label: 'Age', value: 'dob' },
      { id: 'badge_id', label: 'Badge No', value: 'badge_id' },
      { id: 'created_at', label: 'Created date', value: 'created_at' },
      { id: 'city', label: 'City', value: 'city' },
      { id: 'created_by', label: 'Enter By', value: 'created_by' },
      { id: 'father_name', label: 'Father Name', value: 'father_name' },
      { id: 'gender', label: 'Gender', value: 'gender' },
      { id: 'home_branch', label: 'Home Branch', value: 'home_branch' },
      { id: 'unique_id', label: 'Id', value: 'unique_id' },
      { id: 'mother_name', label: 'Mother Name', value: 'mother_name' },
      { id: 'name', label: 'Name', value: 'name' },
      { id: 'phone', label: 'Mobile', value: 'phone' },
      { id: 'spouse_name', label: 'Spouse Name', value: 'spouse_name' },
      { id: 'regular_sewa', label: 'Sewa Name', value: 'regular_sewa' }
    ];
  }

  loadVisitors(): void {
    this.isLoading = true;
    this.error = null;

    const params = this.buildVisitorQueryParams();

    this.dataService.get<any>('v1/visitors', { params }).pipe(
      catchError((error) => {
        console.error('Error loading visitors:', error);
        this.error = error.error?.message || error.message || 'Failed to load visitors. Please try again.';
        return of({ data: [], visitors: [], results: [] });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      // Pull list + total from common pagination shapes
      const visitorsData =
        response?.data?.data ??
        response?.data ??
        response?.visitors ??
        response?.results ??
        response ??
        [];
      const list: any[] = Array.isArray(visitorsData) ? visitorsData : [];
      this.totalItems =
        response?.total ??
        response?.meta?.total ??
        response?.pagination?.total ??
        response?.data?.total ??
        list.length;

      this.allVisitors = list.map((item: any) => {
        // Get first image from user_images array
        const firstImage = item.user_images && item.user_images.length > 0
          ? item.user_images[0].full_path
          : null;

        // Extract relation name from relation_of object
        let relationName = '';
        if (item.user_profile?.relation_of) {
          const relationOf = item.user_profile.relation_of;
          // Get first value from relation_of object
          const relationKeys = Object.keys(relationOf);
          if (relationKeys.length > 0) {
            relationName = relationOf[relationKeys[0]] || '';
          }
        }

        // Convert gender to proper case
        let gender = '';
        if (item.user_profile?.gender) {
          const genderValue = item.user_profile.gender.toLowerCase();
          gender = genderValue === 'male' ? 'Male' : genderValue === 'female' ? 'Female' : 'Other';
        }

        return {
          id: item.unique_id || 0, // Display ID (unique_id)
          uuid: item.id || '', // UUID for API calls
          image: firstImage || null,
          name: item.name || '',
          email: item.email || '', // Email not in API response
          phone: item.phone || '',
          date: item.start_date || item.created_at || '',
          validUpto: item.valid_upto || '',
          purposeToVisit: item.remarks || item.purpose_to_visit || '',
          sewaInterest: item.user_profile?.sewa_interest === 1 || false, // Convert number to boolean
          gender: gender,
          relationName: relationName,
          uid: item.unique_id?.toString() || item.uid || ''
        };
      });

      this.visitors = this.allVisitors;
    });
  }

  private buildVisitorQueryParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    const term = this.searchTerm.trim();
    if (term) {
      if (/^\d{10}$/.test(term)) {
        params['mobile_number'] = term;
      } else if (/^\d+$/.test(term)) {
        params['unique_id'] = parseInt(term, 10);
      } else {
        params['name'] = term;
      }
    }

    const gender = this.selectedGender[0];
    if (gender) {
      params['gender'] = String(gender).toUpperCase();
    }

    const sortCol = this.sortByColumn[0];
    const sortDir = this.sortOrder[0];
    if (sortCol) {
      params['sortByColumn'] = sortCol;
    }
    if (sortDir) {
      params['orderBy'] = sortDir;
      if (!sortCol) {
        params['sortByColumn'] = 'created_at';
      }
    }

    params['page'] = this.currentPage;
    params['per_page'] = this.pageSize;

    return params;
  }

  exportVisitors(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    const params = this.buildVisitorQueryParams();
    params['page'] = this.currentPage;
    params['per_page'] = this.pageSize;
    params['is_export'] = 1;
    params['export_type'] = 'excel';

    this.dataService.get<any>('v1/visitors', { params, responseType: 'blob', observe: 'response' }).pipe(
      catchError((error) => {
        console.error('Error exporting visitors:', error);
        this.snackbar.showError(error?.error?.message || 'Failed to export visitors.');
        return of(null);
      }),
      finalize(() => { this.isExporting = false; })
    ).subscribe((response: any) => {
      this.handleExportResponse(response, `visitors_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  private handleExportResponse(response: any, fallbackName: string): void {
    if (!response) return;
    const body: Blob | undefined = response.body;
    const headers = response.headers;

    // JSON response containing a downloadLink — trigger auto download of that file.
    if (body && body.type && body.type.includes('application/json')) {
      body.text().then((txt: string) => {
        try {
          const parsed = JSON.parse(txt);
          const url = parsed?.data?.downloadLink
            || parsed?.data?.download_link
            || parsed?.data?.url
            || parsed?.url
            || parsed?.download_url;
          if (url) {
            this.triggerBrowserDownload(url, this.filenameFromUrl(url) || fallbackName);
            this.snackbar.showSuccess(parsed?.message || 'Successfully downloaded.');
          } else {
            this.snackbar.showError(parsed?.message || 'Export response did not include a download link.');
          }
        } catch {
          this.snackbar.showError('Export response was not a downloadable file.');
        }
      });
      return;
    }

    if (!body) return;

    const filename = this.extractFilename(headers?.get?.('content-disposition')) || fallbackName;
    const blob = new Blob([body], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    this.triggerBrowserDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.snackbar.showSuccess('Successfully downloaded.');
  }

  private triggerBrowserDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private filenameFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return last ? decodeURIComponent(last) : null;
    } catch {
      return null;
    }
  }

  private extractFilename(disposition: string | null | undefined): string | null {
    if (!disposition) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return match ? decodeURIComponent(match[1]) : null;
  }

  get filteredVisitors(): Visitor[] {
    return this.visitors;
  }

  get pagedVisitors(): Visitor[] {
    return this.visitors;
  }

  trackById(_: number, v: Visitor): number {
    return v.id;
  }

  private searchDebounceTimer: any;

  onSearchChange(): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadVisitors();
    }, 350);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadVisitors();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.sortOrder = [];
    this.currentPage = 1;
    this.loadVisitors();
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVisitors();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
    this.loadVisitors();
  }

  // Selection handlers
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.pagedVisitors.forEach(v => this.selectedVisitors.add(v.id));
    } else {
      this.pagedVisitors.forEach(v => this.selectedVisitors.delete(v.id));
    }
  }

  toggleSelectVisitor(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedVisitors.has(id)) {
      this.selectedVisitors.delete(id);
    } else {
      this.selectedVisitors.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedVisitors.length > 0 &&
      this.pagedVisitors.every(v => this.selectedVisitors.has(v.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedVisitors.filter(v => this.selectedVisitors.has(v.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedVisitors.length;
  }

  // Action handlers
  getActionOptions(visitor: Visitor): MenuOption[] {
    return [
      { id: '1', label: 'View', value: 'view', icon: 'visibility' },
      { id: '2', label: 'Edit', value: 'edit', icon: 'edit' },
      { id: '3', label: 'Convert To Volunteer', value: 'convert', icon: 'refresh' },
      { id: '4', label: 'Print Visitor Card', value: 'print', icon: 'print' }
    ];
  }

  onAction(visitor: Visitor, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    if (actionId === 'view') {
      this.viewDetails(visitor);
    } else if (actionId === 'edit') {
      this.editVisitor(visitor);
    } else if (actionId === 'delete') {
      this.deleteVisitor(visitor);
    } else if (actionId === 'print') {
      this.printVisitorCards([visitor.uuid || String(visitor.id)]);
    } else if (actionId === 'convert') {
      this.convertToVolunteer(visitor);
    }
  }

  convertToVolunteer(visitor: Visitor): void {
    this.visitorToConvert = visitor;
    this.convertConfirmOpen = true;
  }

  cancelConvertToVolunteer(): void {
    this.convertConfirmOpen = false;
    this.visitorToConvert = null;
  }

  confirmConvertToVolunteer(): void {
    const visitor = this.visitorToConvert;
    if (!visitor || this.isConverting) return;

    this.isConverting = true;
    const userId = visitor.uuid;
    if (!userId) {
      this.isConverting = false;
      alert('Missing visitor identifier.');
      return;
    }

    this.dataService.put(`v1/visitors/convert-to-volunteer/${userId}`, { id: userId }).pipe(
      catchError((error) => {
        console.error('Error converting visitor to volunteer:', error);
        const apiError = error as { error?: { message?: string } };
        alert(apiError?.error?.message || 'Failed to convert visitor to volunteer. Please try again.');
        return of(null);
      }),
      finalize(() => {
        this.isConverting = false;
        this.convertConfirmOpen = false;
        this.visitorToConvert = null;
      })
    ).subscribe((response) => {
      if (response) {
        this.loadVisitors();
      }
    });
  }

  viewDetails(visitor: Visitor): void {
    const id = visitor.uuid || visitor.id;
    this.router.navigate(['/visitors', id, 'view']);
  }

  editVisitor(visitor: Visitor): void {
    const id = visitor.uuid || visitor.id;
    this.router.navigate(['/visitors', id, 'edit']);
  }

  deleteVisitor(visitor: Visitor): void {
    if (confirm(`Are you sure you want to delete ${visitor.name}?`)) {
      const visitorId = visitor.uuid || visitor.id;
      this.dataService.delete(`v1/visitors/${visitorId}`).pipe(
        catchError((error) => {
          console.error('Error deleting visitor:', error);
          alert('Failed to delete visitor. Please try again.');
          return of(null);
        })
      ).subscribe(() => {
        this.loadVisitors();
      });
    }
  }

  // Toggle Sewa Interest
  toggleSewaInterest(visitor: Visitor, event: Event): void {
    event.stopPropagation();

    if (visitor.sewaInterest) {
      // Turning OFF -> ask for reason; commit happens on modal submit
      this.openSewaReasonModal(visitor);
    } else {
      // Turning ON -> commit immediately
      this.commitSewaInterest(visitor, 1);
    }
  }

  private openSewaReasonModal(visitor: Visitor): void {
    this.sewaReasonVisitor = visitor;
    this.sewaReasonForm = { reason: '', remarks: '' };
    this.selectedSewaReason = [];
    this.sewaReasonModalOpen = true;
  }

  closeSewaReasonModal(): void {
    this.sewaReasonModalOpen = false;
    this.sewaReasonVisitor = null;
  }

  onSewaReasonChange(event: string[]): void {
    this.selectedSewaReason = event;
    this.sewaReasonForm.reason = event?.[0] || '';
  }

  submitSewaReason(): void {
    if (!this.sewaReasonVisitor) return;
    const visitor = this.sewaReasonVisitor;
    this.isSubmittingSewaReason = true;
    this.commitSewaInterest(visitor, 0, this.sewaReasonForm.reason, this.sewaReasonForm.remarks)
      .add(() => {
        this.isSubmittingSewaReason = false;
        this.closeSewaReasonModal();
      });
  }

  private commitSewaInterest(visitor: Visitor, value: 0 | 1, reason: string = '', remarks: string = '') {
    const previous = visitor.sewaInterest;
    visitor.sewaInterest = value === 1;

    const payload = {
      user_id: visitor.uuid || String(visitor.id),
      sewa_interest: value,
      reason: reason || '',
      remarks: remarks || ''
    };

    return this.dataService.put('v1/users/update-sewa-interest', payload).pipe(
      catchError((error) => {
        console.error('Error updating sewa interest:', error);
        visitor.sewaInterest = previous;
        alert('Failed to update sewa interest. Please try again.');
        return of(null);
      })
    ).subscribe();
  }

  // Format date
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString.split(' ')[0]);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    return dateString;
  }


  exportMenuOpen = false;

  // Export options
  getExportOptions(): MenuOption[] {
    return [
      {
        id: 'export',
        label: 'Export selected records',
        value: 'export',
        icon: 'download'
      },
      {
        id: 'print',
        label: 'Print selected records',
        value: 'print',
        icon: 'print'
      }
    ];
  }

  toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      this.exportMenuOpen = false;
    }
  }

  onExportAction(action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);

    this.exportMenuOpen = false;

    if (actionId === 'export') {
      this.exportSelectedRecords();
    } else if (actionId === 'print') {
      this.printSelectedRecords();
    }
  }

  exportSelectedRecords(): void {
    if (this.selectedVisitors.size === 0) {
      this.exportVisitors();
      return;
    }
    if (this.isExporting) return;
    this.isExporting = true;

    const ids = this.allVisitors
      .filter(v => this.selectedVisitors.has(v.id))
      .map(v => String((v as any).uuid ?? v.id));
    const payload = { ids, exportChoice: 'web' };

    this.dataService.post<any>('v1/export/batch/visitor', payload, { responseType: 'blob', observe: 'response' }).pipe(
      catchError((error) => {
        console.error('Error exporting selected visitors:', error);
        this.snackbar.showError(error?.error?.message || 'Failed to export selected visitors.');
        return of(null);
      }),
      finalize(() => { this.isExporting = false; })
    ).subscribe((response: any) => {
      this.handleExportResponse(response, `visitors_selected_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  printSelectedRecords(): void {
    if (this.selectedVisitors.size === 0) {
      alert('Please select at least one record to print.');
      return;
    }

    const selectedData = this.allVisitors.filter(v => this.selectedVisitors.has(v.id));
    const ids = selectedData.map(v => v.uuid || String(v.id));
    this.printVisitorCards(ids);
  }

  printVisitorCards(ids: string[]): void {
    if (!ids.length) return;
    this.isLoadingPrintCards = true;
    this.printedCards = [];
    this.printCardModalOpen = true;

    this.dataService.post<any>('v1/users/bulk', { ids }).pipe(
      catchError((error) => {
        console.error('Error fetching visitor cards:', error);
        alert('Failed to load visitor cards. Please try again.');
        this.printCardModalOpen = false;
        return of(null);
      }),
      finalize(() => {
        this.isLoadingPrintCards = false;
      })
    ).subscribe((response: any) => {
      const data = response?.data || response?.results || response || [];
      const cards = Array.isArray(data) ? data : [data];
      // Merge `remarks` from the local listing rows (which already mapped item.remarks)
      // since /v1/users/bulk may not return that field.
      this.printedCards = cards.map((card: any) => {
        if (card?.remarks) return card;
        const match = this.allVisitors.find(v =>
          (v as any).uuid === card?.id || String(v.id) === String(card?.unique_id)
        );
        return { ...card, remarks: match?.purposeToVisit || card?.remarks || '' };
      });
    });
  }

  closePrintCardModal(): void {
    this.printCardModalOpen = false;
    this.printedCards = [];
  }

  formatRelation(card: any): string {
    const relationOf = card?.user_profile?.relation_of || card?.relation_of;
    if (relationOf && typeof relationOf === 'object') {
      const entries = Object.entries(relationOf).filter(([, v]) => !!v);
      if (entries.length) {
        const [key, value] = entries[0];
        return `${key} ${value}`;
      }
    }
    const father = card?.user_profile?.father_name || card?.father_name;
    const spouse = card?.user_profile?.spouse_name || card?.spouse_name;
    const mother = card?.user_profile?.mother_name || card?.mother_name;
    if (spouse) return `W/O ${spouse}`;
    if (father) return `S/O ${father}`;
    if (mother) return `D/O ${mother}`;
    return '';
  }

  formatCardAddress(card: any): string {
    const addr = card?.user_address || card || {};
    const parts: string[] = [];
    const line1 = addr.address_1 || card?.address_1 || addr.address || card?.address;
    if (line1) parts.push(line1);
    const city = addr.city || card?.city;
    if (city) parts.push(city);
    const state = addr.state || card?.state;
    const pincode = addr.pincode || card?.pincode;
    const statePincode = [state, pincode].filter(Boolean).join('-');
    if (statePincode) parts.push(statePincode);
    return parts.join(', ');
  }

  cardPurpose(card: any): string {
    return card?.remarks
      ?? card?.user?.remarks
      ?? card?.user_profile?.remarks
      ?? card?.purpose_to_visit
      ?? card?.purpose_of_visit
      ?? '';
  }

  cardPhone(card: any): string {
    return card?.phone || card?.mobile || '';
  }

  cardGender(card: any): string {
    const raw = card?.user_profile?.gender || card?.gender;
    if (!raw) return '';
    const v = String(raw).toLowerCase();
    if (v === 'male') return 'Male';
    if (v === 'female') return 'Female';
    return 'Other';
  }

  formatPrintDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  printCards(): void {
    const cards = document.querySelector('.printable-cards') as HTMLElement | null;
    if (!cards) {
      this.closePrintCardModal();
      window.print();
      return;
    }

    const host = document.createElement('div');
    host.className = 'printable-print-host';
    host.appendChild(cards.cloneNode(true));
    document.body.appendChild(host);

    this.closePrintCardModal();

    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup);
      host.remove();
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => window.print(), 0);
  }

  // Create Visitor Modal Methods
  createVisitorFooterButtons = [
    {
      text: 'Cancel',
      type: 'secondary' as const,
      action: 'cancel'
    },
    {
      text: 'Submit',
      type: 'primary' as const,
      action: 'submit'
    }
  ];

  openCreateVisitorModal(): void {
    this.createVisitorModalOpen = true;
  }

  closeCreateVisitorModal(): void {
    this.createVisitorModalOpen = false;
  }

  onFooterAction(action: string): void {
    if (action === 'cancel') {
      this.closeCreateVisitorModal();
    } else if (action === 'submit') {
      // Trigger form submission in create-visitor component
      if (this.createVisitorComponent) {
        this.createVisitorComponent.submitForm();
      }
    }
  }

  onVisitorCreated(): void {
    this.closeCreateVisitorModal();
    this.loadVisitors(); // Reload the visitors list
  }
}

