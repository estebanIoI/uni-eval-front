# 🚀 API Client - Arquitectura Profesional y Reutilizable

Sistema de cliente API genérico siguiendo la filosofía del backend: **define una vez, usa en todas partes**.

## 📁 Estructura

```
src/api/
├── core/
│   ├── HttpClient.ts          # Cliente HTTP base con interceptores
│   └── apiConfig.ts            # Configuración centralizada
├── types/
│   └── api.types.ts            # Tipos TypeScript compartidos
├── services/
│   ├── factory.ts              # Factory para generar servicios CRUD
│   └── generated/              # Servicios auto-generados
│       ├── evaluacion.service.ts
│       ├── profesor.service.ts
│       ├── asignatura.service.ts
│       └── estudiante.service.ts
├── hooks/
│   └── useApi.ts               # Hooks React genéricos
├── utils/
│   └── helpers.ts              # Utilidades y helpers
└── index.ts                    # Export centralizado
```

## 🎯 Características

### ✅ HttpClient Genérico
- Manejo automático de errores estandarizados del backend
- Retry automático con backoff
- Interceptores request/response
- Timeout configurable
- Type-safe con TypeScript

### ✅ Factory de Servicios CRUD
- Generación automática de operaciones CRUD
- Operaciones bulk opcionales
- Toggle boolean fields
- Fácilmente extensible con métodos custom

### ✅ Hooks React
- `useApi` - Para peticiones GET
- `useMutation` - Para POST/PUT/DELETE
- `usePagination` - Para listas paginadas
- `useQueryParams` - Para filtros y búsqueda
- `useDebounce` - Para búsquedas con delay

### ✅ Type Safety Total
- Tipos para todas las entidades
- DTOs para Create/Update
- Responses tipadas
- Autocomplete en IDE

## 🔥 Uso Básico

### 1. Importar servicio
```typescript
import { evaluacionService } from '@/api';
```

### 2. Usar en componente con hooks
```typescript
'use client';

import { useApi, useMutation, evaluacionService } from '@/api';

export function EvaluacionList() {
  // Listar con paginación
  const { data, loading, error, refetch } = useApi(
    () => evaluacionService.list({ page: 1, limit: 10 }),
    []
  );

  // Crear nueva evaluación
  const { mutate: createEvaluacion, loading: creating } = useMutation(
    evaluacionService.create,
    {
      onSuccess: () => {
        refetch();
        toast.success('Evaluación creada');
      }
    }
  );

  if (loading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data?.data.map(eval => (
        <Card key={eval.id}>{eval.nombre}</Card>
      ))}
    </div>
  );
}
```

### 3. Con paginación automática
```typescript
import { usePagination, evaluacionService } from '@/api';

export function EvaluacionTable() {
  const {
    data,
    pagination,
    loading,
    page,
    setPage,
    nextPage,
    previousPage
  } = usePagination(evaluacionService.list);

  return (
    <>
      <Table data={data} />
      <Pagination
        page={page}
        totalPages={pagination?.totalPages}
        onNext={nextPage}
        onPrevious={previousPage}
      />
    </>
  );
}
```

## 🛠️ Crear Nuevo Servicio

### Opción 1: Servicio CRUD simple
```typescript
// src/api/services/generated/miEntidad.service.ts
import { createCrudService } from '../factory';
import type { MiEntidad } from '@/api/types/api.types';

export const miEntidadService = createCrudService<MiEntidad>({
  resource: '/mi-entidad',
  enableBulk: true,
  enableToggle: true,
});
```

### Opción 2: Servicio con extensiones custom
```typescript
import { createCrudService, extendService } from '../factory';
import { httpClient } from '@/api/core/HttpClient';

const baseService = createCrudService<MiEntidad>({
  resource: '/mi-entidad'
});

const customExtensions = {
  getByCampo: async (valor: string) => {
    return httpClient.get(`/mi-entidad/campo/${valor}`);
  },
  exportar: async (formato: 'csv' | 'excel') => {
    return httpClient.get(`/mi-entidad/export?format=${formato}`);
  }
};

export const miEntidadService = extendService(baseService, customExtensions);
```

## 📊 Ejemplos Avanzados

### Búsqueda con filtros y debounce
```typescript
import { useApi, useQueryParams, useDebounce, evaluacionService } from '@/api';

export function EvaluacionSearch() {
  const { params, setParam } = useQueryParams({
    search: '',
    status: 'all',
    page: 1
  });

  const debouncedSearch = useDebounce(params.search, 500);

  const { data, loading } = useApi(
    () => evaluacionService.list({
      ...params,
      search: debouncedSearch
    }),
    [debouncedSearch, params.status, params.page]
  );

  return (
    <>
      <Input
        value={params.search}
        onChange={(e) => setParam('search', e.target.value)}
      />
      <Select
        value={params.status}
        onChange={(val) => setParam('status', val)}
      />
      <Results data={data} loading={loading} />
    </>
  );
}
```

