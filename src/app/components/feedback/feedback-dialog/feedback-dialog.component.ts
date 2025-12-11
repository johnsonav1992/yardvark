import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, required, email, Field, disabled } from '@angular/forms/signals';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { postReq, apiUrl } from '../../../utils/httpUtils';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'feedback-dialog',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MessageModule,
    Field
  ],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss'
})
export class FeedbackDialogComponent {
  private _dialogRef = inject(DynamicDialogRef);

  public isSubmitting = signal(false);
  public submitError = signal<string | null>(null);
  public submitSuccess = signal(false);

  // Signal-based form model
  public formModel = signal({
    name: '',
    email: '',
    message: '',
    feedbackType: 'general' as 'general' | 'bug' | 'enhancement'
  });

  // Create signal form with validation schema
  public form = form(this.formModel, (f) => {
    required(f.name);
    disabled(f.name, () => this.isSubmitting());
    
    required(f.email);
    email(f.email);
    disabled(f.email, () => this.isSubmitting());
    
    required(f.message);
    disabled(f.message, () => this.isSubmitting());
    
    required(f.feedbackType);
    disabled(f.feedbackType, () => this.isSubmitting());
  });

  // Computed signal for feedback type based on form value
  public feedbackType = computed(() => this.form.feedbackType().value());

  public feedbackOptions = [
    {
      label: 'General Feedback',
      value: 'general',
      icon: 'ti ti-message-circle'
    },
    { label: 'Bug Report', value: 'bug', icon: 'ti ti-bug' },
    { label: 'Feature Request', value: 'enhancement', icon: 'ti ti-bulb' }
  ];

  public messagePlaceholder = computed(() => {
    const feedbackType = this.feedbackType();

    switch (feedbackType) {
      case 'bug':
        return 'Describe the bug you encountered. Please include steps to reproduce the issue:\n\n1. Go to...\n2. Click on...\n3. The bug occurs when...\n\nInclude any error messages and screenshot links (upload to Google Photos, etc.) if possible.';
      case 'enhancement':
        return "Describe the feature or improvement you'd like to see. What problem would this solve for you?";
      default:
        return "Tell us what you think about Yardvark. What's working well? What could be improved?";
    }
  });

  public successMessage = computed(() => {
    const feedbackType = this.feedbackType();

    switch (feedbackType) {
      case 'bug':
        return 'Thank you for the bug report! We will work on fixing this issue soon.';
      case 'enhancement':
        return 'Thank you for the feature request! We will consider it for future updates.';
      default:
        return 'Thank you for your feedback! We appreciate your input.';
    }
  });

  public onSubmit(): void {
    // Check if form is valid
    if (this.form().invalid()) {
      // Mark all fields as touched to show validation errors
      this.form.name().markAsTouched();
      this.form.email().markAsTouched();
      this.form.message().markAsTouched();
      this.form.feedbackType().markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = this.form().value();

    postReq(apiUrl('email/feedback'), formData).subscribe({
      next: () => {
        this.submitSuccess.set(true);

        setTimeout(() => {
          this._dialogRef.close(true);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
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
