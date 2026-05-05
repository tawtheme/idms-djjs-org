import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

/**
 * Route guard that ensures user is authenticated.
 * Redirects to login if not authenticated.
 * VMS Users are bounced to the attendance page on every other route.
 *
 * Returns a UrlTree (instead of `false` + imperative navigation) so Angular
 * cancels the in-flight navigation cleanly and doesn't fall through to the
 * wildcard route, which would otherwise loop back into the same guard.
 */
const authOnly = (route?: any) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('[authOnly] route.path =', route?.path, 'authed =', auth.isAuthenticated(), 'isVms =', auth.isVmsUser());

  if (!auth.checkAuth()) {
    console.log('[authOnly] not authed → /login');
    return router.parseUrl('/login');
  }

  if (auth.isVmsUser()) {
    const path = route?.path || '';
    const allowed = path === 'programs/attendances' || path === 'programs/attendances/:id';
    console.log('[authOnly] VMS user, allowed =', allowed);
    if (!allowed) {
      return router.parseUrl('/programs/attendances');
    }
  }

  console.log('[authOnly] allow', route?.path);
  return true;
};

/**
 * Route guard that ensures user is NOT authenticated (guest only)
 * Redirects to the appropriate landing page if already authenticated.
 */
const guestOnly = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('[guestOnly] authed =', auth.isAuthenticated(), 'isVms =', auth.isVmsUser());

  if (auth.isAuthenticated()) {
    const target = auth.isVmsUser() ? '/programs/attendances' : '/dashboard';
    console.log('[guestOnly] already authed → redirect', target);
    return router.parseUrl(target);
  }

  console.log('[guestOnly] allow login');
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
    path: 'volunteers/:id/edit',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/all-volunteers/edit-volunteer/edit-volunteer.component').then(
        (m) => m.EditVolunteerComponent
      ),
  },
  {
    path: 'volunteers/:id/view',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/volunteers/all-volunteers/volunteer-view/volunteer-view.component').then(
        (m) => m.VolunteerViewComponent
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
  // Reports Routes
  // ============================================
  {
    path: 'reports/programs',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/programs-report/programs-report.component').then(
        (m) => m.ProgramsReportComponent
      ),
  },
  {
    path: 'reports/volunteers-branch-sewa',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/volunteers-branch-sewa-report/volunteers-branch-sewa-report.component').then(
        (m) => m.VolunteersBranchSewaReportComponent
      ),
  },
  {
    path: 'reports/consecutive-absentees',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/consecutive-absentees-report/consecutive-absentees-report.component').then(
        (m) => m.ConsecutiveAbsenteesReportComponent
      ),
  },
  {
    path: 'reports/cards-returned',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/cards-returned-report/cards-returned-report.component').then(
        (m) => m.CardsReturnedReportComponent
      ),
  },
  {
    path: 'reports/donation-dept-wise',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/donation-dept-wise-report/donation-dept-wise-report.component').then(
        (m) => m.DonationDeptWiseReportComponent
      ),
  },
  {
    path: 'reports/volunteers-skills',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/volunteers-skills-report/volunteers-skills-report.component').then(
        (m) => m.VolunteersSkillsReportComponent
      ),
  },
  {
    path: 'reports/sewa-issued',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/sewa-issued-report/sewa-issued-report.component').then(
        (m) => m.SewaIssuedReportComponent
      ),
  },
  {
    path: 'reports/head-subhead-volunteers',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/head-subhead-volunteers-report/head-subhead-volunteers-report.component').then(
        (m) => m.HeadSubheadVolunteersReportComponent
      ),
  },
  {
    path: 'reports/volunteers-attendance',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/volunteers-attendance-report/volunteers-attendance-report.component').then(
        (m) => m.VolunteersAttendanceReportComponent
      ),
  },
  {
    path: 'reports/volunteers-count-by-department',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/volunteers-count-by-department-report/volunteers-count-by-department-report.component').then(
        (m) => m.VolunteersCountByDepartmentReportComponent
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
  // Wildcard Route (404 - redirect to dashboard; authOnly bounces VMS users to attendances)
  // ============================================
  {
    path: '**',
    redirectTo: 'dashboard'
  },
];
