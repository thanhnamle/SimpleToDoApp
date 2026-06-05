import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService } from '../services/todo.service';
import { SignalRService } from '../services/signalr.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Todo, TodoStatus } from '../models/todo';
import {
  LucideBarChart,
  LucideLoader2,
  LucideAlertCircle,
  LucideCalendar,
  LucideChevronLeft,
  LucideChevronRight,
  LucideMaximize
} from '@lucide/angular';

interface GanttTask extends Todo {
  left: number; // percentage (0-100)
  width: number; // percentage (0-100)
}

@Component({
  selector: 'app-todo-gantt',
  imports: [
    CommonModule,
    FormsModule,
    LucideBarChart,
    LucideLoader2,
    LucideAlertCircle,
    LucideCalendar,
    LucideChevronLeft,
    LucideChevronRight,
    LucideMaximize
  ],
  templateUrl: './todo-gantt.html'
})
export class TodoGantt implements OnInit, OnDestroy {
  private readonly todoService = inject(TodoService);
  private readonly signalRService = inject(SignalRService);
  private readonly notificationService = inject(NotificationService);

  private signalRSub?: Subscription;

  todos = signal<Todo[]>([]);
  ganttTasks = signal<GanttTask[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Gantt Chart State
  currentDate = new Date(); // Center point of the view
  daysToView = 14; // Number of days to show in the timeline (1 week before, 1 week after)
  timelineDays: Date[] = [];
  startDate = new Date();
  endDate = new Date();

  // Drag state
  isDragging = false;
  draggedTaskId: number | null = null;
  dragStartX = 0;
  dragOriginalStart = new Date();
  dragOriginalEnd = new Date();

  // Tooltip state
  hoveredTask: GanttTask | null = null;
  tooltipPos = { x: 0, y: 0 };

  isOverdue(task: Todo): boolean {
    if (!task.dueDate || task.status === 'Done') return false;
    const due = new Date(task.dueDate);
    if (isNaN(due.getTime())) return false;
    if (task.isAllDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due < today;
    }
    return due < new Date();
  }

  formatTooltipDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  onTaskMouseEnter(event: MouseEvent, task: GanttTask) {
    if (this.isDragging) return;
    this.hoveredTask = task;
    this.tooltipPos = {
      x: event.clientX + 15,
      y: event.clientY + 15
    };
  }

  onTaskMouseLeave() {
    if (!this.isDragging) {
      this.hoveredTask = null;
    }
  }

  ngOnInit() {
    this.currentDate.setHours(0, 0, 0, 0);
    this.generateTimeline();
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
        this.processGanttTasks();
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

  generateTimeline() {
    const start = new Date(this.currentDate);
    start.setDate(start.getDate() - Math.floor(this.daysToView / 2));
    this.startDate = start;
    
    const end = new Date(start);
    end.setDate(end.getDate() + this.daysToView - 1);
    this.endDate = end;

    const days = [];
    for (let i = 0; i < this.daysToView; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    this.timelineDays = days;
    
    if (this.todos().length > 0) {
      this.processGanttTasks();
    }
  }

  processGanttTasks() {
    const totalTimeRange = this.endDate.getTime() - this.startDate.getTime() + (24 * 60 * 60 * 1000); // include full end day
    
    const tasks = this.todos().map(todo => {
      let taskStart = new Date(todo.startDate);
      if (isNaN(taskStart.getTime())) taskStart = new Date();
      
      let taskEnd = todo.dueDate ? new Date(todo.dueDate) : new Date(taskStart.getTime() + 24 * 60 * 60 * 1000);
      if (isNaN(taskEnd.getTime())) taskEnd = new Date(taskStart.getTime() + 24 * 60 * 60 * 1000);
      
      // Calculate offset percentage from start of timeline
      const startOffset = taskStart.getTime() - this.startDate.getTime();
      let left = (startOffset / totalTimeRange) * 100;
      
      // Calculate width percentage
      const duration = taskEnd.getTime() - taskStart.getTime();
      let width = (duration / totalTimeRange) * 100;

      // Handle clipping if task goes out of bounds, but for visual accuracy we might just let CSS overflow hidden handle it
      // However, calculating bounded values is better
      const boundedLeft = Math.max(0, left);
      const rightClip = Math.min(100, left + width);
      const boundedWidth = Math.max(0.5, rightClip - boundedLeft); // min 0.5% width
      
      return {
        ...todo,
        left: boundedLeft,
        width: boundedWidth
      };
    });
    
    this.ganttTasks.set(tasks);
  }

  shiftTimeline(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.generateTimeline();
  }

  onDaysChange(event: any) {
    const val = event.target.value;
    if (val !== 'custom') {
      this.daysToView = parseInt(val, 10);
      this.generateTimeline();
    }
  }

  onCustomDaysChange(event: any) {
    const val = parseInt(event.target.value, 10);
    if (!isNaN(val) && val > 0) {
      this.daysToView = val;
      this.generateTimeline();
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  getPriorityColor(p: string): string {
    switch (p) {
      case 'High': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      default: return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
    }
  }

  // Drag and Drop Interactivity
  onTaskMouseDown(event: MouseEvent, task: GanttTask) {
    if (task.status === 'Done') return; // Cannot drag completed tasks
    event.preventDefault();
    this.isDragging = true;
    this.draggedTaskId = task.id;
    this.dragStartX = event.clientX;
    this.dragOriginalStart = new Date(task.startDate);
    this.dragOriginalEnd = task.dueDate ? new Date(task.dueDate) : new Date(this.dragOriginalStart.getTime() + 24 * 60 * 60 * 1000);
  }

  toLocalISOString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 19);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.hoveredTask && !this.isDragging) {
      this.tooltipPos = {
        x: event.clientX + 15,
        y: event.clientY + 15
      };
    }

    if (!this.isDragging || !this.draggedTaskId) return;
    
    const deltaX = event.clientX - this.dragStartX;
    // Calculate how many milliseconds per pixel based on current view
    const containerWidth = this.daysToView * 60; // 60px per day matches the CSS min-width
    const msPerPixel = (this.daysToView * 24 * 60 * 60 * 1000) / containerWidth;
    
    const deltaMs = deltaX * msPerPixel;
    
    // Update temporary dates
    const newStart = new Date(this.dragOriginalStart.getTime() + deltaMs);
    const newEnd = new Date(this.dragOriginalEnd.getTime() + deltaMs);
    
    // Update UI optimisticly
    this.todos.update(current => {
      const idx = current.findIndex(t => t.id === this.draggedTaskId);
      if (idx > -1) {
        const t = current[idx];
        t.startDate = t.isAllDay ? this.toLocalISOString(newStart).substring(0, 10) : this.toLocalISOString(newStart);
        t.dueDate = t.isAllDay ? this.toLocalISOString(newEnd).substring(0, 10) : this.toLocalISOString(newEnd);
      }
      return [...current];
    });
    
    // Recalculate position
    this.processGanttTasks();
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.isDragging && this.draggedTaskId) {
      this.isDragging = false;
      
      const currentTask = this.todos().find(t => t.id === this.draggedTaskId);
      if (!currentTask) {
        this.draggedTaskId = null;
        return;
      }
      
      // Save changes to backend
      const updateReq = {
        title: currentTask.title,
        description: currentTask.description,
        isCompleted: currentTask.isCompleted,
        category: currentTask.category,
        priority: currentTask.priority,
        status: currentTask.status,
        isAllDay: currentTask.isAllDay,
        startDate: currentTask.startDate,
        dueDate: currentTask.dueDate,
        reminderMinutes: currentTask.reminderMinutes
      };
      
      this.todoService.update(this.draggedTaskId, updateReq).subscribe({
        next: () => {
          this.notificationService.showToast('Task schedule updated', 'success');
        },
        error: (err) => {
          this.notificationService.showToast('Failed to update task schedule', 'error');
          this.fetchTodos(); // Revert
        }
      });
      
      this.draggedTaskId = null;
    }
  }
}
