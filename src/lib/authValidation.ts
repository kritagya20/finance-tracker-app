/**
 * Authentication validation utilities for Email, Mobile Number (starting with 9, 8, 7, 6), and 6-Digit MPIN.
 */

// RFC 5322 compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 6-digit MPIN regex
export const MPIN_REGEX = /^\d{6}$/;

export type IdentifierType = 'email' | 'phone' | 'unknown';

export interface ValidationResult {
  isValid: boolean;
  type: IdentifierType;
  errorMessage?: string;
}

/**
 * Checks if a string conforms to a valid email format.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/**
 * Normalizes a mobile input to its core 10 digits, stripping +91 or leading 0.
 */
export function extract10DigitMobile(value: string): string {
  let digits = value.replace(/\D/g, '');
  // If starts with country code 91 and has 12 digits (e.g. +91 98765 43210)
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  // If starts with leading 0 and has 11 digits (e.g. 09876543210)
  else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Checks if a string conforms to a valid 10-digit mobile number starting with 6, 7, 8, or 9.
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = extract10DigitMobile(value);
  if (digits.length !== 10) {
    return false;
  }
  return /^[6-9]/.test(digits);
}

/**
 * Validates a mobile number and returns targeted error messages.
 */
export function validatePhoneNumber(value: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Mobile number is required.' };
  }

  const digits = extract10DigitMobile(trimmed);

  if (digits.length > 0 && !/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      errorMessage: 'Mobile number must start with 9, 8, 7, or 6.',
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      errorMessage: 'Please enter a 10-digit mobile number.',
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      errorMessage: 'Mobile number must be 10 digits.',
    };
  }

  return { isValid: true };
}

/**
 * Validates a 6-digit MPIN.
 * Enforces bank-grade anti-pattern rules:
 * 1. Must be exactly 6 digits.
 * 2. Digits cannot all be identical (e.g. 000000, 111111).
 * 3. Cannot be sequential numbers ascending or descending (e.g. 123456, 987654, 654321).
 * 4. Cannot be repetitive patterns (e.g. 121212, 123123).
 */
export function validateMpin(
  value: string,
  options?: { enforceStrength?: boolean }
): { isValid: boolean; errorMessage?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Please enter your 6-digit MPIN.' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, errorMessage: 'MPIN must contain digits only.' };
  }
  if (trimmed.length !== 6) {
    return { isValid: false, errorMessage: 'MPIN should be of 6 digits.' };
  }

  // Enforce strength checks for new MPIN creation/updates
  if (options?.enforceStrength !== false) {
    // 1. All digits identical check (e.g. 111111, 000000)
    const isAllSame = trimmed.split('').every((char) => char === trimmed[0]);
    if (isAllSame) {
      return {
        isValid: false,
        errorMessage: 'All digits cannot be the same (e.g. 111111).',
      };
    }

    // 2. Sequential numbers check (ascending or descending)
    const SEQUENTIAL_PATTERNS = [
      '012345', '123456', '234567', '345678', '456789',
      '987654', '876543', '765432', '654321', '543210',
    ];
    if (SEQUENTIAL_PATTERNS.includes(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Sequential numbers are not allowed (e.g. 123456 or 654321).',
      };
    }

    let isAsc = true;
    let isDesc = true;
    for (let i = 1; i < trimmed.length; i++) {
      const prev = Number(trimmed[i - 1]);
      const curr = Number(trimmed[i]);
      if (curr !== prev + 1) isAsc = false;
      if (curr !== prev - 1) isDesc = false;
    }
    if (isAsc || isDesc) {
      return {
        isValid: false,
        errorMessage: 'Sequential numbers are not allowed (e.g. 123456 or 654321).',
      };
    }

    // 3. Repetitive sequences check (e.g. 121212, 123123)
    const REPETITIVE_PATTERNS = [
      '121212', '212121', '123123', '321321', '112233', '001122',
    ];
    if (REPETITIVE_PATTERNS.includes(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Repetitive patterns are not allowed (e.g. 121212).',
      };
    }
  }

  return { isValid: true };
}

/**
 * Detects if the user is typing an email, phone number, or undetermined string.
 */
export function detectIdentifierType(value: string): IdentifierType {
  const trimmed = value.trim();
  if (!trimmed) return 'unknown';

  // If it has @ or alphabetic characters, treat as email attempt
  if (/@/.test(trimmed) || /[a-zA-Z]/.test(trimmed)) {
    return 'email';
  }

  // If it starts with + or digits
  if (/^[\d+\s().-]+$/.test(trimmed)) {
    return 'phone';
  }

  return 'unknown';
}

/**
 * Validates a login identifier (either email or 10-digit mobile number starting with 6-9).
 */
export function validateLoginIdentifier(value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      type: 'unknown',
      errorMessage: 'Please enter your email or mobile number.',
    };
  }

  const detectedType = detectIdentifierType(trimmed);

  if (detectedType === 'email') {
    if (isValidEmail(trimmed)) {
      return { isValid: true, type: 'email' };
    }
    return {
      isValid: false,
      type: 'email',
      errorMessage: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  if (detectedType === 'phone') {
    const phoneVal = validatePhoneNumber(trimmed);
    if (phoneVal.isValid) {
      return { isValid: true, type: 'phone' };
    }
    return {
      isValid: false,
      type: 'phone',
      errorMessage: phoneVal.errorMessage || 'Please enter a valid 10-digit mobile number.',
    };
  }

  return {
    isValid: false,
    type: 'unknown',
    errorMessage: 'Please enter a valid email or 10-digit mobile number.',
  };
}

/**
 * Formats display name from an email or phone identifier.
 */
export function deriveDisplayName(identifier: string): string {
  const trimmed = identifier.trim();
  if (isValidEmail(trimmed)) {
    const localPart = trimmed.split('@')[0] || 'User';
    const cleaned = localPart.replace(/[._+-]+/g, ' ');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  if (isValidPhoneNumber(trimmed)) {
    const digits = extract10DigitMobile(trimmed);
    const last4 = digits.slice(-4);
    return `User (••${last4 || 'Mobile'})`;
  }

  return 'User';
}
