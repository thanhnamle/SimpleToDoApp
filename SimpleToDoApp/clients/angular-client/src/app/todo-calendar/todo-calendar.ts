import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../services/todo.service';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { SignalRService } from '../services/signalr.service';
import { TodoUiService } from '../services/todo-ui.service';
import { Subscription, interval } from 'rxjs';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { TodoModal } from '../todo-modal/todo-modal';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlus,
  LucideClock,
  LucideBell,
  LucideTag,
  LucideList,
  LucideCalendarDays
} from '@lucide/angular';

@Component({
  selector: 'app-todo-calendar',
  imports: [
    CommonModule,
    TodoModal,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlus,
    LucideClock,
    LucideBell,
    LucideTag,
    LucideList,
    LucideCalendarDays
  ],
  templateUrl: './todo-calendar.html'
})
export class TodoCalendar implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly notificationService = inject(NotificationService);
  private readonly reminderService = inject(ReminderService);
  private readonly signalRService = inject(SignalRService);
  public readonly uiService = inject(TodoUiService);

  private signalRSub?: Subscription;
  private clockSub?: Subscription;

  todos = signal<Todo[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Digital Clock
  currentTime = signal<Date>(new Date());

  // View Mode
  viewMode = signal<'month' | 'timeline'>('month');

  // Calendar State
  currentDate = new Date();
  year = this.currentDate.getFullYear();
  month = this.currentDate.getMonth();
  days: (number | null)[] = [];

  // Modal State
  modalOpen = false;
  selectedTodo: Todo | null = null;
  
  dayModalOpen = false;
  selectedDayForModal: number | null = null;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit() {
    this.fetchCalendarTodos();
    this.generateCalendarGrid();
    this.signalRSub = this.signalRService.todoUpdated$.subscribe(() => {
      this.fetchCalendarTodos();
    });
    this.clockSub = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  ngOnDestroy() {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
    if (this.clockSub) {
      this.clockSub.unsubscribe();
    }
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

  // Timeline specific helpers
  hours = Array.from({ length: 24 }, (_, i) => i);

  getTodosForTimelineDate(): Todo[] {
    // Uses the currently selected year, month, and today's day (or 1st if month is different)
    // Wait, the timeline view should show the timeline for a specific day. 
    // Let's assume it shows the timeline for the 'currentDate'
    return this.todos().filter(todo => {
      if (todo.isAllDay) return false;
      const start = new Date(todo.startDate);
      return start.getDate() === this.currentDate.getDate() && 
             start.getMonth() === this.currentDate.getMonth() && 
             start.getFullYear() === this.currentDate.getFullYear();
    });
  }

  getAllDayTodosForTimelineDate(): Todo[] {
    return this.todos().filter(todo => {
      if (!todo.isAllDay) return false;
      const start = new Date(todo.startDate);
      return start.getDate() === this.currentDate.getDate() && 
             start.getMonth() === this.currentDate.getMonth() && 
             start.getFullYear() === this.currentDate.getFullYear();
    });
  }

  getTopPosition(dateStr: string): string {
    const d = new Date(dateStr);
    const minutes = d.getHours() * 60 + d.getMinutes();
    const totalMinutes = 24 * 60;
    return `${(minutes / totalMinutes) * 100}%`;
  }

  getHeight(startStr: string, endStr: string): string {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000); // default 1h
    const diffMins = (end.getTime() - start.getTime()) / (1000 * 60);
    const totalMinutes = 24 * 60;
    return `${Math.max((diffMins / totalMinutes) * 100, 2)}%`; // min 2% height
  }

  formatTimelineHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  }

  toggleViewMode() {
    this.viewMode.update(v => v === 'month' ? 'timeline' : 'month');
  }

  switchToTimeline(dayNum: number) {
    this.currentDate = new Date(this.year, this.month, dayNum);
    this.viewMode.set('timeline');
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

  openDayModal(event: Event, day: number) {
    event.stopPropagation();
    this.selectedDayForModal = day;
    this.dayModalOpen = true;
  }

  closeDayModal() {
    this.dayModalOpen = false;
    this.selectedDayForModal = null;
  }

  handleTimelineTimeClick(hour: number) {
    const clickedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate(), hour, 0, 0);
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
      dueDate: new Date(clickedDate.getTime() + 3600000).toISOString(),
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
          this.reminderService.load();
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
          this.reminderService.load();
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

  // Tooltip & Overdue States
  hoveredTodo: Todo | null = null;
  tooltipPos = { x: 0, y: 0 };

  onTodoMouseEnter(e: MouseEvent, todo: Todo) {
    this.hoveredTodo = todo;
    const tooltipWidth = 288; // w-72 is 18rem = 288px
    const tooltipHeight = 180; // approximate maximum height
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    
    // Check if overflowing the right edge
    if (x + tooltipWidth > window.innerWidth) {
      x = e.clientX - tooltipWidth - 15;
    }
    
    // Check if overflowing the bottom edge
    if (y + tooltipHeight > window.innerHeight) {
      y = e.clientY - tooltipHeight - 15;
    }
    
    this.tooltipPos = {
      x: Math.max(10, x),
      y: Math.max(10, y)
    };
  }

  onTodoMouseLeave() {
    this.hoveredTodo = null;
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
