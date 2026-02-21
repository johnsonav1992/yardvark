import type { FormGroup, ValidatorFn } from "@angular/forms";

export const GUARANTEED_ANALYSIS_FORMAT_REGEX =
	/^([0-9](\.\d{1,2})?|[1-9][0-9](\.\d{1,2})?|100(\.0{1,2})?)-([0-9](\.\d{1,2})?|[1-9][0-9](\.\d{1,2})?|100(\.0{1,2})?)-([0-9](\.\d{1,2})?|[1-9][0-9](\.\d{1,2})?|100(\.0{1,2})?)$/;
export const APPLICATION_RATE_FORMAT_REGEX = /^(.+)\/(.+)sqft$/i;

export const guaranteedAnalysisFieldValidator: ValidatorFn = (control) => {
	const val = control.value;

	if (val && val.length > 0) {
		const isValid =
			GUARANTEED_ANALYSIS_FORMAT_REGEX.test(val) ||
			val.toLowerCase() === "N/A".toLowerCase();

		if (!isValid) {
			return { invalidAnalysis: true };
		}
	}

	return null;
};

export const applicationRateFieldValidator: ValidatorFn = (control) => {
	const val = control.value;

	if (val && val.length > 0) {
		const isValid = APPLICATION_RATE_FORMAT_REGEX.test(val);

		if (!isValid) {
			return { invalidApplicationRate: true };
		}
	}

	return null;
};

/**
 * Marks all form controls as dirty and touched to display validation errors.
 *
 * This utility function is useful when handling form submissions to ensure that
 * all validation errors are visible to the user, even if they haven't interacted
 * with every form field.
 *
 * @param form - The Angular FormGroup to process
 * @returns The same FormGroup instance after marking it as touched
 *
 * @example
 * ```typescript
 * const myForm = new FormGroup({...});
 *
 * onSubmit() {
 *   if (myForm.invalid) {
 *     showAllFormErrorsOnSubmit(myForm);
 *     return;
 *   }
 *   // process valid form submission
 * }
 * ```
 */
export const showAllFormErrorsOnSubmit = (form: FormGroup) => {
	Object.entries(form.controls).forEach(([_, ctrl]) => ctrl.markAsDirty());

	return form.markAllAsTouched();
};

export const websiteUrlValidator: ValidatorFn = (control) => {
	const val = control.value;

	if (val && val.length > 0) {
		const isValid =
			/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=~_:();,]*)?$/.test(val);

		if (!isValid) {
			return { invalidUrl: true };
		}
	}

	return null;
};
