/**
 * Shared validation utilities — single source of truth for input checks.
 *
 * Pure helpers (`isMobileValid`, `isEmailValid`, `sanitizeMobile`) and
 * field-level error helpers (`mobileError`, `emailError`) that take a
 * `required` flag so callers don't repeat empty/required logic.
 */

const MOBILE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MSG_MOBILE_INVALID = 'Enter a valid 10-digit mobile number.';
const MSG_EMAIL_INVALID = 'Enter a valid email address.';
const MSG_REQUIRED = 'This field is required.';
const MSG_DIGITS_ONLY = 'Only numbers are allowed.';

export interface FieldOptions {
  required?: boolean;
  /** Optional override for the "required" message. */
  requiredMessage?: string;
  /** Optional override for the format-invalid message. */
  invalidMessage?: string;
}

export function isMobileValid(value: string | null | undefined): boolean {
  return MOBILE_REGEX.test(value || '');
}

export function isEmailValid(value: string | null | undefined): boolean {
  return EMAIL_REGEX.test(value || '');
}

/** Strip non-digits and clamp to 10 chars. */
export function sanitizeMobile(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}

/** Returns a user-facing error string for a mobile field, or '' when valid. */
export function mobileError(value: string | null | undefined, opts: FieldOptions = {}): string {
  const v = value || '';
  if (!v) return opts.required ? (opts.requiredMessage || MSG_REQUIRED) : '';
  return isMobileValid(v) ? '' : (opts.invalidMessage || MSG_MOBILE_INVALID);
}

/** Returns a user-facing error string for an email field, or '' when valid. */
export function emailError(value: string | null | undefined, opts: FieldOptions = {}): string {
  const v = value || '';
  if (!v) return opts.required ? (opts.requiredMessage || MSG_REQUIRED) : '';
  return isEmailValid(v) ? '' : (opts.invalidMessage || MSG_EMAIL_INVALID);
}

/**
 * Returns a user-facing error for a generic required string field, or ''.
 * Use for non-format fields like Name where only "required" matters.
 */
export function requiredError(value: string | null | undefined, opts: FieldOptions = {}): string {
  const v = (value || '').trim();
  if (!v && opts.required) return opts.requiredMessage || MSG_REQUIRED;
  return '';
}

/**
 * Keypress guard for numeric inputs. Call from `(keypress)`.
 * Returns the string `MSG_DIGITS_ONLY` if a non-digit was blocked, else ''.
 */
export function blockNonDigitKey(event: KeyboardEvent): string {
  if (event.ctrlKey || event.metaKey || event.altKey) return '';
  if (event.key.length === 1 && !/^\d$/.test(event.key)) {
    event.preventDefault();
    return MSG_DIGITS_ONLY;
  }
  return '';
}

export const VALIDATION_MESSAGES = {
  mobileInvalid: MSG_MOBILE_INVALID,
  emailInvalid: MSG_EMAIL_INVALID,
  required: MSG_REQUIRED,
  digitsOnly: MSG_DIGITS_ONLY
};
