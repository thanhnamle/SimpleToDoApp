import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { LucideX, LucideAlertTriangle, LucideBell } from '@lucide/angular';

@Component({
  selector: 'app-todo-modal',
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideAlertTriangle,
    LucideBell
  ],
  templateUrl: './todo-modal.html'
})
export class TodoModal implements OnChanges {
  @Input() isOpen = false;
  @Input() todo: Todo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTodoRequest | UpdateTodoRequest>();

  isEditMode = false;
  error: string | null = null;

  formData = {
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    status: 'Pending',
    isAllDay: false,
    startDate: '',
    dueDate: '',
    reminderMinutes: 0
  };

  private formatDateOnlyForInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    return `${yyyy}-${MM}-${dd}`;
  }

  /** Today's date string (YYYY-MM-DD) used for date-type inputs when All Day is on */
  get todayStr(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  get isDueDateOverdue(): boolean {
    if (!this.formData.dueDate || this.formData.status === 'Done') return false;
    const due = new Date(this.formData.dueDate);
    return !isNaN(due.getTime()) && due < new Date();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['todo'] || changes['isOpen']) {
      if (this.isOpen) {
        if (this.todo && this.todo.id !== 0) {
          this.isEditMode = true;
          this.formData = {
            title: this.todo.title,
            description: this.todo.description,
            category: this.todo.category || '',
            priority: this.todo.priority,
            status: this.todo.status,
            isAllDay: this.todo.isAllDay,
            startDate: this.todo.isAllDay
              ? this.formatDateOnlyForInput(this.todo.startDate)
              : this.formatDateForInput(this.todo.startDate),
            dueDate: this.todo.isAllDay
              ? this.formatDateOnlyForInput(this.todo.dueDate)
              : this.formatDateForInput(this.todo.dueDate),
            reminderMinutes: this.todo.reminderMinutes
          };
        } else {
          this.isEditMode = false;
          const isAllDay = this.todo?.isAllDay || false;
          this.formData = {
            title: this.todo?.title || '',
            description: this.todo?.description || '',
            category: this.todo?.category || '',
            priority: this.todo?.priority || 'Medium',
            status: this.todo?.status || 'Pending',
            isAllDay: isAllDay,
            startDate: isAllDay
              ? this.formatDateOnlyForInput(this.todo?.startDate || new Date().toISOString())
              : this.formatDateForInput(this.todo?.startDate || new Date().toISOString()),
            dueDate: isAllDay
              ? this.formatDateOnlyForInput(this.todo?.dueDate || new Date(Date.now() + 3600000).toISOString())
              : this.formatDateForInput(this.todo?.dueDate || new Date(Date.now() + 3600000).toISOString()),
            reminderMinutes: this.todo?.reminderMinutes || 0
          };
        }
        this.error = null;
      }
    }
  }

  onAllDayChange() {
    // When All Day toggled on, strip time part from dates
    if (this.formData.isAllDay) {
      if (this.formData.startDate) {
        this.formData.startDate = this.formData.startDate.substring(0, 10);
      }
      if (this.formData.dueDate) {
        this.formData.dueDate = this.formData.dueDate.substring(0, 10);
      }
    } else {
      // Re-attach a default time when switching back
      if (this.formData.startDate && this.formData.startDate.length === 10) {
        this.formData.startDate += 'T09:00';
      }
      if (this.formData.dueDate && this.formData.dueDate.length === 10) {
        this.formData.dueDate += 'T18:00';
      }
    }
  }

  onSubmit(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.formData.title.trim()) {
      this.error = 'Title is required.';
      return;
    }
    if (!this.formData.description.trim()) {
      this.error = 'Description is required.';
      return;
    }
    if (!this.formData.category.trim()) {
      this.error = 'Category is required.';
      return;
    }

    const startDate = this.toApiDateTime(this.formData.startDate, new Date());
    const dueDate = this.toApiDateTime(this.formData.dueDate, new Date(Date.now() + 3600000));

    if (new Date(dueDate).getTime() < new Date(startDate).getTime()) {
      this.error = 'Due date must be after start date.';
      return;
    }

    const payload = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim(),
      category: this.formData.category.trim(),
      priority: this.formData.priority,
      status: this.formData.status,
      isCompleted: this.formData.status === 'Done',
      isAllDay: this.formData.isAllDay,
      reminderMinutes: Number(this.formData.reminderMinutes) || 0,
      startDate,
      dueDate
    };

    this.save.emit(payload);
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  private formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  private toApiDateTime(value: string, fallback: Date): string {
    if (!value) return this.formatDateTimeForApi(fallback);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return value.substring(0, 19);

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? this.formatDateTimeForApi(fallback) : this.formatDateTimeForApi(parsed);
  }

  private formatDateTimeForApi(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
  }
}
