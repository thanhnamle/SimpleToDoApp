import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TodoService } from '../services/todo.service';
import { SignalRService } from '../services/signalr.service';
import { Subscription } from 'rxjs';
import { Todo } from '../models/todo';
import { User } from '../models/auth';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';
import { 
  LucideUsers, 
  LucideActivity, 
  LucideCheckCircle2, 
  LucideClock, 
  LucideAlertCircle,
  LucidePlus,
  LucideEdit3,
  LucideTrash2,
  LucideX,
  LucideLoader2,
  LucideEye,
  LucideEyeOff
} from '@lucide/angular';

@Component({
  selector: 'app-todo-department',
  imports: [
    CommonModule,
    FormsModule,
    LucideUsers,
    LucideActivity,
    LucideCheckCircle2,
    LucideClock,
    LucideAlertCircle,
    LucidePlus,
    LucideEdit3,
    LucideTrash2,
    LucideX,
    LucideLoader2,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './todo-department.html'
})
export class TodoDepartment implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly todoService = inject(TodoService);
  private readonly signalRService = inject(SignalRService);
  private readonly notificationService = inject(NotificationService);

  private signalRSub?: Subscription;

  readonly members = signal<User[]>([]);
  readonly todos = signal<Todo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  departments = signal<any[]>([]);

  currentUser = this.authService.currentUser;
  isDepartmentHead = computed(() => this.currentUser()?.role === 'DepartmentHead');
  isLeader = computed(() => this.currentUser()?.role === 'Leader');

  groupedMembers = computed(() => {
    const membersArray = this.members();
    const groups: { [deptName: string]: User[] } = {};
    
    for (const member of membersArray) {
      const deptName = member.departmentName || 'Global Management';
      if (!groups[deptName]) {
        groups[deptName] = [];
      }
      groups[deptName].push(member);
    }
    
    return Object.keys(groups).sort().map(key => ({
      departmentName: key,
      members: groups[key]
    }));
  });

  // Stats variables
  totalTasks = signal<number>(0);
  pendingTasks = signal<number>(0);
  inProgressTasks = signal<number>(0);
  completedTasks = signal<number>(0);
  
  completionRate = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  ngOnInit() {
    this.fetchData();
    this.fetchDepartments();
    this.signalRSub = this.signalRService.todoUpdated$.subscribe(() => {
      this.fetchData();
    });
  }

  fetchDepartments() {
    if (this.isDepartmentHead()) {
      this.authService.getDepartments().subscribe(d => this.departments.set(d));
    }
  }

  ngOnDestroy() {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
  }

  @HostListener('window:keydown.esc')
  onEsc() {
    if (this.modalOpen) {
      this.closeModal();
    }
  }

  fetchData() {
    this.loading.set(true);
    
    // 1. Fetch Users
    this.authService.getDepartmentMembers().subscribe({
      next: (users) => {
        const currentUserId = this.authService.currentUser()?.userId;
        const filteredAccounts = users.filter(acc => 
          acc.role !== 'User' && 
          !(acc.role === 'Employee' && !acc.departmentId) &&
          acc.userId !== currentUserId
        );
        this.members.set(filteredAccounts);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set('Failed to load department members');
        this.loading.set(false);
      }
    });

    // 2. Fetch Stats
    this.todoService.getStats().subscribe({
      next: (stats) => {
        this.totalTasks.set(stats.totalTasks);
        this.pendingTasks.set(stats.pendingTasks);
        this.inProgressTasks.set(stats.inProgressTasks);
        this.completedTasks.set(stats.completedTasks);
        this.userStats.set(stats.userStats || {});
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load stats');
        this.loading.set(false);
      }
    });
  }

  userStats = signal<any>({});

  getMemberTasksCount(userId: number): number {
    return this.userStats()[userId]?.totalTasks || 0;
  }

  getMemberCompletedTasksCount(userId: number): number {
    return this.userStats()[userId]?.completedTasks || 0;
  }

  getMemberTasksCompletionRate(userId: number): number {
    const total = this.getMemberTasksCount(userId);
    if (total === 0) return 0;
    return Math.round((this.getMemberCompletedTasksCount(userId) / total) * 100);
  }

  // Account Management
  modalOpen = false;
  selectedAccount: User | null = null;
  isSavingAccount = false;
  showPassword = false;

  accountFormData: Partial<User> & { password?: string } = {
    email: '',
    password: '',
    role: 'Employee',
    departmentId: null as number | null
  };

  openCreateModal() {
    this.selectedAccount = null;
    this.accountFormData = {
      username: '',
      email: '',
      password: '',
      role: 'Employee',
      departmentId: null
    };
    this.modalOpen = true;
  }

  openEditModal(user: User) {
    this.selectedAccount = user;
    this.accountFormData = {
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      departmentId: user.departmentId || null
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.selectedAccount = null;
  }

  handleSaveAccount() {
    this.isSavingAccount = true;
    const req$ = this.selectedAccount
      ? this.authService.updateAccount(this.selectedAccount.userId, this.accountFormData)
      : this.authService.createAccount(this.accountFormData);

    req$.subscribe({
      next: () => {
        this.isSavingAccount = false;
        this.notificationService.showToast(`Staff ${this.selectedAccount ? 'updated' : 'created'} successfully`, 'success');
        this.closeModal();
        this.fetchData(); // Reload list
      },
      error: (err) => {
        this.isSavingAccount = false;
        this.notificationService.showToast(err.error?.message || 'Failed to save staff account', 'error');
      }
    });
  }

  handleDelete(userId: number) {
    this.notificationService.confirm(
      'Are you sure you want to delete this staff account?', 
      'Delete Account', 
      'Delete'
    ).then(confirmed => {
      if (!confirmed) return;

      this.authService.deleteAccount(userId).subscribe({
        next: () => {
          this.notificationService.showToast('Staff deleted successfully', 'success');
          this.fetchData(); // Reload list
        },
        error: (err) => {
          this.notificationService.showToast(err.error?.message || 'Failed to delete account', 'error');
        }
      });
    });
  }
}
