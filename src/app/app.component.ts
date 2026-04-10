import { Component, signal, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { HeaderComponent } from './components/header/header.component';
import { LauncherComponent } from './components/launcher/launcher.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, LauncherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = signal('');
  showLauncher = signal(true);
  activeRoute = signal('');
  breadcrumbs = signal<{ label: string; route?: string }[]>([]);
  contentWrapperHeight = signal('calc(100vh - 48px)');

  @ViewChild('contentWrapper', { static: false }) contentWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild(HeaderComponent, { static: false }) headerComponent!: HeaderComponent;

  private auth = inject(AuthService);
  private router = inject(Router);
  private heightCalculationTimeout?: number;

  get isAuthenticated() { return this.auth.isAuthenticated(); }

  private routeMap: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/visitors': 'Visitors',
    '/volunteers': 'All Volunteers',
    '/volunteers/branch-applications': 'Branch Applications',
    '/volunteers/resigned-sewas': 'Resigned Sewas',
    '/sewa/all-sewa': 'All Sewa',
    '/sewa/allocate-sewa': 'Allocate Sewa',
    '/programs/programs-list': 'Programs List',
    '/programs/add-program': 'Add Program',
    '/programs/edit-program': 'Edit Program',
    '/programs/view': 'Program Details',
    '/programs/sewa-volunteers': 'Sewa Volunteers',
    '/programs/attendances': 'Attendances',
    '/volunteer-cards': 'Volunteer Cards',
    '/roles': 'Roles',
    '/initiatives': 'Initiatives',
    '/projects': 'Projects',
    '/branches': 'All Branches',
    '/branches/areas': 'Branch Areas',
    '/departments': 'Departments',
    '/master-tables': 'Master Tables'
  };

  private parentMap: { [key: string]: { label: string; route: string } } = {
    '/programs/view': { label: 'Programs List', route: '/programs/programs-list' },
    '/programs/edit-program': { label: 'Programs List', route: '/programs/programs-list' },
    '/programs/add-program': { label: 'Programs List', route: '/programs/programs-list' },
    '/programs/attendances': { label: 'Programs List', route: '/programs/programs-list' },
    '/volunteers/branch-applications': { label: 'All Volunteers', route: '/volunteers' },
    '/volunteers/resigned-sewas': { label: 'All Volunteers', route: '/volunteers' },
    '/branches/areas': { label: 'All Branches', route: '/branches' },
  };

  ngOnInit() {
    // Check if current route is a page (not launcher)
    this.checkCurrentRoute(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkCurrentRoute(event.url);
        setTimeout(() => this.calculateContentHeight(), 100);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => this.calculateContentHeight(), 100);
  }

  ngOnDestroy() {
    if (this.heightCalculationTimeout) {
      clearTimeout(this.heightCalculationTimeout);
    }
  }

  onOpenPage(route: string): void {
    this.showLauncher.set(false);
    this.updatePageTitle(route);
    this.activeRoute.set(route);
    this.router.navigateByUrl(route);
    setTimeout(() => this.calculateContentHeight(), 100);
  }

  onClosePage(): void {
    this.showLauncher.set(true);
    this.router.navigateByUrl('/dashboard');
  }

  private checkCurrentRoute(url: string): void {
    const basePath = url.split('?')[0].split('#')[0];

    // Auth pages — let them render without launcher
    if (['/login', '/forgot-password', '/reset-password'].includes(basePath)) {
      return;
    }

    // If we land on a known page route, show the page view
    const matchedTitle = this.getPageTitle(basePath);
    if (matchedTitle && basePath !== '/dashboard') {
      this.showLauncher.set(false);
      this.updatePageTitle(basePath);
    } else if (!this.showLauncher()) {
      // Already in page view (navigated via menu), update title
      this.updatePageTitle(basePath);
    }
  }

  private updatePageTitle(url: string): void {
    const basePath = url.split('?')[0].split('#')[0];
    const pageTitle = this.getPageTitle(basePath) || '';
    this.title.set(pageTitle);
    this.activeRoute.set(basePath);
    this.buildBreadcrumbs(basePath, pageTitle);
  }

  private buildBreadcrumbs(basePath: string, pageTitle: string): void {
    const crumbs: { label: string; route?: string }[] = [];
    // Find parent by checking each parentMap key
    for (const key of Object.keys(this.parentMap)) {
      if (basePath === key || basePath.startsWith(key + '/')) {
        const parent = this.parentMap[key];
        crumbs.push({ label: parent.label, route: parent.route });
        break;
      }
    }
    if (pageTitle) {
      crumbs.push({ label: pageTitle });
    }
    this.breadcrumbs.set(crumbs);
  }

  private getPageTitle(basePath: string): string | null {
    // Exact match
    if (this.routeMap[basePath]) {
      return this.routeMap[basePath];
    }
    // Partial match for dynamic routes like /programs/edit-program/:id, /programs/attendances/:id
    for (const route of Object.keys(this.routeMap)) {
      if (basePath.startsWith(route + '/')) {
        return this.routeMap[route];
      }
    }
    return null;
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.calculateContentHeight();
  }

  private calculateContentHeight() {
    if (this.heightCalculationTimeout) {
      clearTimeout(this.heightCalculationTimeout);
    }
    this.heightCalculationTimeout = window.setTimeout(() => {
      const headerHeight = this.getHeaderHeight();
      const height = window.innerHeight - headerHeight;
      const contentWrapper = document.querySelector('.content-wrapper') as HTMLElement;
      if (contentWrapper) {
        contentWrapper.style.height = `${height}px`;
      }
      this.contentWrapperHeight.set(`${height}px`);
    }, 50);
  }

  private getHeaderHeight(): number {
    if (this.headerComponent) {
      const height = this.headerComponent.getHeight();
      if (height > 0) return height;
    }
    const headerElement = document.querySelector('app-header .header') as HTMLElement;
    if (headerElement) {
      const height = parseInt(window.getComputedStyle(headerElement).height) || 0;
      if (height > 0) return height;
    }
    return 48;
  }
}
