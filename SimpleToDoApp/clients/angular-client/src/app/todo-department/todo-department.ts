import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TodoService } from '../services/todo.service';
import { Todo } from '../models/todo';
import { User } from '../models/auth';
import { LucideUsers, LucideActivity, LucideCheckCircle2, LucideClock, LucideAlertCircle } from '@lucide/angular';

@Component({
  selector: 'app-todo-department',
  imports: [
    CommonModule,
    LucideUsers,
    LucideActivity,
    LucideCheckCircle2,
    LucideClock,
    LucideAlertCircle
  ],
  templateUrl: './todo-department.html'
})
export class TodoDepartment implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly todoService = inject(TodoService);

  readonly members = signal<User[]>([]);
  readonly todos = signal<Todo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  currentUser = this.authService.currentUser;
  isDepartmentHead = computed(() => this.currentUser()?.role === 'DepartmentHead');
  isLeader = computed(() => this.currentUser()?.role === 'Leader');

  // Stats
  totalTasks = computed(() => this.todos().length);
  pendingTasks = computed(() => this.todos().filter(t => t.status === 'Pending').length);
  inProgressTasks = computed(() => this.todos().filter(t => t.status === 'InProgress').length);
  completedTasks = computed(() => this.todos().filter(t => t.status === 'Done').length);
  completionRate = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.error.set(null);

    // Fetch members and todos in parallel
    this.authService.getDepartmentMembers().subscribe({
      next: (users) => {
        this.members.set(users);
        
        // Fetch todos
        this.todoService.getAll().subscribe({
          next: (tasks) => {
            this.todos.set(tasks);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to load department tasks.');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set('Failed to load department members.');
        this.loading.set(false);
      }
    });
  }

  getMemberTasksCount(userId: number): number {
    return this.todos().filter(t => t.assignedUserId === userId).length;
  }

  getMemberCompletedTasksCount(userId: number): number {
    return this.todos().filter(t => t.assignedUserId === userId && t.status === 'Done').length;
  }

  getMemberTasksCompletionRate(userId: number): number {
    const total = this.getMemberTasksCount(userId);
    if (total === 0) return 0;
    return Math.round((this.getMemberCompletedTasksCount(userId) / total) * 100);
  }
}
