/**
 * Servicio para Roles
 * Acceso a endpoints /rol según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import type { ApiResponse } from '../../types/api.types';

export interface Rol {
  id: number;
  nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CreateRolInput {
  nombre: string;
}

export interface UpdateRolInput {
  nombre?: string;
}

export interface RolMixto {
  id: number;
  nombre: string;
  origen: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

class RolService extends BaseService<Rol, CreateRolInput, UpdateRolInput> {
  constructor() {
    super('/rol');
  }

  /**
   * Obtener roles locales y remotos (únicos)
   * GET /rol/mix
   */
  async getAllMix(): Promise<ApiResponse<RolMixto[]>> {
    return this.getCustom('/mix');
  }
}

export const rolService = new RolService();
