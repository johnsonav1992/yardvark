import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { HttpClient } from '@angular/common/http';
import { showAllFormErrorsOnSubmit } from '../../../utils/formUtils';
import { DEV_BE_API_URL } from '../../../constants/api-constants';

@Component({
  selector: 'feedback-dialog',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MessageModule,
    ReactiveFormsModule
  ],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss'
})
export class FeedbackDialogComponent {
  private _dialogRef = inject(DynamicDialogRef);
  private _http = inject(HttpClient);

  public isSubmitting = signal(false);
  public submitError = signal<string | null>(null);
  public submitSuccess = signal(false);

  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    message: new FormControl('', [Validators.required]),
    feedbackType: new FormControl<'general' | 'bug' | 'enhancement'>(
      'general',
      [Validators.required]
    )
  });

  public feedbackOptions = [
    {
      label: 'General Feedback',
      value: 'general',
      icon: 'ti ti-message-circle'
    },
    { label: 'Bug Report', value: 'bug', icon: 'ti ti-bug' },
    { label: 'Feature Request', value: 'enhancement', icon: 'ti ti-bulb' }
  ];

  public getMessagePlaceholder(): string {
    const feedbackType = this.form.get('feedbackType')?.value;

    switch (feedbackType) {
      case 'bug':
        return 'Describe the bug you encountered. Please include steps to reproduce the issue:\n\n1. Go to...\n2. Click on...\n3. The bug occurs when...\n\nInclude any error messages and screenshot links (upload to Google Photos, etc.) if possible.';
      case 'enhancement':
        return "Describe the feature or improvement you'd like to see. What problem would this solve for you?";
      default:
        return "Tell us what you think about Yardvark. What's working well? What could be improved?";
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      showAllFormErrorsOnSubmit(this.form);
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = this.form.value;

    this._http.post(`${DEV_BE_API_URL}/email/feedback`, formData).subscribe({
      next: () => {
        this.submitSuccess.set(true);
        setTimeout(() => {
          this._dialogRef.close(true);
        }, 1500);
      },
      error: (error) => {
        console.error('Error sending feedback:', error);
        this.submitError.set('Failed to send feedback. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  public onCancel(): void {
    this._dialogRef.close(false);
  }
}
