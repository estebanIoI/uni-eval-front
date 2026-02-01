import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EscalasView } from "./EscalaView";
import { CategoriaEscalaView } from "./CategoriaEscalaView";
import { CategoriaEscalaMapView } from "./CategoriaEscalaMapView";
import { type Escala, type CategoriaEscala } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";

interface EscalasIntegratedViewProps {
  escalas: Escala[];
  categoriasEscala: CategoriaEscala[];
  setModalEscala: (value: any) => void;
  setModalCategoriaEscala: (value: any) => void;
  setModalCategoriaEscalaMap: (value: any) => void;
  handleEliminarEscala: (escala: Escala) => void;
  handleEliminarCategoriaEscala: (categoria: CategoriaEscala) => void;
  refreshData: () => void;
  escalasPagination?: PaginationMeta | null;
  categoriasPagination?: PaginationMeta | null;
  onEscalasPageChange: (page: number) => void;
  onEscalasLimitChange: (limit: number) => void;
  onCategoriasPageChange: (page: number) => void;
  onCategoriasLimitChange: (limit: number) => void;
}

export function EscalasIntegratedView({
  escalas,
  categoriasEscala,
  setModalEscala,
  setModalCategoriaEscala,
  setModalCategoriaEscalaMap,
  handleEliminarEscala,
  handleEliminarCategoriaEscala,
  refreshData,
  escalasPagination,
  categoriasPagination,
  onEscalasPageChange,
  onEscalasLimitChange,
  onCategoriasPageChange,
  onCategoriasLimitChange,
}: EscalasIntegratedViewProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaEscala | null>(null);

  if (categoriaSeleccionada) {
    return (
      <CategoriaEscalaMapView
        categoria={categoriaSeleccionada}
        onBack={() => setCategoriaSeleccionada(null)}
        onAgregarEscalas={(categoria) => {
          setModalCategoriaEscalaMap({
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
        <h1 className="text-3xl font-bold tracking-tight">Escalas de Valoración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las escalas de valoración, sus categorías y relaciones
        </p>
      </div>

      <Tabs defaultValue="escalas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="escalas">Escalas</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="escalas" className="mt-6">
          <EscalasView
            escalas={escalas}
            setModalEscala={setModalEscala}
            handleEliminarEscala={handleEliminarEscala}
            pagination={escalasPagination}
            onPageChange={onEscalasPageChange}
            onLimitChange={onEscalasLimitChange}
          />
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <CategoriaEscalaView
            categorias={categoriasEscala}
            setModalCategoriaEscala={setModalCategoriaEscala}
            handleEliminarCategoriaEscala={handleEliminarCategoriaEscala}
            onVerEscalas={(categoria) => setCategoriaSeleccionada(categoria)}
            pagination={categoriasPagination}
            onPageChange={onCategoriasPageChange}
            onLimitChange={onCategoriasLimitChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
