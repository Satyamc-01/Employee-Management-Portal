import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

export type Department = string;

export interface Employee {
  id: number | string;
  name: string;
  department: Department;
  designation: string;
  status: 'active' | 'on_leave' | 'inactive';
  employmentStage: 'trainee' | 'probation' | 'confirmed';
  attendanceThisMonth: number;
  leaveBalance: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly apiUrl = 'http://localhost:3000/employees';

  // internal state
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // public streams
  employees$ = this.employeesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // derived streams
  totalEmployees$ = this.employees$.pipe(
    map(list => list.length)
  );

  departments$ = this.employees$.pipe(
    map(list => Array.from(new Set(list.map(e => e.department))) as Department[])
  );

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────
  loadEmployees(): void {
  if (this.employeesSubject.value.length > 0) {
    return;
  }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<Employee[]>(this.apiUrl).pipe(
      tap(employees => {
        console.log('[EmployeeService] fetched employees:', employees);
      }),
      catchError(err => {
        console.error('[EmployeeService] load error', err);
        this.errorSubject.next('Failed to load employees');
        return of([] as Employee[]);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    ).subscribe(employees => {
      this.employeesSubject.next(employees);
    });
  }

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────
  createEmployee(payload: Omit<Employee, 'id'>): Observable<Employee | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Employee>(this.apiUrl, payload).pipe(
      tap(created => {
        console.log('[EmployeeService] created employee:', created);
        const current = this.employeesSubject.value;
        this.employeesSubject.next([...current, created]);
      }),
      catchError(err => {
        console.error('[EmployeeService] create error', err);
        this.errorSubject.next('Failed to create employee');
        return of(null);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  // ─────────────────────────────────────────
  // UPDATE (full object, safe for json-server)
  // ─────────────────────────────────────────
  updateEmployee(id: number | string, changes: Partial<Employee>): Observable<Employee | null> {
    const current = this.employeesSubject.value;
    const idx = current.findIndex(e => e.id == id); // == handles '1' vs 1

    if (idx === -1) {
      console.warn('[EmployeeService] updateEmployee: id not found', id);
      return of(null);
    }

    const existing = current[idx];

    // full object: existing + changes
    const body: Employee = {
      ...existing,
      ...changes
    };

    const url = `${this.apiUrl}/${existing.id}`;
    console.log('[EmployeeService] PUT', url, body);

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<Employee>(url, body).pipe(
      tap(updated => {
        console.log('[EmployeeService] updated:', updated);
        const list = [...current];
        list[idx] = updated;
        this.employeesSubject.next(list);
      }),
      catchError(err => {
        console.error('[EmployeeService] update error', err);
        this.errorSubject.next('Failed to update employee');
        return of(null);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────
  deleteEmployee(id: number | string): Observable<boolean> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[EmployeeService] DELETE', url);

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<void>(url).pipe(
      tap(() => {
        const current = this.employeesSubject.value;
        const filtered = current.filter(e => e.id != id); // != to handle '1' vs 1
        this.employeesSubject.next(filtered);
      }),
      map(() => true),
      catchError(err => {
        console.error('[EmployeeService] delete error', err);
        this.errorSubject.next('Failed to delete employee');
        return of(false);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  // ─────────────────────────────────────────
  // HELPER: get by id (for details / dashboard)
  // ─────────────────────────────────────────
  getEmployeeById(id: number | string): Employee | undefined {
    return this.employeesSubject.value.find(e => e.id == id);
  }
}
