import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Escala } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../../PaginationControls";
import { Edit, Trash2, Plus } from "lucide-react";

interface EscalasViewProps {
  escalas: Escala[];
  setModalEscala: (value: any) => void;
  handleEliminarEscala: (escala: Escala) => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function EscalasView({
  escalas,
  setModalEscala,
  handleEliminarEscala,
  pagination,
  onPageChange,
  onLimitChange,
}: EscalasViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Escalas de Valoración</CardTitle>
            <CardDescription>Configure las escalas de calificación</CardDescription>
          </div>
          <Button onClick={() => setModalEscala({ isOpen: true, escala: undefined })}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Escala
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {escalas.map((escala) => (
          <Card
            key={escala.id}
            className="transition-all duration-200 hover:shadow-md border border-muted"
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {escala.sigla} - {escala.nombre}
                  </h3>
                  <p className="text-sm text-muted-foreground">{escala.descripcion}</p>
                </div>
                <div className="flex gap-2 self-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalEscala({ isOpen: true, escala })}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEliminarEscala(escala)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </CardContent>
    </Card>
  );
}
