import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateTodoRequest, Todo, UpdateTodoRequest } from '../models/todo';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth';
import { LucideX, LucideBell, LucideCalendar, LucideChevronDown, LucideChevronLeft, LucideChevronRight, LucideClock } from '@lucide/angular';

@Component({
  selector: 'app-todo-modal',
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideBell,
    LucideCalendar,
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClock
  ],
  templateUrl: './todo-modal.html'
})
export class TodoModal implements OnChanges {
  @Input() isOpen = false;
  @Input() todo: Todo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTodoRequest | UpdateTodoRequest>();

  @HostListener('window:keydown.esc')
  onEsc() {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  private readonly authService = inject(AuthService);

  isEditMode = false;
  error: string | null = null;

  showStartPicker = false;
  showDuePicker = false;
  startCalendarMonth = 0;
  startCalendarYear = 2026;
  dueCalendarMonth = 0;
  dueCalendarYear = 2026;

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  currentUser = this.authService.currentUser;
  members = signal<User[]>([]);

  formData = {
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    status: 'Pending',
    isAllDay: false,
    startDate: '',
    dueDate: '',
    reminderMinutes: 0,
    assignedUserId: undefined as number | undefined
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

  get minStartDate(): string {
    if (this.isEditMode && this.todo) {
      return this.formData.isAllDay
        ? this.formatDateOnlyForInput(this.todo.startDate)
        : this.formatDateForInput(this.todo.startDate);
    }
    const now = new Date();
    return this.formData.isAllDay
      ? this.formatDateOnlyForInput(now.toISOString())
      : this.formatDateForInput(now.toISOString());
  }

  get minDueDate(): string {
    return this.formData.startDate;
  }

  get minStartDateDate(): string {
    if (this.isEditMode && this.todo) {
      return this.formatDateOnlyForInput(this.todo.startDate);
    }
    return this.todayStr;
  }

  get minDueDateDate(): string {
    return this.startDateDate || this.todayStr;
  }

  get startDateDate(): string {
    if (!this.formData.startDate) return '';
    return this.formData.startDate.substring(0, 10);
  }
  set startDateDate(val: string) {
    if (!val) return;
    const time = this.startDateTime || '09:00';
    this.formData.startDate = this.formData.isAllDay ? val : `${val}T${time}`;
  }

  get startDateTime(): string {
    if (!this.formData.startDate || this.formData.startDate.length < 16) return '09:00';
    return this.formData.startDate.substring(11, 16);
  }
  set startDateTime(val: string) {
    const date = this.startDateDate || this.todayStr;
    const time = val || '09:00';
    this.formData.startDate = `${date}T${time}`;
  }

  get dueDateDate(): string {
    if (!this.formData.dueDate) return '';
    return this.formData.dueDate.substring(0, 10);
  }
  set dueDateDate(val: string) {
    if (!val) return;
    const time = this.dueDateTime || '18:00';
    this.formData.dueDate = this.formData.isAllDay ? val : `${val}T${time}`;
  }

  get dueDateTime(): string {
    if (!this.formData.dueDate || this.formData.dueDate.length < 16) return '18:00';
    return this.formData.dueDate.substring(11, 16);
  }
  set dueDateTime(val: string) {
    const date = this.dueDateDate || this.todayStr;
    const time = val || '18:00';
    this.formData.dueDate = `${date}T${time}`;
  }

  get isDueDateOverdue(): boolean {
    if (!this.formData.dueDate || this.formData.status === 'Done') return false;
    const due = new Date(this.formData.dueDate);
    if (isNaN(due.getTime())) return false;
    if (this.formData.isAllDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const match = this.formData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const dueDateLocal = new Date(year, month, day);
        return dueDateLocal < today;
      }
    }
    return due < new Date();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['todo'] || changes['isOpen']) {
      if (this.isOpen) {
        if (this.currentUser()?.role === 'DepartmentHead' || this.currentUser()?.role === 'Leader') {
          this.authService.getDepartmentMembers().subscribe({
            next: (users) => {
              this.members.set(users);
              // Set default assignee if not set
              if (!this.formData.assignedUserId && users.length > 0) {
                this.formData.assignedUserId = this.currentUser()?.userId;
              }
            },
            error: (err) => console.error('Failed to load department members', err)
          });
        }

        this.isEditMode = this.todo && this.todo.id !== 0 ? true : false;
        if (this.isEditMode && this.todo) {
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
            reminderMinutes: this.todo.reminderMinutes,
            assignedUserId: this.todo.assignedUserId
          };
        } else {
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
            reminderMinutes: this.todo?.reminderMinutes || 0,
            assignedUserId: this.currentUser()?.userId
          };
        }
        
        const startInitDate = new Date(this.formData.startDate);
        const dueInitDate = new Date(this.formData.dueDate);
        
        this.startCalendarMonth = isNaN(startInitDate.getTime()) ? new Date().getMonth() : startInitDate.getMonth();
        this.startCalendarYear = isNaN(startInitDate.getTime()) ? new Date().getFullYear() : startInitDate.getFullYear();
        this.dueCalendarMonth = isNaN(dueInitDate.getTime()) ? new Date().getMonth() : dueInitDate.getMonth();
        this.dueCalendarYear = isNaN(dueInitDate.getTime()) ? new Date().getFullYear() : dueInitDate.getFullYear();

        this.showStartPicker = false;
        this.showDuePicker = false;
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
      dueDate,
      assignedUserId: this.formData.assignedUserId
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

  get startDateTimeHour(): string {
    return this.startDateTime.substring(0, 2);
  }
  set startDateTimeHour(val: string) {
    this.startDateTime = `${val}:${this.startDateTimeMinute}`;
  }

  get startDateTimeMinute(): string {
    return this.startDateTime.substring(3, 5);
  }
  set startDateTimeMinute(val: string) {
    this.startDateTime = `${this.startDateTimeHour}:${val}`;
  }

  get dueDateTimeHour(): string {
    return this.dueDateTime.substring(0, 2);
  }
  set dueDateTimeHour(val: string) {
    this.dueDateTime = `${val}:${this.dueDateTimeMinute}`;
  }

  get dueDateTimeMinute(): string {
    return this.dueDateTime.substring(3, 5);
  }
  set dueDateTimeMinute(val: string) {
    this.dueDateTime = `${this.dueDateTimeHour}:${val}`;
  }

  prevStartMonth() {
    if (this.startCalendarMonth === 0) {
      this.startCalendarMonth = 11;
      this.startCalendarYear--;
    } else {
      this.startCalendarMonth--;
    }
  }

  nextStartMonth() {
    if (this.startCalendarMonth === 11) {
      this.startCalendarMonth = 0;
      this.startCalendarYear++;
    } else {
      this.startCalendarMonth++;
    }
  }

  prevDueMonth() {
    if (this.dueCalendarMonth === 0) {
      this.dueCalendarMonth = 11;
      this.dueCalendarYear--;
    } else {
      this.dueCalendarMonth--;
    }
  }

  nextDueMonth() {
    if (this.dueCalendarMonth === 11) {
      this.dueCalendarMonth = 0;
      this.dueCalendarYear++;
    } else {
      this.dueCalendarMonth++;
    }
  }

  selectStartDate(cell: any) {
    this.startDateDate = cell.dateString;
  }

  selectDueDate(cell: any) {
    this.dueDateDate = cell.dateString;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Select Date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Select Date';
    if (this.formData.isAllDay) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getCalendarDays(year: number, month: number) {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean; dateString: string; isPast: boolean }> = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;
      days.push({
        day: prevDay,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateString,
        isPast: this.isDateStringPast(dateString)
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      days.push({
        day: d,
        month,
        year,
        isCurrentMonth: true,
        dateString,
        isPast: this.isDateStringPast(dateString)
      });
    }

    // Next month padding
    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateString = `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${n.toString().padStart(2, '0')}`;
      days.push({
        day: n,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateString,
        isPast: this.isDateStringPast(dateString)
      });
    }

    return days;
  }

  private isDateStringPast(dateStr: string): boolean {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }
}
