/**
 * Hook personalizado para gestión de autenticación mejorada
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, tokenManager, logger } from '@/src/api';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  // Verificar autenticación al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasValidToken = tokenManager.hasValidTokens();
        setIsAuthenticated(hasValidToken);

        if (hasValidToken) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          
          // Refrescar token si es necesario
          await tokenManager.refreshTokenIfNeeded();
        }
      } catch (error) {
        logger.error('Error verificando autenticación', { error });
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Verificar periódicamente el estado del token
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const hasValidToken = tokenManager.hasValidTokens();
        
        if (!hasValidToken) {
          logger.warn('Token expirado, redirigiendo a login');
          handleLogout();
        } else {
          await tokenManager.refreshTokenIfNeeded();
        }
      } catch (error) {
        logger.error('Error en verificación periódica', { error });
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    logger.info('Usuario cerrando sesión');
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.replace('/login');
  }, [router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      return await tokenManager.refreshTokenIfNeeded();
    } catch (error) {
      logger.error('Error al refrescar token', { error });
      return false;
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    logout: handleLogout,
    refreshToken,
  };
}
