import { Injectable } from '@angular/core';
import { Todo } from '../models/todo';

@Injectable({
  providedIn: 'root'
})
export class TodoUiService {

  getPriorityStyle(p: string): string {
    switch (p) {
      case 'High':
        return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20';
    }
  }

  getStatusStyle(s: string): string {
    switch (s) {
      case 'Pending':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      case 'InProgress':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20';
      case 'Done':
        return 'bg-emerald-500 text-white shadow-sm';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  isOverdue(task: Todo): boolean {
    if (!task.dueDate || task.status === 'Done') return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    
    if (task.isAllDay) {
      due.setHours(23, 59, 59, 999);
    }
    
    return due < now;
  }
}
