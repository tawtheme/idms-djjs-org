import { Component, inject, OnInit, OnDestroy, signal, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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


