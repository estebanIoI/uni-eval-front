/**
 * Servicio para Aspectos y Escalas (a/e)
 * Acceso a endpoints /a/e según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import type { ApiResponse } from '../../types/api.types';

export interface AspectoEscala {
  id: number;
  aspecto_id: number;
  escala_id: number;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
  [key: string]: any;
}

export interface AspectoBulkItem {
  id: number;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

export interface EscalaBulkItem {
  id?: number | null;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

export interface AspectoEscalaBulkItem {
  escalas: number[] | EscalaBulkItem[];
  aspectos: number[] | AspectoBulkItem[];
  es_pregunta_abierta: boolean;
}

export interface AspectoEscalaBulkInput {
  items: AspectoEscalaBulkItem[];
}

export interface AspectoEscalaBulkResponse {
  success: boolean;
  data?: {
    total: number;
    created: number;
    updated: number;
  };
  [key: string]: any;
}

export interface UpdateAspectoEscalaInput {
  aspecto_id?: number;
  escala_id?: number;
  es_cmt?: boolean;
  es_cmt_oblig?: boolean;
}

class AEService extends BaseService<AspectoEscala, AspectoEscalaBulkInput, UpdateAspectoEscalaInput> {
  constructor() {
    super('/a/e');
  }

  /**
   * Bulk insert relaciones aspecto-escala
   * POST /a/e/bulk
   */
  async bulkCreateAE(data: AspectoEscalaBulkInput): Promise<ApiResponse<AspectoEscalaBulkResponse>> {
    return this.executeAsync(
      () => this.bulkCreate(data),
      { success: false, data: {} } as AspectoEscalaBulkResponse
    );
  }
}

export const aEService = new AEService();
