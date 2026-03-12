import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import {
   FiSearch,
   FiChevronUp,
   FiChevronDown,
   FiX,
   FiAlertCircle,
   FiInbox,
   FiEye,
   FiRefreshCw,
   FiChevronLeft,
   FiChevronRight,
   FiDownload,
   FiColumns,
   FiMaximize2,
   FiMinimize2,
   FiCopy,
   FiCheck,
   FiBookmark,
   FiPrinter,
   FiLock,
   FiUnlock,
   FiBarChart2,
   FiGrid,
   FiSun,
   FiMoon,
   FiLayout
} from "react-icons/fi";
import { RiFileExcelFill, RiFileTextLine } from "react-icons/ri";

// ==================== TYPES ====================
export interface Column<T extends object> {
   field: keyof T;
   headerName: string;
   renderField?: <K extends keyof T>(value: T[K], row: T) => React.ReactNode;
   getFilterValue?: <K extends keyof T>(value: T[K]) => string;
   visibility?: "always" | "desktop" | "expanded" | "hidden";
   priority?: number;
   filterType?: "text" | "number" | "date" | "date-range" | "select" | "boolean" | "number-range" | "multi-select";
   filterOptions?: Array<{ value: any; label: string }>;
   width?: number;
   minWidth?: number;
   align?: "left" | "center" | "right";
   pinned?: "left" | "right";
   sortable?: boolean;
   resizable?: boolean;
   groupable?: boolean;
   aggregation?: "sum" | "avg" | "min" | "max" | "count";
   format?: "currency" | "percent" | "number" | "date" | "text";
   editable?: boolean;
   tooltip?: (row: T) => string;
   conditionalStyle?: (row: T) => React.CSSProperties;
   frozen?: boolean;
}

type ViewMode = "table" | "cards" | "compact";
type Theme = "light" | "dark";
type DensityMode = "comfortable" | "compact" | "spacious";

interface SavedFilter {
   id: string;
   name: string;
   globalFilter: string;
   columnFilters: Record<string, string>;
   sortConfig: { field: string | null; direction: "asc" | "desc" | null };
   createdAt: string;
}

interface GroupConfig {
   field: string;
   direction: "asc" | "desc";
}

// ==================== REF HANDLE ====================
export interface CustomTableHandle<T extends object = any> {
   /** Limpia todos los filtros, búsqueda global y orden */
   clearAllFilters: () => void;
   /** Limpia solo los filtros de columna */
   clearColumnFilters: () => void;
   /** Limpia la búsqueda global */
   clearGlobalFilter: () => void;
   /** Limpia todas las filas seleccionadas (checkboxes a 0) */
   clearSelection: () => void;
   /** Devuelve las filas actualmente seleccionadas */
   getSelectedRows: () => T[];
   /** Devuelve las filas filtradas/ordenadas actualmente visibles */
   getFilteredRows: () => T[];
   /** Cambia el tema */
   setTheme: (theme: Theme) => void;
   /** Cambia la densidad */
   setDensity: (density: DensityMode) => void;
   /** Cambia la vista */
   setViewMode: (mode: ViewMode) => void;
   /** Cambia la página */
   goToPage: (page: number) => void;
   /** Va a la primera página */
   goToFirstPage: () => void;
   /** Va a la última página */
   goToLastPage: () => void;
   /** Exporta a Excel */
   exportExcel: (onlySelected?: boolean) => void;
   /** Exporta a CSV */
   exportCSV: (onlySelected?: boolean) => void;
   /** Exporta a JSON */
   exportJSON: (onlySelected?: boolean) => void;
   /** Activa/desactiva pantalla completa */
   toggleFullscreen: () => void;
   /** Fuerza el refresco visual (útil tras mutaciones externas) */
   refresh: () => void;
}

export interface PropsTable<T extends object> {
   data: T[];
   paginate: number[];
   columns: Column<T>[];
   headerActions?: () => React.ReactNode;
   actions?: (row: T) => React.ReactNode;
   loading?: boolean;
   error?: string;
   striped?: boolean;
   hoverable?: boolean;
   cardTitleField?: keyof T;
   conditionExcel?: string | Array<string>;
   defaultView?: ViewMode;
   enableViewToggle?: boolean;
   title?: string;
   subtitle?: string;
   childrenField?: keyof T;
   rowIdField?: keyof T;
   indentSize?: number;
   enableGroupSelection?: boolean;
   enableColumnReorder?: boolean;
   enableColumnResize?: boolean;
   enableRowSelection?: boolean;
   enableGroupBy?: boolean;
   enableAggregations?: boolean;
   enableSavedFilters?: boolean;
   enableFullscreen?: boolean;
   enableThemeToggle?: boolean;
   enableExportOptions?: boolean;
   enableColumnVisibility?: boolean;
   enableDensityControl?: boolean;
   enableInlineEdit?: boolean;
   enableRowPinning?: boolean;
   onRowSelect?: (rows: T[]) => void;
   onCellEdit?: (row: T, field: keyof T, value: any) => void;
   defaultTheme?: Theme;
   defaultDensity?: DensityMode;
   storageKey?: string;
}

// ==================== DESIGN TOKENS ====================
const makeTokens = (theme: Theme) => ({
   pageBg: theme === "dark" ? "#0f0f14" : "#f5f5f8",
   white: theme === "dark" ? "#1a1a24" : "#ffffff",
   surface: theme === "dark" ? "#151520" : "#fafafa",
   surfaceElevated: theme === "dark" ? "#1e1e2e" : "#ffffff",
   hover: theme === "dark" ? "#22223a" : "#fdf4f6",
   border: theme === "dark" ? "#2a2a40" : "#e8e8ed",
   borderMd: theme === "dark" ? "#36364f" : "#d8d8df",
   thead: theme === "dark" ? "#13131e" : "#f2f2f6",
   theadBorder: theme === "dark" ? "#2a2a40" : "#e2e2ea",
   ruby: "#9B2242",
   rubyMid: "#b52a4f",
   rubyLight: theme === "dark" ? "rgba(155,34,66,0.18)" : "#fceef2",
   rubyGlow: "rgba(155,34,66,0.15)",
   gold: "#c9920a",
   goldLight: theme === "dark" ? "rgba(201,146,10,0.15)" : "#fef9ec",
   green: "#16a34a",
   greenLight: theme === "dark" ? "rgba(22,163,74,0.15)" : "#f0fdf4",
   blue: "#2563eb",
   blueLight: theme === "dark" ? "rgba(37,99,235,0.15)" : "#eff6ff",
   text1: theme === "dark" ? "#e8e8f0" : "#1a1a24",
   text2: theme === "dark" ? "#9898b8" : "#5a5a72",
   text3: theme === "dark" ? "#55556a" : "#9898b0",
   r4: "6px",
   r6: "10px",
   r8: "14px",
   r12: "18px",
   shadow: theme === "dark" ? "0 1px 4px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
   shadowMd: theme === "dark" ? "0 4px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
   shadowHover: "0 8px 32px rgba(155,34,66,0.18), 0 2px 8px rgba(0,0,0,0.1)"
});

// ==================== SUBCOMPONENTES PARA FILTROS DE FECHA ====================
const DateFilterInput = ({ field, value, setColFilter, C }) => {
   const inputRef = useRef<HTMLInputElement>(null);

   // Resetea el DOM solo cuando se limpia el filtro externamente
   useEffect(() => {
      if (value === "" && inputRef.current) {
         inputRef.current.value = "";
      }
   }, [value]);

   const commit = (val: string) => {
      setColFilter(field, val);
   };

   return (
      <input
         ref={inputRef}
         type="date"
         defaultValue={value}
         // onBlur: filtra solo cuando el usuario sale del input (confirmó la fecha)
         onBlur={(e) => commit(e.target.value)}
         // Enter: confirma inmediatamente
         onKeyDown={(e) => {
            if (e.key === "Enter") {
               commit((e.target as HTMLInputElement).value);
               (e.target as HTMLInputElement).blur();
            }
         }}
         style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: C.text1,
            fontSize: 12,
            width: "100%",
            fontFamily: "inherit"
         }}
      />
   );
};

const DateRangeFilterInput = <T extends object>({
   field,
   value,
   setColFilter,
   C
}: {
   field: string;
   value: string;
   setColFilter: (f: string, v: string) => void;
   C: ReturnType<typeof makeTokens>;
}) => {
   const [start, end] = value.split("|");
   const [localStart, setLocalStart] = useState(start || "");
   const [localEnd, setLocalEnd] = useState(end || "");

   useEffect(() => {
      setLocalStart(start || "");
      setLocalEnd(end || "");
   }, [start, end]);

   const applyRange = () => {
      setColFilter(field, `${localStart}|${localEnd}`);
   };

   return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
         <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            onBlur={applyRange}
            style={{
               background: "transparent",
               border: "none",
               outline: "none",
               color: C.text1,
               fontSize: 12,
               width: "100%",
               fontFamily: "inherit"
            }}
         />
         <div style={{ height: 1, background: C.border }} />
         <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            onBlur={applyRange}
            style={{
               background: "transparent",
               border: "none",
               outline: "none",
               color: C.text1,
               fontSize: 12,
               width: "100%",
               fontFamily: "inherit"
            }}
         />
      </div>
   );
};

