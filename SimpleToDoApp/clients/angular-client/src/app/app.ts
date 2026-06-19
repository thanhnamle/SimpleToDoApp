import { Component, inject, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from './services/notification.service';
import { 
  LucideCheckCircle2, 
  LucideAlertCircle, 
  LucideAlertTriangle, 
  LucideInfo, 
  LucideX 
} from '@lucide/angular';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    LucideCheckCircle2,
    LucideAlertCircle,
    LucideAlertTriangle,
    LucideInfo,
    LucideX
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly notificationService = inject(NotificationService);
  toasts = computed(() => this.notificationService.toasts());
  confirmDialog = computed(() => this.notificationService.confirmDialog());

  removeToast(id: number) {
    this.notificationService.removeToast(id);
  }
}
