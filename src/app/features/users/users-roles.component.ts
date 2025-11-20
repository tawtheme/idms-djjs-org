import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { DataService } from '../../data.service';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  created_at: string;
  last_login: string;
  avatar: string | null;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, PagerComponent, EmptyStateComponent, SidePanelComponent, CreateUserComponent, UserDetailComponent],
  selector: 'app-users-roles',
  templateUrl: './users-roles.component.html',
  styleUrls: ['./users-roles.component.scss']
})
export class UsersRolesComponent {
  users: User[] = [];
  allUsers: User[] = [];
  sidePanelOpen = false;
  detailPanelOpen = false;
  selectedUserId: string | null = null;

  // Filters
  userName = '';
  selectedRole: any[] = [];
  roleOptions: DropdownOption[] = [];
  selectedDepartment: any[] = [];
  departmentOptions: DropdownOption[] = [];
  selectedStatus: any[] = [];
  statusOptions: DropdownOption[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Users & Roles', route: '/users-roles' }
  ];

  constructor(private data: DataService, private router: Router) {
    this.data.getJson<any>('users.json').subscribe((response) => {
      const rawUsers = response?.users ?? [];
      this.allUsers = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        department: u.department || '',
        status: u.status,
        created_at: u.created_at,
        last_login: u.last_login,
        avatar: u.avatar
      }));

      // Build role options from data
      const roleSet = new Set<string>();
      for (const u of this.allUsers) {
        if (u.role) {
          roleSet.add(u.role);
        }
      }
      this.roleOptions = Array.from(roleSet).sort().map((v, idx) => ({
        id: String(idx + 1),
        label: v.charAt(0).toUpperCase() + v.slice(1),
        value: v
      }));

      // Build department options from data
      const departmentSet = new Set<string>();
      for (const u of this.allUsers) {
        if (u.department) {
          departmentSet.add(u.department);
        }
      }
      this.departmentOptions = Array.from(departmentSet).sort().map((v, idx) => ({
        id: String(idx + 1),
        label: v,
        value: v
      }));

      // Build status options
      const statusSet = new Set<string>();
      for (const u of this.allUsers) {
        if (u.status) {
          statusSet.add(u.status);
        }
      }
      this.statusOptions = Array.from(statusSet).sort().map((v, idx) => ({
        id: String(idx + 1),
        label: v.charAt(0).toUpperCase() + v.slice(1),
        value: v
      }));

      this.applyFilter();
    });
  }

  get pagedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  trackById(_: number, u: User): string {
    return u.id;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.userName = '';
    this.selectedRole = [];
    this.selectedDepartment = [];
    this.selectedStatus = [];
    this.fromDate = null;
    this.toDate = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const name = this.userName.trim().toLowerCase();
    const role = this.selectedRole[0] || '';
    const department = this.selectedDepartment[0] || '';
    const status = this.selectedStatus[0] || '';

    this.users = this.allUsers.filter((u) => {
      const matchesName = !name || 
        (u.name || '').toLowerCase().includes(name) ||
        (u.email || '').toLowerCase().includes(name) ||
        (u.id || '').toLowerCase().includes(name);
      const matchesRole = !role || u.role === role;
      const matchesDepartment = !department || u.department === department;
      const matchesStatus = !status || u.status === status;
      const ud = u.created_at ? new Date(u.created_at) : null;
      const withinFrom = !this.fromDate || (ud && ud >= this.fromDate);
      const withinTo = !this.toDate || (ud && ud <= this.toDate);
      return matchesName && matchesRole && matchesDepartment && matchesStatus && withinFrom && withinTo;
    });

    // Reset pagination after filtering
    this.totalItems = this.users.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  }

  openCreateUserPanel(): void {
    this.sidePanelOpen = true;
  }

  closeCreateUserPanel(): void {
    this.sidePanelOpen = false;
  }

  onUserSaved(): void {
    this.closeCreateUserPanel();
    // Reload users data
    this.data.getJson<any>('users.json').subscribe((response) => {
      const rawUsers = response?.users ?? [];
      this.allUsers = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        department: u.department || '',
        status: u.status,
        created_at: u.created_at,
        last_login: u.last_login,
        avatar: u.avatar
      }));
      this.applyFilter();
    });
  }

  onUserCancelled(): void {
    this.closeCreateUserPanel();
  }

  openUserDetailPanel(userId: string): void {
    this.selectedUserId = userId;
    this.detailPanelOpen = true;
  }

  closeUserDetailPanel(): void {
    this.detailPanelOpen = false;
    this.selectedUserId = null;
  }
}


