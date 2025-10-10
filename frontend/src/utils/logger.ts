interface LogEntry {
  type: 'user_activity' | 'error' | 'info' | 'warning';
  action: string;
  userId?: string;
  email?: string;
  noteId?: string;
  details?: any;
  timestamp: string;
  userAgent: string;
  url: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  constructor() {
    // Logger initialized
  }

  private formatLog(level: string, entry: LogEntry, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  private log(level: 'info' | 'warn' | 'error', entry: LogEntry, message: string) {
    const formattedMessage = this.formatLog(level, entry, message);
    
    if (this.isDevelopment) {
      console[level](formattedMessage, entry);
    } else {
      // In production, you might want to send logs to a logging service
      // For now, we'll just use console logging
      console[level](formattedMessage, entry);
    }
  }

  info(type: LogEntry['type'], action: string, details?: any) {
    const entry: LogEntry = {
      type,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.log('info', entry, `${type}: ${action}`);
  }

  warn(type: LogEntry['type'], action: string, details?: any) {
    const entry: LogEntry = {
      type,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.log('warn', entry, `${type}: ${action}`);
  }

  error(type: LogEntry['type'], action: string, details?: any) {
    const entry: LogEntry = {
      type,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.log('error', entry, `${type}: ${action}`);
  }

  // Specific logging methods for common activities
  userActivity(action: string, userId?: string, email?: string, details?: any) {
    this.info('user_activity', action, { userId, email, ...details });
  }

  noteActivity(action: string, noteId?: string, userId?: string, details?: any) {
    this.info('user_activity', `note_${action}`, { noteId, userId, ...details });
  }

  authActivity(action: string, email?: string, details?: any) {
    this.info('user_activity', `auth_${action}`, { email, ...details });
  }

  apiError(action: string, error: any, details?: any) {
    this.error('error', `api_${action}`, { error: error.message || error, ...details });
  }
}

export const logger = new Logger();
