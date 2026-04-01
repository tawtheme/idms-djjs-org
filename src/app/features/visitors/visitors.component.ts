import { Component, HostListener, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { MenuDropdownComponent, MenuOption } from '../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { CreateVisitorComponent } from './create-visitor/create-visitor.component';
import { DataService } from '../../data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

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

  visitors: Visitor[] = [];
  allVisitors: Visitor[] = [];

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  // Create Visitor Modal
  createVisitorModalOpen = false;

  // Selection
  selectedVisitors = new Set<number>();

  // Filters
  searchTerm = ''; // Handles Name, Mobile No., Relation Name, UID
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  sortOrder: any[] = [];
  sortOrderOptions: DropdownOption[] = [];

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
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    // Combined Sort By and Order By options
    this.sortOrderOptions = [
      { id: '0', label: 'None', value: '' },
      { id: '1', label: 'Name (ASC)', value: 'name:asc' },
      { id: '2', label: 'Name (DESC)', value: 'name:desc' },
      { id: '3', label: 'Date (ASC)', value: 'date:asc' },
      { id: '4', label: 'Date (DESC)', value: 'date:desc' },
      { id: '5', label: 'Id (ASC)', value: 'id:asc' },
      { id: '6', label: 'Id (DESC)', value: 'id:desc' },
      { id: '7', label: 'Mobile No. (ASC)', value: 'phone:asc' },
      { id: '8', label: 'Mobile No. (DESC)', value: 'phone:desc' },
      { id: '9', label: 'Address (ASC)', value: 'address:asc' },
      { id: '10', label: 'Address (DESC)', value: 'address:desc' },
      { id: '11', label: 'Age (ASC)', value: 'age:asc' },
      { id: '12', label: 'Age (DESC)', value: 'age:desc' },
      { id: '13', label: 'Badge No (ASC)', value: 'badgeNo:asc' },
      { id: '14', label: 'Badge No (DESC)', value: 'badgeNo:desc' },
      { id: '15', label: 'Created date (ASC)', value: 'createdDate:asc' },
      { id: '16', label: 'Created date (DESC)', value: 'createdDate:desc' },
      { id: '17', label: 'City (ASC)', value: 'city:asc' },
      { id: '18', label: 'City (DESC)', value: 'city:desc' }
    ];
  }

  loadVisitors(): void {
    this.isLoading = true;
    this.error = null;

    this.dataService.get<any>('v1/visitors').pipe(
      catchError((error) => {
        console.error('Error loading visitors:', error);
        this.error = error.error?.message || error.message || 'Failed to load visitors. Please try again.';
        // Return empty array on error to prevent breaking the UI
        return of({ data: [], visitors: [], results: [] });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      // Handle different response structures
      const visitorsData = response.data || response.visitors || response.results || response || [];

      // Map API response to Visitor interface
      this.allVisitors = (Array.isArray(visitorsData) ? visitorsData : []).map((item: any) => {
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
          date: item.created_at || item.date || '', // Date not in API response
          validUpto: item.valid_upto || item.valid_until || '', // Not in API response
          purposeToVisit: item.purpose_to_visit || item.purpose || '', // Not in API response
          sewaInterest: item.user_profile?.sewa_interest === 1 || false, // Convert number to boolean
          gender: gender,
          relationName: relationName,
          uid: item.unique_id?.toString() || item.uid || ''
        };
      });

      this.applyFilter();
    });
  }

  get filteredVisitors(): Visitor[] {
    return this.visitors;
  }

  get pagedVisitors(): Visitor[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.visitors.slice(start, start + this.pageSize);
  }

  trackById(_: number, v: Visitor): number {
    return v.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.sortOrder = [];
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const gender = this.selectedGender[0] || '';

    // Filter visitors
    let filtered = this.allVisitors.filter((v) => {
      // Search in Name, Mobile No., Relation Name, UID
      const matchesTerm = !term ||
        v.name.toLowerCase().includes(term) ||
        v.phone.includes(term) ||
        (v.relationName && v.relationName.toLowerCase().includes(term)) ||
        (v.uid && v.uid.toLowerCase().includes(term));

      const matchesGender = !gender || v.gender === gender;

      return matchesTerm && matchesGender;
    });

    // Apply sorting
    const sortOrderValue = this.sortOrder[0]?.value || '';

    if (sortOrderValue) {
      const [sortField, orderDirection] = sortOrderValue.split(':');
      const orderByValue = orderDirection || 'asc';

      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'date':
            aValue = a.date ? new Date(a.date).getTime() : 0;
            bValue = b.date ? new Date(b.date).getTime() : 0;
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'phone':
            aValue = a.phone;
            bValue = b.phone;
            break;
          case 'address':
            aValue = (a as any).address?.toLowerCase() || '';
            bValue = (b as any).address?.toLowerCase() || '';
            break;
          case 'age':
            aValue = (a as any).age || 0;
            bValue = (b as any).age || 0;
            break;
          case 'badgeNo':
            aValue = (a as any).badgeNo || '';
            bValue = (b as any).badgeNo || '';
            break;
          case 'createdDate':
            aValue = (a as any).createdDate ? new Date((a as any).createdDate).getTime() : 0;
            bValue = (b as any).createdDate ? new Date((b as any).createdDate).getTime() : 0;
            break;
          case 'city':
            aValue = (a as any).city?.toLowerCase() || '';
            bValue = (b as any).city?.toLowerCase() || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return orderByValue === 'asc' ? -1 : 1;
        if (aValue > bValue) return orderByValue === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.visitors = filtered;
    this.totalItems = this.visitors.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
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
    }
  }

  viewDetails(visitor: Visitor): void {
    console.log('View visitor:', visitor);
    // Implement view details logic
  }

  editVisitor(visitor: Visitor): void {
    console.log('Edit visitor:', visitor);
    // Implement edit logic
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
        // Remove from local array on success
        this.allVisitors = this.allVisitors.filter(v => v.id !== visitor.id);
        this.applyFilter();
      });
    }
  }

  // Toggle Sewa Interest
  toggleSewaInterest(visitor: Visitor, event: Event): void {
    event.stopPropagation();
    const newValue = !visitor.sewaInterest;

    // Optimistically update UI
    visitor.sewaInterest = newValue;

    // Use UUID for API call, convert boolean to number (1 or 0)
    const visitorId = visitor.uuid || visitor.id;
    const sewaInterestValue = newValue ? 1 : 0;

    // Make API call to update - need to update user_profile
    this.dataService.patch(`v1/visitors/${visitorId}`, {
      user_profile: {
        sewa_interest: sewaInterestValue
      }
    }).pipe(
      catchError((error) => {
        console.error('Error updating sewa interest:', error);
        // Revert on error
        visitor.sewaInterest = !newValue;
        alert('Failed to update sewa interest. Please try again.');
        return of(null);
      })
    ).subscribe(() => {
      console.log('Sewa interest updated successfully');
    });
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
      alert('Please select at least one record to export.');
      return;
    }

    const selectedData = this.allVisitors.filter(v => this.selectedVisitors.has(v.id));

    // Convert to CSV
    const headers = ['Id', 'Name', 'Email', 'Phone', 'Date', 'Valid Upto', 'Purpose To Visit', 'Sewa Interest', 'Gender', 'Relation Name', 'UID'];
    const rows = selectedData.map(v => [
      v.id,
      v.name,
      v.email,
      v.phone,
      v.date,
      v.validUpto,
      v.purposeToVisit,
      v.sewaInterest ? 'Yes' : 'No',
      v.gender || '',
      v.relationName || '',
      v.uid || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitors_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printSelectedRecords(): void {
    if (this.selectedVisitors.size === 0) {
      alert('Please select at least one record to print.');
      return;
    }

    const selectedData = this.allVisitors.filter(v => this.selectedVisitors.has(v.id));

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visitors Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h2>Visitors Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${selectedData.length}</p>
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Valid Upto</th>
                <th>Purpose To Visit</th>
                <th>Sewa Interest</th>
                <th>Gender</th>
                <th>Relation Name</th>
                <th>UID</th>
              </tr>
            </thead>
            <tbody>
              ${selectedData.map(v => `
                <tr>
                  <td>${v.id}</td>
                  <td>${v.name}</td>
                  <td>${v.email}</td>
                  <td>${v.phone}</td>
                  <td>${v.date}</td>
                  <td>${v.validUpto}</td>
                  <td>${v.purposeToVisit}</td>
                  <td>${v.sewaInterest ? 'Yes' : 'No'}</td>
                  <td>${v.gender || '-'}</td>
                  <td>${v.relationName || '-'}</td>
                  <td>${v.uid || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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

