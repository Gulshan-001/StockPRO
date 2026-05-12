import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Alert, UnreadCountResponse } from '../models/alert.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = `${environment.alertApiUrl}/api/alerts`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Poll for unread count every 60 seconds if logged in
    timer(0, 60000).pipe(
      switchMap(() => {
        if (this.authService.isLoggedIn) {
          return this.getUnreadCount();
        }
        return new Observable<UnreadCountResponse>();
      })
    ).subscribe(res => {
      if (res && res.count !== undefined) {
        this.unreadCountSubject.next(res.count);
      }
    });
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${id}`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  acknowledge(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/acknowledge/${id}`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  registerRecipient(): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-recipient`, {});
  }

  private refreshUnreadCount(): void {
    this.getUnreadCount().subscribe(res => this.unreadCountSubject.next(res.count));
  }
}
