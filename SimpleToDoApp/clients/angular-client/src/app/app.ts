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

  @ViewChild('customCursor') customCursor!: ElementRef;

  toasts = computed(() => this.notificationService.toasts());
  confirmDialog = computed(() => this.notificationService.confirmDialog());

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.customCursor) {
      this.customCursor.nativeElement.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`;
    }
  }

  @HostListener('document:mousedown')
  onMouseDown() {
    if (this.customCursor) {
      this.customCursor.nativeElement.classList.add('cursor-active');
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.customCursor) {
      this.customCursor.nativeElement.classList.remove('cursor-active');
    }
  }

  removeToast(id: number) {
    this.notificationService.removeToast(id);
  }
}
