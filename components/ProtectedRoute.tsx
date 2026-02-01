'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/src/api';
import type { AppRoleName } from '@/src/api/core/auth';
import { hasRole, getDefaultRoute, hasGlobalRole } from '@/src/api/core/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRoleName[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getToken();
      
      if (!token) {
        console.log('❌ No hay token, redirigiendo al login');
        router.push('/login');
        return;
      }

      // Obtener usuario desde localStorage
      const user = authService.getCurrentUser();
      
      if (!user) {
        console.log('❌ No hay usuario en localStorage, redirigiendo al login');
        router.push('/login');
        return;
      }

      console.log('🔍 ProtectedRoute - Verificando autorización');
      console.log('  Usuario:', user.user_name);
      console.log('  Roles de usuario (rolesApp):', user.rolesApp?.map((r: any) => r.name));
      console.log('  Roles permitidos:', allowedRoles);

      // Si no se especifican roles, solo requiere autenticación
      if (!allowedRoles || allowedRoles.length === 0) {
        console.log('✅ No se requieren roles específicos, acceso permitido');
        setIsAuthorized(true);
        return;
      }

      // Verificar si tiene rol global (Admin bypass)
      if (hasGlobalRole(user)) {
        console.log('✅ Usuario tiene rol global (Admin), acceso permitido');
        setIsAuthorized(true);
        return;
      }

      // Verificar si tiene alguno de los roles permitidos
      const authorized = hasRole(user, allowedRoles);
      
      if (authorized) {
        console.log('✅ Usuario autorizado');
        setIsAuthorized(true);
      } else {
        console.log('❌ Usuario NO autorizado, redirigiendo a su ruta predeterminada');
        const defaultRoute = getDefaultRoute(user);
        console.log('  Ruta predeterminada:', defaultRoute);
        router.push(defaultRoute);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // Mientras se verifica la autorización, mostrar loading
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  return null;
} 