// ==================== COMPONENTE PRINCIPAL (forwardRef) ====================
const CustomTableInner = <T extends object>(
   {
      data,
      columns: initialColumns,
      paginate,
      actions,
      loading,
      error,
      headerActions,
      striped = true,
      hoverable = true,
      cardTitleField,
      conditionExcel,
      defaultView = "table",
      enableViewToggle = true,
      title,
      subtitle,
      childrenField,
      indentSize = 20,
      rowIdField,
      enableColumnReorder = true,
      enableColumnResize = true,
      enableRowSelection = false,
      enableGroupBy = true,
      enableAggregations = true,
      enableSavedFilters = true,
      enableFullscreen = true,
      enableThemeToggle = true,
      enableExportOptions = true,
      enableColumnVisibility = true,
      enableDensityControl = true,
      enableInlineEdit = false,
      enableRowPinning = false,
      onRowSelect,
      onCellEdit,
      enableGroupSelection = false,
      defaultTheme = "light",
      defaultDensity = "comfortable",
      storageKey
   }: PropsTable<T>,
   ref: React.Ref<CustomTableHandle<T>>
) => {
   // ========== ESTADOS ==========
   const [currentPage, setCurrentPage] = useState(1);
   const [rowsPerPage, setRowsPerPage] = useState(paginate[0]);
   const [globalFilter, setGlobalFilter] = useState("");
   const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
   const [sortConfig, setSortConfig] = useState<{ field: keyof T | null; direction: "asc" | "desc" | null }>({ field: null, direction: null });
   const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
   const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
   const [hoveredRow, setHoveredRow] = useState<string | null>(null);

   const [theme, setTheme] = useState<Theme>(defaultTheme);
   const [density, setDensity] = useState<DensityMode>(defaultDensity);
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [columns, setColumns] = useState(initialColumns);
   const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
   const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
   const [pinnedRows, setPinnedRows] = useState<Set<string>>(new Set());
   const [groupBy, setGroupBy] = useState<GroupConfig | null>(null);
   const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
   const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
   const [saveFilterName, setSaveFilterName] = useState("");
   const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
   const [editingValue, setEditingValue] = useState<string>("");
   const [copiedCell, setCopiedCell] = useState<string | null>(null);
   const [showColumnManager, setShowColumnManager] = useState(false);
   const [showExportMenu, setShowExportMenu] = useState(false);
   const [showFilterLibrary, setShowFilterLibrary] = useState(false);
   const [showStats, setShowStats] = useState(false);
   const [flashRow, setFlashRow] = useState<string | null>(null);
   const [resizingCol, setResizingCol] = useState<string | null>(null);
   // ── selectAll se resetea automáticamente cuando selectedRows se vacía ──
   const [selectAll, setSelectAll] = useState(false);
   const [showGroupPanel, setShowGroupPanel] = useState(false);
   const [rowExpanded, setRowExpanded] = useState<Set<string>>(new Set());

   const showExpandCol = Boolean(childrenField) || enableRowSelection;
   const showActionsCol = Boolean(actions) || enableRowPinning;

   const C = makeTokens(theme);
   const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
   const containerRef = useRef<HTMLDivElement>(null);
   const searchRef = useRef<HTMLInputElement>(null);
   const resizeRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

   const columnManagerRef = useRef<HTMLDivElement>(null);
   const exportMenuRef = useRef<HTMLDivElement>(null);
   const filterLibraryRef = useRef<HTMLDivElement>(null);

   // Densidad
   const dp = {
      comfortable: { cell: "13px 16px", header: "14px 16px 0", filterMargin: "8px 10px 10px" },
      compact: { cell: "7px 12px", header: "10px 12px 0", filterMargin: "5px 8px 7px" },
      spacious: { cell: "18px 20px", header: "18px 20px 0", filterMargin: "10px 12px 12px" }
   }[density];

   // ========== FILTRADO DE COLUMNAS ==========
   const allVisibleColumns = useMemo(() => {
      return columns.filter((col) => {
         if (hiddenColumns.has(String(col.field))) return false;
         if (col.visibility === "hidden") return false;
         return true;
      });
   }, [columns, hiddenColumns]);

   const normalColumns = useMemo(() => allVisibleColumns.filter((col) => col.visibility !== "expanded"), [allVisibleColumns]);
   const expandedColumns = useMemo(() => allVisibleColumns.filter((col) => col.visibility === "expanded"), [allVisibleColumns]);

   // ========== FILTRADO DE DATOS ==========
   const filteredData = useMemo(() => {
      if (!globalFilter && Object.keys(columnFilters).length === 0) return safeData;
      return safeData.filter((row) => {
         if (globalFilter) {
            const matchesGlobal = allVisibleColumns.some((col) => {
               const val = col.getFilterValue ? col.getFilterValue(row[col.field]) : String(row[col.field] ?? "");
               return val.toLowerCase().includes(globalFilter.toLowerCase());
            });
            if (!matchesGlobal) return false;
         }
         for (const [field, filterValue] of Object.entries(columnFilters)) {
            if (!filterValue) continue;
            const col = columns.find((c) => String(c.field) === field);
            if (!col) continue;
            const rowValue = row[col.field as keyof T];
            const rawValue = String(rowValue ?? "");
            switch (col.filterType) {
               case "text":
               default:
                  if (!rawValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                  break;
               case "number": {
                  const num = Number(rowValue);
                  if (isNaN(num) || !rawValue.includes(filterValue)) return false;
                  break;
               }
               case "select":
               case "boolean":
                  if (rawValue !== filterValue) return false;
                  break;
               case "date-range": {
                  const [start, end] = filterValue.split("|");
                  if (start && end) {
                     const date = new Date(rowValue as any);
                     if (date < new Date(start) || date > new Date(end)) return false;
                  } else if (start && new Date(rowValue as any) < new Date(start)) return false;
                  else if (end && new Date(rowValue as any) > new Date(end)) return false;
                  break;
               }
               case "number-range": {
                  const [min, max] = filterValue.split("|").map(Number);
                  const num = Number(rowValue);
                  if (!isNaN(min) && num < min) return false;
                  if (!isNaN(max) && num > max) return false;
                  break;
               }
               case "multi-select": {
                  const selected = filterValue.split(",").filter(Boolean);
                  if (selected.length > 0 && !selected.includes(rawValue)) return false;
                  break;
               }
            }
         }
         return true;
      });
   }, [safeData, globalFilter, columnFilters, allVisibleColumns, columns]);

   // ========== ORDENACIÓN ==========
   const sortedData = useMemo(
      () =>
         [...filteredData].sort((a, b) => {
            if (!sortConfig.field || !sortConfig.direction) return 0;
            const va = a[sortConfig.field];
            const vb = b[sortConfig.field];
            if (va == null) return -1;
            if (vb == null) return 1;
            const c = String(va).localeCompare(String(vb), undefined, { numeric: true });
            return sortConfig.direction === "asc" ? c : -c;
         }),
      [filteredData, sortConfig]
   );

   // ========== AGRUPACIÓN ==========
   const groupedData = useMemo(() => {
      if (!groupBy || !enableGroupBy) return null;
      const map = new Map<string, T[]>();
      sortedData.forEach((row) => {
         const key = String((row as any)[groupBy.field] ?? "Sin grupo");
         if (!map.has(key)) map.set(key, []);
         map.get(key)!.push(row);
      });
      const entries = [...map.entries()];
      if (groupBy.direction === "desc") entries.reverse();
      return entries;
   }, [sortedData, groupBy, enableGroupBy]);

   // ========== AGREGACIONES ==========
   const aggregations = useMemo(() => {
      if (!enableAggregations) return {};
      const agg: Record<string, any> = {};
      normalColumns.forEach((col) => {
         if (!col.aggregation) return;
         const vals = filteredData.map((r) => Number(r[col.field])).filter((v) => !isNaN(v));
         if (vals.length === 0) {
            agg[String(col.field)] = "—";
            return;
         }
         switch (col.aggregation) {
            case "sum":
               agg[String(col.field)] = vals.reduce((a, b) => a + b, 0).toLocaleString();
               break;
            case "avg":
               agg[String(col.field)] = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
               break;
            case "min":
               agg[String(col.field)] = Math.min(...vals).toLocaleString();
               break;
            case "max":
               agg[String(col.field)] = Math.max(...vals).toLocaleString();
               break;
            case "count":
               agg[String(col.field)] = vals.length.toLocaleString();
               break;
         }
      });
      return agg;
   }, [filteredData, normalColumns, enableAggregations]);

   // ========== UTILIDADES ==========
   const getRowId = (row: Record<string, any>, _: number, index: number) => row.id ?? String(index);

   const pinnedRowsData = useMemo(() => sortedData.filter((row, i) => pinnedRows.has(getRowId(row, 0, i))), [sortedData, pinnedRows]);

   const flatData = sortedData;
   const totalRows = flatData.length;
   const totalPages = Math.ceil(totalRows / rowsPerPage);
   const startIndex = (currentPage - 1) * rowsPerPage;
   const currentRows = flatData.slice(startIndex, startIndex + rowsPerPage);

   const selectedData = useMemo(() => flatData.filter((row, i) => selectedRows.has(getRowId(row, 0, i))), [flatData, selectedRows]);

   // ========== RESET HELPERS ==========
   /** Vacía selección y sincroniza el checkbox "seleccionar todo" */
   const resetSelection = () => {
      setSelectedRows(new Set());
      setSelectAll(false);
   };

   // ── Cuando cambia el dataset, resetear selección ──
   useEffect(() => {
      resetSelection();
      setCurrentPage(1);
   }, [data]);

   // ── Sincronizar selectAll con el estado real de selectedRows ──
   useEffect(() => {
      if (selectedRows.size === 0) {
         setSelectAll(false);
      } else if (currentRows.length > 0 && currentRows.every((r, i) => selectedRows.has(getRowId(r, 0, i)))) {
         setSelectAll(true);
      } else {
         setSelectAll(false);
      }
   }, [selectedRows, currentRows]);

   // ========== EFECTOS ==========
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (showColumnManager || showExportMenu || showFilterLibrary) {
            const target = e.target as Node;
            const isClickInside =
               (showColumnManager && columnManagerRef.current?.contains(target)) ||
               (showExportMenu && exportMenuRef.current?.contains(target)) ||
               (showFilterLibrary && filterLibraryRef.current?.contains(target));
            if (!isClickInside) {
               setShowColumnManager(false);
               setShowExportMenu(false);
               setShowFilterLibrary(false);
            }
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [showColumnManager, showExportMenu, showFilterLibrary]);

   useEffect(() => {
      const h = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            setShowColumnManager(false);
            setShowExportMenu(false);
            setShowFilterLibrary(false);
            setShowGroupPanel(false);
            setShowStats(false);
         }
      };
      window.addEventListener("keydown", h);
      return () => window.removeEventListener("keydown", h);
   }, []);

   useEffect(() => {
      if (!containerRef.current) return;
      if (isFullscreen) {
         document.body.style.overflow = "hidden";
         containerRef.current.style.position = "fixed";
         containerRef.current.style.inset = "0";
         containerRef.current.style.zIndex = "9999";
         containerRef.current.style.borderRadius = "0";
      } else {
         document.body.style.overflow = "";
         containerRef.current.style.position = "";
         containerRef.current.style.inset = "";
         containerRef.current.style.zIndex = "";
         containerRef.current.style.borderRadius = C.r12;
      }
   }, [isFullscreen]);

   // Persistencia en localStorage
   useEffect(() => {
      if (!storageKey) return;
      try {
         const saved = localStorage.getItem(`ultratbl_${storageKey}`);
         if (saved) {
            const p = JSON.parse(saved);
            if (p.hiddenColumns) setHiddenColumns(new Set(p.hiddenColumns));
            if (p.columnWidths) setColumnWidths(p.columnWidths);
            if (p.theme) setTheme(p.theme);
            if (p.density) setDensity(p.density);
            if (p.savedFilters) setSavedFilters(p.savedFilters);
            if (p.rowsPerPage) setRowsPerPage(p.rowsPerPage);
            if (p.globalFilter !== undefined) setGlobalFilter(p.globalFilter);
            if (p.columnFilters) setColumnFilters(p.columnFilters);
            if (p.sortConfig) setSortConfig(p.sortConfig);
            if (p.currentPage) setCurrentPage(p.currentPage);
         }
      } catch {}
   }, [storageKey]);

   useEffect(() => {
      if (!storageKey) return;
      try {
         localStorage.setItem(
            `ultratbl_${storageKey}`,
            JSON.stringify({
               hiddenColumns: [...hiddenColumns],
               columnWidths,
               theme,
               density,
               savedFilters,
               rowsPerPage,
               globalFilter,
               columnFilters,
               sortConfig: { field: sortConfig.field ? String(sortConfig.field) : null, direction: sortConfig.direction },
               currentPage
            })
         );
      } catch {}
   }, [hiddenColumns, columnWidths, theme, density, savedFilters, rowsPerPage, globalFilter, columnFilters, sortConfig, currentPage]);

   useEffect(() => {
      if (onRowSelect) {
         const selRows = safeData.filter((_, i) => selectedRows.has(getRowId(_, 0, i)));
         onRowSelect(selRows);
      }
   }, [selectedRows]);

   // Resize
   useEffect(() => {
      const onMove = (e: MouseEvent) => {
         if (!resizeRef.current) return;
         const delta = e.clientX - resizeRef.current.startX;
         const newW = Math.max(80, resizeRef.current.startW + delta);
         setColumnWidths((p) => ({ ...p, [resizeRef.current!.col]: newW }));
      };
      const onUp = () => {
         resizeRef.current = null;
         setResizingCol(null);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
         window.removeEventListener("mousemove", onMove);
         window.removeEventListener("mouseup", onUp);
      };
   }, []);

   // ========== HANDLERS ==========
   const handleSort = (field: keyof T) =>
      setSortConfig((p) => {
         if (p.field === field) {
            if (p.direction === "asc") return { field, direction: "desc" };
            if (p.direction === "desc") return { field: null, direction: null };
         }
         return { field, direction: "asc" };
      });

   const setColFilter = (f: string, v: string) => {
      setColumnFilters((p) => ({ ...p, [f]: v }));
      setCurrentPage(1);
   };
   const clearColFilter = (f: string) => setColFilter(f, "");

   const clearAll = () => {
      setGlobalFilter("");
      setColumnFilters({});
      setCurrentPage(1);
      setSortConfig({ field: null, direction: null });
      // ── También resetea checkboxes al limpiar todos los filtros ──
      resetSelection();
   };

   const toggleExpand = (nodeId: string) =>
      setExpandedNodes((prev) => {
         const n = new Set(prev);
         n.has(nodeId) ? n.delete(nodeId) : n.add(nodeId);
         return n;
      });

   const toggleRow = (rowId: string) =>
      setSelectedRows((prev) => {
         const n = new Set(prev);
         n.has(rowId) ? n.delete(rowId) : n.add(rowId);
         return n;
      });

   const toggleRowExpanded = (rowId: string) =>
      setRowExpanded((prev) => {
         const n = new Set(prev);
         n.has(rowId) ? n.delete(rowId) : n.add(rowId);
         return n;
      });

   const handleSelectAll = () => {
      if (selectAll) {
         // Deseleccionar solo los de la página actual
         setSelectedRows((prev) => {
            const n = new Set(prev);
            currentRows.forEach((r, i) => n.delete(getRowId(r, 0, i)));
            return n;
         });
         setSelectAll(false);
      } else {
         setSelectedRows((prev) => {
            const n = new Set(prev);
            currentRows.forEach((r, i) => n.add(getRowId(r, 0, i)));
            return n;
         });
         setSelectAll(true);
      }
   };

   const toggleColumnVisibility = (field: string) =>
      setHiddenColumns((prev) => {
         const n = new Set(prev);
         n.has(field) ? n.delete(field) : n.add(field);
         return n;
      });

   const togglePinRow = (rowId: string) =>
      setPinnedRows((prev) => {
         const n = new Set(prev);
         n.has(rowId) ? n.delete(rowId) : n.add(rowId);
         return n;
      });

   const saveCurrentFilter = () => {
      if (!saveFilterName.trim()) return;
      const f: SavedFilter = {
         id: Date.now().toString(),
         name: saveFilterName.trim(),
         globalFilter,
         columnFilters,
         sortConfig: { field: sortConfig.field ? String(sortConfig.field) : null, direction: sortConfig.direction },
         createdAt: new Date().toLocaleDateString()
      };
      setSavedFilters((p) => [...p, f]);
      setSaveFilterName("");
      setShowSaveFilterModal(false);
   };

   const applyFilter = (f: SavedFilter) => {
      setGlobalFilter(f.globalFilter);
      setColumnFilters(f.columnFilters);
      setSortConfig({ field: f.sortConfig.field as keyof T | null, direction: f.sortConfig.direction });
      setCurrentPage(1);
      // ── Resetear selección al aplicar un filtro guardado ──
      resetSelection();
      setShowFilterLibrary(false);
   };

   const deleteSavedFilter = (id: string) => setSavedFilters((p) => p.filter((f) => f.id !== id));

   const copyCellValue = (val: string, key: string) => {
      navigator.clipboard.writeText(val).catch(() => {});
      setCopiedCell(key);
      setTimeout(() => setCopiedCell(null), 1500);
   };

   const flashRowHighlight = (rowId: string) => {
      setFlashRow(rowId);
      setTimeout(() => setFlashRow(null), 600);
   };

   const startResize = (col: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const w = columnWidths[col] || normalColumns.find((c) => String(c.field) === col)?.width || 140;
      resizeRef.current = { col, startX: e.clientX, startW: w };
      setResizingCol(col);
   };

   const getTitle = (row: T): string => {
      if (cardTitleField && row[cardTitleField]) return String(row[cardTitleField]);
      const tf = columns.find((c) => c.priority === 1 || c.headerName.toLowerCase().includes("nombre"));
      return tf ? String(row[tf.field] || "") : "—";
   };

   const getSubtitle = (row: T): string => {
      const sf = columns.find((c) => c.priority === 2);
      return sf ? String(row[sf.field] || "") : "";
   };

   const highlight = (text: string) => {
      if (!globalFilter || !text) return text;
      const re = new RegExp(`(${globalFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return (
         <>
            {text.split(re).map((p, i) =>
               re.test(p) ? (
                  <mark key={i} style={{ background: "rgba(155,34,66,0.18)", color: C.ruby, borderRadius: 2, padding: "0 1px", fontWeight: 700 }}>
                     {p}
                  </mark>
               ) : (
                  p
               )
            )}
         </>
      );
   };

   const getPages = () => {
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
      if (currentPage <= 3) return [1, 2, 3, "…", totalPages];
      if (currentPage >= totalPages - 2) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
      return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
   };

   // ========== EXPORT ==========
   const exportExcel = (dataToExport: T[]) => {
      const rows = dataToExport.map((row) => {
         const obj: Record<string, any> = {};
         columns.forEach((col) => {
            try {
               const rv = col.renderField ? col.renderField(row[col.field], row) : null;
               obj[col.headerName] =
                  rv && (typeof rv === "string" || typeof rv === "number") ? String(rv) : col.getFilterValue ? col.getFilterValue(row[col.field]) : row[col.field];
            } catch {
               obj[col.headerName] = row[col.field];
            }
         });
         return obj;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos");
      XLSX.writeFile(wb, `${title || "export"}.xlsx`);
      setShowExportMenu(false);
   };

   const exportCSV = (dataToExport: T[]) => {
      const headers = columns.map((c) => c.headerName).join(",");
      const rows = dataToExport
         .map((row) =>
            columns
               .map((col) => {
                  const v = String(row[col.field] ?? "").replace(/"/g, '""');
                  return `"${v}"`;
               })
               .join(",")
         )
         .join("\n");
      const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "export"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
   };

   const exportJSON = (dataToExport: T[]) => {
      const rows = dataToExport.map((row) => {
         const obj: Record<string, any> = {};
         columns.forEach((col) => {
            obj[String(col.field)] = row[col.field];
         });
         return obj;
      });
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "export"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
   };

   const printTable = () => {
      window.print();
      setShowExportMenu(false);
   };

   // ========== IMPERATIVE HANDLE (REF PÚBLICO) ====================
   useImperativeHandle(
      ref,
      () => ({
         clearAllFilters: () => clearAll(),
         clearColumnFilters: () => {
            setColumnFilters({});
            setCurrentPage(1);
         },
         clearGlobalFilter: () => {
            setGlobalFilter("");
            setCurrentPage(1);
         },
         clearSelection: () => resetSelection(),
         getSelectedRows: () => selectedData,
         getFilteredRows: () => sortedData,
         setTheme: (t: Theme) => setTheme(t),
         setDensity: (d: DensityMode) => setDensity(d),
         setViewMode: (m: ViewMode) => setViewMode(m),
         goToPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
         goToFirstPage: () => setCurrentPage(1),
         goToLastPage: () => setCurrentPage(totalPages),
         exportExcel: (onlySelected = false) => exportExcel(onlySelected ? selectedData : sortedData),
         exportCSV: (onlySelected = false) => exportCSV(onlySelected ? selectedData : sortedData),
         exportJSON: (onlySelected = false) => exportJSON(onlySelected ? selectedData : sortedData),
         toggleFullscreen: () => setIsFullscreen((f) => !f),
         refresh: () => setColumns((c) => [...c])
      }),
      [selectedData, sortedData, totalPages]
   );

   // ========== RENDER FILTER INPUT ==========
   const renderFilterInput = (col: Column<T>) => {
      const field = String(col.field);
      const value = columnFilters[field] || "";

      switch (col.filterType) {
         case "date":
            return <DateFilterInput field={field} value={value} setColFilter={setColFilter} C={C} />;
         case "date-range":
            return <DateRangeFilterInput field={field} value={value} setColFilter={setColFilter} C={C} />;
         case "select":
            return (
               <select
                  value={value}
                  onChange={(e) => setColFilter(field, e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: C.text1, fontSize: 12, width: "100%", cursor: "pointer" }}
               >
                  <option value="">Todos</option>
                  {col.filterOptions?.map((o) => (
                     <option key={o.value} value={String(o.value)}>
                        {o.label}
                     </option>
                  ))}
               </select>
            );
         case "boolean":
            return (
               <select
                  value={value}
                  onChange={(e) => setColFilter(field, e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: C.text1, fontSize: 12, width: "100%", cursor: "pointer" }}
               >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
               </select>
            );
         case "number-range": {
            const [mn = "", mx = ""] = value.split("|");
            return (
               <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                     type="number"
                     placeholder="Mín"
                     value={mn}
                     onChange={(e) => setColFilter(field, `${e.target.value}|${mx}`)}
                     style={{ background: "transparent", border: "none", outline: "none", color: C.text1, fontSize: 12, width: "45%" }}
                  />
                  <span style={{ color: C.text3, fontSize: 10 }}>–</span>
                  <input
                     type="number"
                     placeholder="Máx"
                     value={mx}
                     onChange={(e) => setColFilter(field, `${mn}|${e.target.value}`)}
                     style={{ background: "transparent", border: "none", outline: "none", color: C.text1, fontSize: 12, width: "45%" }}
                  />
               </div>
            );
         }
         case "multi-select": {
            const sel = value ? value.split(",").filter(Boolean) : [];
            return (
               <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {col.filterOptions?.map((o) => {
                     const active = sel.includes(String(o.value));
                     const next = active ? sel.filter((v) => v !== String(o.value)) : [...sel, String(o.value)];
                     return (
                        <button
                           key={o.value}
                           onMouseDown={(e) => {
                              e.preventDefault();
                              setColFilter(field, next.join(","));
                           }}
                           style={{
                              padding: "2px 8px",
                              borderRadius: 100,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "none",
                              background: active ? C.ruby : C.border,
                              color: active ? "#fff" : C.text2,
                              transition: "all 0.15s"
                           }}
                        >
                           {o.label}
                        </button>
                     );
                  })}
               </div>
            );
         }
         default:
            return (
               <input
                  type="text"
                  placeholder="Filtrar…"
                  value={value}
                  onChange={(e) => setColFilter(field, e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: C.text1, fontSize: 12, width: "100%", fontFamily: "inherit" }}
               />
            );
      }
   };

   // ========== ESTADÍSTICAS ==========
   const getColumnStats = (col: Column<T>) => {
      const vals = filteredData.map((r) => Number(r[col.field])).filter((v) => !isNaN(v));
      if (vals.length === 0) return null;
      return {
         sum: vals.reduce((a, b) => a + b, 0),
         avg: vals.reduce((a, b) => a + b, 0) / vals.length,
         min: Math.min(...vals),
         max: Math.max(...vals),
         count: vals.length
      };
   };

   // ========== INLINE EDIT ==========
   const startEdit = (rowId: string, field: string, value: string) => {
      if (!enableInlineEdit) return;
      setEditingCell({ rowId, field });
      setEditingValue(value);
   };

   const commitEdit = (row: T) => {
      if (!editingCell || !onCellEdit) return;
      onCellEdit(row, editingCell.field as keyof T, editingValue);
      setEditingCell(null);
   };

   // ========== RENDER ROWS ==========
   const renderRows = (rows: T[], level = 0): React.ReactNode[] =>
      rows.flatMap((row, idx) => {
         const rowId = getRowId(row, level, idx);
         const hasChildren = childrenField && Array.isArray(row[childrenField]) && (row[childrenField] as T[]).length > 0;
         const isExpanded = hasChildren ? expandedNodes.has(rowId) : false;
         const isSelected = selectedRows.has(rowId);
         const isPinned = pinnedRows.has(rowId);
         const isFlashing = flashRow === rowId;
         const isHovered = hoveredRow === rowId;
         const isRowExpanded = rowExpanded.has(rowId);

         let bgColor = C.white;
         if (isFlashing) bgColor = C.rubyLight;
         else if (isPinned) bgColor = C.goldLight;
         else if (isSelected) bgColor = `rgba(155,34,66,0.06)`;
         else if (isExpanded) bgColor = `rgba(155,34,66,0.04)`;
         else if (isHovered && hoverable) bgColor = C.hover;
         else if (striped && idx % 2 === 1) bgColor = C.surface;

         return (
            <React.Fragment key={rowId}>
               <motion.tr
                  onMouseEnter={() => setHoveredRow(rowId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => hasChildren && toggleExpand(rowId)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18, delay: idx * 0.01 }}
                  style={{ background: bgColor, cursor: hasChildren ? "pointer" : "default", transition: "background 0.1s", position: "relative" }}
               >
                  {showExpandCol && (
                     <td style={{ padding: "0 4px 0 12px", borderBottom: `1px solid ${C.border}`, width: 52, paddingLeft: 12 + level * indentSize }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                           {enableRowSelection && (
                              <input
                                 type="checkbox"
                                 checked={isSelected}
                                 onChange={() => toggleRow(rowId)}
                                 onClick={(e) => e.stopPropagation()}
                                 style={{ accentColor: C.ruby, cursor: "pointer", width: 14, height: 14 }}
                              />
                           )}
                           {hasChildren ? (
                              <motion.div
                                 animate={{ rotate: isExpanded ? 90 : 0 }}
                                 transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
                                 style={{ display: "flex", color: isExpanded ? C.ruby : C.text3 }}
                              >
                                 <FiChevronDown size={13} style={{ transform: isExpanded ? "rotate(-90deg)" : "none" }} />
                              </motion.div>
                           ) : (
                              <div style={{ width: 13 }} />
                           )}
                        </div>
                     </td>
                  )}

                  {normalColumns.map((col) => {
                     const fieldStr = String(col.field);
                     const cellKey = `${rowId}-${fieldStr}`;
                     const isEditing = editingCell?.rowId === rowId && editingCell?.field === fieldStr;
                     const rawVal = String(row[col.field] ?? "");
                     const customStyle = col.conditionalStyle ? col.conditionalStyle(row) : {};

                     return (
                        <td
                           key={fieldStr}
                           onDoubleClick={() => startEdit(rowId, fieldStr, rawVal)}
                           title={col.tooltip ? col.tooltip(row) : rawVal}
                           style={{
                              padding: dp.cell,
                              borderBottom: `1px solid ${C.border}`,
                              fontSize: density === "compact" ? 12 : 13,
                              color: C.text1,
                              textAlign: col.align || "left",
                              verticalAlign: "middle",
                              ...(columnWidths[fieldStr] || col.width ? { width: columnWidths[fieldStr] || col.width } : {}),
                              minWidth: col.minWidth || 80,
                              ...customStyle
                           }}
                           onClick={(e) => {
                              if (e.metaKey || e.ctrlKey) {
                                 e.stopPropagation();
                                 copyCellValue(rawVal, cellKey);
                              }
                           }}
                        >
                           {isEditing ? (
                              <input
                                 autoFocus
                                 value={editingValue}
                                 onChange={(e) => setEditingValue(e.target.value)}
                                 onBlur={() => commitEdit(row)}
                                 onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit(row);
                                    if (e.key === "Escape") setEditingCell(null);
                                 }}
                                 style={{
                                    background: C.rubyLight,
                                    border: `1.5px solid ${C.ruby}`,
                                    borderRadius: 4,
                                    color: C.text1,
                                    fontSize: 12,
                                    padding: "3px 7px",
                                    width: "100%",
                                    outline: "none",
                                    fontFamily: "inherit"
                                 }}
                              />
                           ) : (
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                                 {col.renderField ? col.renderField(row[col.field], row) : highlight(rawVal)}
                                 {copiedCell === cellKey && (
                                    <motion.span
                                       initial={{ opacity: 0, scale: 0.7 }}
                                       animate={{ opacity: 1, scale: 1 }}
                                       exit={{ opacity: 0 }}
                                       style={{ color: C.green, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
                                    >
                                       <FiCheck size={10} /> Copiado
                                    </motion.span>
                                 )}
                              </div>
                           )}
                        </td>
                     );
                  })}

                  {showActionsCol && (
                     <td style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                           {expandedColumns.length > 0 && (
                              <IconBtn
                                 onClick={() => toggleRowExpanded(rowId)}
                                 title={isRowExpanded ? "Ocultar columnas adicionales" : "Mostrar columnas adicionales"}
                                 active={isRowExpanded}
                                 C={C}
                              >
                                 <FiEye size={12} />
                              </IconBtn>
                           )}
                           {enableRowPinning && (
                              <IconBtn onClick={() => togglePinRow(rowId)} title={isPinned ? "Desanclar" : "Anclar"} active={isPinned} C={C}>
                                 {isPinned ? <FiLock size={12} /> : <FiUnlock size={12} />}
                              </IconBtn>
                           )}
                           {actions && actions(row)}
                        </div>
                     </td>
                  )}
               </motion.tr>

               {isRowExpanded && expandedColumns.length > 0 && (
                  <tr style={{ background: C.surface }}>
                     {showExpandCol && <td style={{ borderBottom: `1px solid ${C.border}` }} />}
                     {expandedColumns.map((col) => {
                        const fieldStr = String(col.field);
                        const rawVal = String(row[col.field] ?? "");
                        const customStyle = col.conditionalStyle ? col.conditionalStyle(row) : {};
                        return (
                           <td
                              key={fieldStr}
                              title={col.tooltip ? col.tooltip(row) : rawVal}
                              style={{
                                 padding: dp.cell,
                                 borderBottom: `1px solid ${C.border}`,
                                 fontSize: density === "compact" ? 12 : 13,
                                 color: C.text1,
                                 textAlign: col.align || "left",
                                 verticalAlign: "middle",
                                 ...(columnWidths[fieldStr] || col.width ? { width: columnWidths[fieldStr] || col.width } : {}),
                                 minWidth: col.minWidth || 80,
                                 ...customStyle
                              }}
                           >
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                 <span style={{ fontSize: 10, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {col.headerName}:
                                 </span>
                                 <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {col.renderField ? col.renderField(row[col.field], row) : rawVal}
                                 </span>
                              </div>
                           </td>
                        );
                     })}
                     {showActionsCol && <td style={{ borderBottom: `1px solid ${C.border}` }} />}
                  </tr>
               )}

               {isExpanded && renderRows(row[childrenField] as T[], level + 1)}
            </React.Fragment>
         );
      });

   // ========== RENDER TABLE ==========
   const renderTable = () => {
      const hasAgg = normalColumns.some((c) => c.aggregation);
      const totalColumns = (showExpandCol ? 1 : 0) + normalColumns.length + (showActionsCol ? 1 : 0);

      return (
         <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
               <thead>
                  <tr>
                     {showExpandCol && (
                        <th
                           style={{
                              width: 52,
                              padding: "0 4px 0 12px",
                              background: C.thead,
                              borderBottom: `2px solid ${C.theadBorder}`,
                              position: "sticky",
                              top: 0,
                              zIndex: 20
                           }}
                        >
                           {enableRowSelection && (
                              <input
                                 type="checkbox"
                                 checked={selectAll}
                                 onChange={handleSelectAll}
                                 style={{ accentColor: C.ruby, cursor: "pointer", width: 14, height: 14 }}
                              />
                           )}
                        </th>
                     )}

                     {normalColumns.map((col) => {
                        const field = String(col.field);
                        const isSorted = sortConfig.field === col.field;
                        const hasFilter = !!columnFilters[field];
                        const hasFixedWidth = columnWidths[field] || col.width;

                        return (
                           <th
                              key={field}
                              style={{
                                 padding: 0,
                                 textAlign: col.align || "left",
                                 background: C.thead,
                                 borderBottom: `2px solid ${isSorted ? C.ruby : C.theadBorder}`,
                                 position: "sticky",
                                 top: 0,
                                 zIndex: 20,
                                 ...(hasFixedWidth ? { width: hasFixedWidth } : {}),
                                 minWidth: col.minWidth || 80,
                                 transition: "border-color 0.2s"
                              }}
                           >
                              <div style={{ padding: dp.header, display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 28 }}>
                                 <button
                                    onClick={() => col.sortable !== false && handleSort(col.field)}
                                    style={{
                                       display: "flex",
                                       alignItems: "center",
                                       gap: 5,
                                       background: "none",
                                       border: "none",
                                       cursor: col.sortable !== false ? "pointer" : "default",
                                       padding: 0,
                                       color: isSorted ? C.ruby : C.text2,
                                       fontSize: 11,
                                       fontWeight: 700,
                                       textTransform: "uppercase",
                                       letterSpacing: "0.07em",
                                       fontFamily: "inherit"
                                    }}
                                 >
                                    {col.headerName}
                                    {col.sortable !== false && (
                                       <span style={{ display: "flex", flexDirection: "column", opacity: isSorted ? 1 : 0.35 }}>
                                          <FiChevronUp size={9} style={{ color: isSorted && sortConfig.direction === "asc" ? C.ruby : C.text3 }} />
                                          <FiChevronDown size={9} style={{ color: isSorted && sortConfig.direction === "desc" ? C.ruby : C.text3 }} />
                                       </span>
                                    )}
                                 </button>
                                 {enableGroupBy && col.groupable && (
                                    <button
                                       onClick={() => setGroupBy(groupBy?.field === field ? null : { field, direction: "asc" })}
                                       title="Agrupar por esta columna"
                                       style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          color: groupBy?.field === field ? C.ruby : C.text3,
                                          padding: 0,
                                          display: "flex"
                                       }}
                                    >
                                       <FiLayout size={11} />
                                    </button>
                                 )}
                              </div>

                              <div
                                 style={{
                                    margin: dp.filterMargin,
                                    background: hasFilter ? C.rubyLight : C.white,
                                    border: `1px solid ${hasFilter ? "rgba(155,34,66,0.25)" : C.border}`,
                                    borderRadius: C.r4,
                                    padding: "5px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    transition: "all 0.2s"
                                 }}
                              >
                                 {col.filterType !== "date-range" && col.filterType !== "multi-select" && (
                                    <FiSearch size={10} style={{ color: hasFilter ? C.ruby : C.text3, flexShrink: 0 }} />
                                 )}
                                 <div style={{ flex: 1, minWidth: 0 }}>{renderFilterInput(col)}</div>
                                 {hasFilter && (
                                    <button
                                       onClick={() => clearColFilter(field)}
                                       style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: C.text3 }}
                                    >
                                       <FiX size={10} />
                                    </button>
                                 )}
                              </div>

                              {enableColumnResize && col.resizable !== false && (
                                 <div
                                    onMouseDown={(e) => startResize(field, e)}
                                    style={{
                                       position: "absolute",
                                       right: 0,
                                       top: 0,
                                       bottom: 0,
                                       width: 6,
                                       cursor: "col-resize",
                                       background: resizingCol === field ? C.ruby : "transparent",
                                       transition: "background 0.15s",
                                       zIndex: 1
                                    }}
                                 />
                              )}
                           </th>
                        );
                     })}

                     {showActionsCol && (
                        <th
                           style={{
                              padding: `${dp.header} 14px`,
                              textAlign: "right",
                              background: C.thead,
                              borderBottom: `2px solid ${C.theadBorder}`,
                              position: "sticky",
                              top: 0,
                              zIndex: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: C.text2,
                              width: "auto"
                           }}
                        >
                           Acciones
                           <div style={{ height: 32 }} />
                        </th>
                     )}
                  </tr>
               </thead>
               <tbody>
                  {enableRowPinning && pinnedRowsData.length > 0 && (
                     <>
                        {renderRows(pinnedRowsData)}
                        <tr>
                           <td
                              colSpan={totalColumns}
                              style={{
                                 padding: "2px 16px",
                                 background: C.goldLight,
                                 borderBottom: `2px dashed ${C.gold}`,
                                 fontSize: 10,
                                 color: C.gold,
                                 fontWeight: 700,
                                 textTransform: "uppercase"
                              }}
                           >
                              ↑ Filas ancladas — filas normales ↓
                           </td>
                        </tr>
                     </>
                  )}

                  {groupedData
                     ? groupedData.map(([groupKey, groupRows]) => {
                          const gPaged = groupRows.slice(0, rowsPerPage);
                          const groupRowIds = groupRows.map((r, i) => getRowId(r, 0, i));
                          const allGroupSelected = groupRowIds.every((id) => selectedRows.has(id));
                          const someGroupSelected = groupRowIds.some((id) => selectedRows.has(id));

                          const toggleGroupSelection = () => {
                             setSelectedRows((prev) => {
                                const next = new Set(prev);
                                if (allGroupSelected) groupRowIds.forEach((id) => next.delete(id));
                                else groupRowIds.forEach((id) => next.add(id));
                                return next;
                             });
                          };

                          return (
                             <React.Fragment key={groupKey}>
                                <tr>
                                   <td
                                      colSpan={totalColumns}
                                      style={{
                                         padding: "8px 16px",
                                         background: C.rubyLight,
                                         borderBottom: `1px solid ${C.border}`,
                                         borderTop: `2px solid rgba(155,34,66,0.15)`
                                      }}
                                   >
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                         {enableGroupSelection && (
                                            <input
                                               type="checkbox"
                                               checked={allGroupSelected}
                                               ref={(el) => {
                                                  if (el) el.indeterminate = someGroupSelected && !allGroupSelected;
                                               }}
                                               onChange={toggleGroupSelection}
                                               style={{ accentColor: C.ruby, cursor: "pointer", width: 14, height: 14, flexShrink: 0 }}
                                            />
                                         )}
                                         <span style={{ fontWeight: 800, fontSize: 12, color: C.ruby }}>
                                            {columns.find((c) => String(c.field) === groupBy?.field)?.headerName || groupBy?.field}:
                                         </span>
                                         <span style={{ fontWeight: 600, fontSize: 13, color: C.text1 }}>{groupKey}</span>
                                         <span style={{ fontSize: 11, color: C.text3, marginLeft: 4 }}>
                                            ({groupRows.length} registros
                                            {someGroupSelected && (
                                               <span style={{ color: C.ruby, fontWeight: 700 }}>
                                                  {" "}
                                                  · {groupRowIds.filter((id) => selectedRows.has(id)).length} sel.
                                               </span>
                                            )}
                                            )
                                         </span>
                                         {enableGroupSelection && !allGroupSelected && (
                                            <button
                                               onClick={toggleGroupSelection}
                                               style={{
                                                  marginLeft: "auto",
                                                  padding: "3px 10px",
                                                  borderRadius: 100,
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  border: `1px solid rgba(155,34,66,0.3)`,
                                                  background: "rgba(155,34,66,0.08)",
                                                  color: C.ruby,
                                                  cursor: "pointer",
                                                  whiteSpace: "nowrap"
                                               }}
                                            >
                                               Sel. grupo
                                            </button>
                                         )}
                                      </div>
                                   </td>
                                </tr>
                                {renderRows(gPaged)}
                             </React.Fragment>
                          );
                       })
                     : renderRows(currentRows)}
               </tbody>
               {hasAgg && enableAggregations && (
                  <tfoot>
                     <tr style={{ background: C.thead }}>
                        {showExpandCol && <td style={{ borderTop: `2px solid ${C.theadBorder}` }} />}
                        {normalColumns.map((col) => {
                           const field = String(col.field);
                           const agg = aggregations[field];
                           return (
                              <td
                                 key={field}
                                 style={{
                                    padding: "10px 16px",
                                    borderTop: `2px solid ${C.theadBorder}`,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: agg ? C.ruby : C.text3,
                                    textAlign: col.align || "left",
                                    ...(columnWidths[field] || col.width ? { width: columnWidths[field] || col.width } : {}),
                                    minWidth: col.minWidth || 80
                                 }}
                              >
                                 {agg ? (
                                    <div>
                                       <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 2 }}>
                                          {col.aggregation}
                                       </div>
                                       {agg}
                                    </div>
                                 ) : (
                                    ""
                                 )}
                              </td>
                           );
                        })}
                        {showActionsCol && <td style={{ borderTop: `2px solid ${C.theadBorder}` }} />}
                     </tr>
                  </tfoot>
               )}
            </table>
         </div>
      );
   };

   // ========== RENDER CARDS ==========
   const renderCards = () => (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16, padding: 24, background: C.pageBg }}>
         {currentRows.map((row, idx) => {
            const rowId = getRowId(row, 0, idx);
            const isSelected = selectedRows.has(rowId);
            return (
               <motion.div
                  key={rowId}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.04, type: "spring", stiffness: 280, damping: 22 }}
                  whileHover={{ y: -4, boxShadow: C.shadowHover }}
                  onClick={() => enableRowSelection && toggleRow(rowId)}
                  style={{
                     background: C.white,
                     borderRadius: C.r8,
                     border: `2px solid ${isSelected ? C.ruby : C.border}`,
                     overflow: "hidden",
                     boxShadow: C.shadow,
                     cursor: enableRowSelection ? "pointer" : "default",
                     transition: "border-color 0.2s"
                  }}
               >
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${C.ruby}, ${C.rubyMid})` }} />
                  <div
                     style={{
                        padding: "15px 17px 13px",
                        borderBottom: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10
                     }}
                  >
                     <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                           style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: C.text1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: 2
                           }}
                        >
                           {getTitle(row)}
                        </div>
                        {getSubtitle(row) && <div style={{ fontSize: 12, color: C.text2 }}>{getSubtitle(row)}</div>}
                     </div>
                     <div
                        style={{
                           width: 34,
                           height: 34,
                           borderRadius: "50%",
                           flexShrink: 0,
                           background: isSelected ? C.ruby : C.rubyLight,
                           border: `1.5px solid rgba(155,34,66,0.18)`,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           fontSize: 13,
                           fontWeight: 800,
                           color: isSelected ? "#fff" : C.ruby,
                           transition: "all 0.2s"
                        }}
                     >
                        {isSelected ? <FiCheck size={14} /> : String(getTitle(row)).charAt(0).toUpperCase()}
                     </div>
                  </div>
                  <div style={{ padding: "11px 17px 13px" }}>
                     {normalColumns.slice(0, 5).map((col, ci) => (
                        <div
                           key={String(col.field)}
                           style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 0",
                              gap: 10,
                              borderBottom: ci < Math.min(normalColumns.length - 1, 4) ? `1px solid ${C.border}` : "none"
                           }}
                        >
                           <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                              {col.headerName}
                           </span>
                           <span
                              style={{
                                 fontSize: 12,
                                 color: C.text2,
                                 fontWeight: 500,
                                 textAlign: "right",
                                 overflow: "hidden",
                                 textOverflow: "ellipsis",
                                 whiteSpace: "nowrap",
                                 maxWidth: "55%"
                              }}
                           >
                              {col.renderField ? col.renderField(row[col.field], row) : String(row[col.field] ?? "—")}
                           </span>
                        </div>
                     ))}
                  </div>
                  {actions && (
                     <div
                        style={{ padding: "9px 13px 11px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", background: C.surface }}
                        onClick={(e) => e.stopPropagation()}
                     >
                        <div style={{ display: "flex", gap: 5 }}>{actions(row)}</div>
                     </div>
                  )}
               </motion.div>
            );
         })}
      </div>
   );

   // ========== RENDER COMPACT ==========
   const renderCompact = () => (
      <div style={{ padding: "8px 16px" }}>
         {currentRows.map((row, idx) => {
            const rowId = getRowId(row, 0, idx);
            const isSelected = selectedRows.has(rowId);
            const isHovered = hoveredRow === rowId;
            return (
               <motion.div
                  key={rowId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  onMouseEnter={() => setHoveredRow(rowId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => enableRowSelection && toggleRow(rowId)}
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: 12,
                     padding: "8px 10px",
                     borderRadius: C.r6,
                     background: isSelected ? C.rubyLight : isHovered ? C.hover : "transparent",
                     border: `1px solid ${isSelected ? "rgba(155,34,66,0.2)" : "transparent"}`,
                     cursor: "pointer",
                     transition: "all 0.12s",
                     marginBottom: 2
                  }}
               >
                  {enableRowSelection && (
                     <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(rowId)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ accentColor: C.ruby, cursor: "pointer", width: 13, height: 13, flexShrink: 0 }}
                     />
                  )}
                  <div
                     style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: C.rubyLight,
                        border: `1.5px solid rgba(155,34,66,0.18)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: C.ruby,
                        flexShrink: 0
                     }}
                  >
                     {String(getTitle(row)).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: `repeat(${Math.min(normalColumns.length, 4)}, 1fr)`, gap: 8 }}>
                     {normalColumns.slice(0, 4).map((col) => (
                        <div key={String(col.field)} style={{ minWidth: 0 }}>
                           <div style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.headerName}</div>
                           <div style={{ fontSize: 12, color: C.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {col.renderField ? col.renderField(row[col.field], row) : String(row[col.field] ?? "—")}
                           </div>
                        </div>
                     ))}
                  </div>
                  {actions && (
                     <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: "flex", gap: 4 }}>
                        {actions(row)}
                     </div>
                  )}
               </motion.div>
            );
         })}
      </div>
   );

   // ========== RENDER LOADING / ERROR / EMPTY ==========
   const renderLoading = () => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
         <motion.div
            style={{ width: 36, height: 36, borderRadius: "50%", border: `2.5px solid ${C.border}`, borderTopColor: C.ruby }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
         />
         <span style={{ fontSize: 13, color: C.text3, fontWeight: 500 }}>Cargando registros…</span>
      </div>
   );

   const renderError = () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "64px 0", color: "#ef4444" }}>
         <FiAlertCircle size={18} />
         <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
      </div>
   );

   const renderEmpty = () => (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: C.text2 }}
      >
         <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <FiInbox size={48} color={C.text3} />
         </motion.div>
         <h3 style={{ color: C.text1, marginTop: 20, marginBottom: 8 }}>No se encontraron resultados</h3>
         <p style={{ color: C.text2, textAlign: "center", maxWidth: 300 }}>
            {globalFilter || Object.values(columnFilters).some(Boolean)
               ? "Los filtros aplicados no coinciden con ningún registro."
               : "No hay datos disponibles para mostrar."}
         </p>
         {(globalFilter || Object.values(columnFilters).some(Boolean)) && (
            <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={clearAll}
               style={{
                  marginTop: 20,
                  padding: "8px 20px",
                  background: C.ruby,
                  color: "white",
                  border: "none",
                  borderRadius: C.r6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
               }}
            >
               <FiRefreshCw size={14} />
               Limpiar todos los filtros
            </motion.button>
         )}
      </motion.div>
   );

   // ========== RENDER MODALS ==========
   const renderColumnManager = () => (
      <AnimatePresence>
         {showColumnManager && (
            <motion.div
               ref={columnManagerRef}
               initial={{ opacity: 0, scale: 0.95, y: -8 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -8 }}
               style={{
                  position: "absolute",
                  top: 50,
                  right: 16,
                  zIndex: 100,
                  background: C.surfaceElevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.r8,
                  padding: 16,
                  width: 240,
                  boxShadow: C.shadowMd
               }}
            >
               <div style={{ fontSize: 12, fontWeight: 800, color: C.text1, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Columnas visibles
               </div>
               {columns.map((col) => (
                  <label
                     key={String(col.field)}
                     style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                  >
                     <input
                        type="checkbox"
                        checked={!hiddenColumns.has(String(col.field))}
                        onChange={() => toggleColumnVisibility(String(col.field))}
                        style={{ accentColor: C.ruby, width: 13, height: 13 }}
                     />
                     <span style={{ fontSize: 12, color: C.text1, fontWeight: 500 }}>{col.headerName}</span>
                  </label>
               ))}
            </motion.div>
         )}
      </AnimatePresence>
   );

   const renderExportMenu = () => (
      <AnimatePresence>
         {showExportMenu && (
            <motion.div
               ref={exportMenuRef}
               initial={{ opacity: 0, scale: 0.95, y: -8 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -8 }}
               style={{
                  position: "absolute",
                  top: 50,
                  right: 16,
                  zIndex: 100,
                  background: C.surfaceElevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.r8,
                  padding: 8,
                  width: 220,
                  boxShadow: C.shadowMd
               }}
            >
               <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.07em", padding: "4px 12px" }}>
                  Todos los datos
               </div>
               {[
                  { icon: <RiFileExcelFill size={14} />, label: "Excel (.xlsx)", action: () => exportExcel(sortedData), color: C.green },
                  { icon: <RiFileExcelFill size={14} />, label: "CSV (.csv)", action: () => exportCSV(sortedData), color: C.blue },
                  { icon: <RiFileTextLine size={14} />, label: "JSON (.json)", action: () => exportJSON(sortedData), color: C.gold },
                  { icon: <FiPrinter size={14} />, label: "Imprimir", action: printTable, color: C.text2 }
               ].map((opt) => (
                  <button
                     key={opt.label}
                     onClick={opt.action}
                     style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 12px",
                        borderRadius: C.r4,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: opt.color,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        transition: "background 0.1s"
                     }}
                     onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                     onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                     {opt.icon} {opt.label}
                  </button>
               ))}

               {enableRowSelection && selectedData.length > 0 && (
                  <>
                     <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
                     <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: "0.07em", padding: "4px 12px" }}>
                        Solo seleccionados ({selectedData.length})
                     </div>
                     {[
                        { icon: <RiFileExcelFill size={14} />, label: "Excel (seleccionados)", action: () => exportExcel(selectedData), color: C.green },
                        { icon: <RiFileExcelFill size={14} />, label: "CSV (seleccionados)", action: () => exportCSV(selectedData), color: C.blue },
                        { icon: <RiFileTextLine size={14} />, label: "JSON (seleccionados)", action: () => exportJSON(selectedData), color: C.gold }
                     ].map((opt) => (
                        <button
                           key={opt.label}
                           onClick={opt.action}
                           style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "9px 12px",
                              borderRadius: C.r4,
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              color: opt.color,
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "inherit",
                              transition: "background 0.1s"
                           }}
                           onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                           onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                           {opt.icon} {opt.label}
                        </button>
                     ))}
                  </>
               )}
            </motion.div>
         )}
      </AnimatePresence>
   );

   const renderFilterLibrary = () => (
      <AnimatePresence>
         {showFilterLibrary && (
            <motion.div
               ref={filterLibraryRef}
               initial={{ opacity: 0, scale: 0.95, y: -8 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -8 }}
               style={{
                  position: "absolute",
                  top: 50,
                  right: 16,
                  zIndex: 100,
                  background: C.surfaceElevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.r8,
                  padding: 16,
                  width: 280,
                  boxShadow: C.shadowMd
               }}
            >
               <div
                  style={{
                     fontSize: 12,
                     fontWeight: 800,
                     color: C.text1,
                     marginBottom: 12,
                     textTransform: "uppercase",
                     letterSpacing: "0.07em",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "space-between"
                  }}
               >
                  Filtros guardados
                  <button
                     onClick={() => setShowSaveFilterModal(true)}
                     style={{
                        background: C.rubyLight,
                        border: "none",
                        borderRadius: C.r4,
                        color: C.ruby,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "4px 8px",
                        cursor: "pointer"
                     }}
                  >
                     + Guardar actual
                  </button>
               </div>

               {showSaveFilterModal && (
                  <div style={{ marginBottom: 12, padding: 10, background: C.rubyLight, borderRadius: C.r6, border: `1px solid rgba(155,34,66,0.2)` }}>
                     <input
                        autoFocus
                        placeholder="Nombre del filtro…"
                        value={saveFilterName}
                        onChange={(e) => setSaveFilterName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveCurrentFilter()}
                        style={{
                           width: "100%",
                           background: "transparent",
                           border: "none",
                           outline: "none",
                           color: C.text1,
                           fontSize: 12,
                           fontFamily: "inherit",
                           marginBottom: 8
                        }}
                     />
                     <div style={{ display: "flex", gap: 6 }}>
                        <button
                           onClick={saveCurrentFilter}
                           style={{
                              flex: 1,
                              background: C.ruby,
                              border: "none",
                              borderRadius: C.r4,
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "5px 0",
                              cursor: "pointer"
                           }}
                        >
                           Guardar
                        </button>
                        <button
                           onClick={() => setShowSaveFilterModal(false)}
                           style={{
                              flex: 1,
                              background: C.border,
                              border: "none",
                              borderRadius: C.r4,
                              color: C.text2,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "5px 0",
                              cursor: "pointer"
                           }}
                        >
                           Cancelar
                        </button>
                     </div>
                  </div>
               )}

               {savedFilters.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: C.text3, fontSize: 12 }}>No hay filtros guardados</div>
               ) : (
                  savedFilters.map((f) => (
                     <div
                        key={f.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}
                     >
                        <div>
                           <div style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>{f.name}</div>
                           <div style={{ fontSize: 10, color: C.text3 }}>{f.createdAt}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                           <button
                              onClick={() => applyFilter(f)}
                              style={{
                                 background: C.rubyLight,
                                 border: "none",
                                 borderRadius: C.r4,
                                 color: C.ruby,
                                 fontSize: 10,
                                 fontWeight: 700,
                                 padding: "3px 8px",
                                 cursor: "pointer"
                              }}
                           >
                              Aplicar
                           </button>
                           <button
                              onClick={() => deleteSavedFilter(f.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, padding: 2, display: "flex" }}
                           >
                              <FiX size={12} />
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </motion.div>
         )}
      </AnimatePresence>
   );

   const renderStats = () => (
      <AnimatePresence>
         {showStats && (
            <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               style={{ overflow: "hidden", borderBottom: `1px solid ${C.border}` }}
            >
               <div style={{ padding: "12px 20px", background: C.pageBg, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {normalColumns
                     .filter((col) => getColumnStats(col) !== null)
                     .map((col) => {
                        const stats = getColumnStats(col);
                        if (!stats) return null;
                        return (
                           <div
                              key={String(col.field)}
                              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r6, padding: "10px 14px", minWidth: 140 }}
                           >
                              <div style={{ fontSize: 10, fontWeight: 800, color: C.ruby, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                 {col.headerName}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                 {[
                                    ["Suma", stats.sum.toLocaleString()],
                                    ["Promedio", stats.avg.toFixed(1)],
                                    ["Min", stats.min.toLocaleString()],
                                    ["Max", stats.max.toLocaleString()]
                                 ].map(([label, value]) => (
                                    <div key={label}>
                                       <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase" }}>{label}</div>
                                       <div style={{ fontSize: 11, fontWeight: 700, color: C.text1 }}>{value}</div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        );
                     })}
                  {normalColumns.filter((col) => getColumnStats(col) !== null).length === 0 && (
                     <span style={{ fontSize: 12, color: C.text3, padding: "8px 0" }}>No hay columnas numéricas para estadísticas</span>
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );

   // ========== MAIN RENDER ==========
   const activeCount = [globalFilter, ...Object.values(columnFilters)].filter(Boolean).length;
   const totalSelected = selectedRows.size;

   return (
      <div
         ref={containerRef}
         style={{
            background: C.white,
            borderRadius: isFullscreen ? 0 : C.r12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: C.shadowMd,
            fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            height: isFullscreen ? "100vh" : undefined,
            width: "100%"
         }}
      >
         {/* HEADER */}
         <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "16px 20px 14px", flexShrink: 0, position: "relative" }}>
            {(title || headerActions) && (
               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  {title && (
                     <div>
                        <h2
                           style={{
                              fontSize: 17,
                              fontWeight: 800,
                              color: C.text1,
                              margin: 0,
                              letterSpacing: "-0.02em",
                              display: "flex",
                              alignItems: "center",
                              gap: 8
                           }}
                        >
                           {title}
                           {groupBy && (
                              <span style={{ fontSize: 11, background: C.rubyLight, color: C.ruby, borderRadius: 100, padding: "2px 8px", fontWeight: 700 }}>
                                 Agrupado por: {columns.find((c) => String(c.field) === groupBy.field)?.headerName}
                              </span>
                           )}
                        </h2>
                        {subtitle && <p style={{ fontSize: 12, color: C.text3, margin: "3px 0 0" }}>{subtitle}</p>}
                     </div>
                  )}
                  {headerActions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{headerActions()}</div>}
               </div>
            )}

            {/* TOOLBAR */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: 9,
                     flex: "1 1 220px",
                     minWidth: 0,
                     background: C.surface,
                     border: `1.5px solid ${globalFilter ? "rgba(155,34,66,0.35)" : C.border}`,
                     borderRadius: C.r6,
                     padding: "8px 13px",
                     boxShadow: globalFilter ? `0 0 0 3px ${C.rubyGlow}` : "none",
                     transition: "all 0.2s"
                  }}
               >
                  <FiSearch size={14} style={{ color: globalFilter ? C.ruby : C.text3, flexShrink: 0 }} />
                  <input
                     ref={searchRef}
                     type="text"
                     placeholder="Buscar… (⌘K)"
                     value={globalFilter}
                     onChange={(e) => {
                        setGlobalFilter(e.target.value);
                        setCurrentPage(1);
                     }}
                     style={{ background: "none", border: "none", outline: "none", color: C.text1, fontSize: 13, flex: 1, minWidth: 0, fontFamily: "inherit" }}
                  />
                  <AnimatePresence>
                     {globalFilter && (
                        <motion.button
                           initial={{ opacity: 0, scale: 0.7 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.7 }}
                           onClick={() => setGlobalFilter("")}
                           style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: C.text3 }}
                        >
                           <FiX size={13} />
                        </motion.button>
                     )}
                  </AnimatePresence>
               </div>

               <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {enableDensityControl && (
                     <div style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.r6, padding: 3, gap: 2 }}>
                        {(["compact", "comfortable", "spacious"] as DensityMode[]).map((d) => (
                           <button
                              key={d}
                              onClick={() => setDensity(d)}
                              title={d}
                              style={{
                                 width: 24,
                                 height: 24,
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 borderRadius: 6,
                                 border: "none",
                                 cursor: "pointer",
                                 background: density === d ? C.ruby : "transparent",
                                 color: density === d ? "#fff" : C.text3,
                                 transition: "all 0.15s"
                              }}
                           >
                              <FiGrid size={d === "compact" ? 9 : d === "comfortable" ? 11 : 13} />
                           </button>
                        ))}
                     </div>
                  )}

                  <IconBtn onClick={() => setShowStats((s) => !s)} title="Estadísticas numéricas" active={showStats} C={C}>
                     <FiBarChart2 size={14} />
                  </IconBtn>

                  {enableGroupBy && (
                     <IconBtn onClick={() => setShowGroupPanel((p) => !p)} title="Agrupar filas" active={!!groupBy} C={C}>
                        <FiLayout size={14} />
                     </IconBtn>
                  )}

                  {enableSavedFilters && (
                     <IconBtn
                        onClick={() => {
                           setShowFilterLibrary((p) => !p);
                           setShowColumnManager(false);
                           setShowExportMenu(false);
                        }}
                        title="Filtros guardados"
                        active={showFilterLibrary}
                        C={C}
                     >
                        <FiBookmark size={14} />
                     </IconBtn>
                  )}

                  {enableColumnVisibility && (
                     <IconBtn
                        onClick={() => {
                           setShowColumnManager((p) => !p);
                           setShowFilterLibrary(false);
                           setShowExportMenu(false);
                        }}
                        title="Gestionar columnas"
                        active={showColumnManager || hiddenColumns.size > 0}
                        C={C}
                     >
                        <FiColumns size={14} />
                     </IconBtn>
                  )}

                  {enableThemeToggle && (
                     <IconBtn
                        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                        title={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
                        C={C}
                     >
                        {theme === "light" ? <FiMoon size={14} /> : <FiSun size={14} />}
                     </IconBtn>
                  )}

                  {enableFullscreen && (
                     <IconBtn onClick={() => setIsFullscreen((f) => !f)} title="Pantalla completa (⌘F)" C={C}>
                        {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
                     </IconBtn>
                  )}

                  {enableExportOptions && (
                     <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                           setShowExportMenu((p) => !p);
                           setShowColumnManager(false);
                           setShowFilterLibrary(false);
                        }}
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 5,
                           padding: "7px 12px",
                           borderRadius: C.r6,
                           background: showExportMenu ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)",
                           border: "1px solid rgba(34,197,94,0.25)",
                           color: C.green,
                           fontSize: 11,
                           fontWeight: 700,
                           cursor: "pointer",
                           fontFamily: "inherit",
                           position: "relative"
                        }}
                     >
                        <FiDownload size={13} /> Exportar
                        {enableRowSelection && selectedData.length > 0 && (
                           <span
                              style={{
                                 position: "absolute",
                                 top: -4,
                                 right: -4,
                                 background: C.ruby,
                                 color: "white",
                                 borderRadius: 100,
                                 padding: "2px 5px",
                                 fontSize: 9,
                                 fontWeight: 800,
                                 lineHeight: 1
                              }}
                           >
                              {selectedData.length}
                           </span>
                        )}
                     </motion.button>
                  )}
               </div>
            </div>

            {/* BARRA DE ESTADO */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
               <span style={{ fontSize: 11, color: C.text3 }}>
                  <strong style={{ color: C.text2, fontWeight: 700 }}>{totalRows.toLocaleString()}</strong> registros
                  {activeCount > 0 && (
                     <>
                        {" "}
                        · <span style={{ color: C.ruby }}>{safeData.length - totalRows} ocultos</span>
                     </>
                  )}
               </span>

               {totalSelected > 0 && (
                  <motion.span
                     initial={{ opacity: 0, scale: 0.85 }}
                     animate={{ opacity: 1, scale: 1 }}
                     style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: C.rubyLight,
                        color: C.ruby,
                        borderRadius: 100,
                        padding: "2px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                     }}
                  >
                     <FiCheck size={10} /> {totalSelected} seleccionados
                     <button
                        onClick={() => resetSelection()}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.ruby, display: "flex", marginLeft: 2 }}
                     >
                        <FiX size={10} />
                     </button>
                  </motion.span>
               )}

               {groupBy && (
                  <motion.span
                     initial={{ opacity: 0, scale: 0.85 }}
                     animate={{ opacity: 1, scale: 1 }}
                     style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: C.blueLight,
                        color: C.blue,
                        borderRadius: 100,
                        padding: "2px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                     }}
                  >
                     <FiLayout size={10} /> Agrupado
                     <button
                        onClick={() => setGroupBy(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.blue, display: "flex", marginLeft: 2 }}
                     >
                        <FiX size={10} />
                     </button>
                  </motion.span>
               )}

               {sortConfig.field && (
                  <span style={{ fontSize: 11, color: C.text3, display: "flex", alignItems: "center", gap: 4 }}>
                     Orden: <strong style={{ color: C.text2 }}>{columns.find((c) => c.field === sortConfig.field)?.headerName}</strong>(
                     {sortConfig.direction === "asc" ? "A→Z" : "Z→A"})
                  </span>
               )}

               {activeCount > 0 && (
                  <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.97 }}
                     onClick={clearAll}
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: C.r6,
                        background: C.rubyLight,
                        border: `1px solid rgba(155,34,66,0.2)`,
                        color: C.ruby,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit"
                     }}
                  >
                     <FiX size={10} /> Limpiar ({activeCount})
                  </motion.button>
               )}
            </div>

            {renderColumnManager()}
            {renderExportMenu()}
            {renderFilterLibrary()}
         </div>

         {/* PANEL DE AGRUPACIÓN */}
         <AnimatePresence>
            {showGroupPanel && enableGroupBy && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden", borderBottom: `1px solid ${C.border}`, background: C.pageBg }}
               >
                  <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                     <span style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: "uppercase", letterSpacing: "0.07em" }}>Agrupar por:</span>
                     {columns
                        .filter((c) => c.groupable)
                        .map((col) => (
                           <button
                              key={String(col.field)}
                              onClick={() => setGroupBy(groupBy?.field === String(col.field) ? null : { field: String(col.field), direction: "asc" })}
                              style={
                                 {
                                    padding: "4px 12px",
                                    borderRadius: 100,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                    background: groupBy?.field === String(col.field) ? C.ruby : C.white,
                                    color: groupBy?.field === String(col.field) ? "#fff" : C.text2,
                                    transition: "all 0.15s"
                                 } as any
                              }
                           >
                              {col.headerName}
                           </button>
                        ))}
                     {columns.filter((c) => c.groupable).length === 0 && (
                        <span style={{ fontSize: 11, color: C.text3 }}>Marca columnas con groupable: true para habilitarlas</span>
                     )}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {renderStats()}

         {/* CUERPO */}
         <div style={{ overflowY: "auto", flex: 1, background: viewMode === "cards" ? C.pageBg : C.white }}>
            {loading
               ? renderLoading()
               : error
                 ? renderError()
                 : currentRows.length === 0
                   ? renderEmpty()
                   : viewMode === "table"
                     ? renderTable()
                     : viewMode === "cards"
                       ? renderCards()
                       : renderCompact()}
         </div>

         {/* PAGINACIÓN */}
         {currentRows.length > 0 && (
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  padding: "10px 18px",
                  borderTop: `1px solid ${C.border}`,
                  background: C.surface,
                  flexShrink: 0
               }}
            >
               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>Por página</span>
                  <select
                     value={rowsPerPage}
                     onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                     }}
                     style={{
                        background: C.white,
                        border: `1px solid ${C.borderMd}`,
                        borderRadius: C.r4,
                        color: C.text1,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 8px",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "inherit"
                     }}
                  >
                     {paginate.map((n) => (
                        <option key={n} value={n}>
                           {n}
                        </option>
                     ))}
                  </select>
               </div>

               <span style={{ fontSize: 11, color: C.text3, order: 3 }}>
                  <strong style={{ color: C.text1 }}>
                     {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalRows)}
                  </strong>{" "}
                  de <strong style={{ color: C.text1 }}>{totalRows}</strong>
               </span>

               <div style={{ display: "flex", alignItems: "center", gap: 3, order: 2 }}>
                  <PgBtn onClick={() => setCurrentPage(1)} disabled={currentPage === 1} C={C}>
                     <span style={{ fontSize: 10 }}>«</span>
                  </PgBtn>
                  <PgBtn onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} C={C}>
                     <FiChevronLeft size={13} />
                  </PgBtn>
                  {getPages().map((p, i) =>
                     p === "…" ? (
                        <span key={i} style={{ width: 28, textAlign: "center", fontSize: 12, color: C.text3 }}>
                           …
                        </span>
                     ) : (
                        <PgBtn key={i} active={currentPage === p} onClick={() => setCurrentPage(p as number)} C={C}>
                           {p}
                        </PgBtn>
                     )
                  )}
                  <PgBtn onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} C={C}>
                     <FiChevronRight size={13} />
                  </PgBtn>
                  <PgBtn onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} C={C}>
                     <span style={{ fontSize: 10 }}>»</span>
                  </PgBtn>
               </div>
            </div>
         )}
      </div>
   );
};

// ==================== forwardRef wrapper con genérico ====================
// Necesario porque forwardRef no soporta genéricos directamente en TSX
const CustomTable = forwardRef(CustomTableInner) as <T extends object>(props: PropsTable<T> & { ref?: React.Ref<CustomTableHandle<T>> }) => React.ReactElement;

export default CustomTable;

// ========== COMPONENTES AUXILIARES ==========
interface IconBtnProps {
   children: React.ReactNode;
   onClick: () => void;
   title?: string;
   active?: boolean;
   C: ReturnType<typeof makeTokens>;
}
const IconBtn = ({ children, onClick, title, active = false, C }: IconBtnProps) => (
   <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
         width: 32,
         height: 32,
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         borderRadius: C.r4,
         border: `1px solid ${active ? C.ruby : C.border}`,
         background: active ? C.rubyLight : C.surface,
         cursor: "pointer",
         color: active ? C.ruby : C.text2,
         transition: "all 0.15s"
      }}
   >
      {children}
   </motion.button>
);

interface PgBtnProps {
   children: React.ReactNode;
   onClick: () => void;
   disabled?: boolean;
   active?: boolean;
   C: ReturnType<typeof makeTokens>;
}
const PgBtn = ({ children, onClick, disabled = false, active = false, C }: PgBtnProps) => (
   <motion.button
      whileTap={!disabled ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
         width: 28,
         height: 28,
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         borderRadius: C.r4,
         border: `1px solid ${active ? C.ruby : C.border}`,
         background: active ? C.ruby : C.surface,
         cursor: disabled ? "not-allowed" : "pointer",
         fontSize: 12,
         fontWeight: active ? 700 : 500,
         color: active ? "#fff" : C.text2,
         opacity: disabled ? 0.4 : 1,
         boxShadow: active ? `0 2px 8px rgba(155,34,66,0.15)` : "none",
         transition: "all 0.15s",
         fontFamily: "inherit"
      }}
   >
      {children}
   </motion.button>
);
