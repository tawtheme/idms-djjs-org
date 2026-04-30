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
    { label: 'Add Volunteer', icon: 'volunteer_activism', route: '/volunteers/create' },
    { label: 'Attendance', icon: 'checklist', route: '/programs/attendances' },
    { label: 'Volunteer Cards', icon: 'badge', route: '/volunteer-cards' },
    { label: 'Sewa Volunteer', icon: 'people', route: '/programs/sewa-volunteers' },
    { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa' },
    { label: 'Programs', icon: 'event', route: '/programs/programs-list' }
  ];

  menuGroups: MenuGroup[] = [];

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
