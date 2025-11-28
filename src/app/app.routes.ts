import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
