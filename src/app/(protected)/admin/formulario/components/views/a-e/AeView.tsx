import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { type AspectoConEscalas } from "@/src/api";
import { useState } from "react";

interface AeViewProps {
  aspectosConEscalas: AspectoConEscalas[];
  setModalAe: (value: any) => void;
}

export function AeView({ aspectosConEscalas, setModalAe }: AeViewProps) {
  const [expandedAspecto, setExpandedAspecto] = useState<number | null>(
    aspectosConEscalas.length > 0 ? aspectosConEscalas[0].id : null
  );

  const totalOpciones = aspectosConEscalas.reduce(
    (sum, aspecto) => sum + aspecto.opciones.length,
    0
  );

  const toggleAspecto = (id: number) => {
    setExpandedAspecto(expandedAspecto === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Relación Aspecto - Escala</CardTitle>
              <CardDescription>
                Aspectos configurados con sus escalas de evaluación
              </CardDescription>
            </div>
            <Button onClick={() => setModalAe({ isOpen: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Configurar A/E
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">
              Aspectos: {aspectosConEscalas.length}
            </Badge>
            <Badge variant="outline">
              Opciones: {totalOpciones}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {aspectosConEscalas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No hay aspectos configurados</p>
            <Button onClick={() => setModalAe({ isOpen: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Configurar Primer Aspecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {aspectosConEscalas.map((aspecto) => (
            <Card key={aspecto.id} className="overflow-hidden">
              <div
                onClick={() => toggleAspecto(aspecto.id)}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{aspecto.nombre}</h3>
                    {aspecto.es_activo && (
                      <Badge variant="default" className="text-xs">
                        Activo
                      </Badge>
                    )}
                    {aspecto.es_cmt && (
                      <Badge variant="secondary" className="text-xs">
                        Comentario
                      </Badge>
                    )}
                    {aspecto.es_cmt_oblig && (
                      <Badge variant="destructive" className="text-xs">
                        Comentario Obligatorio
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {aspecto.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orden: {aspecto.orden} • Opciones: {aspecto.opciones.length}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {expandedAspecto === aspecto.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedAspecto === aspecto.id && (
                <div className="border-t bg-muted/30 p-4">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Escalas de Evaluación
                    </p>
                    {aspecto.opciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No hay opciones configuradas
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {aspecto.opciones.map((opcion) => (
                          <div
                            key={opcion.id}
                            className="p-3 rounded-lg border border-muted-foreground/20 bg-background"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {opcion.sigla}
                                </Badge>
                                <h4 className="font-semibold text-sm">
                                  {opcion.nombre}
                                </h4>
                                {opcion.puntaje && (
                                  <Badge variant="secondary" className="text-xs">
                                    {opcion.puntaje} pts
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Orden: {opcion.orden}
                              </p>
                            </div>
                            {opcion.descripcion && (
                              <p className="text-xs text-muted-foreground">
                                {opcion.descripcion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
