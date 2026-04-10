import { Component, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../services/auth.service';

interface LauncherItem {
  label: string;
  icon: string;
  route: string;
  color: string;
}

interface LauncherGroup {
  title: string;
  icon: string;
  items: LauncherItem[];
}

@Component({
  selector: 'app-launcher',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './launcher.component.html',
  styleUrls: ['./launcher.component.scss']
})
export class LauncherComponent implements OnInit, OnDestroy {
  @Output() openPage = new EventEmitter<string>();
  private auth = inject(AuthService);
  private router = inject(Router);
  private timerInterval?: ReturnType<typeof setInterval>;

  activeGroupIndex = 0;
  currentTime = '';

  ngOnInit(): void {
    this.updateTime();
    this.timerInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  groups: LauncherGroup[] = [
    {
      title: 'Main',
      icon: 'dashboard',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', color: '#3b82f6' },
        { label: 'Visitors', icon: 'people', route: '/visitors', color: '#8b5cf6' }
      ]
    },
    {
      title: 'People Management',
      icon: 'volunteer_activism',
      items: [
        { label: 'All Volunteers', icon: 'volunteer_activism', route: '/volunteers', color: '#10b981' },
        { label: 'Branch Applications', icon: 'business', route: '/volunteers/branch-applications', color: '#f59e0b' },
        { label: 'Resigned Sewas', icon: 'person_remove', route: '/volunteers/resigned-sewas', color: '#ef4444' }
      ]
    },
    {
      title: 'Programs & Services',
      icon: 'event',
      items: [
        { label: 'All Sewa', icon: 'favorite', route: '/sewa/all-sewa', color: '#ec4899' },
        { label: 'Allocate Sewa', icon: 'assignment', route: '/sewa/allocate-sewa', color: '#14b8a6' },
        { label: 'Programs List', icon: 'event', route: '/programs/programs-list', color: '#6366f1' },
        { label: 'Sewa Volunteers', icon: 'people', route: '/programs/sewa-volunteers', color: '#0ea5e9' },
        { label: 'Attendances', icon: 'checklist', route: '/programs/attendances', color: '#22c55e' }
      ]
    },
    {
      title: 'Volunteer Management',
      icon: 'badge',
      items: [
        { label: 'Volunteer Cards', icon: 'badge', route: '/volunteer-cards', color: '#f97316' }
      ]
    },
    {
      title: 'Administration',
      icon: 'admin_panel_settings',
      items: [
        { label: 'Roles', icon: 'admin_panel_settings', route: '/roles', color: '#64748b' },
        { label: 'Initiatives', icon: 'trending_up', route: '/initiatives', color: '#a855f7' },
        { label: 'Projects', icon: 'inventory', route: '/projects', color: '#06b6d4' },
        { label: 'All Branches', icon: 'account_tree', route: '/branches', color: '#84cc16' },
        { label: 'Branch Areas', icon: 'map', route: '/branches/areas', color: '#eab308' },
        { label: 'Departments', icon: 'business', route: '/departments', color: '#f43f5e' },
        { label: 'Master Tables', icon: 'table_chart', route: '/master-tables', color: '#78716c' }
      ]
    }
  ];

  activeFilter = 'All';

  get allItems(): LauncherItem[] {
    return this.groups.flatMap(g => g.items);
  }

  get filteredItems(): LauncherItem[] {
    if (this.activeFilter === 'All') return this.allItems;
    const group = this.groups.find(g => g.title === this.activeFilter);
    return group ? group.items : this.allItems;
  }

  onCardClick(route: string): void {
    this.openPage.emit(route);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
