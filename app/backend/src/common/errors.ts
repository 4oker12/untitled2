import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorBody {
  error: { code: string; message: string; details?: any };
}

export function err(code: string, message: string, details?: any): ErrorBody {
  return { error: { code, message, details } };
}

@Catch()
export class UnifiedErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = err('INTERNAL', 'Internal server error');

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp: any = exception.getResponse();
      if (typeof resp === 'object' && resp?.message) {
        const message = Array.isArray(resp.message) ? resp.message.join(', ') : resp.message;
        body = err(HttpStatus[status] || 'ERROR', message);
      } else if (typeof resp === 'string') {
        body = err(HttpStatus[status] || 'ERROR', resp);
      }
    } else if (exception?.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      body = err('CONFLICT', 'Unique constraint violation');
    }

    res.status(status).json(body);
  }
}
