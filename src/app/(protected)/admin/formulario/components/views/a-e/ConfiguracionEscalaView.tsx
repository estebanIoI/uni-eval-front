import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, Loader2, Trash2 } from "lucide-react";
import { type CfgEItem, configuracionValoracionService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ModalConfirmacion } from "@/src/app/(protected)/admin/formulario/components/ModalConfirmacion";
import { ModalEditarConfiguracionEscala } from "./ModalEditarConfiguracionEscala";

interface ConfiguracionEscalaViewProps {
  configuraciones: CfgEItem[];
  setModalConfiguracionEscala: (value: any) => void;
  onConfigUpdated?: () => void;
}

export function ConfiguracionEscalaView({
  configuraciones,
  setModalConfiguracionEscala,
  onConfigUpdated,
}: ConfiguracionEscalaViewProps) {
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<CfgEItem | null>(null);
  const [editConfig, setEditConfig] = useState<CfgEItem | null>(null);

  const handleToggleActivo = async (config: CfgEItem) => {
    setTogglingId(config.id);
    try {
      const response = await configuracionValoracionService.toggleField(config.id, "es_activo");
      if (response.success) {
        toast({
          title: "Estado actualizado",
          description: `La escala "${config.escala?.nombre || ''}" fue ${!config.es_activo ? 'activada' : 'desactivada'}.`,
        });
        onConfigUpdated?.();
      } else {
        throw new Error(response.error?.message || "Error al actualizar");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (config: CfgEItem) => {
    setEditConfig(config);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    const response = await configuracionValoracionService.delete(deleteConfig.id);
    if (!response.success) {
      throw new Error(response.error?.message || "No se pudo eliminar la configuración");
    }
    onConfigUpdated?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Configuración de Escalas</CardTitle>
            <CardDescription>
              Define el orden y puntaje de las escalas para una configuración
            </CardDescription>
          </div>
          <Button onClick={() => setModalConfiguracionEscala({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Configurar Escalas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {configuraciones.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No hay configuración registrada para escalas.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escala</TableHead>
                  <TableHead className="w-[140px]">Puntaje</TableHead>
                  <TableHead className="w-[120px]">Orden</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuraciones.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {config.escala
                        ? `${config.escala.sigla} - ${config.escala.nombre}`
                        : `Escala #${config.escala_id}`}
                    </TableCell>
                    <TableCell>{config.puntaje}</TableCell>
                    <TableCell>{config.orden}</TableCell>
                    <TableCell>
                      <Badge variant={config.es_activo ? "default" : "secondary"}>
                        {config.es_activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(config)}
                          title="Editar configuración"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActivo(config)}
                          disabled={togglingId === config.id}
                          title={config.es_activo ? "Desactivar" : "Activar"}
                        >
                          {togglingId === config.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfig(config)}
                          title="Eliminar configuración"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <ModalConfirmacion
        isOpen={Boolean(deleteConfig)}
        onClose={() => setDeleteConfig(null)}
        onConfirm={handleDelete}
        title="Eliminar configuración de escala"
        description={`¿Seguro que deseas eliminar la configuración de la escala "${deleteConfig?.escala?.nombre || deleteConfig?.escala_id || ""}"?`}
      />
      <ModalEditarConfiguracionEscala
        isOpen={Boolean(editConfig)}
        onClose={() => setEditConfig(null)}
        onSuccess={() => {
          setEditConfig(null);
          onConfigUpdated?.();
        }}
        configuracion={editConfig}
      />
    </Card>
  );
}
