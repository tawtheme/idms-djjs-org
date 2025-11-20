import { Component, signal, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AuthService } from './services/auth.service';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { HeaderComponent } from './components/header/header.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ScrollingModule, SidenavComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = signal('idms-djjs.org');
  isCollapsed = signal(false);
  contentWrapperHeight = signal('calc(100vh - 64px)');
  isMobile = signal(false);

  @ViewChild('contentWrapper', { static: false }) contentWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild(HeaderComponent, { static: false }) headerComponent!: HeaderComponent;

  private auth = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private heightCalculationTimeout?: number;
  
  // expose signal to template
  get isAuthenticated() { return this.auth.isAuthenticated(); }

  ngOnInit() {
    // Initialize page title based on current route
    this.updatePageTitle(this.router.url);
    
    // Auto-collapse on mobile and track mobile state
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
      if (result.matches) {
        this.isCollapsed.set(true);
      }
    });

    // Listen for route changes to recalculate height and update title
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Update page title based on current route
        this.updatePageTitle(event.url);
        // Recalculate height after route change
        setTimeout(() => this.calculateContentHeight(), 100);
      });

    // Listen for window resize events
    window.addEventListener('resize', this.calculateContentHeight.bind(this));
  }

  ngAfterViewInit() {
    // Calculate initial height after view init with multiple attempts
    setTimeout(() => this.calculateContentHeight(), 0);
    setTimeout(() => this.calculateContentHeight(), 100);
    setTimeout(() => this.calculateContentHeight(), 300);
    
    // Set up ResizeObserver for more precise height tracking
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateContentHeight();
      });
      
      // Observe the main content area and header
      const contentElement = document.querySelector('.content');
      const headerElement = document.querySelector('app-header .header');
      
      if (contentElement) {
        this.resizeObserver.observe(contentElement);
      }
      if (headerElement) {
        this.resizeObserver.observe(headerElement);
      }
    }
    
    // Set up MutationObserver to watch for DOM changes
    this.mutationObserver = new MutationObserver(() => {
      this.calculateContentHeight();
    });
    
    // Observe the entire document for changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  ngOnDestroy() {
    // Cleanup event listeners and observers
    window.removeEventListener('resize', this.calculateContentHeight.bind(this));
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.heightCalculationTimeout) {
      clearTimeout(this.heightCalculationTimeout);
    }
  }

  onToggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
    // Recalculate height after collapse state changes
    setTimeout(() => this.calculateContentHeight(), 100);
  }

  private updatePageTitle(url: string): void {
    // Extract the route path and set appropriate title
    const routeMap: { [key: string]: string } = {
      '/invoices': 'Invoices',
      '/customers': 'Customers',
      '/orders': 'Orders',
      '/orders/add': 'Add Order',
      '/jobs': 'Jobs',
      '/jobs/create': 'Create Job',
      '/shipments': 'Shipments',
      '/suppliers': 'Suppliers',
      '/quotes': 'Quotes',
      '/purchase-orders': 'Purchase Orders',
      '/users-roles': 'Users & Roles',
      '/settings': 'Settings',
      '/products': 'Products',
      '/reports': 'Reports',
      '/profile': 'Profile',
      '/catalog/items': 'Items'
    };

    // Get the base path (remove query params and fragments)
    const basePath = url.split('?')[0].split('#')[0];
    
    // Set title based on route, fallback to 'idms-djjs.org'
    const pageTitle = routeMap[basePath] || 'idms-djjs.org';
    this.title.set(pageTitle);
  }

  // Method to force recalculate height (can be called from child components)
  recalculateHeight() {
    setTimeout(() => this.calculateContentHeight(), 0);
    setTimeout(() => this.calculateContentHeight(), 100);
  }

  // Get the current calculated content height
  getContentHeight(): number {
    const mainContent = document.querySelector('.content') as HTMLElement;
    if (mainContent) {
      const computedStyle = window.getComputedStyle(mainContent);
      const heightValue = computedStyle.getPropertyValue('--content-height');
      return parseInt(heightValue) || 0;
    }
    return 0;
  }

  // Get the current calculated header height
  getCalculatedHeaderHeight(): number {
    const mainContent = document.querySelector('.content') as HTMLElement;
    if (mainContent) {
      const computedStyle = window.getComputedStyle(mainContent);
      const heightValue = computedStyle.getPropertyValue('--header-height');
      return parseInt(heightValue) || 0;
    }
    return 0;
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    this.calculateContentHeight();
  }

  private calculateContentHeight() {
    // Clear existing timeout
    if (this.heightCalculationTimeout) {
      clearTimeout(this.heightCalculationTimeout);
    }
    
    // Debounce the calculation
    this.heightCalculationTimeout = window.setTimeout(() => {
      // Step 1: Calculate main section height (full viewport height)
      const mainSectionHeight = window.innerHeight;
      
      // Step 2: Calculate header height
      const headerHeight = this.getHeaderHeight();
      
      // Step 3: Calculate content-wrapper height (main - header)
      // Note: padding is included in height due to box-sizing: border-box
      const contentWrapperHeight = mainSectionHeight - headerHeight;
      
      // Step 5: Set main section height
      const mainContent = document.querySelector('.content') as HTMLElement;
      if (mainContent) {
        mainContent.style.height = `${mainSectionHeight}px`;
      }
      
      // Step 6: Set content-wrapper height
      const contentWrapper = document.querySelector('.content-wrapper') as HTMLElement;
      if (contentWrapper) {
        contentWrapper.style.height = `${contentWrapperHeight}px`;
      }
      
      // Update the signal for any components that need it
      this.contentWrapperHeight.set(`${contentWrapperHeight}px`);
    }, 50); // 50ms debounce
  }


  private getContentPadding(): number {
    // Get padding values from CSS custom properties
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      const computedStyle = window.getComputedStyle(contentWrapper);
      
      // Try to get from CSS custom properties first
      const paddingTop = computedStyle.getPropertyValue('--padding-top');
      const paddingBottom = computedStyle.getPropertyValue('--padding-bottom');
      
      if (paddingTop && paddingBottom) {
        const top = parseInt(paddingTop) || 0;
        const bottom = parseInt(paddingBottom) || 0;
        return top + bottom;
      }
      
      // Fallback to computed styles
      const computedPaddingTop = parseInt(computedStyle.paddingTop) || 0;
      const computedPaddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      return computedPaddingTop + computedPaddingBottom;
    }
    
    // Fallback values based on current CSS
    const isMobile = window.innerWidth <= 768;
    return isMobile ? 0 : 0; // Currently both are 0px based on your current padding
  }

  private getContentMargin(): number {
    // Get margin values from CSS custom properties
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
      const computedStyle = window.getComputedStyle(contentWrapper);
      
      // Try to get from CSS custom properties first
      const marginTop = computedStyle.getPropertyValue('--margin-top');
      const marginBottom = computedStyle.getPropertyValue('--margin-bottom');
      
      if (marginTop && marginBottom) {
        const top = parseInt(marginTop) || 0;
        const bottom = parseInt(marginBottom) || 0;
        return top + bottom;
      }
      
      // Fallback to computed styles
      const computedMarginTop = parseInt(computedStyle.marginTop) || 0;
      const computedMarginBottom = parseInt(computedStyle.marginBottom) || 0;
      return computedMarginTop + computedMarginBottom;
    }
    
    // Fallback values - no margin by default
    return 0;
  }

  private getHeaderHeight(): number {
    // Try to get the actual header element height using ViewChild
    if (this.headerComponent) {
      const height = this.headerComponent.getHeight();
      if (height > 0) {
        return height;
      }
    }
    
    // Fallback: Try to get from DOM query
    const headerElement = document.querySelector('app-header .header') as HTMLElement;
    if (headerElement) {
      const computedStyle = window.getComputedStyle(headerElement);
      const height = parseInt(computedStyle.height) || 0;
      if (height > 0) {
        return height;
      }
    }
    
    // Final fallback: Check if we're on mobile (breakpoint)
    const isMobile = window.innerWidth <= 768;
    return isMobile ? 56 : 64; // Mobile: 56px, Desktop: 64px
  }
}
