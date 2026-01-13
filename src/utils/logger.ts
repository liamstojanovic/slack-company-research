import { ENV } from '../config/environment';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = LOG_LEVEL_MAP[ENV.app.logLevel] || LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (level < this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';

    console.log(`[${timestamp}] [${levelName}] ${message}${metaString}`);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger();
