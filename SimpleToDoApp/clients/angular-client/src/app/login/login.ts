import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { 
  LucideCheckSquare, 
  LucideAlertCircle, 
  LucideLoader2, 
  LucideArrowRight,
  LucideSun,
  LucideMoon,
  LucideEye,
  LucideEyeOff,
  LucideArrowLeft
} from '@lucide/angular';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideCheckSquare,
    LucideAlertCircle,
    LucideLoader2,
    LucideArrowRight,
    LucideSun,
    LucideMoon,
    LucideEye,
    LucideEyeOff,
    LucideArrowLeft
  ],
  templateUrl: './login.html'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  usernameOrEmail = '';
  password = '';
  showPassword = false;
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  onSubmit() {
    if (!this.usernameOrEmail.trim() || !this.password.trim()) {
      this.error.set('Please fill in all fields.');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.authService.login({
      usernameOrEmail: this.usernameOrEmail,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        let msg = 'Login failed. Please check your credentials.';
        if (err.error) {
          if (err.error.message) {
            msg = err.error.message;
          } else if (err.error.errors) {
            const errorKeys = Object.keys(err.error.errors);
            if (errorKeys.length > 0) {
              const messages = err.error.errors[errorKeys[0]];
              if (Array.isArray(messages) && messages.length > 0) {
                msg = messages[0];
              } else {
                msg = String(messages);
              }
            }
          } else {
            msg = err.error.title || msg;
          }
        } else {
          msg = err.message || msg;
        }
        this.error.set(msg);
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
