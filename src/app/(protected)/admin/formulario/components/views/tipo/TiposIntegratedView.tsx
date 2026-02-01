import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiposEvaluacionView } from "./TipoView";
import { CategoriaTipoView } from "./CategoriaTipoView";
import { CategoriaTipoMapView } from "./CategoriaTipoMapView";
import { type Tipo, type CategoriaTipo } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";

interface TiposIntegratedViewProps {
  tiposEvaluacion: Tipo[];
  categoriasTipo: CategoriaTipo[];
  setModalTipoEvaluacion: (value: any) => void;
  setModalCategoriaTipo: (value: any) => void;
  setModalCategoriaTipoMap: (value: any) => void;
  handleEliminarTipoEvaluacion: (tipo: Tipo) => void;
  handleEliminarCategoriaTipo: (categoria: CategoriaTipo) => void;
  refreshTipos: () => void;
  tiposPagination?: PaginationMeta | null;
  categoriasPagination?: PaginationMeta | null;
  onTiposPageChange: (page: number) => void;
  onTiposLimitChange: (limit: number) => void;
  onCategoriasPageChange: (page: number) => void;
  onCategoriasLimitChange: (limit: number) => void;
}

export function TiposIntegratedView({
  tiposEvaluacion,
  categoriasTipo,
  setModalTipoEvaluacion,
  setModalCategoriaTipo,
  setModalCategoriaTipoMap,
  handleEliminarTipoEvaluacion,
  handleEliminarCategoriaTipo,
  refreshTipos,
  tiposPagination,
  categoriasPagination,
  onTiposPageChange,
  onTiposLimitChange,
  onCategoriasPageChange,
  onCategoriasLimitChange,
}: TiposIntegratedViewProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaTipo | null>(null);

  if (categoriaSeleccionada) {
    return (
      <CategoriaTipoMapView
        categoria={categoriaSeleccionada}
        onBack={() => setCategoriaSeleccionada(null)}
        onAgregarTipos={(categoria) => {
          setModalCategoriaTipoMap({
            isOpen: true,
            categoria,
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tipos de Evaluación</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los tipos de evaluación, sus categorías y relaciones
        </p>
      </div>

      <Tabs defaultValue="tipos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tipos">Tipos de Evaluación</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos" className="mt-6">
          <TiposEvaluacionView
            tiposEvaluacion={tiposEvaluacion}
            setModalTipoEvaluacion={setModalTipoEvaluacion}
            handleEliminarTipoEvaluacion={handleEliminarTipoEvaluacion}
            refreshTipos={refreshTipos}
            pagination={tiposPagination}
            onPageChange={onTiposPageChange}
            onLimitChange={onTiposLimitChange}
          />
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <CategoriaTipoView
            categorias={categoriasTipo}
            setModalCategoriaTipo={setModalCategoriaTipo}
            handleEliminarCategoriaTipo={handleEliminarCategoriaTipo}
            onVerTipos={(categoria) => setCategoriaSeleccionada(categoria)}
            pagination={categoriasPagination}
            onPageChange={onCategoriasPageChange}
            onLimitChange={onCategoriasLimitChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
