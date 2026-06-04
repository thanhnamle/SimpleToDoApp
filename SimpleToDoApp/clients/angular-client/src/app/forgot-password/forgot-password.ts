import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  LucideMail
} from '@lucide/angular';

@Component({
  selector: 'app-forgot-password',
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
    LucideMail
  ],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  email = '';
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  onSubmit() {
    if (!this.email.trim()) {
      this.error.set('Please enter your email address.');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.isSubmitted.set(true);
      },
      error: (err) => {
        let msg = 'Failed to request password reset link.';
        if (err.error) {
          if (err.error.message) {
            msg = err.error.message;
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
