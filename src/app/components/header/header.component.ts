import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../services/auth.service';
import { HeaderActionsService } from '../../services/header-actions.service';

interface MenuGroupItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: { [key: string]: string };
}

interface MenuGroup {
  title: string;
  items: MenuGroupItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() activeRoute: string = '';
  @Input() breadcrumbs: { label: string; route?: string }[] = [];
  @Output() navigateTo = new EventEmitter<string>();
  @Output() closePage = new EventEmitter<void>();
  @Output() sidenavToggle = new EventEmitter<void>();

  @ViewChild('headerElement', { static: false }) headerElement!: ElementRef<HTMLElement>;

  isMenuOpen = false;

  quickTiles: MenuGroupItem[] = [
    { label: 'Add Visitor', icon: 'people', route: '/visitors/create' },
    { label: 'Attendance', icon: 'checklist', route: '/programs/attendances' },
    { label: 'Volunteer Cards', icon: 'badge', route: '/volunteer-cards' },
    { label: 'Sewa Volunteer', icon: 'people', route: '/programs/sewa-volunteers' },
    { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa' },
    { label: 'Programs', icon: 'event', route: '/programs/programs-list' }
  ];

  menuGroups: MenuGroup[] = [
    {
      title: 'Quick Link',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Add Visitors', icon: 'people', route: '/visitors/create' },
        { label: 'Add Volunteers', icon: 'volunteer_activism', route: '/volunteers/create' },
        { label: 'Add Branch', icon: 'account_tree', route: '/branches/create' },
        { label: 'Add Branch Area', icon: 'map', route: '/branches/areas', queryParams: { openAdd: 'true' } },
        { label: 'Add Program', icon: 'event', route: '/programs/add-program' },
        { label: 'Add Sewa', icon: 'favorite', route: '/sewa/all-sewa', queryParams: { openAdd: 'true' } }
      ]
    },
    {
      title: 'Essentials',
      items: [
        { label: 'Attendances', icon: 'checklist', route: '/programs/attendances' },
        { label: 'Volunteer Cards', icon: 'badge', route: '/volunteer-cards' },
        { label: 'Visitors', icon: 'people', route: '/visitors' }
      ]
    },
    {
      title: 'Manage Volunteers',
      items: [
        { label: 'All Volunteers', icon: 'volunteer_activism', route: '/volunteers' },
        { label: 'Add Volunteers', icon: 'volunteer_activism', route: '/volunteers/create' },
        { label: 'Branch Applications', icon: 'business', route: '/volunteers/branch-applications' },
        { label: 'Resigned Sewas', icon: 'person_remove', route: '/volunteers/resigned-sewas' }
      ]
    },
    {
      title: 'Manage Sewa',
      items: [
        { label: 'All Sewa', icon: 'favorite', route: '/sewa/all-sewa' },
        { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa' }
      ]
    },
    {
      title: 'Manage Programs',
      items: [
        { label: 'Programs', icon: 'event', route: '/programs/programs-list' },
        { label: 'Sewa Volunteer', icon: 'people', route: '/programs/sewa-volunteers' }
      ]
    },
    {
      title: 'Reports',
      items: [
        { label: 'Programs List', icon: 'assessment', route: '/reports/programs' },
        { label: 'Volunteers List Branch/Sewa Wise', icon: 'group', route: '/reports/volunteers-branch-sewa' },
        { label: 'Consecutive Absentees', icon: 'person_remove', route: '/reports/consecutive-absentees' },
        { label: 'Cards Returned/Not Returned', icon: 'badge', route: '/reports/cards-returned' },
        { label: 'Donation Department Wise', icon: 'volunteer_activism', route: '/reports/donation-dept-wise' },
        { label: 'Volunteers List Skill Wise', icon: 'engineering', route: '/reports/volunteers-skills' },
        { label: 'Sewa Issued', icon: 'assignment_turned_in', route: '/reports/sewa-issued' },
        { label: 'Head/Subhead Volunteers', icon: 'supervisor_account', route: '/reports/head-subhead-volunteers' },
        { label: 'Volunteers Attendance', icon: 'checklist', route: '/reports/volunteers-attendance' },
        { label: 'Volunteers Count by Department', icon: 'pie_chart', route: '/reports/volunteers-count-by-department' }
      ]
    },
    {
      title: 'Manage Branches',
      items: [
        { label: 'Listing', icon: 'account_tree', route: '/branches' },
        { label: 'Branch Area', icon: 'map', route: '/branches/areas' }
      ]
    },
    {
      title: 'Manage Tables',
      items: [
        { label: 'Skills', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'skills' } },
        { label: 'Degrees', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'degrees' } },
        { label: 'Professions', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'professions' } },
        { label: 'Languages', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'languages' } },
        { label: 'Dress Codes', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'dress_codes' } },
        { label: 'Banks', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'banks' } },
        { label: 'Castes', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'castes' } },
        { label: 'Newspapers', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'newspapers' } },
        { label: 'Countries', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'countries' } },
        { label: 'States', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'states' } },
        { label: 'Districts', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'districts' } },
        { label: 'Cities', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'cities' } },
        { label: 'Ashram Adhaar Area', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'ashram_adhaar_areas' } },
        { label: 'Weapon Types', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'weapon_types' } },
        { label: 'Technical Qualifications', icon: 'table_chart', route: '/master-tables', queryParams: { type: 'technical_qualifications' } }
      ]
    }
  ];

  private auth = inject(AuthService);
  private router = inject(Router);
  protected headerActions = inject(HeaderActionsService);

  constructor(private elementRef: ElementRef) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onMenuButtonClick(): void {
    this.sidenavToggle.emit();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      this.toggleMenu();
    } else if (event.key === 'Escape' && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  onMenuItemClick(item: MenuGroupItem): void {
    this.isMenuOpen = false;
    if (item.queryParams) {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    } else {
      this.navigateTo.emit(item.route);
    }
  }

  onClose(): void {
    this.closePage.emit();
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  getHeight(): number {
    const headerEl = this.headerElement?.nativeElement || this.elementRef.nativeElement.querySelector('.header');
    if (headerEl) {
      const computedStyle = window.getComputedStyle(headerEl);
      return parseInt(computedStyle.height) || 0;
    }
    return 0;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('document:keydown.F2', ['$event'])
  onF2(event: Event): void {
    event.preventDefault();
    this.isMenuOpen = true;
  }
}
