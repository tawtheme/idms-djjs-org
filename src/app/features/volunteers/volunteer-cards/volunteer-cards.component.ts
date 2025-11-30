import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DateRangePickerComponent } from '../../../shared/components/date-range-picker/date-range-picker.component';
import { VolunteerCardsFiltersModalComponent } from './filters-modal/filters-modal.component';

export interface VolunteerCard {
  id: number;
  image?: string;
  name: string;
  relationName?: string;
  fatherName?: string;
  phone?: string;
  mobileNo?: string;
  uid?: string;
  sewa?: string;
  gender?: string;
  unallocationReason?: string;
  enterBy?: string;
  createdAt?: Date;
  address?: {
    taskBranch?: string;
    correspondingBranch?: string;
  };
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
    MenuDropdownComponent,
    DropdownComponent,
    DateRangePickerComponent,
    VolunteerCardsFiltersModalComponent
  ],
  selector: 'app-volunteer-cards',
  templateUrl: './volunteer-cards.component.html',
  styleUrls: ['./volunteer-cards.component.scss']
})
export class VolunteerCardsComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  volunteerCards: VolunteerCard[] = [];
  allVolunteerCards: VolunteerCard[] = [];

  // Selection
  selectedCards = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedSewa: any[] = [];
  sewaOptions: DropdownOption[] = [];
  
  // Date Range
  dateRangeFrom: Date | null = null;
  dateRangeTo: Date | null = null;

  // More Filters Modal
  moreFiltersModalOpen = false;
  moreFilters: any = {
    taskBranch: [],
    correspondingBranch: [],
    branchSearchType: []
  };

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Volunteer Management', route: '/volunteer-cards' },
    { label: 'Volunteer Cards', route: '/volunteer-cards' }
  ];

  constructor() {
    // Initialize empty arrays - data will be loaded from API
    this.allVolunteerCards = [];

    // Build filter options
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.sewaOptions = [];

    this.applyFilter();
  }

  get pagedCards(): VolunteerCard[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.volunteerCards.slice(start, start + this.pageSize);
  }

  trackById(_: number, card: VolunteerCard): number {
    return card.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedSewa = [];
    this.dateRangeFrom = null;
    this.dateRangeTo = null;
    this.moreFilters = {
      taskBranch: [],
      correspondingBranch: [],
      branchSearchType: []
    };
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const gender = this.selectedGender[0]?.value || '';
    const sewa = this.selectedSewa[0]?.value || '';
    const taskBranch = this.moreFilters.taskBranch[0]?.value || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0]?.value || '';

    // Filter cards
    let filtered = this.allVolunteerCards.filter((card) => {
      // Search in Name, Relation Name, Mobile No., UID
      const matchesTerm = !term ||
        card.name.toLowerCase().includes(term) ||
        (card.relationName && card.relationName.toLowerCase().includes(term)) ||
        (card.mobileNo && card.mobileNo.includes(term)) ||
        (card.uid && card.uid.toLowerCase().includes(term));

      const matchesGender = !gender || card.gender === gender;
      const matchesSewa = !sewa || card.sewa === sewa;

      // Date range filter
      const matchesDateRange = !this.dateRangeFrom || !card.createdAt || 
        (card.createdAt >= this.dateRangeFrom && 
         (!this.dateRangeTo || card.createdAt <= this.dateRangeTo));

      // Branch filters
      const matchesTaskBranch = !taskBranch || 
        (card.address?.taskBranch === taskBranch);
      const matchesCorrespondingBranch = !correspondingBranch || 
        (card.address?.correspondingBranch === correspondingBranch);

      return matchesTerm && matchesGender && matchesSewa && 
             matchesDateRange && matchesTaskBranch && matchesCorrespondingBranch;
    });

    // Apply sorting (using table header sorting)
    if (this.sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (this.sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.volunteerCards = filtered;
    this.totalItems = this.volunteerCards.length;
    this.currentPage = 1;
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
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
      this.pagedCards.forEach(card => this.selectedCards.add(card.id));
    } else {
      this.pagedCards.forEach(card => this.selectedCards.delete(card.id));
    }
  }

  toggleSelectCard(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedCards.has(id)) {
      this.selectedCards.delete(id);
    } else {
      this.selectedCards.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedCards.length > 0 &&
           this.pagedCards.every(card => this.selectedCards.has(card.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedCards.filter(card => this.selectedCards.has(card.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedCards.length;
  }

  // Action handlers
  getActionOptions(card: VolunteerCard): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'edit',
        label: 'Edit',
        value: 'edit',
        icon: 'edit'
      },
      {
        id: 'delete',
        label: 'Delete',
        value: 'delete',
        icon: 'delete',
        danger: true
      }
    ];
  }

  onAction(card: VolunteerCard, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(card);
    } else if (actionId === 'edit') {
      this.editCard(card);
    } else if (actionId === 'delete') {
      this.deleteCard(card);
    }
  }

  viewDetails(card: VolunteerCard): void {
    console.log('View card:', card);
  }

  editCard(card: VolunteerCard): void {
    console.log('Edit card:', card);
  }

  deleteCard(card: VolunteerCard): void {
    if (confirm(`Are you sure you want to delete ${card.name}?`)) {
      this.allVolunteerCards = this.allVolunteerCards.filter(c => c.id !== card.id);
      this.applyFilter();
    }
  }

  // Date Range handlers
  onDateRangeChange(range: { fromDate: Date | null; toDate: Date | null }): void {
    this.dateRangeFrom = range.fromDate;
    this.dateRangeTo = range.toDate;
    this.applyFilter();
  }

  // More Filters Modal
  openMoreFiltersModal(): void {
    this.moreFiltersModalOpen = true;
  }

  closeMoreFiltersModal(): void {
    this.moreFiltersModalOpen = false;
  }

  onMoreFiltersApply(filters: any): void {
    this.moreFilters = filters;
    this.applyFilter();
  }
}

