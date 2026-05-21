import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../services/todo.service';
import { NotificationService } from '../services/notification.service';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlus,
  LucideLoader2,
  LucideAlertCircle,
  LucideAlertTriangle,
  LucideClock,
  LucideBell,
  LucideTag
} from '@lucide/angular';

@Component({
  selector: 'app-todo-calendar',
  imports: [
    CommonModule,
    TodoModal,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlus,
    LucideLoader2,
    LucideAlertCircle,
    LucideAlertTriangle,
    LucideClock,
    LucideBell,
    LucideTag
  ],
  templateUrl: './todo-calendar.html'
})
export class TodoCalendar implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);

  todos = signal<Todo[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Calendar State
  currentDate = new Date();
  year = this.currentDate.getFullYear();
  month = this.currentDate.getMonth();
  days: (number | null)[] = [];

  // Modal State
  modalOpen = false;
  selectedTodo: Todo | null = null;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit() {
    this.fetchCalendarTodos();
    this.generateCalendarGrid();
  }

  fetchCalendarTodos() {
    this.loading.set(true);
    this.todoService.getCalendar().subscribe({
      next: (data) => {
        this.todos.set(data);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Failed to fetch calendar tasks.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  generateCalendarGrid() {
    const firstDayIndex = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

    const gridDays: (number | null)[] = [];
    
    // Empty padding slots
    for (let i = 0; i < firstDayIndex; i++) {
      gridDays.push(null);
    }
    // Days slots
    for (let i = 1; i <= daysInMonth; i++) {
      gridDays.push(i);
    }

    this.days = gridDays;
  }

  handlePrevMonth() {
    this.month--;
    if (this.month < 0) {
      this.month = 11;
      this.year--;
    }
    this.generateCalendarGrid();
  }

  handleNextMonth() {
    this.month++;
    if (this.month > 11) {
      this.month = 0;
      this.year++;
    }
    this.generateCalendarGrid();
  }

  isToday(dayNum: number): boolean {
    const today = new Date();
    return today.getDate() === dayNum && 
           today.getMonth() === this.month && 
           today.getFullYear() === this.year;
  }

  getTodosForDay(dayNum: number): Todo[] {
    return this.todos().filter(todo => {
      const start = new Date(todo.startDate);
      return start.getDate() === dayNum && 
             start.getMonth() === this.month && 
             start.getFullYear() === this.year;
    });
  }

  handleDayClick(dayNum: number) {
    const clickedDate = new Date(this.year, this.month, dayNum, 9, 0, 0);
    this.selectedTodo = {
      id: 0,
      title: '',
      description: '',
      isCompleted: false,
      category: '',
      priority: 'Medium',
      status: 'Pending',
      isAllDay: false,
      createdAt: '',
      startDate: clickedDate.toISOString(),
      dueDate: new Date(this.year, this.month, dayNum, 10, 0, 0).toISOString(),
      reminderMinutes: 0
    };
    this.modalOpen = true;
  }

  handleTodoClick(e: MouseEvent, todo: Todo) {
    e.stopPropagation(); // Avoid day click
    this.selectedTodo = todo;
    this.modalOpen = true;
  }

  handleCreateOrUpdate(payload: CreateTodoRequest | UpdateTodoRequest) {
    if (this.selectedTodo && this.selectedTodo.id !== 0) {
      this.todoService.update(this.selectedTodo.id, payload as UpdateTodoRequest).subscribe({
        next: () => {
          this.notificationService.showToast('Task updated successfully.', 'success');
          this.fetchCalendarTodos();
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
          this.fetchCalendarTodos();
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

  closeModal() {
    this.modalOpen = false;
    this.selectedTodo = null;
  }

  getPriorityColor(p: string): string {
    switch (p) {
      case 'High': return 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30';
      default: return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30';
    }
  }

  // Tooltip & Overdue States
  hoveredTodo: Todo | null = null;
  tooltipPos = { x: 0, y: 0 };

  onTodoMouseEnter(e: MouseEvent, todo: Todo) {
    this.hoveredTodo = todo;
    this.tooltipPos = {
      x: e.clientX + 15,
      y: e.clientY + 15
    };
  }

  onTodoMouseLeave() {
    this.hoveredTodo = null;
  }

  isOverdue(todo: Todo): boolean {
    if (!todo.dueDate || todo.status === 'Done') return false;
    const due = new Date(todo.dueDate);
    return !isNaN(due.getTime()) && due < new Date();
  }

  formatTooltipDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatReminderLabel(minutes: number): string {
    if (!minutes) return 'No reminder';
    if (minutes === 1440) return '1 day before';
    if (minutes >= 60) return `${minutes / 60} hour${minutes / 60 > 1 ? 's' : ''} before`;
    return `${minutes} minutes before`;
  }
}
