import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Todo } from '../models/todo';
import { LucideX, LucideAlertTriangle } from '@lucide/angular';

@Component({
  selector: 'app-todo-modal',
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideAlertTriangle
  ],
  templateUrl: './todo-modal.html'
})
export class TodoModal implements OnChanges {
  @Input() isOpen = false;
  @Input() todo: Todo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

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
            startDate: this.formatDateForInput(this.todo.startDate),
            dueDate: this.formatDateForInput(this.todo.dueDate),
            reminderMinutes: this.todo.reminderMinutes
          };
        } else {
          this.isEditMode = false;
          this.formData = {
            title: this.todo?.title || '',
            description: this.todo?.description || '',
            category: this.todo?.category || '',
            priority: this.todo?.priority || 'Medium',
            status: this.todo?.status || 'Pending',
            isAllDay: this.todo?.isAllDay || false,
            startDate: this.formatDateForInput(this.todo?.startDate || new Date().toISOString()),
            dueDate: this.formatDateForInput(this.todo?.dueDate || new Date(Date.now() + 3600000).toISOString()),
            reminderMinutes: this.todo?.reminderMinutes || 0
          };
        }
        this.error = null;
      }
    }
  }

  onSubmit() {
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

    const safeDate = (val: string, fallback: Date) => {
      if (!val) return fallback.toISOString();
      const d = new Date(val);
      return isNaN(d.getTime()) ? fallback.toISOString() : d.toISOString();
    };

    // Deep-clone the payload before emitting so closing the modal
    // cannot corrupt it via ngOnChanges resetting formData.
    const payload = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim(),
      category: this.formData.category.trim(),
      priority: this.formData.priority,
      status: this.formData.status,
      isAllDay: this.formData.isAllDay,
      reminderMinutes: this.formData.reminderMinutes || 0,
      startDate: safeDate(this.formData.startDate, new Date()),
      dueDate: safeDate(this.formData.dueDate, new Date(Date.now() + 3600000))
    };

    // Emit FIRST, then close — order matters
    this.submit.emit(payload);
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
}
