import { Component, inject, OnInit, OnDestroy, signal, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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
        },
        {
          label: 'Manage Preachers',
          icon: 'record_voice_over',
          children: [
            { label: 'Desiring Devotees List', icon: 'people', route: '/preachers/desiring-devotees' },
            { label: 'Preachers List', icon: 'list', route: '/preachers/preachers-list' }
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
      title: 'Financial',
      items: [
        {
          label: 'Manage Pensions',
          icon: 'account_balance_wallet',
          children: [
            { label: 'All Pensions', icon: 'list', route: '/pensions' },
            { label: 'Add Pension', icon: 'add', route: '/pensions/add' },
            { label: 'Pension Reports', icon: 'assessment', route: '/pensions/reports' }
          ]
        }
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
            { label: 'Add Branch', icon: 'add', route: '/branches/add' },
            { label: 'Branch Hierarchy', icon: 'account_tree', route: '/branches/hierarchy' }
          ]
        },
        { label: 'Departments', icon: 'business', route: '/departments' },
        {
          label: 'Master Tables',
          icon: 'table_chart',
          children: [
            { label: 'All Tables', icon: 'list', route: '/master-tables' },
            { label: 'Table Configuration', icon: 'settings', route: '/master-tables/config' }
          ]
        }
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
  }

  ngOnDestroy() {
    // Cleanup handled automatically by Angular
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
  toggleExpand(itemLabel: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.expandedItems.has(itemLabel)) {
      this.expandedItems.delete(itemLabel);
    } else {
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

  get sidenavClasses() {
    return {
      'sidenav': true,
      'collapsed': this.isCollapsed,
      'mobile': this.isMobile(),
      'tablet': this.isTablet(),
      'desktop': this.isDesktop()
    };
  }
}


