import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { TodoService } from './todo.service';
import { NotificationService } from './notification.service';
import { Todo } from '../models/todo';

export interface NotificationItem {
  todo: Todo;
  minutesLeft?: number;
  type: 'reminder' | 'overdue';
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService implements OnDestroy {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);
  private todos = signal<Todo[]>([]);
  private now = signal(Date.now());
  private refreshIntervalId: any;
  private clockIntervalId: any;
  private notifiedKeys = new Set<string>();
  private isFirstLoad = true;

  activeNotifications = computed<NotificationItem[]>(() => {
    const now = this.now();
    const items: NotificationItem[] = [];

    this.todos().forEach(t => {
      if (t.status === 'Done') return;

      // Upcoming Reminders
      if (t.reminderMinutes > 0 && t.startDate) {
        const startMs = new Date(t.startDate).getTime();
        const minutesLeft = Math.round((startMs - now) / 60000);
        if (minutesLeft >= 0 && minutesLeft <= t.reminderMinutes) {
          items.push({ todo: t, minutesLeft, type: 'reminder' });
        }
      }

      // Overdue Tasks
      if (t.dueDate) {
        const dueMs = new Date(t.dueDate).getTime();
        if (now > dueMs) {
          items.push({ todo: t, type: 'overdue' });
        }
      }
    });

    return items.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      if (a.type === 'reminder' && b.type === 'reminder') {
        return (a.minutesLeft || 0) - (b.minutesLeft || 0);
      }
      return 0;
    });
  });

  notificationCount = computed(() => this.activeNotifications().length);

  load() {
    this.todoService.getAll().subscribe({
      next: (data) => {
        this.now.set(Date.now());
        this.todos.set(data);
        this.notifyActiveReminders(data);
        this.notifyOverdueTasks(data, this.isFirstLoad);
        this.isFirstLoad = false;
      },
      error: () => {}
    });
  }

  startPolling(intervalMs = 60000) {
    this.stopPolling();
    this.load();
    this.refreshIntervalId = setInterval(() => this.load(), intervalMs);
    this.clockIntervalId = setInterval(() => {
      this.now.set(Date.now());
      this.notifyActiveReminders(this.todos());
      this.notifyOverdueTasks(this.todos(), false);
    }, 15000);
  }

  stopPolling() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  formatTimeLeft(minutesLeft: number): string {
    if (minutesLeft <= 0) return 'Starting now!';
    if (minutesLeft < 60) return `${minutesLeft}m left`;
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
  }

  formatReminderSetting(minutes: number): string {
    if (!minutes || minutes <= 0) return 'No reminder';
    if (minutes < 60) return `${minutes} minutes before`;
    if (minutes === 60) return '1 hour before';
    if (minutes < 1440) return `${minutes / 60} hours before`;
    return '1 day before';
  }

  private notifyActiveReminders(todos: Todo[]) {
    const now = Date.now();

    for (const todo of todos) {
      if (todo.status === 'Done' || !todo.startDate || todo.reminderMinutes <= 0) continue;

      const startMs = new Date(todo.startDate).getTime();
      if (isNaN(startMs)) continue;

      const reminderStartMs = startMs - todo.reminderMinutes * 60 * 1000;
      if (now < reminderStartMs || now > startMs) continue;

      const key = `${todo.id}:${todo.startDate}:${todo.reminderMinutes}`;
      if (this.notifiedKeys.has(key)) continue;

      const minutesLeft = Math.max(0, Math.round((startMs - now) / 60000));
      const reminderText = this.formatReminderSetting(todo.reminderMinutes);
      
      this.notificationService.showToast(
        `Reminder: "${todo.title}" (${reminderText}).`,
        minutesLeft <= 0 ? 'warning' : 'info'
      );
      this.notifiedKeys.add(key);
    }
  }

  private notifyOverdueTasks(todos: Todo[], silent: boolean) {
    const now = Date.now();
    for (const todo of todos) {
      if (todo.status === 'Done' || !todo.dueDate) continue;
      const dueMs = new Date(todo.dueDate).getTime();
      if (isNaN(dueMs)) continue;

      if (now > dueMs) {
        const key = `overdue:${todo.id}:${todo.dueDate}`;
        if (this.notifiedKeys.has(key)) continue;
        
        this.notifiedKeys.add(key);
        if (!silent) {
          this.notificationService.showToast(
            `Task Overdue: "${todo.title}" is overdue!`,
            'error'
          );
        }
      }
    }
  }
}
