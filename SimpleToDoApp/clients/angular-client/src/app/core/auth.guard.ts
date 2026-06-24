import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = localStorage.getItem('todo_app_auth_user');

  if (user) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
