import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      error: { code: 'INTERNAL', message: 'Unexpected server error.' },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        body = { error: { code: this.codeForStatus(status), message: resp } };
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as Record<string, unknown>;
        body = {
          error: {
            code: (r.code as string) ?? this.codeForStatus(status),
            message: (r.message as string) ?? this.defaultMessage(status),
            details: r.details ?? r.errors,
          },
        };
      }
    } else {
      this.logger.error(exception);
    }

    // Render HTML for web (portal/admin) routes; JSON otherwise.
    if (req.accepts(['html', 'json']) === 'html' &&
        (req.path.startsWith('/admin') || req.path.startsWith('/portal'))) {
      res.status(status).render('error', {
        layout: 'main',
        status,
        code: body.error.code,
        message: body.error.message,
      });
      return;
    }

    res.status(status).json(body);
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'AUTH_REQUIRED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 413: return 'PAYLOAD_TOO_LARGE';
      case 415: return 'UNSUPPORTED_MEDIA_TYPE';
      case 429: return 'RATE_LIMITED';
      default:  return 'INTERNAL';
    }
  }

  private defaultMessage(status: number): string {
    switch (status) {
      case 400: return 'Validation failed.';
      case 401: return 'Authentication required.';
      case 403: return 'Forbidden.';
      case 404: return 'Not found.';
      case 429: return 'Too many requests.';
      default:  return 'Request failed.';
    }
  }
}
