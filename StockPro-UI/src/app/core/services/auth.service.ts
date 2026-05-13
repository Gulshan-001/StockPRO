import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse,
  RegisterRequest, RegisterResponse,
  UserProfile
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.authApiUrl}/api/auth`;
  private readonly TOKEN_KEY = 'stockpro_token';
  private readonly USER_KEY  = 'stockpro_user';

  private _currentUser$ = new BehaviorSubject<UserProfile | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser$(): Observable<UserProfile | null> {
    return this._currentUser$.asObservable();
  }

  get currentUser(): UserProfile | null {
    return this._currentUser$.getValue();
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token && !this.isTokenExpired();
  }

  get userRole(): string {
    return this.currentUser?.role ?? '';
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const profile: UserProfile = {
          userId: res.userId,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        this._currentUser$.next(profile);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API}/register`, data);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/profile`).pipe(
      tap(profile => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        this._currentUser$.next(profile);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = this.token;
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
