import { Component, inject, OnInit, OnDestroy, signal, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  standalone: true,
  selector: 'app-sidenav',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input() isCollapsed: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();
  
  private auth = inject(AuthService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  // Signals for reactive state
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(false);

  // Track expanded menu items
  expandedItems = new Set<string>();
  
  // Subscription for route changes
  private routeSubscription: any;

  // Menu structure
  menuGroups = [
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
        {
          label: 'Manage Volunteers',
          icon: 'volunteer_activism',
          children: [
            { label: 'All Volunteers', icon: 'list', route: '/volunteers' },
            { label: 'Branch Applications', icon: 'business', route: '/volunteers/branch-applications' },
            { label: 'Resigned Sewas', icon: 'person_remove', route: '/volunteers/resigned-sewas' }
          ]
        }
      ]
    },
    {
      title: 'Programs & Services',
      items: [
        {
          label: 'Manage Sewa',
          icon: 'favorite',
          children: [
            { label: 'All Sewa', icon: 'list', route: '/sewa/all-sewa' },
            { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa' }
          ]
        },
        {
          label: 'Manage Programs',
          icon: 'event',
          children: [
            { label: 'Programs List', icon: 'list', route: '/programs/programs-list' },
            { label: 'Sewa Volunteers', icon: 'people', route: '/programs/sewa-volunteers' }
          ]
        },
        { label: 'Attendances', icon: 'checklist', route: '/attendances' }
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
        {
          label: 'Manage Branches',
          icon: 'account_tree',
          children: [
            { label: 'All Branches', icon: 'list', route: '/branches' },
            { label: 'Branch Areas', icon: 'map', route: '/branches/areas' }
          ]
        },
        { label: 'Departments', icon: 'business', route: '/departments' },
        { label: 'Master Tables', icon: 'table_chart', route: '/master-tables' }
      ]
    }
  ];

  ngOnInit() {
    // Watch for screen size changes
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet,
      Breakpoints.Web
    ]).subscribe(result => {
      this.isMobile.set(this.breakpointObserver.isMatched(Breakpoints.Handset));
      this.isTablet.set(this.breakpointObserver.isMatched(Breakpoints.Tablet));
      this.isDesktop.set(this.breakpointObserver.isMatched(Breakpoints.Web));
      
      // Auto-collapse on mobile handled by parent component
    });

    // Check and expand menu items based on current route
    this.checkAndExpandActiveRoute();

    // Listen to route changes and expand menu items accordingly
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndExpandActiveRoute();
      });
  }

  ngOnDestroy() {
    // Unsubscribe from route changes
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  // Close sidebar on mobile when navigation link is clicked
  onNavClick() {
    if (this.isMobile()) {
      this.closeSidebar.emit();
    }
  }

  // Toggle expand/collapse for menu items with children
  // Only one menu item can be expanded at a time
  toggleExpand(itemLabel: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.expandedItems.has(itemLabel)) {
      // If already expanded, collapse it
      this.expandedItems.delete(itemLabel);
    } else {
      // Collapse all other expanded items first (only one expanded at a time)
      this.expandedItems.clear();
      // Then expand the clicked item
      this.expandedItems.add(itemLabel);
    }
  }

  // Check if item is expanded
  isExpanded(itemLabel: string): boolean {
    return this.expandedItems.has(itemLabel);
  }

  // Check if item has children
  hasChildren(item: MenuItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  /**
   * Check if a child route is currently active
   * Prevents parent routes from being highlighted when a child route is active
   * Only the longest matching route in the same parent group will be active
   */
  isChildRouteActive(route: string | undefined, siblings: MenuItem[] | undefined): boolean {
    if (!route) return false;
    
    const currentUrl = this.router.url;
    
    // Exact match
    if (currentUrl === route) {
      return true;
    }
    
    // Check if current URL starts with the route followed by a slash
    // This handles nested routes like /volunteers/branch-applications/something
    if (currentUrl.startsWith(route + '/')) {
      // Check if there's a longer sibling route that also matches
      // If there is, only the longer route should be active
      if (siblings) {
        const longerMatch = siblings.find(sibling => {
          if (!sibling.route || sibling.route === route) return false;
          // Check if this sibling route is longer and also matches the current URL
          return sibling.route.length > route.length && 
                 (currentUrl === sibling.route || currentUrl.startsWith(sibling.route + '/'));
        });
        
        // If there's a longer match, this route shouldn't be active
        if (longerMatch) {
          return false;
        }
      }
      
      return true;
    }
    
    return false;
  }

  get sidenavClasses() {
    return {
      'sidenav': true,
      'collapsed': this.isCollapsed,
      'mobile': this.isMobile(),
      'tablet': this.isTablet(),
      'desktop': this.isDesktop()
    };
  }

  /**
   * Checks the current route and expands parent menu items if any child route is active
   * Only one menu item can be expanded at a time
   */
  private checkAndExpandActiveRoute(): void {
    const currentUrl = this.router.url;
    
    // Clear all expanded items first (only one expanded at a time)
    this.expandedItems.clear();
    
    // Iterate through all menu groups and items
    this.menuGroups.forEach(group => {
      group.items.forEach(item => {
        // If item has children, check if any child route matches current URL
        if (this.hasChildren(item) && item.children) {
          const hasActiveChild = item.children.some(child => {
            if (child.route) {
              // Check if current URL starts with or equals the child route
              return currentUrl === child.route || currentUrl.startsWith(child.route + '/');
            }
            return false;
          });
          
          // If a child route is active, expand the parent menu item
          // (only one will be expanded since we cleared the set first)
          if (hasActiveChild) {
            this.expandedItems.add(item.label);
          }
        }
      });
    });
  }
}


