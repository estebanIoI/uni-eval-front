/**
 * Sistema de logging centralizado para producción
 * Permite debugging sin console.logs en producción
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: error?.stack,
    };

    // Guardar en memoria
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // En desarrollo, mostrar en consola
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level);
      console.log(
        `%c[${level}] ${message}`,
        style,
        context ? context : ''
      );
      if (error?.stack) {
        console.error(error.stack);
      }
    }

    // En producción, enviar a servicio de logging (opcional)
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      this.sendToExternalLogger(entry);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: normal',
      [LogLevel.INFO]: 'color: #0066cc; font-weight: bold',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold',
    };
    return styles[level];
  }

  private sendToExternalLogger(entry: LogEntry) {
    // Implementar envío a servicio externo (Sentry, LogRocket, etc.)
    // Por ahora, solo almacenar localmente
    try {
      const existingLogs = localStorage.getItem('app_error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);
      
      // Mantener solo los últimos 50 errores
      if (logs.length > 50) logs.shift();
      
      localStorage.setItem('app_error_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }

  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Obtener logs almacenados (útil para debugging)
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Limpiar logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Obtener logs de errores del localStorage
   */
  getStoredErrorLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem('app_error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * Exportar logs como JSON (para debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instancia singleton
export const logger = new Logger();
