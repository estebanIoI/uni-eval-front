import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Plus, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  aEService,
  configuracionEvaluacionService,
  type Aspecto,
  type Escala,
  type AspectoEscalaBulkInput,
} from "@/src/api";

interface ModalAeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cfgTId?: number | null;
  aspectos: Aspecto[];
  escalas: Escala[];
}

interface AspectoState {
  id: number;
  selected: boolean;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

interface AeItemState {
  id: string;
  es_pregunta_abierta: boolean;
  escalaIds: number[];
  escalaOpen: { es_cmt: boolean; es_cmt_oblig: boolean };
  aspectos: AspectoState[];
}

const createAspectosState = (aspectos: Aspecto[]): AspectoState[] =>
  aspectos.map((a) => ({
    id: a.id,
    selected: false,
    es_cmt: false,
    es_cmt_oblig: false,
  }));

const createItem = (aspectos: Aspecto[], es_pregunta_abierta: boolean): AeItemState => ({
  id: `${Date.now()}-${Math.random()}`,
  es_pregunta_abierta,
  escalaIds: [],
  escalaOpen: { es_cmt: true, es_cmt_oblig: false },
  aspectos: createAspectosState(aspectos),
});

export function ModalAe({ isOpen, onClose, onSuccess, cfgTId, aspectos, escalas }: ModalAeProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<AeItemState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [aspectosConfigurados, setAspectosConfigurados] = useState<Aspecto[]>([]);
  const [escalasConfiguradas, setEscalasConfiguradas] = useState<Escala[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadConfiguracion = async () => {
      setIsLoadingConfig(true);
      setError(null);

      if (!cfgTId) {
        setAspectosConfigurados([]);
        setEscalasConfiguradas([]);
        setItems([]);
        setError("Selecciona una configuración válida antes de continuar");
        setIsLoadingConfig(false);
        return;
      }

      const response = await configuracionEvaluacionService.getCfgACfgE(cfgTId);
      if (response.success && response.data) {
        const aspectosCfg = response.data.cfg_a
          .filter((a) => a.es_activo)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
          .map((a) => ({
            id: a.id,
            nombre: a.aspecto.nombre,
            descripcion: a.aspecto.descripcion,
          }));

        const escalasCfg = response.data.cfg_e
          .filter((e) => e.es_activo)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
          .map((e) => ({
            id: e.id,
            sigla: e.escala.sigla,
            nombre: e.escala.nombre,
            descripcion: e.escala.descripcion,
          }));

        setAspectosConfigurados(aspectosCfg);
        setEscalasConfiguradas(escalasCfg);
        setItems([
          createItem(aspectosCfg, false),
          createItem(aspectosCfg, true),
        ]);
      } else {
        setAspectosConfigurados([]);
        setEscalasConfiguradas([]);
        setItems([]);
        setError("No hay aspectos o escalas configurados para esta evaluación");
      }

      setIsLoadingConfig(false);
    };

    loadConfiguracion();
  }, [isOpen, cfgTId]);

  const aspectosById = useMemo(
    () => new Map(aspectosConfigurados.map((a) => [a.id, a])),
    [aspectosConfigurados]
  );

  const updateItem = (itemId: string, updates: Partial<AeItemState>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
  };

