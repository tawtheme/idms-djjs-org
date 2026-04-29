import { Component, inject, OnInit, OnDestroy, signal, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

/**
 * Menu item interface for navigation structure
 */
interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  standalone: true,
  selector: 'app-sidenav',
  imports: [RouterLink, RouterLinkActive, CommonModule, IconComponent],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input() isCollapsed: boolean = false;
  @Input() headerHeight: number = 64; // Default header height
  @Output() closeSidebar = new EventEmitter<void>();
  
  private readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Reactive state for responsive behavior
  readonly isMobile = signal(false);

  // Track expanded menu items (only one can be expanded at a time)
  private readonly expandedItems = new Set<string>();
  
  // Subscription for route changes
  private routeSubscription?: Subscription;

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
        { label: 'Attendances', icon: 'checklist', route: '/programs/attendances' }
      ]
    },
    {
      title: 'Reports',
      items: [
        {
          label: 'Reports',
          icon: 'insights',
          children: [
            { label: 'Programs List', icon: 'list', route: '/reports/programs' },
            { label: 'Volunteers Attendance', icon: 'checklist', route: '/reports/volunteers-attendance' },
            { label: 'Volunteers Count by Department', icon: 'trending_up', route: '/reports/volunteers-count-by-department' },
            { label: 'Volunteers List Branch/Sewa Wise', icon: 'groups', route: '/reports/volunteers-branch-sewa' },
            { label: 'List of Sewa Issued', icon: 'assignment', route: '/reports/sewa-issued' },
            { label: 'Donation Dept. Wise', icon: 'volunteer_activism', route: '/reports/donation-dept-wise' },
            { label: 'Head Sub-head Volunteers List', icon: 'people', route: '/reports/head-subhead-volunteers' },
            { label: 'Consecutive Absentees', icon: 'person_remove', route: '/reports/consecutive-absentees' },
            { label: 'Cards Returned/Not Returned', icon: 'badge', route: '/reports/cards-returned' },
            { label: 'Volunteers List Skill Wise', icon: 'work', route: '/reports/volunteers-skills' }
          ]
        }
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

  ngOnInit(): void {
    // Watch for mobile screen size changes
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .subscribe(() => {
        this.isMobile.set(this.breakpointObserver.isMatched(Breakpoints.Handset));
      });

    // Initialize menu expansion based on current route
    this.checkAndExpandActiveRoute();

    // Listen to route changes and update menu expansion
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndExpandActiveRoute();
      });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  /**
   * Logout user and redirect to login page
   */
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  /**
   * Close sidebar on mobile when navigation link is clicked
   */
  onNavClick(): void {
    if (this.isMobile()) {
      this.closeSidebar.emit();
    }
  }

  /**
   * Toggle expand/collapse for menu items with children
   * Only one menu item can be expanded at a time
   */
  toggleExpand(itemLabel: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.expandedItems.has(itemLabel)) {
      this.expandedItems.delete(itemLabel);
    } else {
      this.expandedItems.clear();
      this.expandedItems.add(itemLabel);
    }
  }

  /**
   * Check if a menu item is currently expanded
   */
  isExpanded(itemLabel: string): boolean {
    return this.expandedItems.has(itemLabel);
  }

  /**
   * Check if a menu item has children
   */
  hasChildren(item: MenuItem): boolean {
    return !!(item.children?.length);
  }

  /**
   * Check if a child route is currently active
   * Prevents parent routes from being highlighted when a child route is active
   * Only the longest matching route in the same parent group will be active
   */
  isChildRouteActive(route: string | undefined, siblings: MenuItem[] | undefined): boolean {
    if (!route) {
      return false;
    }
    
    const currentUrl = this.router.url;
    
    // Exact match
    if (currentUrl === route) {
      return true;
    }
    
    // Check if current URL starts with the route followed by a slash
    // This handles nested routes like /volunteers/branch-applications/something
    if (!currentUrl.startsWith(route + '/')) {
      return false;
    }
    
    // Check if there's a longer sibling route that also matches
    // If there is, only the longer route should be active
    if (siblings) {
      const longerMatch = siblings.find(sibling => {
        if (!sibling.route || sibling.route === route) {
          return false;
        }
        return sibling.route.length > route.length && 
               (currentUrl === sibling.route || currentUrl.startsWith(sibling.route + '/'));
      });
      
      return !longerMatch;
    }
    
    return true;
  }

  /**
   * Get CSS classes for the sidenav element
   */
  get sidenavClasses(): Record<string, boolean> {
    return {
      'sidenav': true,
      'collapsed': this.isCollapsed,
      'mobile': this.isMobile()
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
    
    // Find and expand the menu item that contains the active child route
    for (const group of this.menuGroups) {
      for (const item of group.items) {
        if (!this.hasChildren(item) || !item.children) {
          continue;
        }
        
        const hasActiveChild = item.children.some(child => {
          if (!child.route) {
            return false;
          }
          return currentUrl === child.route || currentUrl.startsWith(child.route + '/');
        });
        
        if (hasActiveChild) {
          this.expandedItems.add(item.label);
          return; // Only one menu can be expanded at a time
        }
      }
    }
  }
}


