import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ReminderService } from '../services/reminder.service';
import { SignalRService } from '../services/signalr.service';
import {
  LucideCheckSquare,
  LucideX,
  LucideListTodo,
  LucideKanban,
  LucideCalendar,
  LucideLogOut,
  LucideMenu,
  LucideSun,
  LucideMoon,
  LucideBell,
  LucideClock,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideUsers
} from '@lucide/angular';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideCheckSquare,
    LucideX,
    LucideListTodo,
    LucideKanban,
    LucideCalendar,
    LucideLogOut,
    LucideMenu,
    LucideSun,
    LucideMoon,
    LucideBell,
    LucideClock,
    LucideCheckCircle2,
    LucideAlertTriangle,
    LucideUsers
  ],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  readonly reminderService = inject(ReminderService);
  private readonly router = inject(Router);
  private readonly signalRService = inject(SignalRService);

  isSidebarOpen = signal(false);
  isBellOpen = signal(false);

  isEmployee = computed(() => this.authService.currentUser()?.role === 'Employee');
  isLeader = computed(() => this.authService.currentUser()?.role === 'Leader');
  isDepartmentHead = computed(() => this.authService.currentUser()?.role === 'DepartmentHead');

  username = computed(() => this.authService.currentUser()?.username || 'User');
  email = computed(() => this.authService.currentUser()?.email || '');
  userInitials = computed(() => {
    const name = this.username();
    return name.slice(0, 2).toUpperCase();
  });

  ngOnInit() {
    this.reminderService.startPolling(60000);
    const token = this.authService.currentToken();
    if (token) {
      this.signalRService.startConnection(token);
    }
  }

  ngOnDestroy() {
    this.reminderService.stopPolling();
    this.signalRService.stopConnection();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    this.isSidebarOpen.set(false);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark() {
    return this.themeService.isDark();
  }

  toggleBell() {
    const nextOpen = !this.isBellOpen();
    this.isBellOpen.set(nextOpen);
    if (nextOpen) {
      this.reminderService.load();
    }
  }

  closeBell() {
    this.isBellOpen.set(false);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
