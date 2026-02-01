import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/src/api/types/api.types";

interface PaginationControlsProps {
  pagination?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
}

const LIMIT_OPTIONS = [5, 10, 20, 50, 100];

export function PaginationControls({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading,
}: PaginationControlsProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit, hasNextPage, hasPreviousPage } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="text-sm text-muted-foreground">
        Página <span className="font-medium text-foreground">{page}</span> de{" "}
        <span className="font-medium text-foreground">{totalPages}</span> · Total {total}
      </div>

      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={isLoading}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / pág
              </option>
            ))}
          </select>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage || isLoading}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isLoading}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
