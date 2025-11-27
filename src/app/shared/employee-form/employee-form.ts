import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Employee, Department } from '../../core/employee.service';

export interface EmployeeFormData {
  mode: 'create' | 'edit';
  employee?: Employee;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.css']
})
export class EmployeeFormComponent implements OnInit {
  form!: FormGroup;
  mode: 'create' | 'edit';
  departments: Department[] = ['Engineering', 'HR', 'Sales', 'Finance', 'Operations'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeFormComponent, Partial<Employee> | null>,
    @Inject(MAT_DIALOG_DATA) public data: EmployeeFormData
  ) {
    this.mode = data.mode;
  }

  ngOnInit(): void {
    const emp = this.data.employee;

    this.form = this.fb.group({
      name: [emp?.name ?? '', Validators.required],
      department: [emp?.department ?? 'Engineering', Validators.required],
      designation: [emp?.designation ?? '', Validators.required],
      status: [emp?.status ?? 'active', Validators.required],
      employmentStage: [emp?.employmentStage ?? 'trainee', Validators.required],
      attendanceThisMonth: [
        emp?.attendanceThisMonth ?? 0,
        [Validators.required, Validators.min(0)]
      ],
      leaveBalance: [
        emp?.leaveBalance ?? 0,
        [Validators.required, Validators.min(0)]
      ]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value); // return partial employee
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
