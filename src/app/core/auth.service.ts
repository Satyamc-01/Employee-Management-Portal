import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

const AUTH_KEY = 'employee_portal_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(this.readInitialState());
  loggedIn$ = this.loggedInSubject.asObservable();

  constructor() {}

  private readInitialState(): boolean {
    if (typeof window === 'undefined') return false;
    const value = localStorage.getItem(AUTH_KEY);
    return value === 'true';
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  // mock async login that returns Observable<boolean>
  login(username: string, password: string): Observable<boolean> {
    const ok = !!username && !!password; // basic mock check

    return of(ok).pipe(
      delay(400), // fake network delay
      tap(success => {
        if (success && typeof window !== 'undefined') {
          localStorage.setItem(AUTH_KEY, 'true');
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
    this.loggedInSubject.next(false);
  }
}