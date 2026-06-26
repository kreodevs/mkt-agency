import {
  Injectable,
  LoggerService,
  LogLevel,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LEVEL_ORDER: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly minLevel: LogLevel;

  constructor(config: ConfigService) {
    const configured = config.get<string>('LOG_LEVEL', 'log').toLowerCase();
    this.minLevel = (LEVEL_ORDER.includes(configured as LogLevel)
      ? configured
      : 'log') as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(this.minLevel);
  }

  private write(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload: Record<string, unknown> = {
      level,
      timestamp: new Date().toISOString(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };

    if (context) {
      payload.context = context;
    }

    if (trace) {
      payload.trace = trace;
    }

    const line = JSON.stringify(payload);

    if (level === 'error' || level === 'fatal') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  fatal(message: unknown, context?: string): void {
    this.write('fatal', message, context);
  }
}
