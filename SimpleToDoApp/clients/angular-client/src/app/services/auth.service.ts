import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl}/api/auth`;
  private readonly departmentUrl = `${environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl}/api/departments`;
  private readonly accountsUrl = `${environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl}/api/accounts`;

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly currentToken = signal<string | null>('cookie-based');
  readonly loading = signal<boolean>(false);

  constructor() {
    const user = this.getStoredUser();
    if (user) {
      this.getMe().subscribe({
        error: (err) => console.error('Failed to validate user on startup', err)
      });
    }
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    this.loading.set(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap({
        next: (res) => {
          this.setSession(res);
        },
        error: () => this.clearSession(),
        finalize: () => this.loading.set(false)
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.loading.set(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap({
        finalize: () => this.loading.set(false)
      })
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/verify-email`, {
      params: { token }
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.departmentUrl);
  }

  // Account CRUD for DepartmentHead
  createAccount(data: any): Observable<User> {
    return this.http.post<User>(this.accountsUrl, data);
  }

  updateAccount(id: number, data: any): Observable<User> {
    return this.http.put<User>(`${this.accountsUrl}/${id}`, data);
  }

  deleteAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${this.accountsUrl}/${id}`);
  }

  getDepartmentMembers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.departmentUrl}/members`);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap({
        next: (user) => {
          this.currentUser.set(user);
          localStorage.setItem('todo_app_auth_user', JSON.stringify(user));
        },
        error: () => this.clearSession()
      })
    );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('todo_app_auth_user', JSON.stringify(res.user));
    this.currentToken.set('cookie-based');
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem('todo_app_auth_user');
    this.currentToken.set(null);
    this.currentUser.set(null);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('todo_app_auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }


}
