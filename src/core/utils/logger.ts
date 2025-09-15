/**
 * @fileoverview Logger utility for structured logging across the application
 */

/**
 * Log levels enum for different types of log messages
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  error: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Creates a structured log entry with timestamp and level
 */
const createLogEntry = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): string => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(meta && { meta }),
  };
  return JSON.stringify(logEntry);
};

/**
 * Console-based logger implementation that outputs structured JSON logs
 * In production, this would be replaced with a proper logging service
 */
export const logger: Logger = {
  error: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.error(createLogEntry(LogLevel.ERROR, message, meta));
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.warn(createLogEntry(LogLevel.WARN, message, meta));
  },

  info: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.info(createLogEntry(LogLevel.INFO, message, meta));
  },

  debug: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.debug(createLogEntry(LogLevel.DEBUG, message, meta));
  },
};
