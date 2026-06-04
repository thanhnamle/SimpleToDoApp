import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<Toast[]>([]);
  confirmDialog = signal<ConfirmDialog | null>(null);
  private toastIdCounter = 0;

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const id = this.toastIdCounter++;
    this.toasts.update(prev => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number) {
    this.toasts.update(prev => prev.filter(t => t.id !== id));
  }

  confirm(message: string, title = 'Confirm Action', confirmLabel = 'Confirm', cancelLabel = 'Cancel'): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmDialog.set({
        title,
        message,
        confirmLabel,
        cancelLabel,
        resolve: (value: boolean) => {
          this.confirmDialog.set(null);
          resolve(value);
        }
      });
    });
  }

  // Parse API error helper
  parseApiError(err: any, fallback = 'An error occurred.'): string {
    let msg = fallback;
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
      } else if (err.error.title) {
        msg = err.error.title;
      }
    } else if (err.message) {
      msg = err.message;
    }
    return msg;
  }
}
