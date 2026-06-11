import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TodoService } from '../services/todo.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { SignalRService } from '../services/signalr.service';
import { TodoUiService } from '../services/todo-ui.service';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
import { RippleDirective } from '../core/ripple.directive';
import { MagneticDirective } from '../core/magnetic.directive';
import { AudioService } from '../services/audio.service';
import {
  LucidePlus,
  LucideSearch,
  LucideListTodo,
  LucideTrash2,
  LucideEdit3,
  LucideCheckCircle2,
  LucideCircle,
  LucideClock,
  LucideTag,
  LucideLoader2,
  LucideAlertCircle,
  LucideEye,
  LucideX,
  LucideCalendar,
  LucideBell,
  LucideAlertTriangle,
  LucideInfo,
  LucideUser
} from '@lucide/angular';

@Component({
  selector: 'app-todo-list',
  imports: [
    CommonModule,
    FormsModule,
    TodoModal,
    RippleDirective,
    MagneticDirective,
    LucidePlus,
    LucideSearch,
    LucideListTodo,
    LucideTrash2,
    LucideEdit3,
    LucideCheckCircle2,
    LucideCircle,
    LucideClock,
    LucideTag,
    LucideLoader2,
    LucideAlertCircle,
    LucideEye,
    LucideX,
    LucideCalendar,
    LucideBell,
    LucideAlertTriangle,
    LucideInfo,
    LucideUser
  ],
  templateUrl: './todo-list.html'
})
export class TodoList implements OnInit, OnDestroy {
  private readonly todoService = inject(TodoService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly reminderService = inject(ReminderService);
  private readonly signalRService = inject(SignalRService);
  public readonly uiService = inject(TodoUiService);
  private readonly audioService = inject(AudioService);

  private signalRSub?: Subscription;

  isEmployee = computed(() => this.authService.currentUser()?.role === 'Employee');
  isDepartmentHead = computed(() => this.authService.currentUser()?.role === 'DepartmentHead');

  todos = signal<Todo[]>([]);
  filteredTodos = signal<Todo[]>([]);
  departments = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Search / Filters
  search = '';
  statusFilter = 'All';
  priorityFilter = 'All';
  categoryFilter = 'All';
  sortFilter = 'Default';
  departmentFilter = 'All';
  categories: string[] = ['All'];

  // Modal control
  modalOpen = false;
  selectedTodo: Todo | null = null;

  // Detail panel
  detailOpen = false;
  detailTodo: Todo | null = null;

  ngOnInit() {
    this.fetchTodos();
    if (this.isDepartmentHead()) {
      this.authService.getDepartments().subscribe(d => this.departments.set(d));
    }
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
        this.applyFilters();
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

  applyFilters() {
    const list = this.todos();
    
    // Extrapolate categories list
    const uniqCats = Array.from(new Set(list.map(t => t.category).filter(Boolean)));
    this.categories = ['All', ...uniqCats];

    const filtered = list.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(this.search.toLowerCase()) || 
                            (todo.description && todo.description.toLowerCase().includes(this.search.toLowerCase())) ||
                            (todo.category && todo.category.toLowerCase().includes(this.search.toLowerCase()));
      const matchesStatus = this.statusFilter === 'All' || todo.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'All' || todo.priority === this.priorityFilter;
      const matchesCategory = this.categoryFilter === 'All' || todo.category === this.categoryFilter;
      const matchesDepartment = this.departmentFilter === 'All' || todo.departmentId?.toString() === this.departmentFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDepartment;
    });

    if (this.sortFilter === 'DueDateAsc') {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (this.sortFilter === 'DueDateDesc') {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      });
    }

    this.filteredTodos.set(filtered);
  }

  handleToggleComplete(todo: Todo) {
    const nextStatus = todo.status === 'Done' ? 'Pending' : 'Done';
    
    if (nextStatus === 'Done') {
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

    // Optimistic update
    this.todos.update(prev => 
      prev.map(t => t.id === todo.id ? { ...t, status: nextStatus, isCompleted: nextStatus === 'Done' } : t)
    );
    this.applyFilters();

    this.todoService.updateStatus(todo.id, nextStatus).subscribe({
        next: () => {
          this.notificationService.showToast('Status updated successfully.', 'success');
          this.reminderService.load();
          this.fetchTodos(); // Fetch fresh to keep client aligned with DB value conversion
        },
      error: (err) => {
        console.error('Failed to update task status', err);
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

      const el = document.getElementById('task-' + id);
      if (el) {
        el.classList.add('animate-destroy');
      }

      setTimeout(() => {
        // Optimistic delete
        this.todos.update(prev => prev.filter(t => t.id !== id));
        this.applyFilters();
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

  startTask(todo: Todo) {
    const payload: UpdateTodoRequest = {
      title: todo.title,
      description: todo.description,
      isCompleted: todo.isCompleted,
      category: todo.category,
      priority: todo.priority,
      status: 'InProgress',
      isAllDay: todo.isAllDay,
      startDate: todo.startDate,
      dueDate: todo.dueDate,
      reminderMinutes: todo.reminderMinutes,
      assignedUserId: todo.assignedUserId
    };

    this.todoService.update(todo.id, payload).subscribe({
      next: () => {
        this.notificationService.showToast('Task started successfully.', 'success');
        this.reminderService.load();
        this.fetchTodos();
      },
      error: (err) => {
        const errorMsg = this.notificationService.parseApiError(err, 'Failed to start task.');
        this.notificationService.showToast(errorMsg, 'error');
      }
    });
  }

  openCreateModal() {
    this.selectedTodo = null;
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

  openDetailPanel(todo: Todo) {
    this.detailTodo = todo;
    this.detailOpen = true;
  }

  closeDetailPanel() {
    this.detailOpen = false;
    this.detailTodo = null;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatDetailDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatReminderLabel(minutes: number): string {
    if (!minutes) return 'None';
    if (minutes < 60) return `${minutes} min before`;
    if (minutes === 60) return '1 hour before';
    if (minutes < 1440) return `${minutes / 60} hours before`;
    return '1 day before';
  }
}
