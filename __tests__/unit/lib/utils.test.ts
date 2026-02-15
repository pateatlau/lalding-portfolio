import { describe, it, expect } from 'vitest';
import { validateString, getErrorMessage } from '@/lib/utils';

describe('validateString', () => {
  it('returns true for valid string within maxLength', () => {
    expect(validateString('hello', 10)).toBe(true);
  });

  it('returns true for string at exact maxLength', () => {
    expect(validateString('hello', 5)).toBe(true);
  });

  it('returns false for string exceeding maxLength', () => {
    expect(validateString('hello world', 5)).toBe(false);
  });

  it('returns false for null', () => {
    expect(validateString(null, 10)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validateString(undefined, 10)).toBe(false);
  });

  it('returns false for number', () => {
    expect(validateString(123, 10)).toBe(false);
  });

  it('returns false for object', () => {
    expect(validateString({ message: 'hello' }, 10)).toBe(false);
  });

  it('returns false for empty string (falsy)', () => {
    expect(validateString('', 10)).toBe(false);
  });

  it('returns false for array', () => {
    expect(validateString(['hello'], 10)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
  });

  it('extracts message from object with message property', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
  });

  it('extracts message from object with non-string message property', () => {
    expect(getErrorMessage({ message: 123 })).toBe('123');
  });

  it('returns string directly when passed a string', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('returns default message for null', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong');
  });

  it('returns default message for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong');
  });

  it('returns default message for number', () => {
    expect(getErrorMessage(42)).toBe('Something went wrong');
  });

  it('returns default message for empty object', () => {
    expect(getErrorMessage({})).toBe('Something went wrong');
  });

  it('handles TypeError instances', () => {
    expect(getErrorMessage(new TypeError('Type error'))).toBe('Type error');
  });
});
