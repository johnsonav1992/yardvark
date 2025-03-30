import { ValidatorFn } from '@angular/forms';

export const guaranteedAnalysisFieldValidator: ValidatorFn = (control) => {
  const val = control.value;

  if (val && val.length > 0) {
    const regex = /^[a-zA-Z0-9\s]+$/;
    const isValid = regex.test(val);

    return isValid ? null : { invalidAnalysis: true };
  }

  return null;
};
