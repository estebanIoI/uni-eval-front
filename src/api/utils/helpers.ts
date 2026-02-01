/**
 * Utilidades para la API
 * Helpers para query params, transformaciones, validaciones, etc.
 */

import type { QueryParams, PaginationParams, FilterParams } from '../types/api.types';

// ========================
// QUERY PARAMS
// ========================

/**
 * Construir query params desde objeto
 */
export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parsear query params desde URL
 */
export function parseQueryParams(url: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(url.split('?')[1] || '');
  
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * Combinar parámetros de paginación y filtros
 */
export function mergeQueryParams(
  pagination?: PaginationParams,
  filters?: FilterParams
): QueryParams {
  return {
    ...pagination,
    ...filters,
  };
}

// ========================
// DATE FORMATTING
// ========================

/**
 * Formatear fecha para enviar a API
 */
export function formatDateForApi(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Parsear fecha desde API
 */
export function parseDateFromApi(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Formatear rango de fechas
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string) {
  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate),
  };
}

// ========================
// DATA TRANSFORMATION
// ========================

/**
 * Omitir propiedades de un objeto
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Seleccionar propiedades de un objeto
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Limpiar valores undefined/null de un objeto
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value;
    }
  });
  
  return result;
}

// ========================
// VALIDATION
// ========================

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar teléfono
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validar cédula colombiana
 */
export function isValidCedula(cedula: string): boolean {
  const cedulaRegex = /^\d{7,10}$/;
  return cedulaRegex.test(cedula);
}

// ========================
// PAGINATION
// ========================

/**
 * Calcular offset desde página y límite
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calcular número de páginas total
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Obtener rango de items visible
 */
export function getItemRange(page: number, limit: number, total: number) {
  const start = calculateOffset(page, limit) + 1;
  const end = Math.min(page * limit, total);
  return { start, end, total };
}

// ========================
// ERROR HANDLING
// ========================

/**
 * Extraer mensaje de error
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'Error desconocido';
}

/**
 * Es error de red
 */
export function isNetworkError(error: any): boolean {
  return error?.code === 0 || error?.message?.includes('fetch');
}

/**
 * Es error de autenticación
 */
export function isAuthError(error: any): boolean {
  return error?.code === 401 || error?.code === 403;
}

/**
 * Es error de validación
 */
export function isValidationError(error: any): boolean {
  return error?.code === 400 || error?.code === 422;
}

// ========================
// STORAGE
// ========================

/**
 * Guardar en localStorage de forma segura
 */
export function setStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

/**
 * Obtener de localStorage de forma segura
 */
export function getStorage<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === 'undefined') return defaultValue || null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue || null;
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return defaultValue || null;
  }
}

/**
 * Eliminar de localStorage
 */
export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error al eliminar de localStorage:', error);
  }
}

// ========================
// DEBOUNCE & THROTTLE
// ========================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ========================
// ARRAY HELPERS
// ========================

/**
 * Agrupar array por propiedad
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Ordenar array por propiedad
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Eliminar duplicados
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) return Array.from(new Set(array));
  
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
