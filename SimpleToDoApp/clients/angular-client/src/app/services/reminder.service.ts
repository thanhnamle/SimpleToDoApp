import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { TodoService } from './todo.service';
import { NotificationService } from './notification.service';
import { Todo } from '../models/todo';

export interface ReminderItem {
  todo: Todo;
  minutesLeft: number;
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

  upcomingReminders = computed<ReminderItem[]>(() => {
    const now = this.now();
    return this.todos()
      .filter(t => t.status !== 'Done' && t.reminderMinutes > 0 && t.startDate)
      .map(t => {
        const startMs = new Date(t.startDate).getTime();
        const minutesLeft = Math.round((startMs - now) / 60000);
        return { todo: t, minutesLeft };
      })
      .filter(r => r.minutesLeft >= 0 && r.minutesLeft <= r.todo.reminderMinutes)
      .sort((a, b) => a.minutesLeft - b.minutesLeft);
  });

  reminderCount = computed(() => this.upcomingReminders().length);

  load() {
    this.todoService.getAll().subscribe({
      next: (data) => {
        this.now.set(Date.now());
        this.todos.set(data);
        this.notifyActiveReminders(data);
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
}
