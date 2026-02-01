import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { PaginationMeta } from "@/src/api/types/api.types";
import { PaginationControls } from "../PaginationControls";

interface Category {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

interface CategoryItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  sigla?: string;
  es_activo?: boolean | null;
}

interface CategoriesViewProps {
  type: "tipo" | "aspecto" | "escala";
  categories: Category[];
  items: CategoryItem[];
  categoryItems: Map<number, CategoryItem[]>;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddItem: (categoryId: number) => void;
  onEditItem: (item: CategoryItem) => void;
  onDeleteItem: (item: CategoryItem) => void;
  onToggleItemStatus?: (item: CategoryItem) => void;
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loadingId?: number | null;
}

export function CategoriesView({
  type,
  categories,
  items,
  categoryItems,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItemStatus,
  pagination,
  onPageChange,
  onLimitChange,
  loadingId,
}: CategoriesViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getTypeLabel = () => {
    switch (type) {
      case "tipo":
        return "Tipos de Evaluación";
      case "aspecto":
        return "Aspectos";
      case "escala":
        return "Escalas";
      default:
        return "";
    }
  };

  const getItemLabel = () => {
    switch (type) {
      case "tipo":
        return "Tipo";
      case "aspecto":
        return "Aspecto";
      case "escala":
        return "Escala";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestión de {getTypeLabel()}</CardTitle>
              <CardDescription>
                Organiza {getTypeLabel().toLowerCase()} por categorías
              </CardDescription>
            </div>
            <Button onClick={onAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No hay categorías registradas
                </p>
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => (
              <Card
                key={category.id}
                className="border border-muted rounded-2xl shadow-sm overflow-hidden"
              >
                <Collapsible
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-primary transition-colors">
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                              expandedCategories.has(category.id)
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                          <div className="text-left">
                            <CardTitle className="text-lg">
                              {category.nombre}
                            </CardTitle>
                            {category.descripcion && (
                              <CardDescription className="text-sm mt-1">
                                {category.descripcion}
                              </CardDescription>
                            )}
                          </div>
                        </CollapsibleTrigger>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditCategory(category)}
                          title="Editar categoría"
                          className="hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteCategory(category)}
                          title="Eliminar categoría"
                          className="hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      {/* Items de la categoría */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm text-muted-foreground">
                            {getTypeLabel()} en esta categoría
                          </h4>
                          <Button
                            size="sm"
                            onClick={() => onAddItem(category.id)}
                            className="h-8 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>

                        {!categoryItems.get(category.id) ||
                        categoryItems.get(category.id)!.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No hay {getTypeLabel().toLowerCase()} en esta
                            categoría
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {categoryItems.get(category.id)!.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-white border border-muted rounded-lg hover:shadow-sm transition-shadow"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium truncate">
                                      {item.sigla && (
                                        <span className="text-muted-foreground text-sm">
                                          [{item.sigla}]{" "}
                                        </span>
                                      )}
                                      {item.nombre}
                                    </p>
                                    {item.es_activo !== undefined && (
                                      <Badge
                                        variant={
                                          item.es_activo
                                            ? "default"
                                            : "destructive"
                                        }
                                        className="text-xs"
                                      >
                                        {item.es_activo
                                          ? "Activo"
                                          : "Inactivo"}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.descripcion && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {item.descripcion}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditItem(item)}
                                    title="Editar"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteItem(item)}
                                    title="Eliminar"
                                    className="h-8 w-8 p-0 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                  {onToggleItemStatus &&
                                    item.es_activo !== undefined && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={loadingId === item.id}
                                        onClick={() => onToggleItemStatus(item)}
                                        title="Cambiar estado"
                                        className="h-8 w-8 p-0"
                                      >
                                        {loadingId === item.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : item.es_activo ? (
                                          <span className="h-3.5 w-3.5 flex items-center justify-center text-xs">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="h-3.5 w-3.5 flex items-center justify-center text-xs">
                                            ✕
                                          </span>
                                        )}
                                      </Button>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}

          {categories.length > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
