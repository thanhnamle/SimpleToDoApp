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
  LucideMoon
} from '@lucide/angular';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideCheckSquare,
    LucideAlertCircle,
    LucideLoader2,
    LucideArrowRight,
    LucideSun,
    LucideMoon
  ],
  templateUrl: './register.html'
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  onSubmit() {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
      this.error.set('Please fill in all fields.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/todos']);
      },
      error: (err) => {
        let msg = 'Registration failed.';
        if (err.error) {
          if (err.error.message) {
            msg = err.error.message;
          } else if (err.error.errors) {
            // Extract the first validation error
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