  const updateAspecto = (itemId: string, aspectoId: number, updates: Partial<AspectoState>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          aspectos: it.aspectos.map((a) =>
            a.id === aspectoId ? { ...a, ...updates } : a
          ),
        };
      })
    );
  };

  const toggleEscala = (itemId: string, escalaId: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.escalaIds.includes(escalaId);
        return {
          ...it,
          escalaIds: exists
            ? it.escalaIds.filter((id) => id !== escalaId)
            : [...it.escalaIds, escalaId],
        };
      })
    );
  };

  const addItem = (isOpenQuestion: boolean) => {
    setItems((prev) => [...prev, createItem(aspectosConfigurados, isOpenQuestion)]);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const validate = () => {
    if (aspectosConfigurados.length === 0) {
      setError("No hay aspectos configurados para esta evaluación");
      return false;
    }

    if (items.length === 0) {
      setError("Agrega al menos un bloque de configuración");
      return false;
    }

    for (const item of items) {
      const selectedAspectos = item.aspectos.filter((a) => a.selected);
      if (selectedAspectos.length === 0) {
        setError("Cada bloque debe tener al menos un aspecto seleccionado");
        return false;
      }
      if (!item.es_pregunta_abierta && escalasConfiguradas.length === 0) {
        setError("No hay escalas configuradas para preguntas cerradas");
        return false;
      }
      if (!item.es_pregunta_abierta && item.escalaIds.length === 0) {
        setError("Las preguntas cerradas deben tener al menos una escala");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: AspectoEscalaBulkInput = {
        items: items.map((item) => ({
          es_pregunta_abierta: item.es_pregunta_abierta,
          escalas: item.es_pregunta_abierta
            ? [{ id: null, es_cmt: item.escalaOpen.es_cmt, es_cmt_oblig: item.escalaOpen.es_cmt_oblig }]
            : item.escalaIds,
          aspectos: item.aspectos
            .filter((a) => a.selected)
            .map((a) => ({
              id: a.id,
              es_cmt: a.es_cmt,
              es_cmt_oblig: a.es_cmt_oblig,
            })),
        })),
      };

      console.log("📤 ModalAe payload:", JSON.stringify(payload, null, 2));

      const response = await aEService.bulkCreateAE(payload);
      if (response.success) {
        toast({
          title: "Configuración guardada",
          description: response.data?.message || "Bulk A/E procesado correctamente",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error("No se pudo guardar la configuración");
      }
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                Configurar Aspectos y Escalas (A/E)
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define qué escalas aplican por aspecto y si la pregunta es abierta
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => addItem(false)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar pregunta cerrada
            </Button>
            <Button type="button" variant="outline" onClick={() => addItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar pregunta abierta
            </Button>
          </div>

          {items.map((item, index) => (
            <Card key={item.id} className="border shadow-none bg-muted/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {item.es_pregunta_abierta ? "Pregunta abierta" : "Pregunta cerrada"} #{index + 1}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.es_pregunta_abierta
                        ? "Sin escalas numéricas"
                        : "Selecciona escalas aplicables"}
                    </p>
                  </div>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {!item.es_pregunta_abierta ? (
                  <div className="space-y-2">
                    <Label>Escalas</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {escalasConfiguradas.map((escala) => (
                        <label
                          key={escala.id}
                          className="flex items-center gap-2 rounded-md border p-2 text-sm"
                        >
                          <Checkbox
                            checked={item.escalaIds.includes(escala.id)}
                            onCheckedChange={() => toggleEscala(item.id, escala.id)}
                          />
                          <span>
                            {escala.sigla} - {escala.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Configuración de comentario (pregunta abierta)</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.escalaOpen.es_cmt}
                          onCheckedChange={(value) =>
                            updateItem(item.id, {
                              escalaOpen: {
                                ...item.escalaOpen,
                                es_cmt: Boolean(value),
                                es_cmt_oblig: item.escalaOpen.es_cmt_oblig && Boolean(value),
                              },
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">Permitir comentario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.escalaOpen.es_cmt_oblig}
                          onCheckedChange={(value) =>
                            updateItem(item.id, {
                              escalaOpen: {
                                ...item.escalaOpen,
                                es_cmt_oblig: Boolean(value),
                                es_cmt: item.escalaOpen.es_cmt || Boolean(value),
                              },
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">Comentario obligatorio</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Aspectos</Label>
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Sel.</TableHead>
                          <TableHead>Aspecto</TableHead>
                          <TableHead className="w-[160px]">Comentario</TableHead>
                          <TableHead className="w-[200px]">Comentario obligatorio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.aspectos.map((asp) => {
                          const aspecto = aspectosById.get(asp.id);
                          return (
                            <TableRow key={asp.id}>
                              <TableCell>
                                <Checkbox
                                  checked={asp.selected}
                                  onCheckedChange={(value) =>
                                    updateAspecto(item.id, asp.id, {
                                      selected: Boolean(value),
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {aspecto?.nombre ?? `Aspecto #${asp.id}`}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={asp.es_cmt}
                                    disabled={!asp.selected}
                                    onCheckedChange={(value) =>
                                      updateAspecto(item.id, asp.id, {
                                        es_cmt: Boolean(value),
                                        es_cmt_oblig: asp.es_cmt_oblig && Boolean(value),
                                      })
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {asp.es_cmt ? "Sí" : "No"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={asp.es_cmt_oblig}
                                    disabled={!asp.selected}
                                    onCheckedChange={(value) =>
                                      updateAspecto(item.id, asp.id, {
                                        es_cmt_oblig: Boolean(value),
                                        es_cmt: asp.es_cmt || Boolean(value),
                                      })
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {asp.es_cmt_oblig ? "Sí" : "No"}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
