import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:59444/api/auth';

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly currentToken = signal<string | null>(this.getStoredToken());
  readonly loading = signal<boolean>(false);

  constructor() {
    const token = this.getStoredToken();
    if (token) {
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
        next: (res) => {
          this.setSession(res);
        },
        error: () => this.clearSession(),
        finalize: () => this.loading.set(false)
      })
    );
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
    this.clearSession();
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('todo_app_auth_token', res.token);
    localStorage.setItem('todo_app_auth_user', JSON.stringify(res.user));
    this.currentToken.set(res.token);
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem('todo_app_auth_token');
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

  private getStoredToken(): string | null {
    return localStorage.getItem('todo_app_auth_token');
  }
}
