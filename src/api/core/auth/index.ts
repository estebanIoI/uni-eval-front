/**
 * Índice de exportaciones del módulo de autenticación
 * 
 * ESTRUCTURA PARA PRODUCCIÓN:
 * - Types: Interfaces y constantes
 * - Services: Lógica de validación (IDs + nombres)
 * - Hooks: Integración React
 */

// ========================
// TYPES
// ========================

export type {
  Role,
  User,
  AppRoleName,
  RoleType,
  RoutePermission,
  AuthorizationContext,
} from './types';

export {
  // IDs (base de verdad)
  APP_ROLE_IDS,
  AUTH_ROLE_IDS,
  // Mapeos
  APP_ROLE_ID_TO_NAME,
  APP_ROLE_NAME_TO_ID,
  // Rutas
  ROLE_ROUTES,
  ROLE_PRIORITY,
} from './types';

// ========================
// SERVICES
// ========================

export {
  // Validación por IDs
  hasAppRole,
  hasAuthRole,
  // Validación por nombre
  hasRole,
  hasGlobalRole,
  // Info del usuario
  getUserAppRoleIds,
  getUserAuthRoleIds,
  getUserRoleNames,
  getPrimaryRole,
  getPrimaryRoleId,
  // Rutas
  getDefaultRoute,
  canAccessRoute,
  // Normalización
  normalizeRoleName,
  // Info completa
  getAuthorizationInfo,
  getRoutePermissions,
  ROUTE_PERMISSIONS,
} from './authorization.service';

// ========================
// HOOKS
// ========================

export {
  useAuth,
  useRequireAuth,
  useRequireRole,
  useAuthorizationInfo,
  useRoutePermissions,
} from './useAuth';
