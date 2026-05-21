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
  private intervalId: any;
  private notifiedKeys = new Set<string>();

  upcomingReminders = computed<ReminderItem[]>(() => {
    const now = Date.now();
    return this.todos()
      .filter(t => t.status !== 'Done' && t.reminderMinutes > 0 && t.dueDate)
      .map(t => {
        const dueMs = new Date(t.dueDate).getTime();
        const minutesLeft = Math.round((dueMs - now) / 60000);
        return { todo: t, minutesLeft };
      })
      .filter(r => r.minutesLeft >= 0 && r.minutesLeft <= r.todo.reminderMinutes)
      .sort((a, b) => a.minutesLeft - b.minutesLeft);
  });

  reminderCount = computed(() => this.upcomingReminders().length);

  load() {
    this.todoService.getAll().subscribe({
      next: (data) => {
        this.todos.set(data);
        this.notifyActiveReminders(data);
      },
      error: () => {}
    });
  }

  startPolling(intervalMs = 60000) {
    this.load();
    this.intervalId = setInterval(() => this.load(), intervalMs);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  formatTimeLeft(minutesLeft: number): string {
    if (minutesLeft <= 0) return 'Due now!';
    if (minutesLeft < 60) return `${minutesLeft}m left`;
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
  }

  private notifyActiveReminders(todos: Todo[]) {
    const now = Date.now();

    for (const todo of todos) {
      if (todo.status === 'Done' || !todo.dueDate || todo.reminderMinutes <= 0) continue;

      const dueMs = new Date(todo.dueDate).getTime();
      if (isNaN(dueMs)) continue;

      const reminderStartMs = dueMs - todo.reminderMinutes * 60 * 1000;
      if (now < reminderStartMs || now > dueMs) continue;

      const key = `${todo.id}:${todo.dueDate}:${todo.reminderMinutes}`;
      if (this.notifiedKeys.has(key)) continue;

      const minutesLeft = Math.max(0, Math.round((dueMs - now) / 60000));
      this.notificationService.showToast(
        `Reminder: "${todo.title}" is ${this.formatTimeLeft(minutesLeft).toLowerCase()}.`,
        minutesLeft <= 0 ? 'warning' : 'info'
      );
      this.notifiedKeys.add(key);
    }
  }
}
