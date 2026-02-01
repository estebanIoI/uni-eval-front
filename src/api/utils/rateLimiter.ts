/**
 * Rate limiter avanzado para prevenir ataques de fuerza bruta
 * - 3 intentos silenciosos (sin mostrar contador)
 * - Exponential backoff: 30s → 2min → 10min → 1 hora
 * - Persistencia en localStorage
 * - Herramientas de debug para DEV
 */

import { logger } from './logger';

interface RateLimitData {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
  penaltyUntil?: number; // Penalización progresiva entre intentos
  silentAttempts: number; // Intentos sin mostrar contador
  blockSequence: number; // Número de veces que ha sido bloqueado (para exponential backoff)
}

class RateLimiter {
  private storage: Map<string, RateLimitData> = new Map();
  
  // Configuración
  private readonly SILENT_ATTEMPTS = 3; // 3 intentos sin mostrar contador
  private readonly MAX_ATTEMPTS = 8; // Total de intentos permitidos (3 silenciosos + 5 importantes)
  private readonly WINDOW_MS = 30 * 60 * 1000; // 30 minutos para resetear contador
  private readonly STORAGE_KEY_PREFIX = 'ratelimit_';
  
  // Tiempos de bloqueo exponencial (se aplica cuando se alcanza MAX_ATTEMPTS)
  private readonly BLOCK_DURATIONS = [30, 120, 600, 3600]; // 30s, 2min, 10min, 1h
  
  // Penalizaciones progresivas por intento (intento 4, 5, 6, 7, 8)
  private readonly PENALTY_DURATIONS = [25, 120, 300, 600, 900]; // 25s, 2min, 5min, 10min, 15min
  
