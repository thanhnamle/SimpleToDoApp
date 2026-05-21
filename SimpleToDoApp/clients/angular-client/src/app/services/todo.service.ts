import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../models/todo';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:59444/api/todos';

  getAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.baseUrl);
  }

  getCalendar(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.baseUrl}/calendar`);
  }

  getById(id: number): Observable<Todo> {
    return this.http.get<Todo>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.baseUrl, data);
  }

  update(id: number, data: UpdateTodoRequest): Observable<Todo> {
    return this.http.put<Todo>(`${this.baseUrl}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<Todo> {
    return this.http.patch<Todo>(`${this.baseUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
