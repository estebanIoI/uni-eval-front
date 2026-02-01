/**
 * Servicio para Aspectos, Categorías y Configuración de Aspectos
 * Acceso a endpoints /aspecto, /cat/a, /cfg/a y relaciones /cat/a/aspectos
 */

import { BaseService } from '../../../core/BaseService';
import { httpClient } from '../../../core/HttpClient';
import type { ApiResponse } from '../../../types/api.types';

// ========================
// TYPES
// ========================

export interface Aspecto {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CategoriaAspecto {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface ConfiguracionAspecto {
	id: number;
	cfg_t_id: number;
	aspecto_id: number;
	orden: number;
	es_activo?: boolean | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CreateAspectoInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateAspectoInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateCategoriaAspectoInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateCategoriaAspectoInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateConfiguracionAspectoInput {
	cfg_t_id: number;
	aspecto_id: number;
	orden: number;
	es_activo?: boolean;
}

export interface UpdateConfiguracionAspectoInput {
	cfg_t_id?: number;
	aspecto_id?: number;
	orden?: number;
	es_activo?: boolean;
}

export interface AspectoMapItem extends Aspecto {
	map_id: number;
}

export interface CategoriaAspectoItemsResponse {
	categoria_id: number;
	items: AspectoMapItem[];
}

export interface CreateCategoriaAspectoMapInput {
	categoryData: {
		id?: number;
		nombre?: string;
		descripcion?: string | null;
	};
	itemData: Array<{
		id?: number;
		nombre?: string;
		descripcion?: string | null;
	}>;
}

export interface CreateCategoriaAspectoMapResponse {
	category: CategoriaAspecto;
	mappings: Array<{
		id: number;
		categoria_id: number;
		aspecto_id: number;
		fecha_creacion?: string | null;
		fecha_actualizacion?: string | null;
	}>;
}

export interface CfgABulkItem {
	aspecto_id: number;
	orden: number;
	es_activo: boolean;
}

export interface CfgABulkInput {
	cfg_t_id: number;
	items: CfgABulkItem[];
}

// ========================
// SERVICES
// ========================

class AspectoService extends BaseService<Aspecto, CreateAspectoInput, UpdateAspectoInput> {
	constructor() {
		super('/aspecto');
	}
}

class CategoriaAspectoService extends BaseService<
	CategoriaAspecto,
	CreateCategoriaAspectoInput,
	UpdateCategoriaAspectoInput
> {
	constructor() {
		super('/cat/a');
	}
}

class ConfiguracionAspectoService extends BaseService<
	ConfiguracionAspecto,
	CreateConfiguracionAspectoInput,
	UpdateConfiguracionAspectoInput
> {
	constructor() {
		super('/cfg/a');
	}

	/**
	 * Actualizar campo booleano (ej: es_activo)
	 * PUT /cfg/a/{id} con campo específico
	 */
	async updateBooleanField(id: number, field: string, value: number | boolean): Promise<ApiResponse<ConfiguracionAspecto>> {
		return super.updateBooleanField(id, field, value);
	}

	/**
	 * Bulk crear configuración de aspectos
	 * POST /cfg/a/bulk
	 */
	async bulkCreateCfgA(data: CfgABulkInput): Promise<ApiResponse<any>> {
		return this.executeAsync(
			() => httpClient.post('/cfg/a/bulk', data),
			{ success: false, data: [] }
		);
	}
}

class CategoriaAspectoMapService {
	/**
	 * Listar aspectos asociados a una categoría
	 * GET /cat/a/{id}/aspectos
	 */
	async listAspectosByCategoria(
		categoriaId: number
	): Promise<ApiResponse<CategoriaAspectoItemsResponse>> {
		try {
			const response = await httpClient.get<CategoriaAspectoItemsResponse>(`/cat/a/${categoriaId}/aspectos`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { categoria_id: categoriaId, items: [] }, error };
		}
	}

	/**
	 * Crear categoría con aspectos asociados (o asociar aspectos existentes)
	 * POST /cat/a/aspectos
	 */
	async createCategoriaMap(
		payload: CreateCategoriaAspectoMapInput
	): Promise<ApiResponse<CreateCategoriaAspectoMapResponse>> {
		try {
			const response = await httpClient.post<CreateCategoriaAspectoMapResponse>('/cat/a/aspectos', payload);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { category: {} as CategoriaAspecto, mappings: [] }, error };
		}
	}

	/**
	 * Eliminar asociación de aspecto en una categoría
	 * DELETE /cat/a/{id}/aspectos/{itemId}
	 */
	async removeAspectoFromCategoria(
		categoriaId: number,
		aspectoId: number
	): Promise<ApiResponse<{ deleted: number }>> {
		try {
			const response = await httpClient.delete<{ deleted: number }>(`/cat/a/${categoriaId}/aspectos/${aspectoId}`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { deleted: 0 }, error };
		}
	}
}

export const aspectoService = new AspectoService();
export const aspectosEvaluacionService = aspectoService;
export const categoriaAspectoService = new CategoriaAspectoService();
export const configuracionAspectoService = new ConfiguracionAspectoService();
export const categoriaAspectoMapService = new CategoriaAspectoMapService();
