import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit3, Plus, Check, AlertCircle } from "lucide-react";
import { type Tipo } from "@/src/api";
import { tiposEvaluacionService, categoriaTipoMapService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";

interface ModalTipoEvaluacionProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: Tipo;
  categoryId?: number;
  onSuccess: () => void;
  onTipoCreated?: (tipo: Tipo) => void;
  onTipoUpdated?: (tipo: Tipo) => void;
}

export function ModalTipoEvaluacion({
  isOpen,
  onClose,
  tipo,
  categoryId,
  onSuccess,
  onTipoCreated,
  onTipoUpdated,
}: ModalTipoEvaluacionProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    es_activo: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (tipo) {
      setFormData({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || "",
        es_activo: tipo.es_activo ?? true,
      });
    } else {
      setFormData({ nombre: "", descripcion: "", es_activo: true });
    }
    setErrors({});
  }, [tipo, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion = "La descripción debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (tipo) {
        await tiposEvaluacionService.update(tipo.id, formData);
        toast({
          title: "¡Actualización exitosa!",
          description: "El tipo de evaluación se actualizó correctamente",
        });
        onTipoUpdated?.({ ...tipo, ...formData, es_activo: formData.es_activo ?? true } as Tipo);
      } else if (categoryId) {
        // Creando un nuevo tipo dentro de una categoría
        const response = await categoriaTipoMapService.createCategoriaMap({
          categoryData: {
            id: categoryId
          },
          itemData: [
            {
              nombre: formData.nombre,
              descripcion: formData.descripcion,
              es_activo: formData.es_activo
            }
          ]
        });
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo tipo creado y asociado a la categoría",
        });
        if (response.success && response.data) {
          const nuevoTipo = response.data.mappings[0];
          onTipoCreated?.(nuevoTipo as any);
        }
      } else {
        const response = await tiposEvaluacionService.create(formData);
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo tipo de evaluación creado",
        });
        // Notificar al padre que se creó un nuevo tipo
        if (response.success && response.data) {
          const nuevoTipo = Array.isArray(response.data) ? response.data[0] : response.data;
          onTipoCreated?.(nuevoTipo as Tipo);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {tipo ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {tipo ? "Editar Tipo de Evaluación" : "Nuevo Tipo de Evaluación"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {tipo 
                  ? "Modifica la información del tipo de evaluación"
                  : "Crea un nuevo tipo de evaluación para el sistema"
                }
              </p>
            </div>
            {tipo && (
              <Badge variant={tipo.es_activo ? "default" : "secondary"}>
                {tipo.es_activo ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ejemplos sugeridos - Solo mostrar al crear nuevo */}
              {!tipo && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Ejemplos de tipos de evaluación:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                    <li><strong>Evaluación In Situ:</strong> Evaluación del desempeño docente en el aula</li>
                    <li><strong>Satisfacción Estudiantil:</strong> Encuesta de satisfacción con los servicios académicos</li>
                    <li><strong>Evaluación 360°:</strong> Evaluación integral desde múltiples perspectivas</li>
                    <li><strong>Autoevaluación Docente:</strong> Reflexión del docente sobre su práctica pedagógica</li>
                    <li><strong>Evaluación de Infraestructura:</strong> Valoración de instalaciones y recursos</li>
                  </ul>
                </div>
              )}

              {/* Campo Nombre */}
              <div className="space-y-3">
                <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Nombre del Tipo de Evaluación
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder="Ej. Evaluación de Satisfacción Estudiantil"
                  className={`transition-colors ${errors.nombre ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {errors.nombre && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nombre}
                  </div>
                )}
              </div>

              {/* Campo Descripción */}
              <div className="space-y-3">
                <Label htmlFor="descripcion" className="text-sm font-medium flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  Descripción Detallada
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Describe el propósito y características de este tipo de evaluación. Ej: Instrumento para medir la satisfacción de los estudiantes con los servicios académicos, infraestructura y metodologías de enseñanza..."
                  rows={4}
                  className={`resize-none transition-colors ${errors.descripcion ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                <div className="flex justify-between items-center">
                  {errors.descripcion ? (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.descripcion}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Mínimo 10 caracteres
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formData.descripcion.length}/500
                  </div>
                </div>
              </div>

              {/* Switch Estado Activo */}
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Estado del Tipo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.es_activo 
                      ? "Este tipo estará disponible para crear evaluaciones"
                      : "Este tipo no estará disponible para nuevas evaluaciones"
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.es_activo}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, es_activo: checked })}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {tipo ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {tipo ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {tipo ? "Actualizar" : "Crear"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}