  constructor() {
    this.loadFromLocalStorage();
    // Sincronizar con localStorage cuando cambia (en otras pestañas)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.loadFromLocalStorage());
    }
  }

  /**
   * Cargar datos desde localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const identifier = key.replace(this.STORAGE_KEY_PREFIX, '');
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          this.storage.set(identifier, data);
        }
      }
    } catch (error) {
      logger.error('Error cargando rate limit data', { error });
    }
  }

  /**
   * Guardar datos en localStorage
   */
  private saveToLocalStorage(identifier: string, data: RateLimitData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${identifier}`,
        JSON.stringify(data)
      );
    } catch (error) {
      logger.error('Error guardando rate limit data', { error });
    }
  }

  /**
   * Obtener duración del bloqueo basada en exponential backoff
   */
  private getBlockDuration(blockSequence: number): number {
    const index = Math.min(blockSequence, this.BLOCK_DURATIONS.length - 1);
    return this.BLOCK_DURATIONS[index] * 1000; // Convertir a ms
  }

  /**
   * Obtener penalización por número de intento
   */
  private getPenaltyDuration(attemptNumber: number): number {
    // attemptNumber es el intento actual (4, 5, 6, 7, 8)
    const penaltyIndex = attemptNumber - this.SILENT_ATTEMPTS - 1; // 0, 1, 2, 3, 4
    if (penaltyIndex < 0 || penaltyIndex >= this.PENALTY_DURATIONS.length) return 0;
    return this.PENALTY_DURATIONS[penaltyIndex] * 1000; // Convertir a ms
  }

  /**
   * Registrar un intento fallido
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    let data = this.storage.get(identifier);

    if (!data) {
      // Primer intento
      data = {
        attempts: 1,
        silentAttempts: 1,
        firstAttemptTime: now,
        blockSequence: 0,
      };
      this.storage.set(identifier, data);
      this.saveToLocalStorage(identifier, data);
      return;
    }

    // Si pasó mucho tiempo desde el primer intento, resetear
    if (now - data.firstAttemptTime > this.WINDOW_MS) {
      data = {
        attempts: 1,
        silentAttempts: 1,
        firstAttemptTime: now,
        blockSequence: 0,
      };
      this.storage.set(identifier, data);
      this.saveToLocalStorage(identifier, data);
      return;
    }

    // Incrementar intentos
    data.attempts++;
    
    // Contar intentos silenciosos
    if (data.silentAttempts < this.SILENT_ATTEMPTS) {
      data.silentAttempts++;
    }

    // ====== LÓGICA DE PENALIZACIÓN ======
    // Después del 3er intento, aplicar penalizaciones progresivas
    if (data.attempts > this.SILENT_ATTEMPTS && data.attempts < this.MAX_ATTEMPTS) {
      const penaltyDuration = this.getPenaltyDuration(data.attempts);
      if (penaltyDuration > 0) {
        data.penaltyUntil = now + penaltyDuration;
        
        logger.info('Penalización aplicada', { 
          identifier, 
          attempts: data.attempts,
          penaltySeconds: Math.ceil(penaltyDuration / 1000),
        });
      }
    }

    // Si se excedió el límite de intentos (8), aplicar bloqueo exponencial
    if (data.attempts >= this.MAX_ATTEMPTS) {
      data.blockSequence++;
      const blockDuration = this.getBlockDuration(data.blockSequence - 1);
      data.blockedUntil = now + blockDuration;
      data.penaltyUntil = undefined; // Limpiar penalización cuando se bloquea
      
      logger.warn('Máximo de intentos alcanzado - Usuario bloqueado', { 
        identifier, 
        attempts: data.attempts,
        blockDurationSeconds: Math.ceil(blockDuration / 1000),
        blockLevel: data.blockSequence,
      });
    }

    this.storage.set(identifier, data);
    this.saveToLocalStorage(identifier, data);
  }

  /**
   * Verificar si está bajo penalización
   */
  isPenalized(identifier: string): boolean {
    const data = this.storage.get(identifier);
    if (!data || !data.penaltyUntil) return false;

    const now = Date.now();
    
    // Si la penalización ha pasado, limpiar
    if (now > data.penaltyUntil) {
      data.penaltyUntil = undefined;
      this.storage.set(identifier, data);
      this.saveToLocalStorage(identifier, data);
      return false;
    }

    return true;
  }

  /**
   * Obtener tiempo de penalización restante (en segundos)
   */
  getPenaltyTimeRemaining(identifier: string): number {
    const data = this.storage.get(identifier);
    if (!data || !data.penaltyUntil) return 0;

    const now = Date.now();
    const remaining = Math.max(0, data.penaltyUntil - now);
    return Math.ceil(remaining / 1000);
  }

  /**
   * Verificar si está bloqueado
   */
  isBlocked(identifier: string): boolean {
    const data = this.storage.get(identifier);
    if (!data || !data.blockedUntil) return false;

    const now = Date.now();
    
    // Si el tiempo de bloqueo ha pasado, limpiar
    if (now > data.blockedUntil) {
      this.reset(identifier);
      return false;
    }

    return true;
  }

  /**
   * Obtener tiempo restante de bloqueo (en segundos)
   */
  getBlockedTimeRemaining(identifier: string): number {
    const data = this.storage.get(identifier);
    if (!data || !data.blockedUntil) return 0;

    const now = Date.now();
    const remaining = Math.max(0, data.blockedUntil - now);
    return Math.ceil(remaining / 1000);
  }

  /**
   * Obtener número de intentos
   */
  getAttempts(identifier: string): number {
    const data = this.storage.get(identifier);
    return data?.attempts || 0;
  }

  /**
   * Obtener intentos restantes
   */
  getRemainingAttempts(identifier: string): number {
    const attempts = this.getAttempts(identifier);
    return Math.max(0, this.MAX_ATTEMPTS - attempts);
  }

  /**
   * Verificar si debe mostrar contador (después de intentos silenciosos)
   * Intento 1-3 → NO mostrar
   * Intento 4+ → SÍ mostrar "X intentos restantes"
   */
  shouldShowCounter(identifier: string): boolean {
    const data = this.storage.get(identifier);
    if (!data) return false;
    return data.attempts > this.SILENT_ATTEMPTS; // Mostrar cuando se pase de 3 intentos
  }

  /**
   * Resetear contador para un usuario
   */
  reset(identifier: string): void {
    this.storage.delete(identifier);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${identifier}`);
    }
  }

  /**
   * Verificar si puede intentar
   */
  canAttempt(identifier: string): { 
    allowed: boolean; 
    remaining: number; 
    blockedFor?: number;
    penaltyTimeRemaining?: number;
    showCounter?: boolean;
  } {
    // Verificar si está bloqueado (límite máximo alcanzado)
    const isBlocked = this.isBlocked(identifier);
    
    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        blockedFor: this.getBlockedTimeRemaining(identifier),
        showCounter: true,
      };
    }

    // Verificar si está bajo penalización
    const isPenalized = this.isPenalized(identifier);
    if (isPenalized) {
      return {
        allowed: false,
        remaining: this.getRemainingAttempts(identifier),
        penaltyTimeRemaining: this.getPenaltyTimeRemaining(identifier),
        showCounter: this.shouldShowCounter(identifier),
      };
    }

    return {
      allowed: true,
      remaining: this.getRemainingAttempts(identifier),
      showCounter: this.shouldShowCounter(identifier),
    };
  }

  /**
   * ====== HERRAMIENTAS DE DEBUG PARA DEV ======
   * Desbloquear un usuario (solo en desarrollo)
   */
  devUnlock(identifier: string): void {
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('devUnlock solo funciona en desarrollo');
      return;
    }
    this.reset(identifier);
    logger.info('Usuario desbloqueado (DEV)', { identifier });
  }

  /**
   * Ver estado de un usuario (solo en desarrollo)
   */
  devGetStatus(identifier: string): any {
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('devGetStatus solo funciona en desarrollo');
      return null;
    }
    const data = this.storage.get(identifier);
    return {
      identifier,
      isBlocked: this.isBlocked(identifier),
      isPenalized: this.isPenalized(identifier),
      attempts: data?.attempts || 0,
      silentAttempts: data?.silentAttempts || 0,
      blockedUntil: data?.blockedUntil ? new Date(data.blockedUntil).toISOString() : null,
      penaltyUntil: data?.penaltyUntil ? new Date(data.penaltyUntil).toISOString() : null,
      blockSequence: data?.blockSequence || 0,
    };
  }

  /**
   * Limpiar todos los datos de rate limit (solo en desarrollo)
   */
  devClearAll(): void {
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('devClearAll solo funciona en desarrollo');
      return;
    }
    this.storage.clear();
    if (typeof window !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
    logger.info('Rate limit data limpiado (DEV)');
  }

  /**
   * Exponer herramientas en window para DEV (acceso desde consola)
   */
  exposeDevTools(): void {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).__rateLimiterDev = {
        unlock: (username: string) => this.devUnlock(username),
        status: (username: string) => this.devGetStatus(username),
        clearAll: () => this.devClearAll(),
      };
      console.log('🔧 RateLimiter DEV tools disponibles en: window.__rateLimiterDev');
    }
  }
}

// Instancia singleton
export const rateLimiter = new RateLimiter();

// Exponer herramientas de dev
rateLimiter.exposeDevTools();
