import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { strongPasswordValidator } from '../../../validators/password.validator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          strongPasswordValidator({
            minLength: 8,
            requireUppercase: true,
            requireLowercase: false,
            requireNumber: false,
            requireSpecialChar: true
          })
        ]
      ]
    });
  }

  submit() {
    if (this.form.invalid || this.loading) return;

    this.error = null;
    this.loading = true;

    const { username, password } = this.form.value;

    this.auth.login(username, password).subscribe({
      next: ok => {
        this.loading = false;

        if (!ok) {
          this.error = 'Invalid credentials (mock).';
          return;
        }

        // if guard redirected here, we have ?redirectTo=/some/path
        const redirectTo =
          this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';

        this.router.navigateByUrl(redirectTo);
      },
      error: () => {
        this.loading = false;
        this.error = 'Login failed (mock).';
      }
    });
  }
}
