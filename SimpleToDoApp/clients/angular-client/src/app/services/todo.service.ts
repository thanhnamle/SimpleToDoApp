import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Todo, CreateTodoRequest, UpdateTodoRequest, PagedResult } from '../models/todo';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl}/api/todos`;

  getAll(params?: any): Observable<PagedResult<Todo>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber);
      if (params.pageSize) httpParams = httpParams.set('PageSize', params.pageSize);
      if (params.search) httpParams = httpParams.set('Search', params.search);
      if (params.status && params.status !== 'All') httpParams = httpParams.set('Status', params.status);
      if (params.priority && params.priority !== 'All') httpParams = httpParams.set('Priority', params.priority);
      if (params.category && params.category !== 'All') httpParams = httpParams.set('Category', params.category);
      if (params.sort) httpParams = httpParams.set('Sort', params.sort);
      if (params.departmentId && params.departmentId !== 'All') httpParams = httpParams.set('DepartmentId', params.departmentId);
    } else {
      // Default fallback for legacy calls (Gantt, Board)
      httpParams = httpParams.set('PageSize', '1000');
    }

    return this.http.get<PagedResult<Todo>>(this.baseUrl, { params: httpParams });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
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

  seedTasks(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/seed`, {});
  }
}
