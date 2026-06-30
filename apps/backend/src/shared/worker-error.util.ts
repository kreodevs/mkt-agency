import { HttpException } from '@nestjs/common';

export function formatWorkerErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'string' && response.trim()) {
      return response.trim();
    }
    if (typeof response === 'object' && response !== null && 'error' in response) {
      const message = (response as { error?: unknown }).error;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }
  }

  if (error instanceof Error && error.message.trim() && error.message !== 'Conflict Exception') {
    return error.message.trim();
  }

  return fallback;
}
