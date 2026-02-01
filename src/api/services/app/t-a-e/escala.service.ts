/**
 * Servicio para Escalas, Categorías y Configuración de Escalas
 * Acceso a endpoints /escala, /cat/e, /cfg/e y relaciones /cat/e/escalas
 */

import { BaseService } from '../../../core/BaseService';
import { httpClient } from '../../../core/HttpClient';
import type { ApiResponse } from '../../../types/api.types';

// ========================
// TYPES
// ========================

export interface Escala {
	id: number;
	sigla: string;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CategoriaEscala {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface ConfiguracionEscala {
	id: number;
	cfg_t_id: number;
	escala_id: number;
	puntaje: number;
	orden: number;
	es_activo?: boolean | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CreateEscalaInput {
	sigla: string;
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateEscalaInput {
	sigla?: string;
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateCategoriaEscalaInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateCategoriaEscalaInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateConfiguracionEscalaInput {
	cfg_t_id: number;
	escala_id: number;
	puntaje: number;
	orden: number;
	es_activo?: boolean;
}

export interface UpdateConfiguracionEscalaInput {
	cfg_t_id?: number;
	escala_id?: number;
	puntaje?: number;
	orden?: number;
	es_activo?: boolean;
}

export interface EscalaMapItem extends Escala {
	map_id: number;
}

export interface CategoriaEscalaItemsResponse {
	categoria_id: number;
	items: EscalaMapItem[];
}

export interface CreateCategoriaEscalaMapInput {
	categoryData: {
		id?: number;
		nombre?: string;
		descripcion?: string | null;
	};
	itemData: Array<{
		id?: number;
		sigla?: string;
		nombre?: string;
		descripcion?: string | null;
	}>;
}

export interface CreateCategoriaEscalaMapResponse {
	category: CategoriaEscala;
	mappings: Array<{
		id: number;
		categoria_id: number;
		escala_id: number;
		fecha_creacion?: string | null;
		fecha_actualizacion?: string | null;
	}>;
}

export interface CfgEBulkItem {
	escala_id: number;
	puntaje: number;
	orden: number;
	es_activo: boolean;
}

export interface CfgEBulkInput {
	cfg_t_id: number;
	items: CfgEBulkItem[];
}

// ========================
// SERVICES
// ========================

class EscalaService extends BaseService<Escala, CreateEscalaInput, UpdateEscalaInput> {
	constructor() {
		super('/escala');
	}
}

class CategoriaEscalaService extends BaseService<
	CategoriaEscala,
	CreateCategoriaEscalaInput,
	UpdateCategoriaEscalaInput
> {
	constructor() {
		super('/cat/e');
	}
}

class ConfiguracionEscalaService extends BaseService<
	ConfiguracionEscala,
	CreateConfiguracionEscalaInput,
	UpdateConfiguracionEscalaInput
> {
	constructor() {
		super('/cfg/e');
	}

	/**
	 * Actualizar campo booleano (ej: es_activo)
	 * PUT /cfg/e/{id} con campo específico
	 */
	async updateBooleanField(id: number, field: string, value: number | boolean): Promise<ApiResponse<ConfiguracionEscala>> {
		return super.updateBooleanField(id, field, value);
	}

	/**
	 * Bulk crear configuración de escalas
	 * POST /cfg/e/bulk
	 */
	async bulkCreateCfgE(data: CfgEBulkInput): Promise<ApiResponse<any>> {
		return this.executeAsync(
			() => httpClient.post('/cfg/e/bulk', data),
			{ success: false, data: [] }
		);
	}
}

class CategoriaEscalaMapService {
	/**
	 * Listar escalas asociadas a una categoría
	 * GET /cat/e/{id}/escalas
	 */
	async listEscalasByCategoria(
		categoriaId: number
	): Promise<ApiResponse<CategoriaEscalaItemsResponse>> {
		try {
			const response = await httpClient.get<CategoriaEscalaItemsResponse>(`/cat/e/${categoriaId}/escalas`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { categoria_id: categoriaId, items: [] }, error };
		}
	}

	/**
	 * Crear categoría con escalas asociadas (o asociar escalas existentes)
	 * POST /cat/e/escalas
	 */
	async createCategoriaMap(
		payload: CreateCategoriaEscalaMapInput
	): Promise<ApiResponse<CreateCategoriaEscalaMapResponse>> {
		try {
			const response = await httpClient.post<CreateCategoriaEscalaMapResponse>('/cat/e/escalas', payload);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { category: {} as CategoriaEscala, mappings: [] }, error };
		}
	}

	/**
	 * Eliminar asociación de escala en una categoría
	 * DELETE /cat/e/{id}/escalas/{itemId}
	 */
	async removeEscalaFromCategoria(
		categoriaId: number,
		escalaId: number
	): Promise<ApiResponse<{ deleted: number }>> {
		try {
			const response = await httpClient.delete<{ deleted: number }>(`/cat/e/${categoriaId}/escalas/${escalaId}`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { deleted: 0 }, error };
		}
	}
}

export const escalaService = new EscalaService();
export const escalasValoracionService = escalaService;
export const categoriaEscalaService = new CategoriaEscalaService();
export const configuracionValoracionService = new ConfiguracionEscalaService();
export const categoriaEscalaMapService = new CategoriaEscalaMapService();
