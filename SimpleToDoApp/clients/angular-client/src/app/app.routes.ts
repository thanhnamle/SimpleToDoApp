import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Dashboard } from './layout/dashboard';
import { TodoList } from './todo-list/todo-list';
import { TodoBoard } from './todo-board/todo-board';
import { TodoCalendar } from './todo-calendar/todo-calendar';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'todos',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', component: TodoList },
      { path: 'board', component: TodoBoard },
      { path: 'calendar', component: TodoCalendar }
    ]
  },
  { path: '', redirectTo: 'todos', pathMatch: 'full' },
  { path: '**', redirectTo: 'todos' }
];
