import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  EmployeeService,
  Employee,
  Department
} from '../../core/employee.service';

import {
  Observable,
  BehaviorSubject,
  combineLatest,
  Subject
} from 'rxjs';
import {
  map,
  takeUntil,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    RouterLink,
    MatDialogModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnDestroy {
  // main streams
  employees$!: Observable<Employee[]>;
  totalEmployees$!: Observable<number>;
  departments$!: Observable<Department[]>;

  // department filter
  private selectedDeptSubject = new BehaviorSubject<Department | null>(null);
  selectedDepartment$ = this.selectedDeptSubject.asObservable();

  // search term stream
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  // final filtered list (dept + search)
  filteredEmployees$!: Observable<Employee[]>;

  // selection + edit state
  selectedEmployee: Employee | null = null;
  editMode = false;
  detailForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private dialog: MatDialog  
    ) {
    // connect to service streams
    this.employees$ = this.employeeService.employees$;
    this.totalEmployees$ = this.employeeService.totalEmployees$;
    this.departments$ = this.employeeService.departments$;

    // load from mock REST API
    this.employeeService.loadEmployees();

    // combine: employees + department + search
    this.filteredEmployees$ = combineLatest([
      this.employees$,
      this.selectedDepartment$,
      this.searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).pipe(
      map(([employees, dept, term]) => {
        const search = term.trim().toLowerCase();

        let result = employees;

        // department filter
        if (dept) {
          result = result.filter(e => e.department === dept);
        }

        // search filter (name / designation / department)
        if (search) {
          result = result.filter(e =>
            e.name.toLowerCase().includes(search) ||
            e.designation.toLowerCase().includes(search) ||
            e.department.toLowerCase().includes(search)
          );
        }

        return result;
      })
    );

    // first employee active by default, and keep selection valid w.r.t filters
    this.filteredEmployees$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        if (!this.selectedEmployee && list.length) {
          this.onSelect(list[0]);
          return;
        }

        if (
          this.selectedEmployee &&
          !list.some(e => e.id === this.selectedEmployee!.id)
        ) {
          this.selectedEmployee = list[0] ?? null;
          this.editMode = false;
        }
      });
  }

  // called by mat-tab-group
  onTabChange(index: number, departments: Department[]) {
    const dept = index === 0 ? null : departments[index - 1];
    this.selectedDeptSubject.next(dept);
    this.selectedEmployee = null;
    this.editMode = false;
  }

  // called by search input (input event)
  onSearchChange(value: string) {
    this.searchTermSubject.next(value);
  }

  trackById(index: number, emp: Employee) {
    return emp.id;
  }

  // when user clicks on an employee in list
  onSelect(emp: Employee) {
    this.selectedEmployee = emp;
    this.editMode = false;
    this.buildDetailForm(emp);
  }

  private buildDetailForm(emp: Employee) {
    this.detailForm = this.fb.group({
      designation: [emp.designation, Validators.required],
      status: [emp.status, Validators.required],
      employmentStage: [emp.employmentStage, Validators.required],
      attendanceThisMonth: [
        emp.attendanceThisMonth,
        [Validators.required, Validators.min(0)]
      ],
      leaveBalance: [
        emp.leaveBalance,
        [Validators.required, Validators.min(0)]
      ]
    });
  }

  enableEdit() {
    if (!this.selectedEmployee) return;
    this.editMode = true;
  }

  cancelEdit() {
    if (!this.selectedEmployee) return;
    this.buildDetailForm(this.selectedEmployee);
    this.editMode = false;
  }

  saveChanges() {
    if (!this.selectedEmployee || this.detailForm.invalid) return;

    const id = this.selectedEmployee.id;
    const changes = this.detailForm.value;

    console.log('[Dashboard] updating id', id, 'with', changes);

    this.employeeService.updateEmployee(id, changes).subscribe(updated => {
      if (updated) {
        this.selectedEmployee = updated;
        this.editMode = false;
      }
    });
  }

 deleteSelected() {
  if (!this.selectedEmployee) return;

  const emp = this.selectedEmployee;

  const dialogRef = this.dialog.open(ConfirmDialog, {
    width: '380px',
    data: {
      title: 'Delete Employee',
      subtitle: 'This action cannot be undone.',
      message: `Are you sure you want to delete "${emp.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  });

dialogRef.afterClosed().subscribe((result: boolean) => {
    if (!result) return;  // user clicked Cancel / backdrop

    this.employeeService.deleteEmployee(emp.id).subscribe(success => {
      if (success) {
        this.selectedEmployee = null;
        this.editMode = false;
      }
    });
  });
}

  formatStatus(status: string) {
  if (!status) return '';
  return status.replace('_', ' ');
}


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
