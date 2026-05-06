import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Alert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly API = `${environment.alertApiUrl}/api/alerts`;

  constructor(private http: HttpClient) {}

  /** GET /api/alerts — returns all alerts for the current user */
  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.API);
  }

  /** GET /api/alerts/unread-count */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API}/unread-count`);
  }

  /** PUT /api/alerts/read/{id} */
  markAsRead(alertId: string): Observable<unknown> {
    return this.http.put(`${this.API}/read/${alertId}`, {});
  }

  /** PUT /api/alerts/acknowledge/{id} */
  acknowledge(alertId: string): Observable<unknown> {
    return this.http.put(`${this.API}/acknowledge/${alertId}`, {});
  }

  /** POST /api/alerts/register-recipient — call on login to enable alert fan-out */
  registerRecipient(): Observable<unknown> {
    return this.http.post(`${this.API}/register-recipient`, {});
  }
}
