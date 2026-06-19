import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
  if (match) {
    return decodeURIComponent(match[2]);
  }
  return null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Always send cookies with cross-origin requests
  let authReq = req.clone({
    withCredentials: true
  });

  // Attach CSRF Token for mutating requests
  const csrfToken = getCsrfToken();
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    authReq = authReq.clone({
      setHeaders: {
        'X-XSRF-TOKEN': csrfToken
      }
    });
  }

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401) {
        localStorage.removeItem('todo_app_auth_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
