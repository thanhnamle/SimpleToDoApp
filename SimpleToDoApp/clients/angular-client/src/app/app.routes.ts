import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { VerifyEmail } from './verify-email/verify-email';
import { Dashboard } from './layout/dashboard';
import { TodoList } from './todo-list/todo-list';
import { TodoBoard } from './todo-board/todo-board';
import { TodoCalendar } from './todo-calendar/todo-calendar';
import { TodoDepartment } from './todo-department/todo-department';
import { TodoGantt } from './todo-gantt/todo-gantt';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'verify-email', component: VerifyEmail },
  {
    path: 'todos',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', component: TodoList },
      { path: 'board', component: TodoBoard },
      { path: 'calendar', component: TodoCalendar },
      { path: 'gantt', component: TodoGantt },
      { path: 'department', component: TodoDepartment }
    ]
  },
  { path: '', redirectTo: 'todos', pathMatch: 'full' },
  { path: '**', redirectTo: 'todos' }
];
