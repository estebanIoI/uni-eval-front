"use client";

import { useState, useEffect, useCallback, memo } from "react";
import {
  FileText,
  Settings2,
  Loader2,
  AlertCircle,
  Bot,
  Download,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { metricService } from "@/src/api/services/metric/metric.service";
import { aiConfigService } from "@/src/api/services/ai/ai-config.service";
import type { DocenteGeneralMetrics, CommentsAnalysisResponse } from "@/src/api/services/metric/metric.service";
import type { AIConfig, AIProvider } from "@/src/api/services/ai/ai-config.service";
import Filtros from "@/src/app/(protected)/admin/components/filters";
import type { FiltrosState } from "../types";

const FiltersMemo = memo(Filtros);

// ─────────────────────────────────────────────────────────────
// Provider labels and icons
// ─────────────────────────────────────────────────────────────
const PROVIDER_LABELS: Record<AIProvider, string> = {
  ollama: "Ollama (Local)",
  openai: "OpenAI",
  gemini: "Google Gemini (AI Studio)",
};

const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  ollama: ["llama3.1:8b", "llama3.1:8b-instruct-q4_K_M", "mistral:7b", "gemma2:9b"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
};

// ─────────────────────────────────────────────────────────────
// AI Config Panel
// ─────────────────────────────────────────────────────────────
function AIConfigPanel() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    aiConfigService.getConfig()
      .then(setConfig)
      .catch(() => toast({ title: "Error", description: "No se pudo cargar configuración IA", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      await aiConfigService.saveConfig(config);
      toast({ title: "Configuración guardada", description: "El proveedor de IA ha sido actualizado." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const activeProviderLabel = config ? PROVIDER_LABELS[config.provider] : "—";
  const isCloud = config?.provider === "openai" || config?.provider === "gemini";

  return (
    <Card className="rounded-[2rem] border-2 border-violet-100 shadow-md bg-white overflow-hidden">
      <CardHeader
        className="p-6 border-b border-violet-50 bg-gradient-to-r from-violet-50/60 to-indigo-50/40 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-violet-100 flex items-center justify-center">
              <Bot className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Configuración de IA</CardTitle>
              <CardDescription className="text-slate-500 text-xs font-medium mt-0.5">
                Proveedor activo:{" "}
                <span className="font-semibold text-violet-700">{activeProviderLabel}</span>
                {isCloud && (
                  <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0 border-blue-200 text-blue-600">
                    <Cloud className="h-2.5 w-2.5 mr-1" />Cloud
                  </Badge>
                )}
                {!isCloud && config && (
                  <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0 border-slate-200 text-slate-600">
                    <Cpu className="h-2.5 w-2.5 mr-1" />Local
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] border-violet-200 text-violet-700 bg-violet-50"
            >
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              Análisis de comentarios
            </Badge>
            {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-8 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          ) : config ? (
            <>
              {/* Provider selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Proveedor</label>
                  <Select
                    value={config.provider}
                    onValueChange={(v) => setConfig({ ...config, provider: v as AIProvider })}
                  >
                    <SelectTrigger className="h-9 border-slate-200 text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini (AI Studio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Model selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Modelo</label>
                  {config.provider === "ollama" && (
                    <Input
                      className="h-9 border-slate-200 text-sm rounded-xl"
                      value={config.ollama.model}
                      onChange={(e) =>
                        setConfig({ ...config, ollama: { ...config.ollama, model: e.target.value } })
                      }
                      placeholder="llama3.1:8b"
                    />
                  )}
                  {config.provider === "openai" && (
                    <Select
                      value={config.openai.model}
                      onValueChange={(v) =>
                        setConfig({ ...config, openai: { ...config.openai, model: v } })
                      }
                    >
                      <SelectTrigger className="h-9 border-slate-200 text-sm rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_MODELS.openai.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {config.provider === "gemini" && (
                    <Select
                      value={config.gemini.model}
                      onValueChange={(v) =>
                        setConfig({ ...config, gemini: { ...config.gemini, model: v } })
                      }
                    >
                      <SelectTrigger className="h-9 border-slate-200 text-sm rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_MODELS.gemini.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Ollama host */}
              {config.provider === "ollama" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Host Ollama</label>
                  <Input
                    className="h-9 border-slate-200 text-sm rounded-xl"
                    value={config.ollama.host}
                    onChange={(e) =>
                      setConfig({ ...config, ollama: { ...config.ollama, host: e.target.value } })
                    }
                    placeholder="http://localhost:11434"
                  />
                </div>
              )}

              {/* OpenAI API Key */}
              {config.provider === "openai" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">API Key OpenAI</label>
                  <div className="relative">
                    <Input
                      className="h-9 border-slate-200 text-sm rounded-xl pr-10"
                      type={showKey ? "text" : "password"}
                      value={config.openai.api_key}
                      onChange={(e) =>
                        setConfig({ ...config, openai: { ...config.openai, api_key: e.target.value } })
                      }
                      placeholder="sk-..."
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowKey(!showKey)}
                      type="button"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Obtén tu API key en{" "}
                    <span className="text-blue-600 font-medium">platform.openai.com</span>
                  </p>
                </div>
              )}

              {/* Gemini API Key */}
              {config.provider === "gemini" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">API Key Gemini (AI Studio)</label>
                  <div className="relative">
                    <Input
                      className="h-9 border-slate-200 text-sm rounded-xl pr-10"
                      type={showKey ? "text" : "password"}
                      value={config.gemini.api_key}
                      onChange={(e) =>
                        setConfig({ ...config, gemini: { ...config.gemini, api_key: e.target.value } })
                      }
                      placeholder="AIza..."
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowKey(!showKey)}
                      type="button"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Obtén tu API key en{" "}
                    <span className="text-blue-600 font-medium">aistudio.google.com</span>
                  </p>
                </div>
              )}

              {/* Custom prompt override */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Instrucción adicional al prompt{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <Textarea
                  className="border-slate-200 text-sm rounded-xl resize-none"
                  rows={2}
                  value={config.prompt_override}
                  onChange={(e) => setConfig({ ...config, prompt_override: e.target.value })}
                  placeholder='Ej: "Responde siempre en español formal. Sé conciso y constructivo."'
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-2" />
                  )}
                  {saving ? "Guardando..." : "Guardar configuración"}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Docente row with inline analysis
// ─────────────────────────────────────────────────────────────
interface DocenteInformeRowProps {
  docente: DocenteGeneralMetrics;
  filtros: FiltrosState;
}

function DocenteInformeRow({ docente, filtros }: DocenteInformeRowProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [analysis, setAnalysis] = useState<CommentsAnalysisResponse | null>(null);

  const filters = {
    cfg_t: filtros.configuracionSeleccionada || 0,
    sede: filtros.sedeSeleccionada || undefined,
    periodo: filtros.periodoSeleccionado || undefined,
    programa: filtros.programaSeleccionado || undefined,
    semestre: filtros.semestreSeleccionado || undefined,
    grupo: filtros.grupoSeleccionado || undefined,
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setExpanded(true);
      const result = await metricService.analyzeComments(docente.docente, filters);
      setAnalysis(result);
    } catch {
      toast({
        title: "Error al analizar",
        description: "No se pudo conectar con el servicio de IA. Verifica la configuración.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await metricService.downloadDocenteReportToFile(
        docente.docente,
        filters,
        `informe_${docente.docente}_${docente.nombre_docente?.replace(/\s+/g, "_") ?? ""}.docx`
      );
      toast({ title: "Informe descargado", description: "El reporte DOCX fue generado correctamente." });
    } catch {
      toast({ title: "Error", description: "No se pudo generar el informe.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const scoreColor =
    (docente.promedio_general ?? 0) >= 4.5
      ? "text-emerald-600"
      : (docente.promedio_general ?? 0) >= 4
      ? "text-blue-600"
      : (docente.promedio_general ?? 0) >= 3
      ? "text-amber-600"
      : "text-red-500";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-slate-600">
              {(docente.nombre_docente ?? docente.docente).slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">
              {docente.nombre_docente ?? docente.docente}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">{docente.docente}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className={`font-bold text-base ${scoreColor}`}>
                {docente.promedio_general?.toFixed(2) ?? "—"}
              </p>
              <p className="text-slate-400">Promedio</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-base text-slate-700">{docente.total_realizadas}</p>
              <p className="text-slate-400">Evaluaciones</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-base text-slate-700">
                {docente.porcentaje_cumplimiento?.toFixed(0)}%
              </p>
              <p className="text-slate-400">Cumplimiento</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 text-xs px-3"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1.5" />
              )}
              {analyzing ? "Analizando..." : "Analizar IA"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs px-3"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-1.5" />
              )}
              {downloading ? "Generando..." : "Informe DOCX"}
            </Button>

            {analysis && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
          {analyzing ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 flex-1 rounded-xl" />
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              {/* Conclusion general */}
              <div className="bg-white rounded-2xl border border-violet-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-700">Conclusión General</span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-[9px] px-1.5 py-0 border-emerald-200 text-emerald-600"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                    {analysis.total_respuestas} respuestas
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {analysis.analisis.conclusion_general || "Sin conclusión generada."}
                </p>
              </div>

              {/* Fortalezas y debilidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.analisis.fortalezas?.length > 0 && (
                  <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Fortalezas
                    </p>
                    <ul className="space-y-1">
                      {analysis.analisis.fortalezas.map((f, i) => (
                        <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analisis.debilidades?.length > 0 && (
                  <div className="bg-amber-50/70 rounded-2xl border border-amber-100 p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Áreas de mejora
                    </p>
                    <ul className="space-y-1">
                      {analysis.analisis.debilidades.map((d, i) => (
                        <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Aspectos */}
              {analysis.analisis.aspectos?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Por aspecto
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.analisis.aspectos.map((a, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"
                      >
                        <p className="text-[11px] font-semibold text-slate-700 mb-1">{a.aspecto}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{a.conclusion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AdminInformesPage() {
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: "",
    periodoSeleccionado: "",
    programaSeleccionado: "",
    grupoSeleccionado: "",
    sedeSeleccionada: "",
  });

  const [docentes, setDocentes] = useState<DocenteGeneralMetrics[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const cargarDocentes = useCallback(
    async (page: number = 1) => {
      if (!filtros.configuracionSeleccionada) return;
      try {
        setLoading(true);
        const response = await metricService.getDocentes({
          cfg_t: filtros.configuracionSeleccionada,
          search: searchTerm || undefined,
          sortBy: "nombre_docente",
          sortOrder: "asc",
          sede: filtros.sedeSeleccionada || undefined,
          periodo: filtros.periodoSeleccionado || undefined,
          programa: filtros.programaSeleccionado || undefined,
          semestre: filtros.semestreSeleccionado || undefined,
          grupo: filtros.grupoSeleccionado || undefined,
          page,
          limit: 20,
        });
        setDocentes(response.data);
        setPagination(response.pagination);
      } catch {
        toast({ title: "Error", description: "No se pudo cargar la lista de docentes.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [filtros, searchTerm, toast]
  );

  useEffect(() => {
    if (!filtros.configuracionSeleccionada) return;
    const t = window.setTimeout(() => cargarDocentes(1), searchTerm ? 400 : 0);
    return () => window.clearTimeout(t);
  }, [filtros.configuracionSeleccionada, filtros.sedeSeleccionada, filtros.periodoSeleccionado, filtros.programaSeleccionado, filtros.semestreSeleccionado, filtros.grupoSeleccionado, searchTerm, cargarDocentes]);

  const handleFiltrosChange = useCallback((f: FiltrosState) => setFiltros(f), []);
  const handleLimpiarFiltros = useCallback(
    () =>
      setFiltros({
        configuracionSeleccionada: null,
        semestreSeleccionado: "",
        periodoSeleccionado: "",
        programaSeleccionado: "",
        grupoSeleccionado: "",
        sedeSeleccionada: "",
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 shadow-sm backdrop-blur-xl">
        <div className="mx-auto h-20 w-full max-w-[1680px] px-6 lg:px-8 xl:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100/50">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Informes & Análisis IA</h1>
              <p className="text-xs font-medium text-muted-foreground">Reportes y análisis de comentarios por docente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-3 py-1 bg-violet-50/50 border-violet-100 text-violet-700 font-medium text-xs gap-1.5 rounded-xl"
            >
              <Bot className="h-3.5 w-3.5" />
              IA Habilitada
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-10 lg:px-8 xl:px-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* AI Config Panel */}
        <AIConfigPanel />

        {/* Filters */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />
          <div className="relative">
            <FiltersMemo
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              onLimpiarFiltros={handleLimpiarFiltros}
              loading={loading}
            />
          </div>
        </div>

        {/* Content */}
        {!filtros.configuracionSeleccionada ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-[3rem] p-16 shadow-inner text-center max-w-2xl mx-auto my-20">
            <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
              <Settings2 className="h-12 w-12 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Configuración Necesaria</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm mx-auto">
              Seleccione un modelo de evaluación en el panel de filtros para visualizar los docentes disponibles.
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500/50 animate-pulse" />
                Esperando selección
              </div>
            </div>
          </div>
        ) : (
          <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-md bg-white hover:shadow-xl transition-all duration-500 overflow-hidden">
            <CardHeader className="p-8 pb-5 border-b border-slate-50 bg-slate-50/40">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Docentes con Comentarios
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm font-medium">
                      {pagination.total > 0
                        ? `${pagination.total} docente${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}`
                        : "Cargando..."}
                    </CardDescription>
                  </div>
                </div>

                {/* Search + Refresh */}
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-48 border-slate-200 text-xs rounded-xl"
                    placeholder="Buscar docente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl border-slate-200 text-slate-600 px-2.5"
                    onClick={() => cargarDocentes(1)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading && docentes.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : docentes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Sin resultados</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No se encontraron docentes con los filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docentes.map((d) => (
                    <DocenteInformeRow key={d.docente} docente={d} filtros={filtros} />
                  ))}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => cargarDocentes(page)}
                            className={`h-8 w-8 rounded-xl text-xs font-medium transition-colors ${
                              pagination.page === page
                                ? "bg-violet-600 text-white shadow-sm"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}
