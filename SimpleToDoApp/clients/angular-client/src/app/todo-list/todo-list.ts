import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService } from '../services/todo.service';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
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
  LucideInfo
} from '@lucide/angular';

@Component({
  selector: 'app-todo-list',
  imports: [
    CommonModule,
    FormsModule,
    TodoModal,
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
    LucideInfo
  ],
  templateUrl: './todo-list.html'
})
export class TodoList implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);
  private readonly reminderService = inject(ReminderService);

  todos = signal<Todo[]>([]);
  filteredTodos = signal<Todo[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Search / Filters
  search = '';
  statusFilter = 'All';
  priorityFilter = 'All';
  categoryFilter = 'All';
  categories: string[] = ['All'];

  // Modal control
  modalOpen = false;
  selectedTodo: Todo | null = null;

  // Detail panel
  detailOpen = false;
  detailTodo: Todo | null = null;

  ngOnInit() {
    this.fetchTodos();
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

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    this.filteredTodos.set(filtered);
  }

  handleToggleComplete(todo: Todo) {
    const nextStatus = todo.status === 'Done' ? 'Pending' : 'Done';
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

      // Optimistic delete
      this.todos.update(prev => prev.filter(t => t.id !== id));
      this.applyFilters();

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

  getPriorityStyle(p: string): string {
    switch (p) {
      case 'High':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  }

  getStatusStyle(s: string): string {
    switch (s) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'InProgress':
        return 'bg-sky-500/10 text-sky-400';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
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

  isOverdue(todo: Todo): boolean {
    if (todo.status === 'Done' || !todo.dueDate) return false;
    return new Date(todo.dueDate) < new Date();
  }

  formatReminderLabel(minutes: number): string {
    if (!minutes) return 'None';
    if (minutes < 60) return `${minutes} min before`;
    if (minutes === 60) return '1 hour before';
    if (minutes < 1440) return `${minutes / 60} hours before`;
    return '1 day before';
  }
}
