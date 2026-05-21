import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../services/todo.service';
import { NotificationService } from '../services/notification.service';
import { Todo, TodoStatus } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
import {
  LucidePlus,
  LucideTrash2,
  LucideEdit3,
  LucideArrowRight,
  LucideArrowLeft,
  LucideClock,
  LucideTag,
  LucideLoader2,
  LucideAlertCircle
} from '@lucide/angular';

@Component({
  selector: 'app-todo-board',
  imports: [
    CommonModule,
    TodoModal,
    LucidePlus,
    LucideTrash2,
    LucideEdit3,
    LucideArrowRight,
    LucideArrowLeft,
    LucideClock,
    LucideTag,
    LucideLoader2,
    LucideAlertCircle
  ],
  templateUrl: './todo-board.html'
})
export class TodoBoard implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);

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

  // Drag and Drop state
  draggedTodo: Todo | null = null;
  activeDragColumn: string | null = null;

  ngOnInit() {
    this.fetchTodos();
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

  // Native HTML5 Drag and Drop Handlers
  onDragStart(todo: Todo) {
    this.draggedTodo = todo;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow drop
  }

  onDragEnter(event: DragEvent, columnId: string) {
    event.preventDefault();
    this.activeDragColumn = columnId;
  }

  onDragLeave(event: DragEvent, columnId: string) {
    if (this.activeDragColumn === columnId) {
      this.activeDragColumn = null;
    }
  }

  onDrop(event: DragEvent, nextStatus: string) {
    event.preventDefault();
    this.activeDragColumn = null;
    if (this.draggedTodo && this.draggedTodo.status !== nextStatus) {
      const todoToMove = this.draggedTodo;
      this.draggedTodo = null;
      this.updateStatus(todoToMove, nextStatus as TodoStatus);
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
    // Optimistic status update
    this.todos.update(prev => 
      prev.map(t => t.id === todo.id ? { ...t, status: nextStatus, isCompleted: nextStatus === 'Done' } : t)
    );

    this.todoService.updateStatus(todo.id, nextStatus).subscribe({
      next: () => {
        this.notificationService.showToast('Task moved successfully.', 'success');
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

      // Optimistic delete
      this.todos.update(prev => prev.filter(t => t.id !== id));

      this.todoService.delete(id).subscribe({
        next: () => {
          this.notificationService.showToast('Task deleted successfully.', 'success');
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

  handleCreateOrUpdate(payload: any) {
    if (this.selectedTodo && this.selectedTodo.id !== 0) {
      this.todoService.update(this.selectedTodo.id, payload).subscribe({
        next: () => {
          this.notificationService.showToast('Task updated successfully.', 'success');
          this.fetchTodos();
        },
        error: (err) => {
          const errorMsg = this.notificationService.parseApiError(err, 'Failed to update task.');
          this.notificationService.showToast(errorMsg, 'error');
        }
      });
    } else {
      this.todoService.create(payload).subscribe({
        next: () => {
          this.notificationService.showToast('Task created successfully.', 'success');
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

  getPriorityStyle(p: string): string {
    switch (p) {
      case 'High':
        return 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30 border border-solid';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30 border border-solid';
      default:
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 border border-solid';
    }
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
