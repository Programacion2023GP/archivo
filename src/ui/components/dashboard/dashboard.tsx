import React, { useState, useEffect, useMemo, useRef } from "react";
import {
   BarChart3,
   LineChart,
   PieChart,
   TrendingUp,
   Settings,
   Download,
   Upload,
   Plus,
   X,
   Maximize2,
   Minimize2,
   Grid3x3,
   ChevronRight,
   Trash2,
   Printer,
   ZoomIn,
   Image,
   FileText,
   Filter
} from "lucide-react";

declare global {
   interface Window {
      Highcharts: any;
   }
}

// Nuevo tipo para filtros múltiples
interface ChartFilter {
   field: string;
   values: any[];
   operator: "include" | "exclude";
}

interface ChartConfig {
   id: number;
   type: string;
   xAxis: string;
   yAxis: string;
   filters: ChartFilter[];
   title: string;
   is3D: boolean;
   aggregation: string;
}

interface AdvancedAnalyticsDashboardProps {
   data?: any[];
   fieldLabels?: { [key: string]: string };
   savedCharts?: ChartConfig[];
}

interface RangeConfig {
   enabled: boolean;
   type: "number" | "date" | "custom";
   ranges?: { min: number; max: number; label: string }[];
   step?: number;
   customRanges?: string[];
}

interface AdvancedFilterConfig {
   [field: string]: RangeConfig;
}

interface DashboardExport {
   version: string;
   name: string;
   description: string;
   exportDate: string;
   charts: ChartConfig[];
   metadata: {
      totalCharts: number;
      filtersCount: number;
   };
}

const CHART_TYPES = [
   { id: "column", name: "Columnas", icon: BarChart3, description: "Comparar valores" },
   { id: "bar", name: "Barras", icon: BarChart3, description: "Horizontal" },
   { id: "line", name: "Líneas", icon: LineChart, description: "Ver tendencias" },
   { id: "area", name: "Área", icon: TrendingUp, description: "Con relleno" },
   { id: "pie", name: "Pastel", icon: PieChart, description: "Proporciones" },
   { id: "scatter", name: "Dispersión", icon: Grid3x3, description: "Correlación" }
];

const SAMPLE_DATA = [
   { id: 1, status: "Completado", category: "Ventas", amount: 1500, date: "2025-01", department: "Marketing", region: "Norte", priority: "Alta", age: 25 },
   { id: 2, status: "Pendiente", category: "Compras", amount: 800, date: "2025-01", department: "Operaciones", region: "Sur", priority: "Media", age: 32 },
   { id: 3, status: "Completado", category: "Ventas", amount: 2200, date: "2025-02", department: "Marketing", region: "Norte", priority: "Alta", age: 28 },
   { id: 4, status: "Cancelado", category: "Devoluciones", amount: 300, date: "2025-02", department: "Servicio", region: "Este", priority: "Baja", age: 45 },
   { id: 5, status: "Completado", category: "Ventas", amount: 1800, date: "2025-03", department: "Marketing", region: "Oeste", priority: "Alta", age: 22 },
   { id: 6, status: "Pendiente", category: "Compras", amount: 1200, date: "2025-03", department: "Operaciones", region: "Sur", priority: "Media", age: 38 },
   { id: 7, status: "Completado", category: "Servicios", amount: 950, date: "2025-03", department: "Servicio", region: "Este", priority: "Alta", age: 29 },
   { id: 8, status: "Cancelado", category: "Ventas", amount: 450, date: "2025-02", department: "Marketing", region: "Norte", priority: "Baja", age: 51 }
];

const SAMPLE_LABELS = {
   id: "ID",
   status: "Estado",
   category: "Categoría",
   amount: "Monto",
   date: "Fecha",
   department: "Departamento",
   region: "Región",
   priority: "Prioridad",
   age: "Edad"
};

// Gráficas predefinidas con múltiples filtros
const PREBUILT_CHARTS: ChartConfig[] = [
   {
      id: 1001,
      type: "column",
      xAxis: "department",
      yAxis: "amount",
      filters: [],
      title: "Ventas por Departamento",
      is3D: false,
      aggregation: "sum"
   },
   {
      id: 1002,
      type: "pie",
      xAxis: "status",
      yAxis: "",
      filters: [],
      title: "Distribución por Estado",
      is3D: true,
      aggregation: "count"
   },
   {
      id: 1003,
      type: "line",
      xAxis: "date",
      yAxis: "amount",
      filters: [],
      title: "Tendencia de Ventas Mensual",
      is3D: false,
      aggregation: "sum"
   }
];

const HIGHCHARTS_COLORS = [
   "#2E93fA",
   "#66DA26",
   "#546E7A",
   "#E91E63",
   "#FF9800",
   "#8e44ad",
   "#f39c12",
   "#d35400",
   "#c0392b",
   "#16a085",
   "#27ae60",
   "#2980b9",
   "#9b59b6",
   "#e74c3c",
   "#1abc9c",
   "#34495e",
   "#f1c40f",
   "#e67e22",
   "#7f8c8d",
   "#2c3e50"
];

