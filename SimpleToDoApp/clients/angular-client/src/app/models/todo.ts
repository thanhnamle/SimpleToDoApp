export type TodoPriority = 'Low' | 'Medium' | 'High';
export type TodoStatus = 'Pending' | 'InProgress' | 'Done';

export interface Todo {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  category: string;
  priority: TodoPriority;
  status: TodoStatus;
  isAllDay: boolean;
  createdAt: string;
  startDate: string;
  dueDate: string;
  reminderMinutes: number;
}

export interface CreateTodoRequest {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  isAllDay: boolean;
  startDate: string;
  dueDate: string;
  reminderMinutes: number;
}

export interface UpdateTodoRequest {
  title: string;
  description: string;
  isCompleted: boolean;
  category: string;
  priority: string;
  status: string;
  isAllDay: boolean;
  startDate: string;
  dueDate: string;
  reminderMinutes: number;
}
