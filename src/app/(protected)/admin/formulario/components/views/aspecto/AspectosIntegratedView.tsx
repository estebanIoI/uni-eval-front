import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectosView } from "./AspectoView";
import { CategoriaAspectoView } from "./CategoriaAspectoView";
import { CategoriaAspectoMapView } from "./CategoriaAspectoMapView";
import { type Aspecto, type CategoriaAspecto } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";

interface AspectosIntegratedViewProps {
  aspectos: Aspecto[];
  categoriasAspecto: CategoriaAspecto[];
  setModalAspecto: (value: any) => void;
  setModalCategoriaAspecto: (value: any) => void;
  setModalCategoriaAspectoMap: (value: any) => void;
  handleEliminarAspecto: (aspecto: Aspecto) => void;
  handleEliminarCategoriaAspecto: (categoria: CategoriaAspecto) => void;
  refreshData: () => void;
  aspectosPagination?: PaginationMeta | null;
  categoriasPagination?: PaginationMeta | null;
  onAspectosPageChange: (page: number) => void;
  onAspectosLimitChange: (limit: number) => void;
  onCategoriasPageChange: (page: number) => void;
  onCategoriasLimitChange: (limit: number) => void;
}

export function AspectosIntegratedView({
  aspectos,
  categoriasAspecto,
  setModalAspecto,
  setModalCategoriaAspecto,
  setModalCategoriaAspectoMap,
  handleEliminarAspecto,
  handleEliminarCategoriaAspecto,
  refreshData,
  aspectosPagination,
  categoriasPagination,
  onAspectosPageChange,
  onAspectosLimitChange,
  onCategoriasPageChange,
  onCategoriasLimitChange,
}: AspectosIntegratedViewProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaAspecto | null>(null);

  if (categoriaSeleccionada) {
    return (
      <CategoriaAspectoMapView
        categoria={categoriaSeleccionada}
        onBack={() => setCategoriaSeleccionada(null)}
        onAgregarAspectos={(categoria) => {
          setModalCategoriaAspectoMap({
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
        <h1 className="text-3xl font-bold tracking-tight">Aspectos de Evaluación</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los aspectos a evaluar, sus categorías y relaciones
        </p>
      </div>

      <Tabs defaultValue="aspectos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aspectos">Aspectos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="aspectos" className="mt-6">
          <AspectosView
            aspectos={aspectos}
            setModalAspecto={setModalAspecto}
            handleEliminarAspecto={handleEliminarAspecto}
            pagination={aspectosPagination}
            onPageChange={onAspectosPageChange}
            onLimitChange={onAspectosLimitChange}
          />
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <CategoriaAspectoView
            categorias={categoriasAspecto}
            setModalCategoriaAspecto={setModalCategoriaAspecto}
            handleEliminarCategoriaAspecto={handleEliminarCategoriaAspecto}
            onVerAspectos={(categoria) => setCategoriaSeleccionada(categoria)}
            pagination={categoriasPagination}
            onPageChange={onCategoriasPageChange}
            onLimitChange={onCategoriasLimitChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
