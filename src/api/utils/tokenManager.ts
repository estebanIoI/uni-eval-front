/**
 * Gestión centralizada de tokens con refresh automático
 */

import { logger } from './logger';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;  // Cuándo expira el accessToken (15 min)
  refreshTokenExpiresAt?: string; // Cuándo expira el refreshToken (7 días)
  userId?: number;
}

class TokenManager {
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing: boolean = false;
  private backgroundRefreshInterval: NodeJS.Timeout | null = null;

  /**
   * Guardar tokens de forma segura
   */
  setTokens(data: TokenData): void {
    try {
      localStorage.setItem('authToken', data.accessToken);
      
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Guardar AMBOS tiempos de expiración
      if (data.accessTokenExpiresAt) {
        localStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);
      }
      
      if (data.refreshTokenExpiresAt) {
        localStorage.setItem('refreshTokenExpiresAt', data.refreshTokenExpiresAt);
      }
      
      if (data.userId) {
        localStorage.setItem('userId', String(data.userId));
      }
      
      logger.debug('Tokens guardados correctamente');
    } catch (error) {
      logger.error('Error al guardar tokens', { error });
    }
  }

  /**
   * Obtener access token
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  /**
   * Obtener user ID
   */
  getUserId(): number | null {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  /**
   * Verificar si el token está próximo a expirar
   * El accessToken típicamente dura 15 minutos
   * Refrescamos si faltan menos de 5 minutos
   */
  isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem('accessTokenExpiresAt');
    if (!expiresAt) return false;

    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return expirationTime - currentTime < fiveMinutes;
  }

  /**
   * Verificar si el token ha expirado
   */
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('accessTokenExpiresAt');
    if (!expiresAt) return false;

    const expirationTime = new Date(expiresAt).getTime();
    return Date.now() > expirationTime;
  }

  /**
   * Verificar si el refresh token ha expirado
   */
  isRefreshTokenExpired(): boolean {
    const refreshExpiresAt = localStorage.getItem('refreshTokenExpiresAt');
    if (!refreshExpiresAt) return true;

    const expirationTime = new Date(refreshExpiresAt).getTime();
    return Date.now() > expirationTime;
  }

  /**
   * Refrescar token automáticamente
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    // Si ya hay un refresh en progreso, esperar ese
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Si el token no necesita refresh, retornar true
    if (!this.isTokenExpiringSoon() && !this.isTokenExpired()) {
      return true;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      logger.warn('No hay refresh token disponible');
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.executeRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Ejecutar refresh del token
   */
  private async executeRefresh(refreshToken: string): Promise<boolean> {
    try {
      logger.info('Refrescando token de acceso...');

      const userId = this.getUserId();
      if (!userId) {
        logger.error('No se encontró user_id para refrescar token');
        return false;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            user_id: userId,
            refresh_token: refreshToken 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al refrescar token');
      }

      const data = await response.json();

      if (data.success && data.data) {
        this.setTokens({
          accessToken: data.data.accessToken || data.data.token,
          accessTokenExpiresAt: data.data.accessTokenExpiresAt,
          refreshToken: data.data.refreshToken || refreshToken,
          refreshTokenExpiresAt: data.data.refreshExpiresAt,
        });

        logger.info('Token refrescado exitosamente');
        return true;
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error: any) {
      logger.error('Error al refrescar token', { error: error.message });
      this.clearTokens();
      return false;
    }
  }

  /**
   * Limpiar todos los tokens
   */
  clearTokens(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    logger.debug('Tokens limpiados');
  }

  /**
   * Verificar si hay tokens válidos
   * Solo verifica el accessToken, no el refreshToken
   */
  hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }

  /**
   * Verificar si la sesión puede ser restaurada
   * (tiene refreshToken válido aunque accessToken haya expirado)
   */
  canRestoreSession(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken && !this.isRefreshTokenExpired();
  }

  /**
   * Iniciar refresh automático en background
   * Se ejecuta cada minuto para verificar si el token necesita renovarse
   */
  startBackgroundRefresh(): void {
    if (typeof window === 'undefined') return;

    // Evitar iniciar múltiples intervalos
    if (this.backgroundRefreshInterval) {
      logger.debug('Background refresh ya está activo');
      return;
    }

    logger.info('Iniciando background refresh automático (cada 1 minuto)');

    this.backgroundRefreshInterval = setInterval(async () => {
      try {
        if (!this.isRefreshing && this.isTokenExpiringSoon()) {
          logger.debug('Token expirando pronto, refrescando en background...');
          await this.refreshTokenIfNeeded();
        }
      } catch (error) {
        logger.error('Error en background refresh', { error });
      }
    }, 60 * 1000); // Cada 1 minuto
  }

  /**
   * Detener el refresh automático
   */
  stopBackgroundRefresh(): void {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
      this.backgroundRefreshInterval = null;
      logger.debug('Background refresh detenido');
    }
  }
}

// Instancia singleton
export const tokenManager = new TokenManager();
