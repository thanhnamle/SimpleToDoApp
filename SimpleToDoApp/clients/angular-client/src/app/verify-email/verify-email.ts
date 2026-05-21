import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { 
  LucideAlertCircle, 
  LucideLoader2, 
  LucideSun,
  LucideMoon,
  LucideMailCheck
} from '@lucide/angular';

@Component({
  selector: 'app-verify-email',
  imports: [
    CommonModule,
    RouterLink,
    LucideAlertCircle,
    LucideLoader2,
    LucideSun,
    LucideMoon,
    LucideMailCheck
  ],
  templateUrl: './verify-email.html'
})
export class VerifyEmail implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal<string>('');

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('Missing verification token. Please check your link.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        let msg = 'The verification token is invalid or has expired.';
        if (err.error) {
          if (err.error.message) {
            msg = err.error.message;
          } else {
            msg = err.error.title || msg;
          }
        } else {
          msg = err.message || msg;
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
