import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authOnly = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Use comprehensive auth check that includes localStorage fallback
  // This prevents logout during development file changes/reloads
  if (!auth.checkAuth()) {
    router.navigateByUrl('/login');
    return false;
  }
  
  return true;
};

const guestOnly = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    router.navigateByUrl('/dashboard');
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canMatch: [guestOnly],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'visitors',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/visitors/visitors.component').then(
        (m) => m.VisitorsComponent
      ),
  },
  {
    path: 'volunteers',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/all-volunteers/all-volunteers.component').then(
        (m) => m.AllVolunteersComponent
      ),
  },
  {
    path: 'volunteers/branch-applications',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/branch-applications/branch-applications.component').then(
        (m) => m.BranchApplicationsComponent
      ),
  },
  {
    path: 'volunteers/resigned-sewas',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/resigned-sewas/resigned-sewas.component').then(
        (m) => m.ResignedSewasComponent
      ),
  },
  {
    path: 'preachers/desiring-devotees',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/preachers/desiring-devotees-list/desiring-devotees-list.component').then(
        (m) => m.DesiringDevoteesListComponent
      ),
  },
  {
    path: 'preachers/preachers-list',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/preachers/preachers-list/preachers-list.component').then(
        (m) => m.PreachersListComponent
      ),
  },
  {
    path: 'forgot-password',
    canMatch: [guestOnly],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    canMatch: [guestOnly],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'settings',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
  
  {
    path: 'sewa/all-sewa',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/sewa/all-sewa/all-sewa.component').then(
        (m) => m.AllSewaComponent
      ),
  },
  {
    path: 'sewa/allocate-sewa',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/sewa/allocate-sewa/allocate-sewa.component').then(
        (m) => m.AllocateSewaComponent
      ),
  },
  
  { path: '**', redirectTo: 'dashboard' },
];
