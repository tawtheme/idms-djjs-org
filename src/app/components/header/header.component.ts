import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface MenuGroupItem {
  label: string;
  icon: string;
  route: string;
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

  @ViewChild('headerElement', { static: false }) headerElement!: ElementRef<HTMLElement>;

  isMenuOpen = false;

  menuGroups: MenuGroup[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Visitors', icon: 'people', route: '/visitors' }
      ]
    },
    {
      title: 'People Management',
      items: [
        { label: 'All Volunteers', icon: 'volunteer_activism', route: '/volunteers' },
        { label: 'Branch Applications', icon: 'business', route: '/volunteers/branch-applications' },
        { label: 'Resigned Sewas', icon: 'person_remove', route: '/volunteers/resigned-sewas' }
      ]
    },
    {
      title: 'Programs & Services',
      items: [
        { label: 'All Sewa', icon: 'favorite', route: '/sewa/all-sewa' },
        { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa' },
        { label: 'Programs List', icon: 'event', route: '/programs/programs-list' },
        { label: 'Sewa Volunteers', icon: 'people', route: '/programs/sewa-volunteers' },
        { label: 'Attendances', icon: 'checklist', route: '/programs/attendances' }
      ]
    },
    {
      title: 'Volunteer Management',
      items: [
        { label: 'Volunteer Cards', icon: 'badge', route: '/volunteer-cards' }
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Roles', icon: 'admin_panel_settings', route: '/roles' },
        { label: 'Initiatives', icon: 'trending_up', route: '/initiatives' },
        { label: 'Projects', icon: 'inventory', route: '/projects' },
        { label: 'All Branches', icon: 'account_tree', route: '/branches' },
        { label: 'Branch Areas', icon: 'map', route: '/branches/areas' },
        { label: 'Departments', icon: 'business', route: '/departments' },
        { label: 'Master Tables', icon: 'table_chart', route: '/master-tables' }
      ]
    }
  ];

  constructor(private elementRef: ElementRef) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onMenuItemClick(route: string): void {
    this.isMenuOpen = false;
    this.navigateTo.emit(route);
  }

  onClose(): void {
    this.closePage.emit();
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
}
