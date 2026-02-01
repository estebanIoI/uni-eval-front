/**
 * Servicio para Configuraciones de Evaluación
 * Acceso a endpoints /cfg/t según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import { httpClient } from '../../core/HttpClient';
import type { ApiResponse } from '../../types/api.types';

// ========================
// TYPES
// ========================

export interface ConfiguracionTipo {
  id: number;
  tipo_evaluacion_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  es_cmt_gen: boolean;
  es_cmt_gen_oblig: boolean;
  es_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  rolesRequeridos?: Array<{
    rol_mix_id: number;
    rol_origen_id: number;
    origen: string;
  }>;
}

export interface CreateConfiguracionTipoInput {
  tipo_evaluacion_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  es_cmt_gen?: boolean;
  es_cmt_gen_oblig?: boolean;
  es_activo?: boolean;
}

export interface UpdateConfiguracionTipoInput {
  tipo_evaluacion_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  es_cmt_gen?: boolean;
  es_cmt_gen_oblig?: boolean;
  es_activo?: boolean;
}

/**
 * Opción de escala asociada a un aspecto
 */
export interface AspectoEscalaOpcion {
  id: number | null;
  sigla: string | null;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  puntaje: string | null;
  a_e_id: number;
}

/**
 * Aspecto con sus escalas/opciones configuradas
 */
export interface AspectoConEscalas {
  id: number;
  cfg_a_id: number;
  nombre: string;
  descripcion: string;
  orden: string;
  es_activo: boolean;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
  opciones: AspectoEscalaOpcion[];
}

/**
 * Respuesta del endpoint /cfg/t/{id}/a-e
 */
export interface ConfiguracionAspectosEscalasResponse {
  aspectos: AspectoConEscalas[];
}

export interface CfgAItem {
  id: number;
  cfg_t_id: number;
  aspecto_id: number;
  orden: string;
  es_activo: boolean;
  aspecto: {
    id: number;
    nombre: string;
    descripcion: string;
  };
}

export interface CfgEItem {
  id: number;
  cfg_t_id: number;
  escala_id: number;
  puntaje: string;
  orden: string;
  es_activo: boolean;
  escala: {
    id: number;
    sigla: string;
    nombre: string;
    descripcion: string;
  };
}

export interface ConfiguracionCfgACfgEResponse {
  cfg_a: CfgAItem[];
  cfg_e: CfgEItem[];
}

// ========================
// SERVICE
// ========================

class ConfiguracionEvaluacionService extends BaseService<
  ConfiguracionTipo,
  CreateConfiguracionTipoInput,
  UpdateConfiguracionTipoInput
> {
  constructor() {
    super('/cfg/t');
  }

  /**
   * Obtener listado de configuraciones según rol del usuario
   * GET /cfg/t/r
   */
  async getAllByRole(): Promise<ApiResponse<ConfiguracionTipo[]>> {
    return this.getCustom('/r');
  }

  /**
   * Obtener aspectos con sus escalas configuradas para una configuración
   * GET /cfg/t/{id}/a-e
   */
  async getAspectosConEscalas(id: number): Promise<ApiResponse<AspectoConEscalas[]>> {
    return this.executeAsync(
      () => httpClient.get<AspectoConEscalas[]>(`/cfg/t/${id}/a-e`),
      []
    );
  }

  /**
   * Obtener cfg_a y cfg_e configurados para una configuración
   * GET /cfg/t/{id}/cfg-a_cfg-e
   */
  async getCfgACfgE(id: number): Promise<ApiResponse<ConfiguracionCfgACfgEResponse>> {
    return this.executeAsync(
      () => httpClient.get<ConfiguracionCfgACfgEResponse>(`/cfg/t/${id}/cfg-a_cfg-e`),
      { cfg_a: [], cfg_e: [] }
    );
  }

  /**
   * Actualizar campo booleano (ej: es_activo, es_cmt_gen, es_cmt_gen_oblig)
   * PUT /cfg/t/{id} con campo específico
   */
  async updateBooleanField(id: number, field: string, value: number | boolean): Promise<ApiResponse<ConfiguracionTipo>> {
    return super.updateBooleanField(id, field, value);
  }
}

export const configuracionEvaluacionService = new ConfiguracionEvaluacionService();
