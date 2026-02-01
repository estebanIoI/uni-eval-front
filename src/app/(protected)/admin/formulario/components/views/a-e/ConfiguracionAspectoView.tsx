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
import { type CfgAItem, configuracionAspectoService } from "@/src/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ModalConfirmacion } from "@/src/app/(protected)/admin/formulario/components/ModalConfirmacion";
import { ModalEditarConfiguracionAspecto } from "./ModalEditarConfiguracionAspecto";

interface ConfiguracionAspectoViewProps {
  configuraciones: CfgAItem[];
  setModalConfiguracionAspecto: (value: any) => void;
  onConfigUpdated?: () => void;
}

export function ConfiguracionAspectoView({
  configuraciones,
  setModalConfiguracionAspecto,
  onConfigUpdated,
}: ConfiguracionAspectoViewProps) {
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<CfgAItem | null>(null);
  const [editConfig, setEditConfig] = useState<CfgAItem | null>(null);

  const handleToggleActivo = async (config: CfgAItem) => {
    setTogglingId(config.id);
    try {
      const response = await configuracionAspectoService.toggleField(config.id, "es_activo");
      if (response.success) {
        toast({
          title: "Estado actualizado",
          description: `El aspecto "${config.aspecto?.nombre || ''}" fue ${!config.es_activo ? 'activado' : 'desactivado'}.`,
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

  const handleEdit = (config: CfgAItem) => {
    setEditConfig(config);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    const response = await configuracionAspectoService.delete(deleteConfig.id);
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
            <CardTitle>Configuración de Aspectos</CardTitle>
            <CardDescription>
              Define el orden y estado de los aspectos para una configuración
            </CardDescription>
          </div>
          <Button
            onClick={() => setModalConfiguracionAspecto({ isOpen: true })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Configurar Aspectos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {configuraciones.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No hay configuración registrada para aspectos.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspecto</TableHead>
                  <TableHead className="w-[120px]">Orden</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuraciones.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {config.aspecto?.nombre ?? `Aspecto #${config.aspecto_id}`}
                    </TableCell>
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
        title="Eliminar configuración de aspecto"
        description={`¿Seguro que deseas eliminar la configuración del aspecto "${deleteConfig?.aspecto?.nombre || deleteConfig?.aspecto_id || ""}"?`}
      />
      
      <ModalEditarConfiguracionAspecto
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
