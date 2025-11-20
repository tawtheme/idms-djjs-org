import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  email: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'idms-djjs-org.auth';
  private isHydrated = false;

  readonly isAuthenticated = signal<boolean>(false);
  readonly user = signal<AuthUser | null>(null);

  constructor() {
    this.hydrateFromStorage();
  }

  login(email: string, _password: string, remember: boolean): boolean {
    // Mock validation: accept any non-empty credentials
    const ok = !!email && !!_password;
    if (!ok) return false;

    const user: AuthUser = { email };
    this.user.set(user);
    this.isAuthenticated.set(true);

    // Always save to localStorage to persist across reloads
    // The "remember" flag can be used for other purposes if needed
    localStorage.setItem(this.storageKey, JSON.stringify({ user, remember }));
    return true;
  }

  logout(): void {
    this.user.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(this.storageKey);
  }

  private hydrateFromStorage(): void {
    if (this.isHydrated) return; // Prevent multiple hydrations
    
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        this.isHydrated = true;
        return;
      }
      const parsed = JSON.parse(raw) as { user: AuthUser; remember?: boolean };
      if (parsed?.user) {
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


