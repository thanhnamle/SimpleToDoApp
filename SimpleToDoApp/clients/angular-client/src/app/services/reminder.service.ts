import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { TodoService } from './todo.service';
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
  private todos = signal<Todo[]>([]);
  private intervalId: any;

  // Upcoming reminders: tasks due within their reminderMinutes window, not yet done
  upcomingReminders = computed<ReminderItem[]>(() => {
    const now = Date.now();
    return this.todos()
      .filter(t => t.status !== 'Done' && t.reminderMinutes > 0 && t.dueDate)
      .map(t => {
        const dueMs = new Date(t.dueDate).getTime();
        const reminderMs = t.reminderMinutes * 60 * 1000;
        const minutesLeft = Math.round((dueMs - now) / 60000);
        return { todo: t, minutesLeft };
      })
      .filter(r => r.minutesLeft >= 0 && r.minutesLeft <= r.todo.reminderMinutes)
      .sort((a, b) => a.minutesLeft - b.minutesLeft);
  });

  reminderCount = computed(() => this.upcomingReminders().length);

  load() {
    this.todoService.getAll().subscribe({
      next: (data) => this.todos.set(data),
      error: () => {} // silently fail — reminder is non-critical
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
}
