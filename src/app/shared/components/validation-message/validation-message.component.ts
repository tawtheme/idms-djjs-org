import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { ValidationService, ValidationMessage } from '../../validators/validation.service';

@Component({
  selector: 'app-validation-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-message.component.html',
  styleUrls: ['./validation-message.component.scss']
})
export class ValidationMessageComponent implements OnInit {
  @Input() control!: AbstractControl;
  @Input() fieldName: string = '';
  @Input() showOnTouched: boolean = false;
  @Input() showOnDirty: boolean = false;
  @Input() showOnTyping: boolean = true;
  @Input() customMessages: Record<string, string> = {};
  @Input() showIcon: boolean = true;
  @Input() position: 'below' | 'above' | 'inline' = 'below';

  validationErrors: ValidationMessage[] = [];

  constructor(private validationService: ValidationService) {}

  ngOnInit(): void {
    this.updateValidationErrors();
    
    // Subscribe to control status changes
    this.control.statusChanges?.subscribe(() => {
      this.updateValidationErrors();
    });

    // Subscribe to value changes for real-time validation
    this.control.valueChanges?.subscribe(() => {
      this.updateValidationErrors();
    });
  }

  private updateValidationErrors(): void {
    this.validationErrors = [];
    
    if (!this.control.errors || !this.shouldShowErrors()) {
      return;
    }

    Object.keys(this.control.errors).forEach(errorKey => {
      const error = this.control.errors![errorKey];
      const message = this.getMessage(errorKey, error);
      
      if (message) {
        this.validationErrors.push(message);
      }
    });
  }

  private shouldShowErrors(): boolean {
    // If showOnTyping is enabled, show errors as soon as user starts typing
    if (this.showOnTyping && this.control.value && this.control.value.length > 0) {
      return true;
    }
    
    // If showOnTouched is enabled, show errors when field is touched
    if (this.showOnTouched && !this.control.touched) {
      return false;
    }
    
    // If showOnDirty is enabled, show errors when field is dirty
    if (this.showOnDirty && !this.control.dirty) {
      return false;
    }
    
    // Show errors if control has been interacted with
    return this.control.touched || this.control.dirty || (this.control.value && this.control.value.length > 0);
  }

  private getMessage(errorKey: string, error: any): ValidationMessage | null {
    // Check for custom message first
    if (this.customMessages[errorKey]) {
      return {
        key: errorKey,
        message: this.customMessages[errorKey],
        type: 'error'
      };
    }

    // Map error keys to validation message keys
    const messageKey = this.getValidationMessageKey(errorKey, error);
    
    if (messageKey) {
      return this.validationService.getMessageObject(messageKey, error);
    }

    // Fallback to generic message
    return {
      key: errorKey,
      message: this.getGenericMessage(errorKey),
      type: 'error'
    };
  }

  private getValidationMessageKey(errorKey: string, error: any): string | null {
    const keyMappings: Record<string, string> = {
      'required': 'general.required',
      'email': 'email.format',
      'emailOrPhone': 'emailOrPhone.format',
      'phoneUS': 'phone.format',
      'websiteUrl': 'url.format',
      'noBlankSpaces': 'blank.whitespace',
      'wordCount': 'words.min',
      'exactWordCount': 'words.exact',
      'number': 'number.invalid',
      'numberRange': 'number.min',
      'passwordStrength': 'password.pattern',
      'date': 'date.invalid',
      'pastDate': 'date.past',
      'futureDate': 'date.future',
      'fileSize': 'file.size',
      'fileType': 'file.type',
      'creditCard': 'creditCard.invalid',
      'ssn': 'ssn.invalid',
      'zipCode': 'zipCode.invalid',
      'noConsecutiveChars': 'general.pattern',
      'noRepeatedWords': 'general.pattern',
      'alphanumeric': 'general.pattern',
      'noSpecialChars': 'general.pattern',
      'minlength': 'general.minLength',
      'maxlength': 'general.maxLength',
      'pattern': 'general.pattern',
      'einSsn': 'ein.format'
    };

    return keyMappings[errorKey] || null;
  }

  private getGenericMessage(errorKey: string): string {
    const genericMessages: Record<string, string> = {
      'required': 'This field is required.',
      'email': 'Email must be in format: user@domain.com',
      'emailOrPhone': 'Please enter a valid email address or phone number',
      'phoneUS': 'Phone must be a valid US number: (XXX) XXX-XXXX (area code and exchange cannot start with 0 or 1)',
      'websiteUrl': 'URL must start with http:// or https://',
      'noBlankSpaces': 'This field cannot contain only whitespace.',
      'wordCount': 'Word count does not meet requirements.',
      'exactWordCount': 'Word count must be exact.',
      'number': 'Please enter a valid number.',
      'numberRange': 'Number is out of range.',
      'passwordStrength': 'Password does not meet strength requirements.',
      'date': 'Please enter a valid date.',
      'pastDate': 'Date cannot be in the past.',
      'futureDate': 'Date cannot be in the future.',
      'fileSize': 'File size exceeds limit.',
      'fileType': 'File type is not allowed.',
      'creditCard': 'Please enter a valid credit card number.',
      'ssn': 'Please enter a valid SSN (XXX-XX-XXXX).',
      'zipCode': 'Please enter a valid ZIP code (XXXXX or XXXXX-XXXX).',
      'noConsecutiveChars': 'Too many consecutive characters.',
      'noRepeatedWords': 'Repeated words are not allowed.',
      'alphanumeric': 'Only alphanumeric characters are allowed.',
      'noSpecialChars': 'Special characters are not allowed.',
      'minlength': 'Text is too short.',
      'maxlength': 'Text is too long.',
      'pattern': 'Invalid format.',
      'einSsn': 'EIN/SSN must be a valid US number: XX-XXXXXXX (9 digits with valid format)'
    };

    return genericMessages[errorKey] || 'Invalid input.';
  }

  get componentClasses(): string {
    return [
      'validation-message',
      `validation-message-${this.position}`,
      this.validationErrors.length > 0 ? 'validation-message-visible' : ''
    ].filter(Boolean).join(' ');
  }

  get hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  get errorCount(): number {
    return this.validationErrors.length;
  }
}
