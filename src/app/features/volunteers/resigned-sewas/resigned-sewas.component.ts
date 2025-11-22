import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MenuDropdownComponent, MenuOption } from '../../../shared/components/menu-dropdown/menu-dropdown.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { MoreFiltersModalComponent } from '../all-volunteers/more-filters-modal/more-filters-modal.component';

export interface ResignedSewa {
  id: number;
  image?: string;
  userName: string;
  taskBranch: string;
  correspondingBranch: string;
  sewa: string;
  badgeNo: string;
  reason: string;
  resignedDate: string;
  enterBy?: string;
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
    MoreFiltersModalComponent
  ],
  selector: 'app-resigned-sewas',
  templateUrl: './resigned-sewas.component.html',
  styleUrls: ['./resigned-sewas.component.scss']
})
export class ResignedSewasComponent {
  @ViewChild('exportWrapper') exportWrapper!: ElementRef;

  resignedSewas: ResignedSewa[] = [];
  allResignedSewas: ResignedSewa[] = [];

  // Selection
  selectedResignedSewas = new Set<number>();

  // Filters
  searchTerm = '';
  selectedGender: any[] = [];
  genderOptions: DropdownOption[] = [];
  selectedTaskBranch: any[] = [];
  taskBranchOptions: DropdownOption[] = [];
  selectedSewa: any[] = [];
  sewaOptions: DropdownOption[] = [];
  
