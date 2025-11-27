import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface StrongPasswordConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

const defaultConfig: StrongPasswordConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: false,
  requireNumber: false,
  requireSpecialChar: true
};

export function strongPasswordValidator(
  config?: Partial<StrongPasswordConfig>
): ValidatorFn {
  const finalConfig: StrongPasswordConfig = { ...defaultConfig, ...config };

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    // Agar empty hai, isko required ka kaam nahi karwana.
    // Required ke liye alag se Validators.required use karo.
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < finalConfig.minLength) {
      errors['minLength'] = {
        requiredLength: finalConfig.minLength,
        actualLength: value.length
      };
    }

    if (finalConfig.requireUppercase && !/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }

    if (finalConfig.requireLowercase && !/[a-z]/.test(value)) {
      errors['lowercase'] = true;
    }

    if (finalConfig.requireNumber && !/[0-9]/.test(value)) {
      errors['number'] = true;
    }

    if (
      finalConfig.requireSpecialChar &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(value)
    ) {
      errors['specialChar'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  };
}
