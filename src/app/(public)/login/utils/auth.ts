/**
 * Utilidades de autenticación para el flujo de login
 * - Persistencia de usuario recordado (localStorage)
 * - Almacenamiento de datos de usuario (localStorage)
 * 
 * NOTA: La lógica de autorización y rutas está centralizada en
 * @/src/api/core/auth/authorization.service
 */

import type { LoginResponse } from '@/src/api/services/auth/auth.service';
import type { User } from '@/src/api/core/auth/types';
import { getDefaultRoute } from '@/src/api/core/auth/authorization.service';

type AuthUser = LoginResponse['user'];

/**
 * Determina la ruta de redirección según los roles del usuario
 * Usa el servicio centralizado de autorización
 */
export const getRedirectPath = (userData: AuthUser): string => {
  // Convertir AuthUser a User para usar el servicio centralizado
  const user: User = {
    user_id: userData.user_id,
    user_name: userData.user_name,
    user_username: userData.user_username,
    user_email: userData.user_email,
    rolesAuth: userData.rolesAuth || [],
    rolesAuthIds: userData.rolesAuthIds || [],
    rolesApp: userData.rolesApp || [],
    rolesAppIds: userData.rolesAppIds || [],
  };
  
  const route = getDefaultRoute(user);
  
  if (route === '/login') {
    throw new Error("Rol de usuario no reconocido o sin ruta configurada");
  }
  
  return route;
};

/**
 * Guarda o elimina el username en localStorage para "Recordarme"
 */
export const saveRememberedUsername = (username: string, remember: boolean) => {
  try {
    if (remember) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
  } catch (error) {
    console.warn("Error saving username to localStorage:", error);
  }
};

/**
 * Recupera el username guardado de localStorage
 */
export const getRememberedUsername = (): string | null => {
  try {
    return localStorage.getItem("rememberedUsername");
  } catch (error) {
    console.warn("Error reading username from localStorage:", error);
    return null;
  }
};

/**
 * Guarda los datos del usuario en localStorage
 * Utilizado para mantener la sesión activa
 */
export const saveUserData = (userData: AuthUser) => {
  try {
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.warn("Error saving user data to localStorage:", error);
  }
};