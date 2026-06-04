import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  LucideCheckCircle,
  LucideEye,
  LucideEyeOff
} from '@lucide/angular';

@Component({
  selector: 'app-reset-password',
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
    LucideCheckCircle,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './reset-password.html'
})
export class ResetPassword implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error.set('Invalid or missing password reset token.');
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  onSubmit() {
    if (!this.token) {
      this.error.set('No reset token found. Please request a new link.');
      return;
    }

    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.error.set('Please fill in all fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    // Password validation: 8-15 characters, at least 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,15}$/;
    if (!passwordRegex.test(this.newPassword)) {
      this.error.set('Password must be 8-15 characters long, contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.isSubmitted.set(true);
      },
      error: (err) => {
        let msg = 'Failed to reset password. The token may be invalid or expired.';
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
