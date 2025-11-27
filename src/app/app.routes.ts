import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; // jo bhi path hai

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },

  {
    path: 'employees',
    loadChildren: () =>
      import('./features/employee/employee.routes').then(m => m.EMPLOYEE_ROUTES)
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
