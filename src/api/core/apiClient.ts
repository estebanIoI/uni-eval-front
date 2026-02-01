/**
 * Utilidades para cliente API - Métodos adicionales
 */

import { httpClient } from './HttpClient';

export interface ApiClientExtended {
  downloadFile: (
    endpoint: string,
    params?: Record<string, any>,
    options?: { showMessage?: boolean }
  ) => Promise<{ data: Blob }>;
}

/**
 * Cliente API extendido con métodos adicionales
 */
export const apiClient = {
  ...httpClient,

  /**
   * Descargar un archivo desde el servidor
   */
  downloadFile: async (
    endpoint: string,
    params?: Record<string, any>,
    options?: { showMessage?: boolean }
  ): Promise<{ data: Blob }> => {
    try {
      const queryString = params && Object.keys(params).length 
        ? '?' + new URLSearchParams(params).toString()
        : '';

      const url = `${httpClient['baseURL'] || ''}${endpoint}${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...httpClient['defaultHeaders'],
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al descargar archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Extraer nombre del archivo desde headers si existe
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'archivo';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      return {
        data: blob,
      };
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error;
    }
  },
};

/**
 * Obtener token de autenticación
 */
function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || '';
  }
  return '';
}
