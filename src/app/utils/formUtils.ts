import { FormGroup, ValidatorFn } from '@angular/forms';

export const GUARANTEED_ANALYSIS_FORMAT_REGEX =
  /^([0-9]|[1-9][0-9]|100)-([0-9]|[1-9][0-9]|100)-([0-9]|[1-9][0-9]|100)$/;
export const APPLICATION_RATE_FORMAT_REGEX = /^(.+)\/(.+)sqft$/i;

export const guaranteedAnalysisFieldValidator: ValidatorFn = (control) => {
  const val = control.value;

  if (val && val.length > 0) {
    const isValid =
      GUARANTEED_ANALYSIS_FORMAT_REGEX.test(val) ||
      val.toLowerCase() === 'N/A'.toLowerCase();

    return isValid ? null : { invalidAnalysis: true };
  }

  return null;
};

export const applicationRateFieldValidator: ValidatorFn = (control) => {
  const val = control.value;

  if (val && val.length > 0) {
    const isValid = APPLICATION_RATE_FORMAT_REGEX.test(val);

    return isValid ? null : { invalidApplicationRate: true };
  }

  return null;
};

export const showAllFormErrorsOnSubmit = (form: FormGroup) => {
  Object.entries(form.controls).forEach(([_, ctrl]) => ctrl.markAsDirty());

  return form.markAllAsTouched();
};
