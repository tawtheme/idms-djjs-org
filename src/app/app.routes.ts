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
    router.navigateByUrl('/orders');
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
    path: 'orders',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/orders/orders.component').then(
        (m) => m.OrdersComponent
      ),
  },
  {
    path: 'orders/add',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/orders/add-order/add-order.component').then(
        (m) => m.AddOrderComponent
      ),
  },
  {
    path: 'orders/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/orders/detail/order-detail.component').then(
        (m) => m.OrderDetailComponent
      ),
  },
  {
    path: 'jobs',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/jobs/jobs.component').then((m) => m.JobsComponent),
  },
  {
    path: 'jobs/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/jobs/create-job/create-job.component').then((m) => m.CreateJobComponent),
  },
  {
    path: 'books',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/books/books.component').then((m) => m.BooksComponent),
  },
  
  {
    path: 'customers',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/customers/customers.component').then(
        (m) => m.CustomersComponent
      ),
  },
  {
    path: 'customers/add',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/customers/add-customer/add-customer.component').then(
        (m) => m.AddCustomerComponent
      ),
  },
  {
    path: 'customers/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/customers/detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent
      ),
  },
  {
    path: 'suppliers',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/suppliers/suppliers.component').then(
        (m) => m.SuppliersComponent
      ),
  },
  {
    path: 'suppliers/:id',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/suppliers/detail/supplier-detail.component').then(
        (m) => m.SupplierDetailComponent
      ),
  },
  {
    path: 'catalog/items',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/catalog/items/items.component').then(
        (m) => m.ItemsComponent
      ),
  },
  {
    path: 'users-roles',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/users/users-roles.component').then(
        (m) => m.UsersRolesComponent
      ),
  },
  {
    path: 'users/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/users/create-user/create-user.component').then(
        (m) => m.CreateUserComponent
      ),
  },
  {
    path: 'quotes',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/quotes/quotes.component').then(
        (m) => m.QuotesComponent
      ),
  },
  {
    path: 'quotes/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/quotes/create-quote/create-quote.component').then(
        (m) => m.CreateQuoteComponent
      ),
  },
  {
    path: 'invoices',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/invoices/invoices.component').then(
        (m) => m.InvoicesComponent
      ),
  },
  {
    path: 'invoices/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/invoices/create-invoice/create-invoice.component').then(
        (m) => m.CreateInvoiceComponent
      ),
  },
  {
    path: 'purchase-orders',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/purchase-orders/purchase-orders.component').then(
        (m) => m.PurchaseOrdersComponent
      ),
  },
  {
    path: 'purchase-orders/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/purchase-orders/create-purchase-order/create-purchase-order.component').then(
        (m) => m.CreatePurchaseOrderComponent
      ),
  },
  {
    path: 'shipments',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/shipments/shipments.component').then(
        (m) => m.ShipmentsComponent
      ),
  },
  {
    path: 'shipments/create',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/shipments/create-shipment/create-shipment.component').then(
        (m) => m.CreateShipmentComponent
      ),
  },
  
  {
    path: 'reports',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
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
    path: 'amazon/status',
    canMatch: [authOnly],
    loadComponent: () =>
      import('./features/amazon/amazon-status.component').then(
        (m) => m.AmazonStatusComponent
      ),
  },
  
  { path: '**', redirectTo: 'orders' },
];
