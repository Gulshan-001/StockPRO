import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminUser,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRoleRequest,
  AuditLogEntry,
  AuditLogFilter
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.authApiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  // ── User Management ────────────────────────────────────────────────────────

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API}/users`);
  }

  getUserById(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.API}/users/${id}`);
  }

  createUser(dto: CreateUserRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/users`, dto);
  }

  updateUser(id: string, dto: UpdateUserRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/users/${id}`, dto);
  }

  deactivateUser(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/users/${id}/deactivate`, {});
  }

  reactivateUser(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/users/${id}/reactivate`, {});
  }

  // ── Role Management ────────────────────────────────────────────────────────

  getAvailableRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API}/roles`);
  }

  assignRole(dto: AssignRoleRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/roles`, dto);
  }

  // ── Audit Log ──────────────────────────────────────────────────────────────

  getAuditLogs(filter: AuditLogFilter = {}): Observable<AuditLogEntry[]> {
    let params = new HttpParams();
    if (filter.userId)     params = params.set('userId', filter.userId);
    if (filter.action)     params = params.set('action', filter.action);
    if (filter.entityName) params = params.set('entityName', filter.entityName);
    if (filter.fromDate)   params = params.set('fromDate', filter.fromDate);
    if (filter.toDate)     params = params.set('toDate', filter.toDate);
    return this.http.get<AuditLogEntry[]>(`${this.API}/audit`, { params });
  }
}