const RangeConfigModal: React.FC<{
   isOpen: boolean;
   onClose: () => void;
   field: string;
   config: RangeConfig;
   onSave: (config: RangeConfig) => void;
   data?: any[];
}> = ({ isOpen, onClose, field, config, onSave, data }) => {
   const [localConfig, setLocalConfig] = useState<RangeConfig>(config);
   const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
      start: "",
      end: ""
   });

   // Función mejorada para normalizar fechas
   const normalizeDate = (dateStr: string): Date => {
      // Si es formato YYYY-MM (solo año y mes)
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
         return new Date(dateStr + "-01"); // Agregar día 1
      }
      // Si es formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
         return new Date(dateStr);
      }
      // Intentar parsear como fecha completa
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
   };

   // Detección mejorada de campos de fecha
   const isDateField = useMemo(() => {
      if (!data || !field) return false;

      const sampleValues = data
         .slice(0, 10)
         .map((item) => String(item[field]))
         .filter(Boolean);
      if (sampleValues.length === 0) return false;

      // Probar si los valores son fechas válidas
      const dateCount = sampleValues.filter((value) => {
         const date = normalizeDate(value);
         return !isNaN(date.getTime());
      }).length;

      return dateCount > sampleValues.length * 0.8; // 80% de valores son fechas
   }, [data, field]);

   // Generar rangos de fecha mejorado
   const generateDateRanges = () => {
      if (!isDateField || !data) return [];

      const dates = data
         .map((item) => normalizeDate(String(item[field])))
         .filter((date) => !isNaN(date.getTime()))
         .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length === 0) return [];

      const minDate = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);
      const maxDate = new Date(dates[dates.length - 1].getFullYear(), dates[dates.length - 1].getMonth() + 1, 0);

      const ranges: any[] = [];
      const current = new Date(minDate);

      // Generar rangos mensuales
      while (current <= maxDate) {
         const year = current.getFullYear();
         const month = current.getMonth();
         const start = new Date(year, month, 1);
         const end = new Date(year, month + 1, 0);

         ranges.push({
            start: start.toISOString().split("T")[0],
            end: end.toISOString().split("T")[0],
            label: `${current.toLocaleString("es-ES", { month: "long", year: "numeric" })}`
         });

         current.setMonth(current.getMonth() + 1);
      }

      return ranges;
   };

   // Función para agregar rango de fecha
   const handleAddDateRange = () => {
      if (dateRange.start && dateRange.end) {
         const newRange = {
            start: dateRange.start,
            end: dateRange.end,
            label: `${new Date(dateRange.start).toLocaleDateString("es-ES")} - ${new Date(dateRange.end).toLocaleDateString("es-ES")}`
         };

         setLocalConfig((prev: any) => ({
            ...prev,
            ranges: [...(prev.ranges || []), newRange]
         }));

         setDateRange({ start: "", end: "" });
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
         <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md lg:max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Configurar rangos para {field}</h3>

            <div className="space-y-4">
               <label className="flex items-center gap-2">
                  <input
                     type="checkbox"
                     checked={localConfig.enabled}
                     onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
                     className="w-4 h-4 text-blue-600 rounded"
                  />
                  Usar rangos para este campo
               </label>

               {localConfig.enabled && (
                  <>
                     <div>
                        <label className="block text-sm font-medium mb-1">Tipo de rango</label>
                        <select
                           value={localConfig.type}
                           onChange={(e) => setLocalConfig({ ...localConfig, type: e.target.value as "number" | "date" | "custom" })}
                           className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                        >
                           <option value="number">Numérico</option>
                           <option value="date" disabled={!isDateField}>
                              Fecha {!isDateField && "(campo no detectado como fecha)"}
                           </option>
                           <option value="custom">Personalizado</option>
                        </select>
                        {!isDateField && localConfig.type === "date" && <p className="text-xs text-red-600 mt-1">Este campo no parece contener fechas válidas</p>}
                     </div>

                     {localConfig.type === "number" && (
                        <div>
                           <label className="block text-sm font-medium mb-1">Tamaño del rango</label>
                           <input
                              type="number"
                              value={localConfig.step || 5}
                              onChange={(e) => setLocalConfig({ ...localConfig, step: Number(e.target.value) })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                              min="1"
                           />
                        </div>
                     )}

                     {localConfig.type === "date" && isDateField && (
                        <div className="space-y-4">
                           <div>
                              <label className="block text-sm font-medium mb-2">Seleccionar rango de fechas</label>
                              <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="block text-xs text-gray-600 mb-1">Desde</label>
                                    <input
                                       type="date"
                                       value={dateRange.start}
                                       onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                                       className="w-full p-2 border border-gray-300 rounded text-sm"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                                    <input
                                       type="date"
                                       value={dateRange.end}
                                       onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                                       className="w-full p-2 border border-gray-300 rounded text-sm"
                                    />
                                 </div>
                              </div>
                              <button
                                 type="button"
                                 onClick={handleAddDateRange}
                                 disabled={!dateRange.start || !dateRange.end}
                                 className="mt-2 w-full bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                 + Agregar Rango
                              </button>
                           </div>

                           {/* Rangos predefinidos */}
                           <div>
                              <label className="block text-sm font-medium mb-2">Rangos predefinidos (mensuales)</label>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                 {generateDateRanges().map((range, index) => (
                                    <label key={index} className="flex items-center gap-2 text-sm">
                                       <input
                                          type="checkbox"
                                          checked={localConfig.ranges?.some((r: any) => r.label === range.label)}
                                          onChange={(e) => {
                                             if (e.target.checked) {
                                                setLocalConfig((prev: any) => ({
                                                   ...prev,
                                                   ranges: [...(prev.ranges || []), range]
                                                }));
                                             } else {
                                                setLocalConfig((prev: any) => ({
                                                   ...prev,
                                                   ranges: prev.ranges?.filter((r: any) => r.label !== range.label) || []
                                                }));
                                             }
                                          }}
                                          className="w-4 h-4 text-blue-600 rounded"
                                       />
                                       <span>{range.label}</span>
                                    </label>
                                 ))}
                              </div>
                           </div>

                           {/* Rangos personalizados agregados */}
                           {localConfig.ranges && localConfig.ranges.length > 0 && (
                              <div>
                                 <label className="block text-sm font-medium mb-2">Rangos configurados</label>
                                 <div className="space-y-1">
                                    {localConfig.ranges.map((range: any, index: number) => (
                                       <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                          <span>{range.label}</span>
                                          <button
                                             type="button"
                                             onClick={() => {
                                                setLocalConfig((prev: any) => ({
                                                   ...prev,
                                                   ranges: prev.ranges?.filter((_: any, i: number) => i !== index) || []
                                                }));
                                             }}
                                             className="text-red-600 hover:text-red-800"
                                          >
                                             ×
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {localConfig.type === "custom" && (
                        <div>
                           <label className="block text-sm font-medium mb-1">Rangos personalizados (uno por línea)</label>
                           <textarea
                              value={localConfig.customRanges?.join("\n") || ""}
                              onChange={(e) =>
                                 setLocalConfig({
                                    ...localConfig,
                                    customRanges: e.target.value.split("\n").filter(Boolean)
                                 })
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 text-sm lg:text-base"
                              placeholder="Ejemplo:&#10;0-17&#10;18-25&#10;26-35"
                           />
                        </div>
                     )}
                  </>
               )}
            </div>

            <div className="flex gap-2 mt-6">
               <button
                  onClick={() => onSave(localConfig)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base"
               >
                  Guardar
               </button>
               <button onClick={onClose} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm lg:text-base">
                  Cancelar
               </button>
            </div>
         </div>
      </div>
   );
};

const AdvancedAnalyticsDashboard = ({ data = SAMPLE_DATA, fieldLabels = SAMPLE_LABELS, savedCharts = [] }: AdvancedAnalyticsDashboardProps) => {
   const [charts, setCharts] = useState<ChartConfig[]>([]);
   const [showConfig, setShowConfig] = useState(false);
   const [showTemplates, setShowTemplates] = useState(false);
   const [currentConfig, setCurrentConfig] = useState<ChartConfig>({
      id: Date.now(),
      type: "column",
      xAxis: "",
      yAxis: "",
      filters: [],
      title: "Nueva Gráfica",
      is3D: false,
      aggregation: "count"
   });
   const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
   const [expandedChart, setExpandedChart] = useState<number | null>(null);
   const [rangeConfigModal, setRangeConfigModal] = useState<{ isOpen: boolean; field: string }>({ isOpen: false, field: "" });
   const chartRefs = useRef<{ [key: number]: any }>({});
   const [highchartsLoaded, setHighchartsLoaded] = useState(false);

   const [advancedFilterConfig, setAdvancedFilterConfig] = useState<AdvancedFilterConfig>({
      age: {
         enabled: true,
         type: "number",
         step: 5,
         ranges: [
            { min: 0, max: 17, label: "0-17" },
            { min: 18, max: 25, label: "18-25" },
            { min: 26, max: 35, label: "26-35" },
            { min: 36, max: 50, label: "36-50" },
            { min: 51, max: 100, label: "51+" }
         ]
      },
      date: {
         enabled: false,
         type: "date",
         ranges: []
      }
   });

   // Cargar gráficas guardadas al inicializar
   useEffect(() => {
      if (savedCharts.length > 0) {
         setCharts(savedCharts);
      }
   }, [savedCharts]);

   const getFieldLabel = (fieldKey: string): string => {
      // Si no existe en fieldLabels, devolver el fieldKey como fallback
      return fieldLabels[fieldKey] || fieldKey;
   };

   const availableFields = useMemo(() => {
      if (!data || data.length === 0) return [];

      // Solo incluir campos que existen en fieldLabels
      return Object.keys(data[0])
         .filter((field) => fieldLabels[field]) // ← FILTRO CLAVE: Solo campos que están en fieldLabels
         .map((field) => ({
            key: field,
            label: getFieldLabel(field)
         }));
   }, [data, fieldLabels]);

 const getUniqueValues = (field: string) => {
    if (!field || !data) return [];

    return [
       ...new Set(
          data.map((item) =>
             // CAMBIAR: Normalizar nulls aquí también
             item[field] == null ? "N/D" : item[field]
          )
       )
    ]
       .filter((v) => v != null && v !== "")
       .sort();
 };
   const generateRanges = (field: string, type: "number" | "date", step: number = 5) => {
      const values = getUniqueValues(field);

      if (type === "number") {
         const numericValues = values
            .map((v) => Number(v))
            .filter((v) => !isNaN(v))
            .sort((a, b) => a - b);
         if (numericValues.length === 0) return [];

         const min = Math.floor(Math.min(...numericValues) / step) * step;
         const max = Math.ceil(Math.max(...numericValues) / step) * step;

         const ranges = [];
         for (let i = min; i < max; i += step) {
            ranges.push({
               min: i,
               max: i + step - 1,
               label: `${i}-${i + step - 1}`
            });
         }
         return ranges;
      }

      return [];
   };

   const getRangesForField = (field: string) => {
      const config = advancedFilterConfig[field];
      if (!config?.enabled) return [];

      if (config.type === "number" && config.step) {
         return generateRanges(field, "number", config.step);
      }

      if (config.type === "custom" && config.customRanges) {
         return config.customRanges.map((range) => ({ label: range }));
      }

      return config.ranges || [];
   };

  const processDataWithRanges = (data: any[], field: string, ranges: any[]) => {
     if (!advancedFilterConfig[field]?.enabled || ranges.length === 0) {
        return data.map((item) => ({
           ...item,
           // Normalizar nulls aquí también
           [field]: item[field] == null ? "N/D" : item[field]
        }));
     }

     return data.map((item) => {
        const value = item[field];
        // CAMBIAR: Normalizar null primero
        const normalizedValue = value == null ? "N/D" : value;

        // Resto del código existente...
        const range = ranges.find((r) => {
           if (r.min !== undefined && r.max !== undefined) {
              const numValue = Number(normalizedValue);
              return !isNaN(numValue) && numValue >= r.min && numValue <= r.max;
           } else if (r.start && r.end) {
              const dateValue = new Date(normalizedValue);
              const rangeStart = new Date(r.start);
              const rangeEnd = new Date(r.end);
              return !isNaN(dateValue.getTime()) && dateValue >= rangeStart && dateValue <= rangeEnd;
           }
           return r.label === normalizedValue;
        });

        return {
           ...item,
           [field]: range ? range.label : normalizedValue
        };
     });
  };

   // Función mejorada para aplicar múltiples filtros
   const applyFilters = (data: any[], filters: ChartFilter[]) => {
      if (!filters || filters.length === 0) return data;

      let processedData = [...data];

      // Aplicar transformaciones de rangos primero
      filters.forEach((filter) => {
         const ranges = getRangesForField(filter.field);
         if (ranges.length > 0) {
            processedData = processDataWithRanges(processedData, filter.field, ranges);
         }
      });

      // Aplicar filtros
      return processedData.filter((item) => {
         return filters.every((filter) => {
            const itemValue = item[filter.field];

            if (filter.operator === "include") {
               return filter.values.includes(itemValue);
            } else {
               // exclude
               return !filter.values.includes(itemValue);
            }
         });
      });
   };

  const processChartData = (config: ChartConfig) => {
     if (!config.xAxis || !data || data.length === 0) return [];

     let filteredData = applyFilters(data, config.filters);
     const groupedData: { [key: string]: any[] } = {};

     filteredData.forEach((item) => {
        const xValue = item[config.xAxis];
        // CAMBIAR ESTA LÍNEA: Reemplazar null/undefined por "N/D"
        const normalizedValue = xValue == null ? "N/D" : String(xValue);

        if (!groupedData[normalizedValue]) groupedData[normalizedValue] = [];
        groupedData[normalizedValue].push(item);
     });

     const processedData = Object.keys(groupedData).map((key) => {
        const items = groupedData[key];
        let yValue: number;

        // Cálculos existentes...
        if (config.aggregation === "count") {
           yValue = items.length;
        } else if (config.aggregation === "sum" && config.yAxis) {
           yValue = items.reduce((sum, item) => sum + (parseFloat(item[config.yAxis]) || 0), 0);
        } else if (config.aggregation === "avg" && config.yAxis) {
           const sum = items.reduce((s, item) => s + (parseFloat(item[config.yAxis]) || 0), 0);
           yValue = sum / items.length;
        } else {
           yValue = items.length;
        }

        // CAMBIAR ESTA LÍNEA: Usar key que ya tiene "N/D" si era null
        return {
           name: key, // ← ya viene normalizado
           y: yValue,
           count: items.length
        };
     });

     return processedData.sort((a, b) => b.y - a.y);
  };

   const createHighchartsConfig = (config: ChartConfig) => {
      const chartData = processChartData(config);
      const is3D = config.is3D && ["column", "bar", "pie"].includes(config.type);
      const aggregationLabel = config.aggregation === "count" ? "Cantidad" : config.aggregation === "sum" ? "Suma" : "Promedio";

    const coloredData = chartData.map((point, index) => ({
       ...point,
       name: point.name || "N/D", // ← asegurar
       color: config.type === "pie" || config.type === "column" || config.type === "bar" ? HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length] : undefined
    }));
      return {
         colors: HIGHCHARTS_COLORS,
         chart: {
            type: config.type,
            options3d: is3D ? { enabled: true, alpha: 15, beta: 15, depth: 50, viewDistance: 25 } : undefined,
            backgroundColor: "transparent",
            height: expandedChart === config.id ? 600 : 400
         },
         title: { text: config.title, style: { fontSize: "18px", fontWeight: "bold", color: "#1f2937" } },
         xAxis: {
            type: "category",
            title: { text: getFieldLabel(config.xAxis) },
            labels: { rotation: chartData.length > 10 ? -45 : 0 }
         },
         yAxis: {
            title: { text: config.yAxis ? `${getFieldLabel(config.yAxis)} (${aggregationLabel})` : "Cantidad" }
         },
         tooltip: {
            pointFormat: "<b>{point.y:.2f}</b><br/>Registros: {point.count}",
            headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>'
            
         },
         plotOptions: {
            column: {
               depth: is3D ? 25 : undefined,
               dataLabels: {
                  enabled: chartData.length < 20,
                  format: "{point.y:.1f}"
               },
               colorByPoint: true
            },
            bar: {
               depth: is3D ? 25 : undefined,
               dataLabels: {
                  enabled: chartData.length < 20,
                  format: "{point.y:.1f}"
               },
               colorByPoint: true
            },
            pie: {
               depth: is3D ? 35 : undefined,
               dataLabels: {
                  enabled: true,
                  format: "{point.name}: {point.percentage:.1f}%"
               },
               colors: HIGHCHARTS_COLORS
            },
            series: {
               animation: { duration: 1000 },
               colorByPoint: config.type === "pie" || config.type === "column" || config.type === "bar"
            }
         },
         series: [
            {
               name: config.title,
               data: coloredData,
               colorByPoint: config.type === "pie" || config.type === "column" || config.type === "bar"
            }
         ],
         credits: { enabled: false },
         exporting: {
            enabled: true,
            buttons: {
               contextButton: {
                  enabled: false
               }
            }
         },
         lang: {
            viewFullscreen: "Ver pantalla completa",
            exitFullscreen: "Salir de pantalla completa",
            downloadPNG: "Descargar PNG",
            downloadJPEG: "Descargar JPEG",
            downloadPDF: "Descargar PDF",
            downloadSVG: "Descargar SVG",
            printChart: "Imprimir gráfica",
            contextButtonTitle: "Menú de gráfica"
         }
      };
   };

   // Efectos para manejar gráficas
   useEffect(() => {
      if (!highchartsLoaded || !window.Highcharts) return;

      const initializeCharts = () => {
         Object.keys(chartRefs.current).forEach((chartId) => {
            const id = parseInt(chartId);
            if (chartRefs.current[id] && chartRefs.current[id].destroy) {
               chartRefs.current[id].destroy();
            }
         });
         chartRefs.current = {};

         charts.forEach((config) => {
            const chartId = `chart-${config.id}`;
            const container = document.getElementById(chartId);

            if (container && !chartRefs.current[config.id]) {
               try {
                  container.innerHTML = "";
                  const chartConfig = createHighchartsConfig(config);
                  chartRefs.current[config.id] = window.Highcharts.chart(chartId, chartConfig);
               } catch (error) {
                  console.error(`Error creando gráfica ${config.id}:`, error);
               }
            }
         });
      };

      setTimeout(initializeCharts, 100);
   }, [charts, expandedChart, highchartsLoaded]);

   useEffect(() => {
      return () => {
         Object.values(chartRefs.current).forEach((chart) => {
            if (chart?.destroy) chart.destroy();
         });
      };
   }, []);

   // Funciones para manejar filtros
   const addFilter = () => {
      setCurrentConfig({
         ...currentConfig,
         filters: [...currentConfig.filters, { field: "", values: [], operator: "include" }]
      });
   };

   const updateFilter = (index: number, field: string, values: any[], operator: "include" | "exclude") => {
      const newFilters = [...currentConfig.filters];
      newFilters[index] = { field, values, operator };
      setCurrentConfig({ ...currentConfig, filters: newFilters });
   };

   const removeFilter = (index: number) => {
      const newFilters = currentConfig.filters.filter((_, i) => i !== index);
      setCurrentConfig({ ...currentConfig, filters: newFilters });
   };

   const addChart = () => {
      if (!currentConfig.xAxis) {
         alert("Por favor selecciona al menos un campo para el eje horizontal");
         return;
      }

      const newChart = {
         ...currentConfig,
         id: editingChart ? currentConfig.id : Date.now() + Math.random()
      };

      if (editingChart) {
         setCharts(charts.map((c) => (c.id === editingChart.id ? newChart : c)));
         setEditingChart(null);
      } else {
         setCharts([...charts, newChart]);
      }

      resetConfig();
      setShowConfig(false);
   };

   const resetConfig = () => {
      setCurrentConfig({
         id: Date.now(),
         type: "column",
         xAxis: "",
         yAxis: "",
         filters: [],
         title: "Nueva Gráfica",
         is3D: false,
         aggregation: "count"
      });
   };

   const editChart = (chart: ChartConfig) => {
      setCurrentConfig(chart);
      setEditingChart(chart);
      setShowConfig(true);
   };

   const deleteChart = (id: number) => {
      if (chartRefs.current[id]) {
         chartRefs.current[id].destroy();
         delete chartRefs.current[id];
      }
      setCharts(charts.filter((c) => c.id !== id));
      if (expandedChart === id) setExpandedChart(null);
   };

   // Funciones de exportación
   const exportChartAsPNG = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.exportChart) {
         chart.exportChart({
            type: "image/png",
            filename: charts.find((c) => c.id === id)?.title || "grafica"
         });
      }
   };

   const exportChartAsJPEG = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.exportChart) {
         chart.exportChart({
            type: "image/jpeg",
            filename: charts.find((c) => c.id === id)?.title || "grafica"
         });
      }
   };

   const exportChartAsPDF = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.exportChart) {
         chart.exportChart({
            type: "application/pdf",
            filename: charts.find((c) => c.id === id)?.title || "grafica"
         });
      }
   };

   const exportChartAsSVG = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.exportChart) {
         chart.exportChart({
            type: "image/svg+xml",
            filename: charts.find((c) => c.id === id)?.title || "grafica"
         });
      }
   };

   const printChart = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.print) {
         chart.print();
      }
   };

   const toggleFullscreen = (id: number) => {
      const chart = chartRefs.current[id];
      if (chart?.fullscreen) {
         chart.fullscreen.toggle();
      }
   };

   const toggleExpandChart = (id: number) => {
      setExpandedChart(expandedChart === id ? null : id);
   };

   const loadPrebuiltChart = (chartConfig: ChartConfig) => {
      const newChart = {
         ...chartConfig,
         id: Date.now() + Math.random()
      };
      setCharts([...charts, newChart]);
      setShowTemplates(false);
   };

   // Funciones de importación/exportación del dashboard
   const exportDashboard = () => {
      if (charts.length === 0) {
         alert("No hay gráficas para exportar");
         return;
      }

      const dashboardConfig = {
         version: "1.0",
         name: prompt("¿Cómo quieres llamar a este dashboard?") || "Mi Dashboard",
         description: prompt("Descripción opcional:") || "",
         exportDate: new Date().toISOString(),
         charts: charts.map((chart) => ({
            ...chart,
            // Asegurarnos de que no hay referencias circulares o funciones
            filters: chart.filters.map((filter) => ({
               field: filter.field,
               values: [...filter.values],
               operator: filter.operator
            }))
         })),
         advancedFilterConfig: advancedFilterConfig,
         metadata: {
            totalCharts: charts.length,
            filtersCount: charts.reduce((acc, chart) => acc + chart.filters.length, 0),
            dataSource: `Base de datos (${data.length} registros)`
         }
      };

      try {
         const dataStr = JSON.stringify(dashboardConfig, null, 2);
         const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

         const exportFileName = `dashboard-${dashboardConfig.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().getTime()}.json`;

         const linkElement = document.createElement("a");
         linkElement.setAttribute("href", dataUri);
         linkElement.setAttribute("download", exportFileName);
         linkElement.style.display = "none";

         document.body.appendChild(linkElement);
         linkElement.click();
         document.body.removeChild(linkElement);

         // Feedback al usuario
         alert(`Dashboard "${dashboardConfig.name}" exportado exitosamente con ${charts.length} gráficas`);
      } catch (error) {
         console.error("Error al exportar:", error);
         alert("Error al exportar el dashboard. Verifica la consola para más detalles.");
      }
   };

   const importDashboard = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.name.endsWith(".json")) {
         alert("Por favor, selecciona un archivo JSON válido");
         event.target.value = "";
         return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
         try {
            const content = e.target?.result as string;
            const config = JSON.parse(content);

            // Validar estructura básica del archivo
            if (!config.charts || !Array.isArray(config.charts)) {
               alert("Formato de archivo inválido: no se encontraron gráficas");
               return;
            }

            // Validar cada gráfica
            const validCharts = config.charts.every((chart: any) => chart.id && chart.type && chart.xAxis && Array.isArray(chart.filters));

            if (!validCharts) {
               alert("El archivo contiene gráficas con formato inválido");
               return;
            }

            const chartCount = config.charts.length;
            const filterCount = config.charts.reduce((acc: number, chart: any) => acc + chart.filters.length, 0);

            const userConfirmed = confirm(
               `¿Importar dashboard "${config.name || "Sin nombre"}"?\n\n` +
                  `• ${chartCount} gráfica${chartCount !== 1 ? "s" : ""}\n` +
                  `• ${filterCount} filtro${filterCount !== 1 ? "s" : ""}\n` +
                  `• Exportado: ${config.exportDate ? new Date(config.exportDate).toLocaleDateString() : "Fecha desconocida"}`
            );

            if (userConfirmed) {
               // Restaurar las gráficas
               setCharts(config.charts);

               // Restaurar la configuración avanzada de filtros si existe
               if (config.advancedFilterConfig) {
                  setAdvancedFilterConfig(config.advancedFilterConfig);
               }

               // Feedback al usuario
               alert(`Dashboard importado exitosamente con ${chartCount} gráficas`);
            }
         } catch (error) {
            console.error("Error al importar:", error);
            alert("Error al importar el archivo. Verifica que sea un JSON válido.");
         } finally {
            // Limpiar el input
            event.target.value = "";
         }
      };

      reader.onerror = () => {
         alert("Error al leer el archivo");
         event.target.value = "";
      };

      reader.readAsText(file);
   };

   // Efecto para cargar Highcharts
   useEffect(() => {
      if (window.Highcharts) {
         setHighchartsLoaded(true);
         return;
      }

      let scriptsLoaded = 0;
      const totalScripts = 5;

      const checkAllScriptsLoaded = () => {
         scriptsLoaded++;
         if (scriptsLoaded === totalScripts) {
            setHighchartsLoaded(true);
         }
      };

      const loadScript = (src: string, onLoad?: () => void) => {
         if (document.querySelector(`script[src="${src}"]`)) {
            checkAllScriptsLoaded();
            return;
         }

         const script = document.createElement("script");
         script.src = src;
         script.async = true;
         script.onload = () => {
            if (onLoad) onLoad();
            checkAllScriptsLoaded();
         };
         script.onerror = checkAllScriptsLoaded;
         document.body.appendChild(script);
      };

      loadScript("https://code.highcharts.com/highcharts.js", () => {
         loadScript("https://code.highcharts.com/highcharts-3d.js");
         loadScript("https://code.highcharts.com/modules/exporting.js");
         loadScript("https://code.highcharts.com/modules/export-data.js");
         loadScript("https://code.highcharts.com/modules/accessibility.js");
         loadScript("https://code.highcharts.com/modules/full-screen.js");
      });
   }, []);

   if (!data || data.length === 0) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 lg:p-8">
            <div className="text-center">
               <div className="inline-block p-6 lg:p-8 bg-white rounded-2xl shadow-xl">
                  <BarChart3 className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2">No hay datos disponibles</h3>
                  <p className="text-gray-600 mb-4 text-sm lg:text-base">Importa datos para comenzar a crear gráficas interactivas</p>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br  flex">
         {/* Panel Lateral - RESPONSIVE */}
         <div
            className={` fixed lg:relative left-0 top-0 h-full bg-white shadow-2xl  transition-all duration-300 z-40 ${
               showConfig ? "w-80 lg:w-96" : "w-0"
            } overflow-hidden`}
         >
            <div className="h-full flex flex-col ">
               <div className="bg-[#9B2242] border border-[#651D32] text-white p-4 lg:p-6 flex justify-between items-center">
                  <div>
                     <h2 className="text-lg lg:text-xl font-bold">{editingChart ? "Editar Gráfica" : "Nueva Gráfica"}</h2>
                     <p className="text-sm text-cyan-100 mt-1">Configura tu visualización</p>
                  </div>
                  <button
                     onClick={() => {
                        setShowConfig(false);
                        setEditingChart(null);
                        resetConfig();
                     }}
                     className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                  {/* Título */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Título</label>
                     <input
                        type="text"
                        value={currentConfig.title}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, title: e.target.value })}
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                        placeholder="Ej: Ventas por Mes"
                     />
                  </div>

                  {/* Tipo de Gráfica */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-3">📊 Tipo de Gráfica</label>
                     <div className="space-y-2">
                        {CHART_TYPES.map((type) => (
                           <button
                              key={type.id}
                              onClick={() => setCurrentConfig({ ...currentConfig, type: type.id })}
                              className={`w-full hover:cursor-pointer flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                 currentConfig.type === type.id ? "border-cyan-500 bg-cyan-50" : "border-gray-200 hover:border-gray-300"
                              }`}
                           >
                              {React.createElement(type.icon, { className: `w-5 h-5 ${currentConfig.type === type.id ? "text-cyan-600" : "text-gray-600"}` })}
                              <div>
                                 <div className={`font-medium text-sm lg:text-base ${currentConfig.type === type.id ? "text-cyan-700" : "text-gray-700"}`}>
                                    {type.name}
                                 </div>
                                 <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Vista 3D */}
                  {["column", "bar", "pie"].includes(currentConfig.type) && (
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input
                              type="checkbox"
                              checked={currentConfig.is3D}
                              onChange={(e) => setCurrentConfig({ ...currentConfig, is3D: e.target.checked })}
                              className="w-5 h-5 text-cyan-600 rounded hover:cursor-pointer"
                           />
                           <div>
                              <span className="text-sm font-semibold text-gray-700">Vista 3D</span>
                              <p className="text-xs text-gray-600 mt-0.5">Agrega profundidad</p>
                           </div>
                        </label>
                     </div>
                  )}

                  {/* Eje Horizontal */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">↔️ Eje Horizontal *</label>
                     <select
                        value={currentConfig.xAxis}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, xAxis: e.target.value })}
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 hover:cursor-pointer text-sm lg:text-base"
                     >
                        <option value="">Selecciona un campo...</option>
                        {availableFields.map((field) => (
                           <option key={field.key} value={field.key}>
                              {field.label}
                           </option>
                        ))}
                     </select>
                     <p className="text-xs text-gray-500 mt-1">Campo para categorizar</p>
                  </div>

                  {/* Agregación */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">🔢 ¿Qué calcular?</label>
                     <select
                        value={currentConfig.aggregation}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, aggregation: e.target.value })}
                        className="w-full hover:cursor-pointer px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                     >
                        <option value="count">Contar registros</option>
                        <option value="sum">Sumar valores</option>
                        <option value="avg">Calcular promedio</option>
                     </select>
                  </div>

                  {/* Campo a sumar/promediar */}
                  {["sum", "avg"].includes(currentConfig.aggregation) && (
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                           ↕️ Campo a {currentConfig.aggregation === "sum" ? "Sumar" : "Promediar"}
                        </label>
                        <select
                           value={currentConfig.yAxis}
                           onChange={(e) => setCurrentConfig({ ...currentConfig, yAxis: e.target.value })}
                           className="w-full px-3 lg:px-4 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                        >
                           <option value="">Selecciona campo numérico...</option>
                           {availableFields.map((field) => (
                              <option key={field.key} value={field.key}>
                                 {field.label}
                              </option>
                           ))}
                        </select>
                     </div>
                  )}

                  {/* Filtros Múltiples */}
                  <div className="border-t pt-4 lg:pt-6">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">🔍 Filtros Múltiples</h3>
                        <button
                           onClick={addFilter}
                           className="flex items-center gap-1 px-3 py-1 text-white rounded-lg hover:cursor-pointer bg-[#9B2242] border border-[#651D32] text-xs"
                        >
                           <Plus className="w-3 h-3" />
                           Agregar Filtro
                        </button>
                     </div>

                     <div className="space-y-3 lg:space-y-4">
                        {currentConfig.filters.map((filter, index) => (
                           <div key={index} className="border border-gray-200 rounded-lg p-3 lg:p-4 bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                 <span className="text-sm font-medium text-gray-700">Filtro {index + 1}</span>
                                 <button onClick={() => removeFilter(index)} className="p-1 hover:bg-red-100 rounded text-red-600" title="Eliminar filtro">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>

                              <div className="space-y-3">
                                 {/* Campo del filtro */}
                                 <select
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, e.target.value, [], filter.operator)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm"
                                 >
                                    <option value="">Selecciona campo...</option>
                                    {availableFields.map((field) => (
                                       <option key={field.key} value={field.key}>
                                          {field.label}
                                       </option>
                                    ))}
                                 </select>

                                 {/* Operador del filtro */}
                                 {filter.field && (
                                    <select
                                       value={filter.operator}
                                       onChange={(e) => updateFilter(index, filter.field, filter.values, e.target.value as "include" | "exclude")}
                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-sm"
                                    >
                                       <option value="include">Incluir</option>
                                       <option value="exclude">Excluir</option>
                                    </select>
                                 )}

                                 {/* Valores del filtro */}
                                 {filter.field && (
                                    <div>
                                       <label className="block text-xs font-medium text-gray-600 mb-2">
                                          Valores ({filter.values.length} seleccionados)
                                          <button
                                             type="button"
                                             onClick={() =>
                                                setRangeConfigModal({
                                                   isOpen: true,
                                                   field: filter.field
                                                })
                                             }
                                             className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                          >
                                             ⚙️ Configurar rangos
                                          </button>
                                       </label>

                                       {/* PARA FECHAS CON RANGOS CONFIGURADOS */}
                                       {advancedFilterConfig[filter.field]?.enabled &&
                                       advancedFilterConfig[filter.field]?.type === "date" &&
                                       advancedFilterConfig[filter.field]?.ranges &&
                                       advancedFilterConfig[filter.field]!.ranges!.length > 0 ? (
                                          <div className="space-y-2">
                                             {advancedFilterConfig[filter.field]!.ranges!.map((range, rangeIndex) => (
                                                <label key={rangeIndex} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                   <input
                                                      type="checkbox"
                                                      checked={filter.values.includes(range.label)}
                                                      onChange={(e) => {
                                                         const newValues = e.target.checked
                                                            ? [...filter.values, range.label]
                                                            : filter.values.filter((v) => v !== range.label);
                                                         updateFilter(index, filter.field, newValues, filter.operator);
                                                      }}
                                                      className="w-4 h-4 text-blue-600 rounded"
                                                   />
                                                   <span className="text-sm text-gray-700">{range.label}</span>
                                                </label>
                                             ))}
                                          </div>
                                       ) : advancedFilterConfig[filter.field]?.enabled ? (
                                          // PARA NÚMEROS CON RANGOS
                                          <div className="space-y-2">
                                             {getRangesForField(filter.field).map((range, rangeIndex) => (
                                                <label key={rangeIndex} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                   <input
                                                      type="checkbox"
                                                      checked={filter.values.includes(range.label)}
                                                      onChange={(e) => {
                                                         const newValues = e.target.checked
                                                            ? [...filter.values, range.label]
                                                            : filter.values.filter((v) => v !== range.label);
                                                         updateFilter(index, filter.field, newValues, filter.operator);
                                                      }}
                                                      className="w-4 h-4 text-blue-600 rounded"
                                                   />
                                                   <span className="text-sm text-gray-700">{range.label}</span>
                                                </label>
                                             ))}
                                          </div>
                                       ) : (
                                          // VALORES INDIVIDUALES (sin rangos)
                                          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1 bg-white">
                                             {getUniqueValues(filter.field).map((value) => (
                                                <label key={String(value)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-sm">
                                                   <input
                                                      type="checkbox"
                                                      checked={filter.values.includes(value)}
                                                      onChange={(e) => {
                                                         const newValues = e.target.checked ? [...filter.values, value] : filter.values.filter((v) => v !== value);
                                                         updateFilter(index, filter.field, newValues, filter.operator);
                                                      }}
                                                      className="w-3 h-3 text-cyan-600 rounded"
                                                   />
                                                   <span className="text-gray-700">
                                                      {/* CAMBIAR: Mostrar "N/D" en lugar de "null" */}
                                                      {String(value) === "N/D" ? "N/D" : String(value)}
                                                   </span>
                                                </label>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}

                        {currentConfig.filters.length === 0 && (
                           <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                              <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-600">No hay filtros agregados</p>
                              <p className="text-xs text-gray-500 mt-1">Usa "Agregar Filtro" para filtrar los datos</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="p-4 lg:p-6 border-t bg-gray-50 space-y-3">
                  <button
                     onClick={addChart}
                     className="w-full px-4 lg:px-6 py-2 lg:py-3 bg-[#9B2242] border border-[#651D32] text-white rounded-lg hover:cursor-pointer transition-all font-semibold shadow-lg text-sm lg:text-base"
                  >
                     {editingChart ? "💾 Actualizar" : "✨ Crear Gráfica"}
                  </button>
                  <button
                     onClick={() => {
                        setShowConfig(false);
                        setEditingChart(null);
                        resetConfig();
                     }}
                     className="w-full px-4 lg:px-6 py-2 lg:py-3 hover:cursor-pointer bg-white text-gray-700 rounded-lg hover:bg-gray-100 font-semibold border text-sm lg:text-base"
                  >
                     Cancelar
                  </button>
               </div>
            </div>
         </div>

         {/* Modal de Configuración de Rangos */}
         <RangeConfigModal
            isOpen={rangeConfigModal.isOpen}
            onClose={() => setRangeConfigModal({ isOpen: false, field: "" })}
            field={rangeConfigModal.field}
            config={advancedFilterConfig[rangeConfigModal.field] || { enabled: false, type: "number" }}
            onSave={(newConfig) => {
               setAdvancedFilterConfig((prev) => ({
                  ...prev,
                  [rangeConfigModal.field]: newConfig
               }));
               setRangeConfigModal({ isOpen: false, field: "" });
            }}
            data={data} // ¡IMPORTANTE! Pasar los datos para detectar fechas
         />

         {/* Modal de Plantillas - RESPONSIVE */}
         {showTemplates && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
               <div className="bg-white rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden m-2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 lg:p-6 flex justify-between items-center">
                     <div>
                        <h2 className="text-lg lg:text-2xl font-bold">Plantillas de Gráficas</h2>
                        <p className="text-cyan-100 mt-1 text-sm lg:text-base">Selecciona una plantilla predefinida</p>
                     </div>
                     <button onClick={() => setShowTemplates(false)} className="p-1 lg:p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5 lg:w-6 lg:h-6" />
                     </button>
                  </div>

                  <div className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 overflow-y-auto max-h-[50vh] lg:max-h-[60vh]">
                     {PREBUILT_CHARTS.map((template) => (
                        <div
                           key={template.id}
                           className="border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => loadPrebuiltChart(template)}
                        >
                           <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                              {React.createElement(CHART_TYPES.find((t) => t.id === template.type)?.icon || BarChart3, {
                                 className: `w-4 h-4 lg:w-5 lg:h-5 ${template.is3D ? "text-purple-500" : "text-cyan-500"}`
                              })}
                              <h3 className="font-semibold text-gray-800 text-sm lg:text-base">{template.title}</h3>
                           </div>
                           <div className="text-xs text-gray-600 space-y-1">
                              <p>
                                 <strong>Tipo:</strong> {CHART_TYPES.find((t) => t.id === template.type)?.name}
                              </p>
                              <p>
                                 <strong>Eje X:</strong> {getFieldLabel(template.xAxis)}
                              </p>
                              {template.yAxis && (
                                 <p>
                                    <strong>Eje Y:</strong> {getFieldLabel(template.yAxis)}
                                 </p>
                              )}
                              {template.filters.length > 0 && (
                                 <p>
                                    <strong>Filtros:</strong> {template.filters.length} aplicados
                                 </p>
                              )}
                              {template.is3D && <p className="text-purple-600 font-medium">✓ Vista 3D</p>}
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-4 lg:p-6 border-t bg-gray-50">
                     <button
                        onClick={() => setShowTemplates(false)}
                        className="w-full px-4 lg:px-6 py-2 lg:py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 font-semibold border text-sm lg:text-base"
                     >
                        Cerrar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Área Principal - RESPONSIVE */}
         <div className={`flex-1 transition-all duration-300 ${showConfig ? "lg:ml-0" : "ml-0"}`}>
            <div className="bg-white shadow-sm border-b  top-0 z-30">
               <div className="p-4 lg:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                     {!showConfig && (
                        <button
                           onClick={() => setShowConfig(true)}
                           className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                           title="Abrir configuración"
                        >
                           <ChevronRight className="w-6 h-6 text-gray-600" />
                        </button>
                     )}
                     <div className="flex-1 lg:flex-none">
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Dashboard de Análisis Avanzado</h1>
                        <p className="text-sm text-gray-600 mt-1">
                           {data.length} registros • {charts.length} gráficas • Filtros múltiples
                        </p>
                     </div>
                  </div>

                  {/* Botones - RESPONSIVE */}
                  <div className="flex flex-wrap gap-2 lg:gap-3 w-full lg:w-auto justify-end">
                     {/* Botón Importar */}
                     <div className="relative">
                        <input
                           type="file"
                           accept=".json"
                           onChange={importDashboard}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           id="import-dashboard"
                        />
                        <label
                           htmlFor="import-dashboard"
                           className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg cursor-pointer text-sm lg:text-base"
                        >
                           <Upload className="w-4 h-4" />
                           <span className="hidden sm:inline">Cargar</span>
                        </label>
                     </div>

                     {/* Botón Exportar */}
                     <button
                        onClick={exportDashboard}
                        disabled={charts.length === 0}
                        className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all shadow-lg text-sm lg:text-base ${
                           charts.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                        }`}
                     >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Descargar</span>
                     </button>

                     {/* Botón Plantillas */}
                     <button
                        onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-lg cursor-pointer text-sm lg:text-base"
                     >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Plantillas</span>
                     </button>

                     {/* Botón Nueva Gráfica */}
                     <button
                        onClick={() => setShowConfig(true)}
                        className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-[#9B2242] border border-[#651D32] text-white rounded-lg hover:bg-[#8a1e3a] transition-all shadow-lg cursor-pointer text-sm lg:text-base"
                     >
                        <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                        <span className="hidden sm:inline">Nueva Gráfica</span>
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-4 lg:p-6">
               {charts.length === 0 ? (
                  <div className="text-center py-10 lg:py-20">
                     <div className="inline-block p-6 lg:p-8 bg-white rounded-2xl shadow-xl max-w-full mx-4">
                        <BarChart3 className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 text-cyan-500" />
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">¡Visualiza tus datos!</h3>
                        <p className="text-gray-600 mb-6 max-w-md text-sm lg:text-base">Crea gráficas personalizadas con filtros múltiples para análisis avanzado</p>
                        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
                           <button
                              onClick={() => setShowTemplates(true)}
                              className="inline-flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold shadow-lg hover:cursor-pointer text-sm lg:text-base"
                           >
                              <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                              Usar Plantilla
                           </button>
                           <button
                              onClick={() => setShowConfig(true)}
                              className="inline-flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-3 text-white rounded-lg hover:cursor-pointer bg-[#9B2242] border border-[#651D32] font-semibold shadow-lg text-sm lg:text-base"
                           >
                              <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                              Crear Personalizada
                           </button>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className={`grid gap-4 lg:gap-6 ${expandedChart ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                     {charts.map((chart) => (
                        <div
                           key={chart.id}
                           className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                              expandedChart === chart.id ? "col-span-full" : ""
                           }`}
                        >
                           {/* Header de la gráfica - RESPONSIVE */}
                           <div className="p-3 lg:p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                 {React.createElement(CHART_TYPES.find((t) => t.id === chart.type)?.icon || BarChart3, { className: "w-4 h-4 lg:w-5 lg:h-5" })}
                                 <span className="font-semibold text-sm lg:text-base truncate max-w-[150px] lg:max-w-none">{chart.title}</span>
                                 {chart.is3D && <span className="text-xs bg-white/20 px-2 py-1 rounded">3D</span>}
                                 {chart.filters.length > 0 && (
                                    <span className="text-xs bg-green-500/80 px-2 py-1 rounded flex items-center gap-1">
                                       <Filter className="w-3 h-3" />
                                       {chart.filters.length}
                                    </span>
                                 )}
                              </div>

                              {/* Botones de acciones - RESPONSIVE */}
                              <div className="flex gap-1 flex-wrap justify-end">
                                 <button
                                    onClick={() => toggleFullscreen(chart.id)}
                                    className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs lg:text-sm"
                                    title="Pantalla completa"
                                 >
                                    <ZoomIn className="w-3 h-3 lg:w-4 lg:h-4" />
                                 </button>

                                 <div className="relative group">
                                    <button className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs lg:text-sm">
                                       <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                                       <span className="hidden xs:inline text-xs">Exportar</span>
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-40 lg:w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                       <button
                                          onClick={() => exportChartAsPNG(chart.id)}
                                          className="flex items-center gap-2 w-full px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                       >
                                          <Image className="w-3 h-3 lg:w-4 lg:h-4" />
                                          PNG
                                       </button>
                                       <button
                                          onClick={() => exportChartAsJPEG(chart.id)}
                                          className="flex items-center gap-2 w-full px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100"
                                       >
                                          <Image className="w-3 h-3 lg:w-4 lg:h-4" />
                                          JPEG
                                       </button>
                                       <button
                                          onClick={() => exportChartAsSVG(chart.id)}
                                          className="flex items-center gap-2 w-full px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100"
                                       >
                                          <FileText className="w-3 h-3 lg:w-4 lg:h-4" />
                                          SVG
                                       </button>
                                    </div>
                                 </div>

                                 <button
                                    onClick={() => printChart(chart.id)}
                                    className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs lg:text-sm"
                                    title="Imprimir"
                                 >
                                    <Printer className="w-3 h-3 lg:w-4 lg:h-4" />
                                    <span className="hidden xs:inline text-xs">Imprimir</span>
                                 </button>

                                 <button
                                    onClick={() => toggleExpandChart(chart.id)}
                                    className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs lg:text-sm"
                                    title={expandedChart === chart.id ? "Minimizar" : "Expandir"}
                                 >
                                    {expandedChart === chart.id ? <Minimize2 className="w-3 h-3 lg:w-4 lg:h-4" /> : <Maximize2 className="w-3 h-3 lg:w-4 lg:h-4" />}
                                 </button>

                                 <button
                                    onClick={() => editChart(chart)}
                                    className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs lg:text-sm"
                                    title="Editar"
                                 >
                                    <Settings className="w-3 h-3 lg:w-4 lg:h-4" />
                                 </button>

                                 <button
                                    onClick={() => deleteChart(chart.id)}
                                    className="flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors text-xs lg:text-sm"
                                    title="Eliminar"
                                 >
                                    <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                                 </button>
                              </div>
                           </div>

                           <div className="p-3 lg:p-4">
                              <div id={`chart-${chart.id}`} className="w-full"></div>
                           </div>

                           {/* Footer de la gráfica - RESPONSIVE */}
                           <div className="px-3 lg:px-4 pb-3 lg:pb-4 text-xs text-gray-600 border-t pt-3">
                              <div className="flex flex-col sm:flex-row flex-wrap gap-2 lg:gap-4">
                                 <span className="break-words">
                                    <strong>Eje X:</strong> {getFieldLabel(chart.xAxis)}
                                 </span>
                                 {chart.yAxis && (
                                    <span className="break-words">
                                       <strong>Eje Y:</strong> {getFieldLabel(chart.yAxis)} ({chart.aggregation})
                                    </span>
                                 )}
                                 {chart.filters.length > 0 && (
                                    <span>
                                       <strong>Filtros:</strong> {chart.filters.length}
                                    </span>
                                 )}
                              </div>

                              {/* Detalles de filtros - RESPONSIVE */}
                              {chart.filters.length > 0 && (
                                 <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                                    <strong>Detalles de filtros:</strong>
                                    {chart.filters.map((filter, index) => (
                                       <div key={index} className="mt-1 ml-2 break-words">
                                          {getFieldLabel(filter.field)} {filter.operator === "include" ? "incluye" : "excluye"}: {filter.values.join(", ")}
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default AdvancedAnalyticsDashboard;
