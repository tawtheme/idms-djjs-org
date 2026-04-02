import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { VolunteerCardsFiltersModalComponent } from './filters-modal/filters-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

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
    MenuDropdownComponent,
    DropdownComponent,
    VolunteerCardsFiltersModalComponent,
    IconComponent
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
  
  // Filters panel
  filtersExpanded = false;
  taskBranchOptions: DropdownOption[] = [];
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [];
  filterOptionsDropdown: DropdownOption[] = [];

  // More Filters Modal
  moreFiltersModalOpen = false;
  moreFilters: any = {
    taskBranch: [],
    correspondingBranch: [],
    branchSearchType: [],
    badgeNo: '',
    name: '',
    relationName: '',
    mobileNo: '',
    uid: '',
    options: [],
    startFrom: '',
    endTo: ''
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

  toggleFiltersPanel(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  hasAnyActiveFilter(): boolean {
    return this.selectedGender.length > 0 ||
      this.selectedSewa.length > 0 ||
      this.moreFilters.taskBranch.length > 0 ||
      this.moreFilters.correspondingBranch.length > 0 ||
      this.moreFilters.branchSearchType.length > 0 ||
      !!this.moreFilters.badgeNo ||
      !!this.moreFilters.name ||
      !!this.moreFilters.relationName ||
      !!this.moreFilters.mobileNo ||
      !!this.moreFilters.uid ||
      this.moreFilters.options.length > 0 ||
      !!this.moreFilters.startFrom ||
      !!this.moreFilters.endTo;
  }

  totalActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedGender.length > 0) count++;
    if (this.selectedSewa.length > 0) count++;
    if (this.moreFilters.taskBranch.length > 0) count++;
    if (this.moreFilters.correspondingBranch.length > 0) count++;
    if (this.moreFilters.branchSearchType.length > 0) count++;
    if (this.moreFilters.badgeNo) count++;
    if (this.moreFilters.name) count++;
    if (this.moreFilters.relationName) count++;
    if (this.moreFilters.mobileNo) count++;
    if (this.moreFilters.uid) count++;
    if (this.moreFilters.options.length > 0) count++;
    if (this.moreFilters.startFrom) count++;
    if (this.moreFilters.endTo) count++;
    return count;
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedSewa = [];
    this.moreFilters = {
      taskBranch: [],
      correspondingBranch: [],
      branchSearchType: [],
      badgeNo: '',
      name: '',
      relationName: '',
      mobileNo: '',
      uid: '',
      options: [],
      startFrom: '',
      endTo: ''
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
    const badgeNo = (this.moreFilters.badgeNo || '').trim().toLowerCase();
    const filterName = (this.moreFilters.name || '').trim().toLowerCase();
    const relationName = (this.moreFilters.relationName || '').trim().toLowerCase();
    const mobileNo = (this.moreFilters.mobileNo || '').trim();
    const uid = (this.moreFilters.uid || '').trim().toLowerCase();
    const startFrom = this.moreFilters.startFrom ? new Date(this.moreFilters.startFrom) : null;
    const endTo = this.moreFilters.endTo ? new Date(this.moreFilters.endTo) : null;

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

      // Individual field filters
      const matchesBadgeNo = !badgeNo || (card.id?.toString().includes(badgeNo));
      const matchesName = !filterName || card.name.toLowerCase().includes(filterName);
      const matchesRelationName = !relationName ||
        (card.relationName && card.relationName.toLowerCase().includes(relationName));
      const matchesMobileNo = !mobileNo || (card.mobileNo && card.mobileNo.includes(mobileNo));
      const matchesUid = !uid || (card.uid && card.uid.toLowerCase().includes(uid));

      // Date range filter
      const matchesStartFrom = !startFrom || !card.createdAt || card.createdAt >= startFrom;
      const matchesEndTo = !endTo || !card.createdAt || card.createdAt <= endTo;

      // Branch filters
      const matchesTaskBranch = !taskBranch ||
        (card.address?.taskBranch === taskBranch);
      const matchesCorrespondingBranch = !correspondingBranch ||
        (card.address?.correspondingBranch === correspondingBranch);

      return matchesTerm && matchesGender && matchesSewa &&
             matchesBadgeNo && matchesName && matchesRelationName &&
             matchesMobileNo && matchesUid &&
             matchesStartFrom && matchesEndTo &&
             matchesTaskBranch && matchesCorrespondingBranch;
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

