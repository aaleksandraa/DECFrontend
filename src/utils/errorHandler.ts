import { AxiosError } from 'axios';

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  originalError?: unknown;
}

export interface ValidationErrors {
  [field: string]: string[];
}

class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and normalize errors from various sources
   */
  handle(error: unknown, context?: string): AppError {
    const appError = this.normalizeError(error);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${context || 'Error'}]`, appError);
    }

    // In production, you could send to a logging service like Sentry
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { tags: { context }, extra: appError.details });
    // }

    return appError;
  }

  /**
   * Normalize different error types into AppError
   */
  private normalizeError(error: unknown): AppError {
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error as AxiosError<{ message?: string; errors?: ValidationErrors }>);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Došlo je do neočekivane greške.',
        timestamp: new Date(),
        originalError: error,
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        timestamp: new Date(),
      };
    }

    // Unknown error type
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Došlo je do neočekivane greške.',
      timestamp: new Date(),
      originalError: error,
    };
  }

  /**
   * Handle Axios-specific errors
   */
  private handleAxiosError(error: AxiosError<{ message?: string; errors?: ValidationErrors }>): AppError {
    const status = error.response?.status;
    const data = error.response?.data;

    // No response (network error)
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Nema konekcije sa serverom. Provjerite internet vezu.',
        timestamp: new Date(),
        originalError: error,
      };
    }

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: data?.message || 'Neispravan zahtjev.',
          details: data?.errors,
          timestamp: new Date(),
        };

      case 401:
        return {
          code: 'UNAUTHENTICATED',
          message: 'Sesija je istekla. Molimo prijavite se ponovo.',
          timestamp: new Date(),
        };

      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Nemate dozvolu za ovu akciju.',
          timestamp: new Date(),
        };

      case 404:
        return {
          code: 'NOT_FOUND',
          message: data?.message || 'Traženi resurs nije pronađen.',
          timestamp: new Date(),
        };

      case 422:
        return {
          code: 'VALIDATION_ERROR',
          message: data?.message || 'Validacija nije uspjela.',
          details: data?.errors,
          timestamp: new Date(),
        };

      case 429:
        return {
          code: 'TOO_MANY_REQUESTS',
          message: 'Previše zahtjeva. Molimo sačekajte nekoliko minuta.',
          timestamp: new Date(),
        };

      case 500:
        return {
          code: 'SERVER_ERROR',
          message: 'Greška na serveru. Molimo pokušajte ponovo kasnije.',
          timestamp: new Date(),
        };

      case 503:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Servis je trenutno nedostupan. Molimo pokušajte ponovo kasnije.',
          timestamp: new Date(),
        };

      default:
        return {
          code: `HTTP_${status}`,
          message: data?.message || 'Došlo je do greške prilikom komunikacije sa serverom.',
          timestamp: new Date(),
          originalError: error,
        };
    }
  }

  /**
   * Type guard for Axios errors
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  /**
   * Get user-friendly message from error
   */
  getUserMessage(error: unknown): string {
    const appError = this.handle(error);
    return appError.message;
  }

  /**
   * Get validation errors from error response
   */
  getValidationErrors(error: unknown): ValidationErrors | null {
    const appError = this.handle(error);
    if (appError.code === 'VALIDATION_ERROR' && appError.details) {
      return appError.details as ValidationErrors;
    }
    return null;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error: unknown): boolean {
    const appError = this.handle(error);
    return appError.code === 'UNAUTHENTICATED';
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: unknown): boolean {
    const appError = this.handle(error);
    return appError.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(error: unknown): boolean {
    const appError = this.handle(error);
    return appError.code === 'TOO_MANY_REQUESTS';
  }
}

export const errorHandler = ErrorHandler.getInstance();
