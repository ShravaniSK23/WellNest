import { describe, it, expect } from 'vitest';
import { formatApiError } from '../api/apiClient';
import { AxiosError } from 'axios';

describe('API Client Error Formatting', () => {
  it('extracts nested backend error.message correctly', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: {
            code: 'BAD_REQUEST',
            message: 'Password must be at least 8 characters long',
          },
        },
      },
    } as unknown as AxiosError;

    const message = formatApiError(error);
    expect(message).toBe('Password must be at least 8 characters long');
  });

  it('handles account lockout status 423', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 423,
        data: {
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account locked due to 5 failed login attempts.',
          },
        },
      },
    } as unknown as AxiosError;

    const message = formatApiError(error);
    expect(message).toBe('Account locked due to 5 failed login attempts.');
  });

  it('handles network disconnection when response is undefined', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
    } as unknown as AxiosError;

    const message = formatApiError(error);
    expect(message).toContain('Unable to connect to the WellNest server');
  });
});