  // More Filters
  moreFiltersModalOpen = false;
  moreFilters: any = {
    correspondingBranch: [],
    branchSearchType: [],
    sewa: [],
    sewaInterest: [],
    sewaAllocated: [],
    sewaMode: []
  };

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Manage Volunteers', route: '/volunteers' },
    { label: 'Resigned Sewas', route: '/volunteers/resigned-sewas' }
  ];

  constructor() {
    // Sample data based on the image
    this.allResignedSewas = [
      {
        id: 20171,
        image: 'https://via.placeholder.com/40',
        userName: 'Abhay Arora',
        taskBranch: 'Nurmahal',
        correspondingBranch: 'Amritsar',
        sewa: 'Control Room Br',
        badgeNo: '29',
        reason: 'Foreign',
        resignedDate: '03/10/2025 05:40 pm',
        enterBy: ''
      },
      {
        id: 703,
        image: 'https://via.placeholder.com/40',
        userName: 'Charn Kaur',
        taskBranch: 'Nurmahal',
        correspondingBranch: 'Kapurthala',
        sewa: 'Jal Sewa Sis',
        badgeNo: '54',
        reason: 'Death',
        resignedDate: '03/10/2025 05:41 pm',
        enterBy: 'Kabir'
      }
    ];

    // Generate more sample records
    const reasons = ['Foreign', 'Death', 'Personal', 'Health', 'Transfer'];
    const branches = ['Nurmahal', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Kapurthala'];
    const sewas = ['Control Room Br', 'Jal Sewa Sis', 'Food Distribution', 'Medical Camp'];
    
    for (let i = 2; i < 15; i++) {
      const date = new Date(2025, 2, 10 + i);
      const hours = 5 + (i % 12);
      const minutes = 40 + (i % 20);
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours > 12 ? hours - 12 : hours;
      
      this.allResignedSewas.push({
        id: 20171 + i,
        image: i % 3 === 0 ? undefined : `https://via.placeholder.com/40?text=${String.fromCharCode(65 + i)}`,
        userName: `User ${i + 1}`,
        taskBranch: branches[i % branches.length],
        correspondingBranch: branches[(i + 1) % branches.length],
        sewa: sewas[i % sewas.length],
        badgeNo: String(29 + i),
        reason: reasons[i % reasons.length],
        resignedDate: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`,
        enterBy: i % 2 === 0 ? 'Admin' : 'Manager'
      });
    }

    // Build filter options
    this.genderOptions = [
      { id: '1', label: 'Male', value: 'Male' },
      { id: '2', label: 'Female', value: 'Female' },
      { id: '3', label: 'Other', value: 'Other' }
    ];

    this.taskBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' },
      { id: '4', label: 'Amritsar', value: 'Amritsar' },
      { id: '5', label: 'Kapurthala', value: 'Kapurthala' }
    ];

    this.sewaOptions = [
      { id: '1', label: 'Control Room Br', value: 'Control Room Br' },
      { id: '2', label: 'Jal Sewa Sis', value: 'Jal Sewa Sis' },
      { id: '3', label: 'Food Distribution', value: 'Food Distribution' },
      { id: '4', label: 'Medical Camp', value: 'Medical Camp' }
    ];

    this.applyFilter();
  }

  get filteredResignedSewas(): ResignedSewa[] {
    return this.resignedSewas;
  }

  get pagedResignedSewas(): ResignedSewa[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.resignedSewas.slice(start, start + this.pageSize);
  }

  trackById(_: number, r: ResignedSewa): number {
    return r.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedGender = [];
    this.selectedTaskBranch = [];
    this.selectedSewa = [];
    this.moreFilters = {
      correspondingBranch: [],
      branchSearchType: [],
      sewa: [],
      sewaInterest: [],
      sewaAllocated: [],
      sewaMode: []
    };
    this.applyFilter();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const taskBranch = this.selectedTaskBranch[0] || '';
    const sewa = this.selectedSewa[0] || '';
    const correspondingBranch = this.moreFilters.correspondingBranch[0] || '';

    // Filter resigned sewas
    let filtered = this.allResignedSewas.filter((r) => {
      const matchesTerm = !term || 
        r.userName.toLowerCase().includes(term) ||
        r.badgeNo.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term);

      const matchesTaskBranch = !taskBranch || r.taskBranch === taskBranch;
      const matchesSewa = !sewa || r.sewa === sewa;
      const matchesCorrespondingBranch = !correspondingBranch || r.correspondingBranch === correspondingBranch;

      return matchesTerm && matchesTaskBranch && matchesSewa && matchesCorrespondingBranch;
    });

    this.resignedSewas = filtered;
    this.totalItems = this.resignedSewas.length;
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
      this.pagedResignedSewas.forEach(r => this.selectedResignedSewas.add(r.id));
    } else {
      this.pagedResignedSewas.forEach(r => this.selectedResignedSewas.delete(r.id));
    }
  }

  toggleSelectResignedSewa(id: number, event: Event): void {
    event.stopPropagation();
    if (this.selectedResignedSewas.has(id)) {
      this.selectedResignedSewas.delete(id);
    } else {
      this.selectedResignedSewas.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.pagedResignedSewas.length > 0 && 
           this.pagedResignedSewas.every(r => this.selectedResignedSewas.has(r.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pagedResignedSewas.filter(r => this.selectedResignedSewas.has(r.id)).length;
    return selectedCount > 0 && selectedCount < this.pagedResignedSewas.length;
  }

  // Action handlers
  getActionOptions(resignedSewa: ResignedSewa): MenuOption[] {
    return [
      {
        id: 'view',
        label: 'View',
        value: 'view',
        icon: 'visibility'
      },
      {
        id: 'reactivate',
        label: 'Reactivate',
        value: 'reactivate',
        icon: 'refresh'
      }
    ];
  }

  onAction(resignedSewa: ResignedSewa, action: any): void {
    if (!action) return;
    const actionId = typeof action === 'string' ? action : (action.value || action.id);
    
    if (actionId === 'view') {
      this.viewDetails(resignedSewa);
    } else if (actionId === 'reactivate') {
      this.reactivateSewa(resignedSewa);
    }
  }

  viewDetails(resignedSewa: ResignedSewa): void {
    console.log('View resigned sewa:', resignedSewa);
  }

  reactivateSewa(resignedSewa: ResignedSewa): void {
    if (confirm(`Reactivate ${resignedSewa.userName}?`)) {
      console.log('Reactivate sewa:', resignedSewa.id);
      // Remove from resigned list and move to active volunteers
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.exportWrapper && !this.exportWrapper.nativeElement.contains(event.target)) {
      // Handle any click outside logic if needed
    }
  }
}

