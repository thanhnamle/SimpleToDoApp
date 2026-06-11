import { Component, OnInit, OnDestroy, inject, signal, HostListener, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../services/todo.service';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { SignalRService } from '../services/signalr.service';
import { TodoUiService } from '../services/todo-ui.service';
import { Subscription } from 'rxjs';
import { CreateTodoRequest, Todo, TodoStatus, UpdateTodoRequest } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
import { RippleDirective } from '../core/ripple.directive';
import { MagneticDirective } from '../core/magnetic.directive';
import { AudioService } from '../services/audio.service';
import {
  LucidePlus,
  LucideTrash2,
  LucideEdit3,
  LucideArrowRight,
  LucideArrowLeft,
  LucideClock,
  LucideTag,
  LucideLoader2,
  LucideAlertCircle,
  LucideAlertTriangle,
  LucideUser
} from '@lucide/angular';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-todo-board',
  imports: [
    CommonModule,
    TodoModal,
    RippleDirective,
    MagneticDirective,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    LucidePlus,
    LucideTrash2,
    LucideEdit3,
    LucideArrowRight,
    LucideArrowLeft,
    LucideClock,
    LucideTag,
    LucideLoader2,
    LucideAlertCircle,
    LucideAlertTriangle,
    LucideUser
  ],
  templateUrl: './todo-board.html'
})
export class TodoBoard implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);
  private readonly reminderService = inject(ReminderService);
  private readonly signalRService = inject(SignalRService);
  public readonly uiService = inject(TodoUiService);
  private readonly audioService = inject(AudioService);

  private signalRSub?: Subscription;

  todos = signal<Todo[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  columns = [
    { id: 'Pending', name: 'Pending' },
    { id: 'InProgress', name: 'In Progress' },
    { id: 'Done', name: 'Done' }
  ];

  // Modal control
  modalOpen = false;
  selectedTodo: Todo | null = null;

  ngOnInit() {
    this.fetchTodos();
    this.signalRSub = this.signalRService.todoUpdated$.subscribe(() => {
      this.fetchTodos();
    });
  }

  ngOnDestroy() {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
  }

  fetchTodos() {
    this.loading.set(true);
    this.todoService.getAll().subscribe({
      next: (data) => {
        this.todos.set(data);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Failed to fetch tasks.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  getTodosByStatus(status: string): Todo[] {
    return this.todos().filter(t => t.status === status);
  }
  // CDK Drag and Drop Handler
  onDrop(event: CdkDragDrop<string>) {
    // If dropped in the same column, do nothing (we don't support custom ordering yet)
    if (event.previousContainer !== event.container) {
      const todo = event.item.data as Todo;
      const newStatus = event.container.data as TodoStatus;
      if (todo.status !== newStatus) {
        this.updateStatus(todo, newStatus);
      }
    }
  }

  moveLeft(todo: Todo) {
    const statuses: TodoStatus[] = ['Pending', 'InProgress', 'Done'];
    const idx = statuses.indexOf(todo.status);
    if (idx > 0) {
      const nextStatus = statuses[idx - 1];
      this.updateStatus(todo, nextStatus);
    }
  }

  moveRight(todo: Todo) {
    const statuses: TodoStatus[] = ['Pending', 'InProgress', 'Done'];
    const idx = statuses.indexOf(todo.status);
    if (idx >= 0 && idx < statuses.length - 1) {
      const nextStatus = statuses[idx + 1];
      this.updateStatus(todo, nextStatus);
    }
  }

  private updateStatus(todo: Todo, nextStatus: TodoStatus) {
    if (nextStatus === 'Done' && todo.status !== 'Done') {
      this.audioService.playSuccess();
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
          zIndex: 9999
        });
      });
    }

    // Optimistic status update
    this.todos.update(prev => 
      prev.map(t => t.id === todo.id ? { ...t, status: nextStatus, isCompleted: nextStatus === 'Done' } : t)
    );

    this.todoService.updateStatus(todo.id, nextStatus).subscribe({
      next: () => {
        this.notificationService.showToast('Task moved successfully.', 'success');
        this.reminderService.load();
        this.fetchTodos();
      },
      error: (err) => {
        console.error('Failed to shift task status', err);
        const errorMsg = this.notificationService.parseApiError(err, 'Failed to update status.');
        this.notificationService.showToast(errorMsg, 'error');
        this.fetchTodos(); // Rollback
      }
    });
  }

  handleDelete(id: number) {
    this.notificationService.confirm(
      'Are you sure you want to permanently delete this task?',
      'Delete Task',
      'Delete',
      'Cancel'
    ).then((confirmed) => {
      if (!confirmed) return;

      this.audioService.playDelete();

      const el = document.getElementById('board-task-' + id);
      if (el) {
        el.classList.add('animate-destroy');
      }

      setTimeout(() => {
        // Optimistic delete
        this.todos.update(prev => prev.filter(t => t.id !== id));
      }, 400);

      this.todoService.delete(id).subscribe({
        next: () => {
          this.notificationService.showToast('Task deleted successfully.', 'success');
          this.reminderService.load();
        },
        error: (err) => {
          console.error('Failed to delete task', err);
          const errorMsg = this.notificationService.parseApiError(err, 'Failed to delete task.');
          this.notificationService.showToast(errorMsg, 'error');
          this.fetchTodos(); // Rollback
        }
      });
    });
  }

  handleCreateOrUpdate(payload: CreateTodoRequest | UpdateTodoRequest) {
    if (this.selectedTodo && this.selectedTodo.id !== 0) {
      this.todoService.update(this.selectedTodo.id, payload as UpdateTodoRequest).subscribe({
        next: () => {
          this.notificationService.showToast('Task updated successfully.', 'success');
          this.reminderService.load();
          this.fetchTodos();
        },
        error: (err) => {
          const errorMsg = this.notificationService.parseApiError(err, 'Failed to update task.');
          this.notificationService.showToast(errorMsg, 'error');
        }
      });
    } else {
      this.todoService.create(payload as CreateTodoRequest).subscribe({
        next: () => {
          this.notificationService.showToast('Task created successfully.', 'success');
          this.reminderService.load();
          this.fetchTodos();
        },
        error: (err) => {
          const errorMsg = this.notificationService.parseApiError(err, 'Failed to create task.');
          this.notificationService.showToast(errorMsg, 'error');
        }
      });
    }
  }

  openCreateModal() {
    this.selectedTodo = null;
    this.modalOpen = true;
  }

  openCreateModalWithStatus(status: string) {
    this.selectedTodo = {
      id: 0,
      title: '',
      description: '',
      isCompleted: status === 'Done',
      category: '',
      priority: 'Medium',
      status: status as TodoStatus,
      isAllDay: false,
      createdAt: '',
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 3600000).toISOString(),
      reminderMinutes: 0
    };
    this.modalOpen = true;
  }

  openEditModal(todo: Todo) {
    this.selectedTodo = todo;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.selectedTodo = null;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
