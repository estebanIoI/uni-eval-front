"use client";

import { useState, useMemo, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

import { BarChart3, CheckCircle2, Clock, Users, GraduationCap, TrendingUp, TrendingDown, Star, AlertTriangle, User, ChevronRight, Book } from "lucide-react";

import { 
  ProgramaSummary, 
  RankingItem, 
  DocenteGeneralMetrics,
  AspectoMetric,
  MateriaMetric,
  MateriaGrupoMetric,
  DocenteMateriasMetrics,
  DocenteAspectosMetrics,
  metricService,
  MetricFilters 
} from "@/src/api/services/metric/metric.service";


// Tipos extendidos para el componente basados en el servicio de métricas
export interface DocenteConMetricas extends DocenteGeneralMetrics {
  avg?: number;
  adjusted?: number;
  realizados?: number;
  universo?: number;
  aspectos?: AspectoMetric[];
  estado?: "excelente" | "bueno" | "regular" | "necesita_mejora" | "sin_evaluar";
}

interface EstadisticasProgramaProps {
  datos?: ProgramaSummary[];
  filters: MetricFilters;
  loading?: boolean;
}

// Configuración del gráfico
const chartConfig: ChartConfig = {
  completadas: {
    label: "Completadas",
    color: "hsl(221, 83%, 53%)", // Azul
  },
  pendientes: {
    label: "Pendientes",
    color: "hsl(220, 9%, 46%)", // Gris
  },
};

export default function EstadisticasPrograma({
  datos,
  filters,
  loading = false,
}: EstadisticasProgramaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    programa: string;
    tipo: "completadas" | "pendientes";
    docentes: DocenteConMetricas[];
    loading: boolean;
  }>({
    programa: "",
    tipo: "completadas",
    docentes: [],
    loading: false,
  });

  // Estado unificado para expandir/contraer secciones de un docente
  const [docenteExpandido, setDocenteExpandido] = useState<{ id: string | null; tipo: 'materias' | 'aspectos' | null }>({ id: null, tipo: null });
  const [materiasLoading, setMateriasLoading] = useState<{ [key: string]: boolean }>({});
  const [docenteMaterias, setDocenteMaterias] = useState<{ [key: string]: MateriaMetric[] }>({});
  const [aspectosLoading, setAspectosLoading] = useState<{ [key: string]: boolean }>({});
  const [docenteAspectos, setDocenteAspectos] = useState<{ [key: string]: DocenteAspectosMetrics }>({});
  
  // Estado para aspectos agregados de todos los docentes
  const [aspectosAgregados, setAspectosAgregados] = useState<DocenteAspectosMetrics | null>(null);
  const [aspectosAgregadosLoading, setAspectosAgregadosLoading] = useState(false);

  // Calcular estado basado en promedio
  const calcularEstado = (promedio: number | null): DocenteConMetricas["estado"] => {
    if (promedio === null) return "sin_evaluar";
    if (promedio >= 4.0) return "excelente";
    if (promedio >= 3.5) return "bueno";
    if (promedio >= 3.0) return "regular";
    return "necesita_mejora";
  };

  // Enriquecer docente con aspectos y estado
  const enriquecerDocente = async (docente: DocenteGeneralMetrics, programa: string): Promise<DocenteConMetricas> => {
    const docenteEnriquecido: DocenteConMetricas = {
      ...docente,
      estado: calcularEstado(docente.promedio_general),
      avg: docente.promedio_general || 0,
      adjusted: docente.promedio_general || 0,
      realizados: docente.total_realizadas,
      universo: docente.total_evaluaciones,
      aspectos: [],
    };

    return docenteEnriquecido;
  };

  // Handler para clic en barras
  const handleBarClick = async (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => {
    // Validar que tenemos los filtros requeridos
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setDialogData({
      programa,
      tipo,
      docentes: [],
      loading: true,
    });
    setDialogOpen(true);

    try {
      // Obtener docentes del programa
      const response = await metricService.getDocentes({
        ...filters,
        programa,
      });

      // Enriquecer docentes con aspectos
      const docentesEnriquecidos = await Promise.all(
        response.data.map((doc) => enriquecerDocente(doc, programa))
      );

      setDialogData((prev) => ({
        ...prev,
        docentes: docentesEnriquecidos,
        loading: false,
      }));
    } catch (error) {
      console.error("Error al obtener docentes:", error);
      setDialogData((prev) => ({
        ...prev,
        docentes: [],
        loading: false,
      }));
    }
  };

  // Handler para clic en un docente (expandir/contraer materias)
  const handleDocenteClick = async (docente: DocenteConMetricas) => {
    const docenteId = docente.docente;
    
    // Si ya está expandido con materias, contraer
    if (docenteExpandido.id === docenteId && docenteExpandido.tipo === 'materias') {
      setDocenteExpandido({ id: null, tipo: null });
      return;
    }

    // Si ya tenemos las materias cargadas, solo expandir
    if (docenteMaterias[docenteId]) {
      setDocenteExpandido({ id: docenteId, tipo: 'materias' });
      return;
    }

    // Si no, cargar las materias
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setMateriasLoading((prev) => ({ ...prev, [docenteId]: true }));

    try {
      const response = await metricService.getDocenteMaterias(docenteId, {
        ...filters,
        programa: dialogData.programa,
      });

      setDocenteMaterias((prev) => ({
        ...prev,
        [docenteId]: response.materias,
      }));
      setDocenteExpandido({ id: docenteId, tipo: 'materias' });
    } catch (error) {
      console.error("Error al obtener materias del docente:", error);
    } finally {
      setMateriasLoading((prev) => ({ ...prev, [docenteId]: false }));
    }
  };

  // Handler para expandir/contraer aspectos de un docente
  const handleAspectosClick = async (docente: DocenteConMetricas) => {
    const docenteId = docente.docente;
    
    // Si ya está expandido con aspectos, contraer
    if (docenteExpandido.id === docenteId && docenteExpandido.tipo === 'aspectos') {
      setDocenteExpandido({ id: null, tipo: null });
      return;
    }

    // Si ya tenemos los aspectos cargados, solo expandir
    if (docenteAspectos[docenteId]) {
      setDocenteExpandido({ id: docenteId, tipo: 'aspectos' });
      return;
    }

    // Si no, cargar los aspectos
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setAspectosLoading((prev) => ({ ...prev, [docenteId]: true }));

    try {
      const response = await metricService.getDocenteAspectos({
        ...filters,
        programa: dialogData.programa,
        docente: docenteId,
      });

      setDocenteAspectos((prev) => ({
        ...prev,
        [docenteId]: response,
      }));
      setDocenteExpandido({ id: docenteId, tipo: 'aspectos' });
    } catch (error) {
      console.error("Error al obtener aspectos del docente:", error);
    } finally {
      setAspectosLoading((prev) => ({ ...prev, [docenteId]: false }));
    }
  };

  // Handler para cargar aspectos agregados de todos los docentes
  const loadAspectosAgregados = async () => {
    if (!filters || !filters.cfg_t) {
      console.error("Filtros incompletos: cfg_t es requerido");
      return;
    }

    setAspectosAgregadosLoading(true);

    try {
      const response = await metricService.getDocenteAspectos({
        ...filters,
        // Sin especificar docente para obtener el agregado de todos
      });

      setAspectosAgregados(response);
    } catch (error) {
      console.error("Error al obtener aspectos agregados:", error);
    } finally {
      setAspectosAgregadosLoading(false);
    }
  };

  // Cargar aspectos agregados cuando cambian los filtros
  useEffect(() => {
    if (filters && filters.cfg_t && datos && datos.length > 0) {
      loadAspectosAgregados();
    }
  }, [filters]);

  // Usar datos proporcionados (datos reales del backend)
  const estadisticas: ProgramaSummary[] = datos && datos.length > 0 ? datos : [];

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    return estadisticas.map((item: ProgramaSummary) => {
      const { metricas } = item;
      const completadas = metricas.total_realizadas;
      const pendientes = metricas.total_pendientes;
      const total = metricas.total_evaluaciones;
      const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
      
      return {
        name: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
        programaCompleto: item.nombre,
        completadas,
        pendientes,
        total,
        porcentaje,
        selected: item.selected ?? false,
      };
    });
  }, [estadisticas]);

  const hasSelected = useMemo(
    () => estadisticas.some((item) => item.selected),
    [estadisticas]
  );

  // Calcular totales
  const totales = useMemo(() => {
    return estadisticas.reduce(
      (acc, item) => ({
        completadas: acc.completadas + item.metricas.total_realizadas,
        pendientes: acc.pendientes + item.metricas.total_pendientes,
        total: acc.total + item.metricas.total_evaluaciones,
      }),
      { completadas: 0, pendientes: 0, total: 0 }
    );
  }, [estadisticas]);

  // Helper para obtener color e icono del estado
  const getEstadoInfo = (estado: DocenteConMetricas["estado"]) => {
    switch (estado) {
      case "excelente":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <Star className="h-4 w-4" />,
          label: "Excelente",
          bgGradient: "from-green-50 to-green-100",
        };
      case "bueno":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Bueno",
          bgGradient: "from-blue-50 to-blue-100",
        };
      case "regular":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <AlertTriangle className="h-4 w-4" />,
          label: "Regular",
          bgGradient: "from-yellow-50 to-yellow-100",
        };
      case "necesita_mejora":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <TrendingDown className="h-4 w-4" />,
          label: "Necesita Mejora",
          bgGradient: "from-red-50 to-red-100",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          icon: <Clock className="h-4 w-4" />,
          label: "Sin Evaluar",
          bgGradient: "from-gray-50 to-gray-100",
        };
    }
  };

  // Helper para obtener color del promedio
  const getPromedioColor = (promedio: number) => {
    if (promedio >= 4.0) return "text-green-600";
    if (promedio >= 3.5) return "text-blue-600";
    if (promedio >= 3.0) return "text-yellow-600";
    if (promedio > 0) return "text-red-600";
    return "text-gray-400";
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
            {data?.programaCompleto || label}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Completadas</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.completadas}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Pendientes</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.pendientes}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">
                  {data?.total}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="font-semibold text-blue-600">
                  {data?.porcentaje}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Estadísticas por Programa
              </CardTitle>
              <CardDescription className="text-gray-500">
                Cargando datos...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Estadísticas por Programa
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  {estadisticas.length > 0 
                    ? "Haz clic en las barras para ver el detalle de estudiantes"
                    : "Seleccione una configuración para ver las estadísticas"}
                </CardDescription>
              </div>
            </div>

            {/* Resumen rápido */}
            {estadisticas.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {totales.completadas} completadas
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {totales.pendientes} pendientes
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {estadisticas.length === 0 ? (
            /* Mensaje cuando no hay datos */
            <div className="h-[400px] flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-500">
                No hay datos de programas disponibles
              </p>
              <p className="text-sm mt-2 text-gray-400">
                Las estadísticas aparecerán cuando se carguen los datos
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico */}
              <div className="h-[400px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.toString()}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="completadas"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "completadas")
                      }
                    >
                      {chartData.map((data, index) => (
                        <Cell
                          key={`completadas-${index}`}
                          className="hover:opacity-80 transition-opacity"
                          fill={
                            hasSelected && !data.selected
                              ? "hsl(215, 16%, 85%)"
                              : "hsl(221, 83%, 53%)"
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="pendientes"
                      fill="hsl(220, 9%, 46%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "pendientes")
                      }
                    >
                      {chartData.map((data, index) => (
                        <Cell
                          key={`pendientes-${index}`}
                          className="hover:opacity-80 transition-opacity"
                          fill={
                            hasSelected && !data.selected
                              ? "hsl(215, 16%, 85%)"
                              : "hsl(220, 9%, 46%)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Completadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Pendientes
                  </span>
                </div>
              </div>

              {/* Cards de resumen por programa (responsive) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {estadisticas.map((programa, index) => {
                  const { metricas } = programa;
                  const completadas = metricas.total_realizadas;
                  const total = metricas.total_evaluaciones;
                  const porcentajeCompletado = total > 0 ? Math.round((completadas / total) * 100) : 0;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                        programa.selected
                          ? "bg-blue-50/60 border-blue-300 shadow-sm"
                          : "bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                      }`}
                      onClick={() => handleBarClick(programa.nombre, "completadas")}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-medium text-gray-500 truncate">
                          {programa.nombre}
                        </span>
                        {programa.selected && (
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            Seleccionado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {porcentajeCompletado}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {completadas}/{total}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            porcentajeCompletado >= 80
                              ? "bg-green-100 text-green-700"
                              : porcentajeCompletado >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {porcentajeCompletado >= 80
                            ? "Alto"
                            : porcentajeCompletado >= 60
                            ? "Medio"
                            : "Bajo"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Aspectos Agregados */}
      {estadisticas.length > 0 && (
        <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300 mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Análisis de Aspectos Evaluados
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  Evaluación agregada de todos los docentes por aspecto
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {aspectosAgregadosLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : aspectosAgregados && aspectosAgregados.aspectos && aspectosAgregados.aspectos.length > 0 ? (
              <div>
                {/* Resumen General */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                    <p className="text-sm text-amber-600 font-medium mb-1">Promedio General</p>
                    <p className={`text-3xl font-bold ${getPromedioColor(aspectosAgregados.promedio || 0)}`}>
                      {(aspectosAgregados.promedio || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-amber-600 mt-2">/5.0</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Respuestas</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {aspectosAgregados.total_respuestas}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">evaluaciones registradas</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Suma Total</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {aspectosAgregados.suma_total}
                    </p>
                    <p className="text-xs text-purple-600 mt-2">puntos acumulados</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
                    <p className="text-sm text-rose-600 font-medium mb-1">Desviación Estándar</p>
                    <p className="text-3xl font-bold text-rose-700">
                      {(aspectosAgregados.desviacion || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-rose-600 mt-2">variabilidad</p>
                  </div>
                </div>

                {/* Lista de Aspectos */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Detalle por Aspecto
                  </h3>
                  {aspectosAgregados.aspectos.map((aspecto: AspectoMetric, idx: number) => {
                    const promedioAspecto = aspecto.suma && aspecto.total_respuestas ? aspecto.suma / aspecto.total_respuestas : 0;
                    const porcentajeRespuestas = aspectosAgregados.total_respuestas > 0 ? Math.round((aspecto.total_respuestas / aspectosAgregados.total_respuestas) * 100) : 0;

                    return (
                      <div key={idx} className="p-4 rounded-xl border border-gray-200 hover:border-amber-300 transition-all hover:shadow-md bg-gradient-to-r from-gray-50 to-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-amber-700">{idx + 1}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {aspecto.nombre}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {aspecto.total_respuestas} respuestas ({porcentajeRespuestas}% del total)
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Métricas del aspecto */}
                          <div className="flex items-center gap-3">
                            {/* Suma */}
                            <div className="text-center px-3 py-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-600 font-medium">Suma</p>
                              <p className="text-lg font-bold text-blue-700">{aspecto.suma}</p>
                            </div>

                            {/* Promedio */}
                            <div className="text-center px-3 py-1.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-600 font-medium">Promedio</p>
                              <p className={`text-lg font-bold ${getPromedioColor(promedioAspecto)}`}>
                                {promedioAspecto.toFixed(2)}
                              </p>
                            </div>

                            {/* Badge de estado */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              promedioAspecto >= 4.0
                                ? "bg-green-100 text-green-700 border-green-200"
                                : promedioAspecto >= 3.5
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : promedioAspecto >= 3.0
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {promedioAspecto >= 4.0
                                ? "Excelente"
                                : promedioAspecto >= 3.5
                                ? "Bueno"
                                : promedioAspecto >= 3.0
                                ? "Regular"
                                : "Necesita mejora"}
                            </div>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">Desempeño</span>
                            <span className="text-xs text-gray-500">{(promedioAspecto / 5 * 100).toFixed(0)}% de 5.0</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                promedioAspecto >= 4.0 ? 'bg-green-500' :
                                promedioAspecto >= 3.5 ? 'bg-blue-500' :
                                promedioAspecto >= 3.0 ? 'bg-yellow-500' :
                                promedioAspecto > 0 ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${(promedioAspecto / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium text-gray-500">
                  No hay datos de aspectos disponibles
                </p>
                <p className="text-sm mt-2 text-gray-400">
                  Los aspectos aparecerán cuando se evalúen los docentes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo de detalle de docentes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-lg">Rendimiento de Docentes</span>
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {dialogData.programa}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Listado de docentes con su promedio de evaluación y estado de desempeño
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {dialogData.loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : dialogData.docentes && dialogData.docentes.length > 0 ? (
              <div className="space-y-3">
                {dialogData.docentes.map((docente, index) => {
                  const estadoInfo = getEstadoInfo(docente.estado);
                  const promedio = docente.promedio_general || docente.avg || docente.adjusted || 0;
                  const realizados = docente.total_realizadas;
                  const esperados = docente.total_evaluaciones;
                  const porcentaje = esperados > 0 ? Math.round((realizados / esperados) * 100) : 0;
                  
                  return (
                    <div
                      key={`${docente.docente}-${index}`}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md bg-gradient-to-r ${estadoInfo.bgGradient} cursor-pointer group`}
                      onClick={() => handleDocenteClick(docente)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Posición */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-700">
                              {index + 1}
                            </span>
                          </div>
                          
                          {/* Información del docente */}
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex flex-col">
                                <span>{docente.nombre_docente}</span>
                                <span>{docente.docente}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {realizados} realizadas
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {esperados - realizados} pendientes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-4">
                          {/* Progreso de evaluaciones */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Evaluaciones</p>
                            <p className="text-sm font-medium text-gray-700">
                              {realizados}/{esperados}
                              <span className="text-xs text-gray-400 ml-1">
                                ({porcentaje}%)
                              </span>
                            </p>
                          </div>

                          {/* Promedio */}
                          <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm min-w-[80px]">
                            <p className={`text-2xl font-bold ${getPromedioColor(promedio)}`}>
                              {promedio.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">Promedio</p>
                          </div>

                          {/* Badge de estado */}
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${estadoInfo.color}`}>
                            {estadoInfo.icon}
                            <span className="text-sm font-medium">
                              {estadoInfo.label}
                            </span>
                          </div>

                          {/* Flecha de navegación */}
                          <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso del promedio */}
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                promedio >= 4.0 ? 'bg-green-500' :
                                promedio >= 3.5 ? 'bg-blue-500' :
                                promedio >= 3.0 ? 'bg-yellow-500' :
                                promedio > 0 ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${(promedio / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 min-w-[30px]">
                            /5.0
                          </span>
                        </div>
                      </div>

                      {/* Botones de toggle para Materias y Aspectos */}
                      <div className="mt-3 pt-3 border-t border-gray-200/50 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDocenteClick(docente); }}
                          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                            docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'materias'
                              ? "bg-purple-50 border-purple-300 text-purple-700 font-medium"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50/30"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Book className="h-4 w-4" />
                            Materias
                          </span>
                          <ChevronRight className={`h-4 w-4 transition-transform ${docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'materias' ? 'rotate-90' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleAspectosClick(docente); }}
                          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                            docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'aspectos'
                              ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/30"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Aspectos
                          </span>
                          <ChevronRight className={`h-4 w-4 transition-transform ${docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'aspectos' ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {/* Desplegable de materias */}
                      {docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'materias' && (
                        <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Book className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              Materias ({docenteMaterias[docente.docente]?.length || 0})
                            </span>
                          </div>

                          {materiasLoading[docente.docente] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                            </div>
                          ) : docenteMaterias[docente.docente] && docenteMaterias[docente.docente].length > 0 ? (
                            <div className="space-y-2">
                              {docenteMaterias[docente.docente].map((materia, idx) => {
                                const realizados = materia.total_realizadas;
                                const esperados = materia.total_evaluaciones;
                                const porcentaje = esperados > 0 ? Math.round((realizados / esperados) * 100) : 0;
                                const promedio = materia.promedio_general || 0;
                                
                                // Manejar ambos casos: materia.grupos (array) o materia.grupo (string)
                                const gruposArray: MateriaGrupoMetric[] = [];
                                if (materia.grupos && materia.grupos.length > 0) {
                                  gruposArray.push(...materia.grupos);
                                } else if ((materia as any).grupo) {
                                  gruposArray.push({
                                    grupo: (materia as any).grupo,
                                    total_evaluaciones: materia.total_evaluaciones,
                                    total_realizadas: materia.total_realizadas,
                                    total_pendientes: materia.total_pendientes,
                                    suma: materia.suma,
                                    promedio_general: materia.promedio_general,
                                    desviacion_general: materia.desviacion_general,
                                    total_evaluaciones_registradas: materia.total_evaluaciones_registradas,
                                    total_estudiantes_registrados: materia.total_estudiantes_registrados,
                                    total_aspectos: materia.total_aspectos,
                                    porcentaje_cumplimiento: materia.porcentaje_cumplimiento,
                                  });
                                }

                                return (
                                  <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Book className="h-4 w-4 text-purple-600" />
                                          <p className="text-sm font-semibold text-gray-900">
                                            {materia.nombre_materia}
                                          </p>
                                          <span className="text-xs text-gray-500">({materia.codigo_materia})</span>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-6">
                                          {realizados}/{esperados} evaluaciones
                                        </p>
                                      </div>

                                      {/* Progreso y promedio */}
                                      <div className="flex items-center gap-3">
                                        {promedio > 0 && (
                                          <div className="text-center px-2 py-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded">
                                            <p className={`text-sm font-bold ${getPromedioColor(promedio)}`}>
                                              {promedio.toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                          porcentaje >= 80
                                            ? "bg-green-100 text-green-700"
                                            : porcentaje >= 60
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                          {porcentaje}%
                                        </div>
                                      </div>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple-500 transition-all duration-500"
                                        style={{ width: `${porcentaje}%` }}
                                      />
                                    </div>

                                    {/* Grupos */}
                                    {gruposArray.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          Grupos ({gruposArray.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {gruposArray.map((grupo, gIdx) => {
                                            const gRealizados = grupo.total_realizadas;
                                            const gEsperados = grupo.total_evaluaciones;
                                            const gPorcentaje = gEsperados > 0 ? Math.round((gRealizados / gEsperados) * 100) : 0;
                                            const gPromedio = grupo.promedio_general || 0;

                                            return (
                                              <div
                                                key={gIdx}
                                                className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full flex items-center gap-1"
                                              >
                                                <span className="font-bold text-blue-700">
                                                  {grupo.grupo}
                                                </span>
                                                <span className="text-blue-600">
                                                  {gRealizados}/{gEsperados}
                                                </span>
                                                {gPromedio > 0 && (
                                                  <span className={`font-semibold ${getPromedioColor(gPromedio)}`}>
                                                    ({gPromedio.toFixed(1)})
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center py-2">
                              Sin materias registradas
                            </p>
                          )}
                        </div>
                      )}

                      {/* Desplegable de aspectos */}
                      {docenteExpandido.id === docente.docente && docenteExpandido.tipo === 'aspectos' && docenteAspectos[docente.docente] && (
                        <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              Aspectos de Evaluación ({docenteAspectos[docente.docente].aspectos.length})
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              Promedio: <span className={`font-semibold ${getPromedioColor(docenteAspectos[docente.docente].promedio || 0)}`}>
                                {(docenteAspectos[docente.docente].promedio || 0).toFixed(2)}
                              </span>
                            </span>
                          </div>

                          {docenteAspectos[docente.docente].aspectos && docenteAspectos[docente.docente].aspectos.length > 0 ? (
                            <div className="space-y-2">
                              {docenteAspectos[docente.docente].aspectos.map((aspecto: AspectoMetric, aIdx: number) => {
                                const promedioAspecto = aspecto.suma && aspecto.total_respuestas ? aspecto.suma / aspecto.total_respuestas : 0;
                                
                                return (
                                  <div key={aIdx} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-all">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                          {aspecto.nombre}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {aspecto.total_respuestas} respuestas
                                        </p>
                                      </div>

                                      {/* Promedio del aspecto */}
                                      <div className="flex items-center gap-3">
                                        <div className="text-center px-3 py-1.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                                          <p className={`text-lg font-bold ${getPromedioColor(promedioAspecto)}`}>
                                            {promedioAspecto.toFixed(2)}
                                          </p>
                                        </div>

                                        {/* Badge de estado */}
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                          promedioAspecto >= 4.0
                                            ? "bg-green-100 text-green-700"
                                            : promedioAspecto >= 3.5
                                            ? "bg-blue-100 text-blue-700"
                                            : promedioAspecto >= 3.0
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                          {promedioAspecto >= 4.0
                                            ? "Excelente"
                                            : promedioAspecto >= 3.5
                                            ? "Bueno"
                                            : promedioAspecto >= 3.0
                                            ? "Regular"
                                            : "Bajo"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Barra de progreso del aspecto */}
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${
                                          promedioAspecto >= 4.0 ? 'bg-green-500' :
                                          promedioAspecto >= 3.5 ? 'bg-blue-500' :
                                          promedioAspecto >= 3.0 ? 'bg-yellow-500' :
                                          promedioAspecto > 0 ? 'bg-red-500' : 'bg-gray-300'
                                        }`}
                                        style={{ width: `${(promedioAspecto / 5) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center py-2">
                              Sin aspectos evaluados
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium">
                  No hay docentes para mostrar
                </p>
                <p className="text-sm mt-1">
                  No se encontraron docentes evaluados en este programa
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer con resumen */}
          {!dialogData.loading && dialogData.docentes && dialogData.docentes.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Total: {dialogData.docentes.length} docente
                {dialogData.docentes.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'excelente').length} Excelente
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'bueno').length} Bueno
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'necesita_mejora').length} A mejorar
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