### Operaciones bulk
```typescript
import { useMutation, evaluacionService } from '@/api';

export function BulkActions() {
  const { mutate: bulkDelete } = useMutation(
    evaluacionService.bulkDelete,
    {
      onSuccess: () => toast.success('Eliminados correctamente')
    }
  );

  const handleDelete = (ids: number[]) => {
    bulkDelete({ ids });
  };

  return <Button onClick={() => handleDelete(selectedIds)}>Eliminar</Button>;
}
```

### Toggle boolean field
```typescript
import { useMutation, evaluacionService } from '@/api';

export function EvaluacionToggle({ id, estado }: Props) {
  const { mutate: toggle } = useMutation(
    () => evaluacionService.toggleBoolean!(id, 'estado'),
    {
      onSuccess: () => refetch()
    }
  );

  return (
    <Switch checked={estado} onCheckedChange={toggle} />
  );
}
```

## 🔧 Configuración

### Variables de entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Modificar configuración
```typescript
import { updateApiConfig } from '@/api';

// Cambiar timeout
updateApiConfig({ timeout: 60000 });

// Añadir header global
updateApiConfig({
  defaultHeaders: {
    'X-Custom-Header': 'value'
  }
});
```

### Interceptores
```typescript
import { httpClient, getAuthHeader } from '@/api';

// Request interceptor para auth
httpClient.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      ...getAuthHeader()
    }
  };
});

// Response interceptor para logging
httpClient.addResponseInterceptor((response) => {
  console.log('API Response:', response);
  return response;
});
```

## 📝 Agregar Nueva Entidad

1. Agregar tipo en `api/types/api.types.ts`
2. Crear servicio en `api/services/generated/`
3. Exportar desde `api/index.ts`
4. ¡Listo! Ya tienes CRUD completo

**Tiempo estimado: 2 minutos** ⚡

## 🎨 Comparación con Backend

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| Abstracción | `createCrudModule` | `createCrudService` |
| Generación | Desde Prisma schema | Desde servicios base |
| Validación | AJV + Schema Factory | TypeScript |
| Reutilización | ~95% código genérico | ~95% código genérico |
| Customización | `disable`, `roles`, `override` | `extendService` |

## 💡 Ventajas

✅ **DRY**: No repitas código CRUD  
✅ **Type-Safe**: TypeScript en todo  
✅ **Escalable**: Añade entidades en minutos  
✅ **Mantenible**: Cambios centralizados  
✅ **Testeable**: Lógica separada de UI  
✅ **Consistente**: Mismo patrón en todo el proyecto  

---

## 🆕 Mejoras v2.0 - Sistema de Autenticación Profesional

### Nuevas Utilidades (Enero 2026)

#### 📊 Logger - Sistema de Logging Centralizado
```typescript
import { logger } from '@/src/api';

logger.info('Usuario autenticado', { userId: 123 });
logger.error('Error en API', { error: err.message }, err);
logger.debug('Request enviado', { endpoint: '/api/data' });
```

#### 🔑 TokenManager - Gestión Inteligente de Tokens
```typescript
import { tokenManager } from '@/src/api';

// Auto-refresh automático
await tokenManager.refreshTokenIfNeeded();

// Verificaciones
const isValid = tokenManager.hasValidTokens();
const isExpiring = tokenManager.isTokenExpiringSoon();
```

#### 🛡️ RateLimiter - Protección Anti Fuerza Bruta
```typescript
import { rateLimiter } from '@/src/api';

const { allowed, remaining, blockedFor } = rateLimiter.canAttempt('username');
// Máximo 5 intentos en 15 minutos
```

### Servicios Mejorados

- ✅ **authService** - Rate limiting + logging integrado
- ✅ **HttpClient** - Auto-refresh de tokens + manejo de 401
- ✅ Interceptores automáticos de autenticación
- ✅ Retry inteligente en errores de token

### Documentación Completa

- 📘 **RESUMEN_EJECUTIVO.md** - Overview de mejoras
- 📗 **MEJORAS_IMPLEMENTADAS.md** - Detalles técnicos
- 📙 **GUIA_AUTENTICACION.md** - Ejemplos prácticos
- 📕 **ARQUITECTURA_AUTH.md** - Diagramas y diseño

---

**Creado siguiendo la filosofía de arquitectura genérica del backend** 🚀  
**✨ v2.0 - Listo para producción con estándares empresariales**

