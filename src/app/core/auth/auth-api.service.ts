import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';
import { LoginRequest, LoginResponse, RefreshResponse } from './auth.models';

// CONCEPT: Architecture - The API service is a thin wrapper around HttpClient.
// It handles URL construction and typing. It does NOT manage state.
// The store calls these methods and manages the response.
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  getMe(token: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  refresh(refreshToken: string): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, {
      refreshToken,
      expiresInMins: 30,
    });
  }
}
