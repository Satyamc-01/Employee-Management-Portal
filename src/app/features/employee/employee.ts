import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  EmployeeService,
  Employee,
  Department
} from '../../core/employee.service';

import {
  Observable,
  BehaviorSubject,
  combineLatest
} from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';

import {
  MatTableModule
} from '@angular/material/table';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import {
  MatInputModule
} from '@angular/material/input';
import {
  MatSelectModule
} from '@angular/material/select';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import {
  EmployeeFormComponent,
  EmployeeFormData
} from '../../shared/employee-form/employee-form';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    RouterLink,
    MatProgressSpinnerModule,
    ConfirmDialog
  ],
  templateUrl: './employee.html',
  styleUrls: ['./employee.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesComponent implements OnInit {

showLoader = true;

  // raw streams from service
  employees$!: Observable<Employee[]>;
  departments$!: Observable<Department[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  // table column order
  cols = ['name', 'department', 'designation', 'status', 'actions'];

  // filters state
  private searchTermSubject = new BehaviorSubject<string>('');
  private deptFilterSubject = new BehaviorSubject<string>('');   // '' = All
  private statusFilterSubject = new BehaviorSubject<string>(''); // '' = All

  searchTerm$ = this.searchTermSubject.asObservable();
  deptFilter$ = this.deptFilterSubject.asObservable();
  statusFilter$ = this.statusFilterSubject.asObservable();

  // final filtered list that table consumes
  filteredEmployees$!: Observable<Employee[]>;

ngOnInit(): void {
  // actual data load
  this.employeeService.loadEmployees();

  // UI loader control (fake/minimum loader)
  this.showLoader = true;
  setTimeout(() => {
    this.showLoader = false;
    this.cdr.markForCheck();  // ✅ tell Angular: "re-check this component"
  }, 3000);
}

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef  
  ) {
    // connect to service streams
    this.employees$ = this.employeeService.employees$;
    this.departments$ = this.employeeService.departments$;
    this.loading$ = this.employeeService.loading$;
    this.error$ = this.employeeService.error$;

    // ensure data loaded from mock API
    // this.employeeService.loadEmployees(true);

    // RxJS-based search + filters
    this.filteredEmployees$ = combineLatest([
      this.employees$,
      this.searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.deptFilter$,
      this.statusFilter$
    ]).pipe(
      map(([employees, search, dept, status]) => {
        const term = search.trim().toLowerCase();

        let result = employees;

        // department filter
        if (dept) {
          result = result.filter(e => e.department === dept);
        }

        // status filter
        if (status) {
          // status can be "active" | "on_leave" | "inactive" | "trainee" | "probation"
          // depending how you modelled it (you can tweak here)
          result = result.filter(e =>
            e.status === status ||
            e.employmentStage === status // optional: if you map trainee/probation here
          );
        }

        // search filter (name / designation / department)
        if (term) {
          result = result.filter(e =>
            e.name.toLowerCase().includes(term) ||
            e.designation.toLowerCase().includes(term) ||
            e.department.toLowerCase().includes(term)
          );
        }

        return result;
      })
    );
  }

  // 🔍 search input
  onSearch(value: string) {
    this.searchTermSubject.next(value);
  }

  // department dropdown
  onDeptChange(value: string) {
    this.deptFilterSubject.next(value);
  }

  // status dropdown
  onStatusChange(value: string) {
    this.statusFilterSubject.next(value);
  }

  // ➕ Add employee (modal)
  openAdd() {
    const data: EmployeeFormData = {
      mode: 'create'
    };

    const ref = this.dialog.open(EmployeeFormComponent, {
      width: '420px',
      data
    });

    ref.afterClosed().subscribe(result => {
      // dialog closed without saving
      if (!result) return;

      // result has fields: name, department, designation, status, employmentStage, attendanceThisMonth, leaveBalance
      this.employeeService.createEmployee(result).subscribe();
    });
  }

  // ✏️ Edit employee (modal)
  openEdit(emp: Employee) {
    const data: EmployeeFormData = {
      mode: 'edit',
      employee: emp
    };

    const ref = this.dialog.open(EmployeeFormComponent, {
      width: '420px',
      data
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;

      this.employeeService.updateEmployee(emp.id, result).subscribe();
    });
  }

  // 🗑️ Delete employee
delete(emp: Employee) {
  const dialogRef = this.dialog.open(ConfirmDialog, {
    width: '400px',
    data: {
      title: "Delete Employee",
      message: `Are you sure you want to delete "${emp.name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel"
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.employeeService.deleteEmployee(emp.id).subscribe();
    }
  });
}


  formatStatus(status: string) {
  if (!status) return '';
  return status.replace('_', ' ');
}


}