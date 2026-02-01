import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  configuracionValoracionService,
  type CfgEItem,
} from "@/src/api";

interface ModalEditarConfiguracionEscalaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  configuracion: CfgEItem | null;
}

interface FormData {
  cfg_t_id: number;
  escala_id: number;
  puntaje: number;
  orden: number;
  es_activo: boolean;
}

export function ModalEditarConfiguracionEscala({
  isOpen,
  onClose,
  onSuccess,
  configuracion,
}: ModalEditarConfiguracionEscalaProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    cfg_t_id: 0,
    escala_id: 0,
    puntaje: 0,
    orden: 1,
    es_activo: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && configuracion) {
      setFormData({
        cfg_t_id: configuracion.cfg_t_id,
        escala_id: configuracion.escala_id,
        puntaje: Number(configuracion.puntaje) || 0,
        orden: Number(configuracion.orden) || 1,
        es_activo: configuracion.es_activo,
      });
      setError(null);
    }
  }, [isOpen, configuracion]);

  const validate = () => {
    if (formData.orden <= 0) {
      setError("El orden debe ser mayor a 0");
      return false;
    }
    if (Number.isNaN(formData.puntaje)) {
      setError("El puntaje debe ser un número válido");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !configuracion) return;

    setIsLoading(true);
    try {
      const payload = {
        cfg_t_id: formData.cfg_t_id,
        escala_id: formData.escala_id,
        puntaje: formData.puntaje,
        orden: formData.orden,
        es_activo: formData.es_activo,
      };

      const response = await configuracionValoracionService.update(configuracion.id, payload);

      if (response.success) {
        toast({
          title: "Configuración actualizada",
          description: "Los cambios fueron guardados correctamente",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error?.message || "No se pudo actualizar la configuración");
      }
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err.message || "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError(null);
    }
  };

  if (!configuracion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                Editar Configuración de Escala
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Modifica el puntaje, orden y estado de la escala configurada
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Card className="border shadow-none bg-muted/20">
          <CardContent className="p-4 space-y-4">
            <div className="p-3 bg-background rounded-lg border">
              <Label className="text-xs text-muted-foreground">Escala</Label>
              <p className="font-semibold mt-1">
                {configuracion.escala?.sigla && configuracion.escala?.nombre
                  ? `${configuracion.escala.sigla} - ${configuracion.escala.nombre}`
                  : `Escala #${configuracion.escala_id}`}
              </p>
              {configuracion.escala?.descripcion && (
                <p className="text-sm text-muted-foreground mt-1">
                  {configuracion.escala.descripcion}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntaje">Puntaje *</Label>
              <Input
                id="puntaje"
                type="number"
                step="0.1"
                value={formData.puntaje}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    puntaje: Number(e.target.value),
                  }))
                }
                placeholder="Ej: 4.5"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden *</Label>
              <Input
                id="orden"
                type="number"
                min={1}
                value={formData.orden}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orden: Number(e.target.value),
                  }))
                }
                placeholder="Ej: 1"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Define la posición en que aparecerá esta escala
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="es_activo" className="cursor-pointer">
                  Estado de la Escala
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.es_activo ? "La escala está activa" : "La escala está inactiva"}
                </p>
              </div>
              <Switch
                id="es_activo"
                checked={formData.es_activo}
                onCheckedChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    es_activo: Boolean(value),
                  }))
                }
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
