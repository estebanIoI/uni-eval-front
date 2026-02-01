import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { type Tipo } from "@/src/api";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../../PaginationControls";
import { tiposEvaluacionService } from "@/src/api";

interface TiposEvaluacionViewProps {
  tiposEvaluacion: Tipo[];
  setModalTipoEvaluacion: (value: any) => void;
  handleEliminarTipoEvaluacion: (tipo: Tipo) => void;
  refreshTipos: () => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TiposEvaluacionView({
  tiposEvaluacion,
  setModalTipoEvaluacion,
  handleEliminarTipoEvaluacion,
  refreshTipos,
  pagination,
  onPageChange,
  onLimitChange,
}: TiposEvaluacionViewProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleEstado = async (tipo: Tipo) => {
    try {
      setLoadingId(tipo.id);
      
      await tiposEvaluacionService.updateBooleanField(
        tipo.id,
        "es_activo",
        !tipo.es_activo
      );
      refreshTipos();
    } catch (error) {
      console.error("Error al cambiar estado", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Gestión de Tipos de Evaluación</CardTitle>
            <CardDescription>
              Crea y administra diferentes tipos de evaluaciones: desempeño docente, satisfacción estudiantil, evaluaciones académicas, etc.
            </CardDescription>
          </div>
          <Button onClick={() => setModalTipoEvaluacion({ isOpen: true, tipo: undefined })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mensaje informativo si no hay tipos de evaluación */}
          {tiposEvaluacion.length === 0 && (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">
                  No hay tipos de evaluación registrados
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primer tipo de evaluación para comenzar a diseñar formularios personalizados
                </p>
              </CardContent>
            </Card>
          )}

          {tiposEvaluacion.map((tipo) => (
            <Card
              key={tipo.id}
              className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{tipo.nombre}</h3>
                      <Badge
                        variant={tipo.es_activo ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {tipo.es_activo ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {tipo.es_activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tipo.descripcion}</p>
                  </div>

                  <div className="flex gap-2 self-start items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalTipoEvaluacion({
                          isOpen: true,
                          tipo,
                        })
                      }
                      title="Editar"
                      className="hover:bg-muted hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEliminarTipoEvaluacion(tipo)}
                      title="Eliminar"
                      className="hover:bg-muted hover:text-primary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loadingId === tipo.id}
                      onClick={() => toggleEstado(tipo)}
                      title={tipo.es_activo ? "Desactivar" : "Activar"}
                      className="hover:bg-muted hover:text-primary"
                    >
                      {loadingId === tipo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : tipo.es_activo ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botón para agregar nuevo tipo */}
          <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setModalTipoEvaluacion({ isOpen: true, tipo: undefined })}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium">Crear Nuevo Tipo de Evaluación</p>
                  <p className="text-xs">Satisfacción, Desempeño, Autoevaluación, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </CardContent>
    </Card>
  );
}
