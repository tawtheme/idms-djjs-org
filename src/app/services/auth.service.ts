import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  email: string;
  name?: string;
  id?: number | string;
  token?: string;
  [key: string]: any; // Allow additional properties from API
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: AuthUser;
    token?: string;
    access_token?: string;
    [key: string]: any;
  };
  token?: string;
  user?: AuthUser;
  [key: string]: any; // Allow flexible API response structure
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'idms-djjs-org.auth';
  private readonly tokenKey = 'idms-djjs-org.token';
  private isHydrated = false;
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly isAuthenticated = signal<boolean>(false);
  readonly user = signal<AuthUser | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.hydrateFromStorage();
  }

  login(email: string, password: string, remember: boolean): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const loginData: LoginRequest = { email, password };

    // API endpoint: /api/v1/login
    // Base URL: https://idms.djjsglobal.org/idms_api/api
    // Full URL: https://idms.djjsglobal.org/idms_api/api/v1/login
    // Note: If your API base URL doesn't include /api, use: ${this.apiUrl}/api/v1/login
    return this.http.post<LoginResponse>(`${this.apiUrl}/v1/login`, loginData).pipe(
      tap((response) => {
        // Handle different response structures
        const token = response.token || response.data?.token || response.data?.['access_token'] || response['access_token'];
        const userData = response.user || response.data?.user || { email };

        if (token) {
          const user: AuthUser = {
            ...userData,
            email,
            token
          };

          this.user.set(user);
          this.isAuthenticated.set(true);

          // Store token and user data
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.storageKey, JSON.stringify({ user, remember }));
        } else {
          throw new Error('No token received from server');
        }

        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        
        // Handle CORS errors specifically
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.status === 0) {
          // CORS or network error
          if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
            errorMessage = 'CORS error: Unable to connect to the server. Please check server configuration or contact support.';
          } else {
            errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
          }
        } else if (error.error) {
          errorMessage = error.error?.message || error.error?.error || error.message || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    this.user.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
  }

  private hydrateFromStorage(): void {
    if (this.isHydrated) return; // Prevent multiple hydrations
    
    try {
      const raw = localStorage.getItem(this.storageKey);
      const token = localStorage.getItem(this.tokenKey);
      
      if (!raw || !token) {
        this.isHydrated = true;
        return;
      }
      
      const parsed = JSON.parse(raw) as { user: AuthUser; remember?: boolean };
      if (parsed?.user && token) {
        // Ensure token is included in user object
        parsed.user.token = token;
        this.user.set(parsed.user);
        this.isAuthenticated.set(true);
      }
      this.isHydrated = true;
    } catch {
      this.isHydrated = true;
      // ignore
    }
  }

  // Public method to check if service is ready
  isReady(): boolean {
    return this.isHydrated;
  }

  // Comprehensive check that includes localStorage fallback
  // This prevents logout during development file changes/reloads
  checkAuth(): boolean {
    if (this.isAuthenticated()) {
      return true;
    }
    
    // Fallback: check localStorage directly
    // This handles edge cases during development reloads
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser };
        if (parsed?.user) {
          // Auth exists in storage but signal wasn't set - rehydrate
          this.user.set(parsed.user);
          this.isAuthenticated.set(true);
          return true;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return false;
  }
}


