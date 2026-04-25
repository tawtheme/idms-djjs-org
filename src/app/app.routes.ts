import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

/**
 * Route guard that ensures user is authenticated
 * Redirects to login if not authenticated
 */
const authOnly = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.checkAuth()) {
    router.navigateByUrl('/login');
    return false;
  }
  
  return true;
};

/**
 * Route guard that ensures user is NOT authenticated (guest only)
 * Redirects to dashboard if already authenticated
 */
const guestOnly = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isAuthenticated()) {
    router.navigateByUrl('/dashboard');
    return false;
  }
  
  return true;
};

/**
 * Application routes configuration
 * Routes are organized by feature area for better maintainability
 */
export const routes: Routes = [
  // Default route - redirect to dashboard
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },

  // ============================================
  // Authentication Routes (Guest Only)
  // ============================================
  {
    path: 'login',
    canMatch: [guestOnly],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
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

  // ============================================
  // Main Application Routes (Authenticated)
  // ============================================
  {
    path: 'dashboard',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },

  // ============================================
  // People Management Routes
  // ============================================
  {
    path: 'visitors',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/visitors/visitors.component').then(
        (m) => m.VisitorsComponent
      ),
  },
  {
    path: 'visitors/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/visitors/create-visitor/create-visitor.component').then(
        (m) => m.CreateVisitorComponent
      ),
  },
  {
    path: 'visitors/:id/view',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/visitors/view-visitor/view-visitor.component').then(
        (m) => m.ViewVisitorComponent
      ),
  },
  {
    path: 'visitors/:id/edit',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/visitors/edit-visitor/edit-visitor.component').then(
        (m) => m.EditVisitorComponent
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
    path: 'volunteers/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/all-volunteers/create-volunteer/create-volunteer.component').then(
        (m) => m.CreateVolunteerComponent
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
    path: 'volunteer-cards',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/volunteer-cards/volunteer-cards.component').then(
        (m) => m.VolunteerCardsComponent
      ),
  },

  // ============================================
  // Programs & Services Routes
  // ============================================
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
  {
    path: 'programs/programs-list',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/programs-list/programs-list.component').then(
        (m) => m.ProgramsListComponent
      ),
  },
  {
    path: 'programs/add-program',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/add-program/add-program.component').then(
        (m) => m.AddProgramComponent
      ),
  },
  {
    path: 'programs/edit-program/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/add-program/add-program.component').then(
        (m) => m.AddProgramComponent
      ),
  },
  {
    path: 'programs/view/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/program-detail/program-detail.component').then(
        (m) => m.ProgramDetailComponent
      ),
  },
  {
    path: 'programs/sewa-volunteers',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/sewa-volunteers/sewa-volunteers.component').then(
        (m) => m.SewaVolunteersComponent
      ),
  },
  {
    path: 'programs/attendances',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/attendances/attendances.component').then(
        (m) => m.AttendancesComponent
      ),
  },
  {
    path: 'programs/attendances/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/programs/attendances/attendance-detail/attendance-detail.component').then(
        (m) => m.AttendanceDetailComponent
      ),
  },

  // ============================================
  // Administration Routes
  // ============================================
  {
    path: 'roles',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/roles/roles-list/roles-list.component').then(
        (m) => m.RolesListComponent
      ),
  },
  {
    path: 'initiatives',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/initiatives/initiatives-list/initiatives-list.component').then(
        (m) => m.InitiativesListComponent
      ),
  },
  {
    path: 'projects',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/projects/projects-list/projects-list.component').then(
        (m) => m.ProjectsListComponent
      ),
  },
  {
    path: 'branches',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/branches/all-branches/all-branches.component').then(
        (m) => m.AllBranchesComponent
      ),
  },
  {
    path: 'branches/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/branches/create-branch/create-branch.component').then(
        (m) => m.CreateBranchComponent
      ),
  },
  {
    path: 'branches/areas',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/branches/branch-areas/branch-areas.component').then(
        (m) => m.BranchAreasComponent
      ),
  },
  {
    path: 'departments',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/departments/departments-list/departments-list.component').then(
        (m) => m.DepartmentsListComponent
      ),
  },
  {
    path: 'master-tables',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/master-tables/master-tables-list/master-tables-list.component').then(
        (m) => m.MasterTablesListComponent
      ),
  },

  // ============================================
  // Wildcard Route (404 - redirect to dashboard)
  // ============================================
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  },
];
