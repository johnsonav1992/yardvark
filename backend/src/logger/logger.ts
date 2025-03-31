import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{
      method: string;
      url: string;
      body: unknown;
    }>();
    const response = httpContext.getResponse<{ statusCode: number }>();

    const { method, url, body } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        let logMessage = `${method} ${url} ${statusCode} - ${duration}ms`;

        if (body) {
          logMessage += ` - BODY: ${JSON.stringify(body, null, 2)}`;
        }

        this.logger.log(logMessage);
      }),
    );
  }
}
