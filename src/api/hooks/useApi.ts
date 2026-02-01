/**
 * Hooks React genéricos para consumir API
 * useApi, useMutation, usePagination - reutilizables para cualquier entidad
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PaginatedResponse,
  PaginationParams,
  QueryParams,
  ApiError,
} from '../types/api.types';

// ========================
// useApi - Hook genérico para peticiones GET
// ========================

export interface UseApiOptions<T> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook genérico para peticiones GET
 * 
 * @example
 * const { data, loading, error, refetch } = useApi(
 *   () => evaluacionService.list({ page: 1 }),
 *   [page]
 * );
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const apiError: ApiError = {
          message: err.message || 'Error desconocido',
          code: err.code,
          details: err.details,
        };
        setError(apiError);
        onError?.(apiError);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, ...dependencies]);

  useEffect(() => {
    mountedRef.current = true;
    if (refetchOnMount) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [execute, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
}

// ========================
// useMutation - Hook para POST/PUT/DELETE
// ========================

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: ApiError, variables: V) => void;
  onSettled?: (data: T | null, error: ApiError | null, variables: V) => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook genérico para mutaciones (POST, PUT, DELETE)
 * 
 * @example
 * const { mutate, loading } = useMutation(
 *   (data) => evaluacionService.create(data),
 *   {
 *     onSuccess: () => toast.success('Creado!'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * );
 */
export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(variables);
        setData(result);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'Error en la mutación',
          code: err.code,
          details: err.details,
        };
        setError(apiError);
        onError?.(apiError, variables);
        onSettled?.(null, apiError, variables);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
}

// ========================
// usePagination - Hook para listas paginadas
// ========================

export interface UsePaginationOptions<T> {
  initialPage?: number;
  initialLimit?: number;
  onSuccess?: (data: PaginatedResponse<T>) => void;
  onError?: (error: ApiError) => void;
}

export interface UsePaginationResult<T> {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'] | null;
  loading: boolean;
  error: ApiError | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refetch: () => Promise<void>;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook especializado para listas paginadas
 * 
 * @example
 * const {
 *   data,
 *   pagination,
 *   loading,
 *   page,
 *   setPage,
 *   nextPage,
 *   previousPage
 * } = usePagination(
 *   (params) => evaluacionService.list(params),
 *   { initialPage: 1, initialLimit: 10 }
 * );
 */
export function usePagination<T>(
  apiCall: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const {
    initialPage = 1,
    initialLimit = 10,
    onSuccess,
    onError,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall({ page, limit });
      setData(result.data);
      setPagination(result.pagination);
      onSuccess?.(result);
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Error al cargar datos',
        code: err.code,
        details: err.details,
      };
      setError(apiError);
      onError?.(apiError);
    } finally {
      setLoading(false);
    }
  }, [page, limit, apiCall, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [pagination]);

  const previousPage = useCallback(() => {
    if (pagination?.hasPreviousPage) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  }, [pagination]);

  return {
    data,
    pagination,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    refetch: fetchData,
    isSuccess: !loading && !error,
    isError: !loading && error !== null,
  };
}

// ========================
// useQueryParams - Hook para filtros con query params
// ========================

export interface UseQueryParamsResult<T extends QueryParams> {
  params: T;
  setParams: (params: Partial<T>) => void;
  setParam: <K extends keyof T>(key: K, value: T[K]) => void;
  resetParams: () => void;
}

/**
 * Hook para manejar query params (filtros, búsqueda, etc.)
 * 
 * @example
 * const { params, setParam } = useQueryParams({
 *   search: '',
 *   status: 'active',
 *   page: 1
 * });
 */
export function useQueryParams<T extends QueryParams>(
  initialParams: T
): UseQueryParamsResult<T> {
  const [params, setParamsState] = useState<T>(initialParams);

  const setParams = useCallback((newParams: Partial<T>) => {
    setParamsState((prev) => ({ ...prev, ...newParams }));
  }, []);

  const setParam = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setParamsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetParams = useCallback(() => {
    setParamsState(initialParams);
  }, [initialParams]);

  return {
    params,
    setParams,
    setParam,
    resetParams,
  };
}

// ========================
// useDebounce - Hook para búsquedas con delay
// ========================

/**
 * Hook para debounce (útil para búsquedas)
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
