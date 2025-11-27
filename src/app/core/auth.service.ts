import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface UserAuth {
  username: string;
}

@Injectable({ providedIn: 'root' })

export class AuthService {
    private currentUserSubject = new BehaviorSubject<UserAuth | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): UserAuth | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<UserAuth> {
    return of({ username }).pipe(
      delay(200),
      tap(user => {
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }
}
