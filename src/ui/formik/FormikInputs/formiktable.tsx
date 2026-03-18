/**
 * FormTable v10.4 — "Ivory Ledger"
 * ─────────────────────────────────────────────────────────────────────────────
 * CAMBIOS v10.4:
 *  · Nuevo modo "editdelete": celdas editables + marcado de errores desde
 *    initialRows (lee errorFieldsKey y pre-marca al montar).
 *  · Cuando el usuario edita una celda marcada en error, automáticamente
 *    cambia de rojo → verde (corregida). Marcador ✓ en lugar de ✕.
 *  · correctedCells: Map<rowIndex, Set<field>> para rastrear correcciones.
 *  · initialErrorMap: se calcula desde initialRows en modo editdelete.
 *  · isDeleteLike: helper interno que agrupa "delete" y "editdelete".
 */

import { useState, useCallback, useRef, useEffect, memo, createContext, useContext, useMemo, useImperativeHandle, forwardRef, useReducer } from "react";
import { Formik, Form, useFormikContext, useField, FormikProps } from "formik";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TreeOption<T extends Record<string, any> = any> extends Record<string, any> {
   children_recursive?: TreeOption<T>[];
}
export interface RowContext {
   row: Record<string, any>;
   rowIndex: number;
   setField: (field: string, value: any) => void;
   setFieldRaw: (path: string, value: any) => void;
}
interface ColBase {
   field: string;
   headerName: string;
   width?: number;
   minWidth?: number;
   align?: "left" | "center" | "right";
   required?: boolean;
   placeholder?: string;
   defaultValue?: any;
   compute?: (row: Record<string, any>) => any;
   onChange?: (value: any, ctx: RowContext) => void | Promise<void>;
   validate?: (value: any, row: Record<string, any>) => string | undefined;
   editableInModes?: TableMode[];
}
export type TableMode = "create" | "edit" | "view" | "delete" | "editdelete";
export interface TextCol extends ColBase {
   type?: "text" | "email" | "tel";
   uppercase?: boolean;
}
export interface DateCol extends ColBase {
   type: "date";
}
export interface NumberCol extends ColBase {
   type: "number";
   min?: number;
   max?: number;
   step?: number;
   prefix?: string;
   suffix?: string;
}
export interface SelectCol extends ColBase {
   type: "select";
   options: { value: string; label: string }[];
}
export interface AutocompleteCol<T extends Record<string, any> = any> extends ColBase {
   type: "autocomplete";
   options: (T & TreeOption<T>)[];
   idKey: keyof T | (keyof T)[];
   labelKey: keyof T;
   selectableKey?: keyof T;
   loading?: boolean;
}
export interface CheckboxCol extends ColBase {
   type: "checkbox";
   label?: string;
}
export interface CheckboxGroupCol extends ColBase {
   type: "checkboxgroup";
   items: { value?: string | boolean; label: string; field: string }[];
}
export type ColumnDef = TextCol | DateCol | NumberCol | SelectCol | AutocompleteCol | CheckboxCol | CheckboxGroupCol;

export interface FormTableHandle {
   resetCheckboxes: (rowIndex?: number) => void;
   resetAllCheckboxes: () => void;
   getSelectedRows: () => number[];
   clearSelection: () => void;
   getErrorState: () => { rowIndex: number; fields: string[]; description?: string }[];
}
export interface SelectionAction {
   label: string;
   color?: string;
   onClick: (indices: number[], rows: Record<string, any>[]) => void;
}
export interface FormTableProps {
   columns: ColumnDef[];
   initialRows?: Record<string, any>[];
   onSubmit?: (rows: Record<string, any>[]) => void | Promise<void>;
   validate?: (rows: (Record<string, any> | null)[]) => (Record<string, string> | undefined)[] | undefined;
   showRowNum?: boolean;
   initialSize?: number;
   chunkSize?: number;
   emptyRow?: () => Record<string, any>;
   onSelectionChange?: (indices: number[], rows: Record<string, any>[]) => void;
   selectionActions?: SelectionAction[];
   mode?: TableMode;
   errorFieldsKey?: string;
   errorDescriptionField?: string;
   errorDescriptionPlaceholder?: string;
   onErrorChange?: (errors: { rowIndex: number; fields: string[]; description?: string }[]) => void;
   errorDescriptions?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const T = {
   bg0: "#ffffff",
   bg1: "#fafafa",
   bg2: "#f5f5f4",
   bg3: "#f0efec",
   bg4: "#e8e7e3",
   bgPop: "#ffffff",
   ink0: "#111110",
   ink1: "#3d3d3a",
   ink2: "#878580",
   ink3: "#c2c0bb",
   line0: "#ebebea",
   line1: "#e0dfdc",
   line2: "#cccbc8",
   ind: "#4f46e5",
   indDim: "rgba(79,70,229,0.07)",
   indRim: "rgba(79,70,229,0.25)",
   indSoft: "rgba(79,70,229,0.12)",
   em: "#059669",
   emDim: "rgba(5,150,105,0.07)",
   emRim: "rgba(5,150,105,0.22)",
   emStrong: "rgba(5,150,105,0.18)",
   amb: "#d97706",
   ambDim: "rgba(217,119,6,0.08)",
   ambRim: "rgba(217,119,6,0.25)",
   ros: "#dc2626",
   rosDim: "rgba(220,38,38,0.06)",
   rosRim: "rgba(220,38,38,0.22)",
   rosMid: "rgba(220,38,38,0.12)",
   rosStrong: "rgba(220,38,38,0.18)",
   vio: "#7c3aed",
   vioDim: "rgba(124,58,237,0.08)",
   mono: "'IBM Plex Mono','JetBrains Mono',monospace",
   sans: "'IBM Plex Sans',system-ui,sans-serif"
} as const;

const ROW_H = 34;
const HDR_H = 38;
const FILL_SZ = 7;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isBlank = (v: unknown) => v === "" || v === null || v === undefined;
const rowIsEmpty = (row: Record<string, unknown>, cols: ColumnDef[]) => cols.every((c) => isBlank(row[c.field]));

function fuzzyScore(str: string, query: string): number {
   if (!query) return 1;
   const s = str.toLowerCase(),
      q = query.toLowerCase();
   if (s.includes(q)) return 1 - (s.indexOf(q) / s.length) * 0.3;
   let si = 0,
      qi = 0,
      score = 0;
   while (si < s.length && qi < q.length) {
      if (s[si] === q[qi]) {
         score++;
         qi++;
      }
      si++;
   }
   return qi === q.length ? (score / q.length) * 0.7 : 0;
}

function flattenTree<T extends Record<string, any>>(
   opts: (T & TreeOption<T>)[] = [],
   depth = 0,
   selectableKey?: keyof T
): { item: T & TreeOption<T>; depth: number; isGroup: boolean; selectable: boolean }[] {
   const out: { item: T & TreeOption<T>; depth: number; isGroup: boolean; selectable: boolean }[] = [];
   for (const item of opts) {
      if (!item) continue;
      const kids = item.children_recursive ?? [];
      const hasKids = Array.isArray(kids) && kids.length > 0;
      const selectable = selectableKey ? !!item[selectableKey] : true;
      out.push({ item, depth, isGroup: hasKids, selectable });
      if (hasKids) out.push(...flattenTree(kids as any, depth + 1, selectableKey));
   }
   return out;
}

function filterTree<T extends Record<string, any>>(opts: (T & TreeOption<T>)[], q: string, lk: keyof T): (T & TreeOption<T>)[] {
   return opts.reduce<(T & TreeOption<T>)[]>((acc, item) => {
      const match = fuzzyScore(String(item[lk]), q) > 0;
      const kids = Array.isArray(item.children_recursive) ? filterTree(item.children_recursive as any, q, lk) : [];
      if (match || kids.length) acc.push({ ...item, children_recursive: kids });
      return acc;
   }, []);
}

function parseExcelPaste(text: string): string[][] {
   return text
      .split(/\r?\n/)
      .filter((r) => r)
      .map((r) => r.split("\t"));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────────────────────────────────────────

type NavMode = "nav" | "edit" | "delete";
interface NavState {
   r: number;
   c: number;
   mode: NavMode;
}
interface INav {
   nav: NavState;
   navRef: React.MutableRefObject<NavState>;
}
const NavCtx = createContext<INav>(null!);
const useNav = () => useContext(NavCtx);

interface ISelection {
   selected: Set<number>;
   anchorRow: number | null;
   toggleRow: (r: number, multi: boolean, range: boolean) => void;
   selectAll: (total: number) => void;
   clearSelection: () => void;
   isSelected: (r: number) => boolean;
}
const SelCtx = createContext<ISelection>(null!);
const useSel = () => useContext(SelCtx);

interface FillState {
   active: boolean;
   srcRow: number;
   srcCol: number;
   endRow: number;
}
interface IFill {
   fill: FillState | null;
   startFill: (r: number, c: number) => void;
   updateFill: (r: number) => void;
   commitFill: () => void;
   inRange: (r: number, c: number) => boolean;
}
const FillCtx = createContext<IFill>(null!);
const useFill = () => useContext(FillCtx);

const ModeCtx = createContext<TableMode>("create");
const useMode = () => useContext(ModeCtx);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR CELLS CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface IErrorCtx {
   errorMap: Map<number, Set<string>>;
   toggleCellError: (r: number, field: string) => void;
   isCellError: (r: number, field: string) => boolean;
   toggleColError: (field: string, totalRows: number) => void;
   isColAllError: (field: string, totalRows: number) => boolean;
   // editdelete
   correctedCells: Map<number, Set<string>>;
   markCorrected: (r: number, field: string) => void;
   isCorrected: (r: number, field: string) => boolean;
}
const ErrorCtx = createContext<IErrorCtx>({
   errorMap: new Map(),
   toggleCellError: () => {},
   isCellError: () => false,
   toggleColError: () => {},
   isColAllError: () => false,
   correctedCells: new Map(),
   markCorrected: () => {},
   isCorrected: () => false
});
const useErrorCtx = () => useContext(ErrorCtx);

// ─────────────────────────────────────────────────────────────────────────────
// ROW EFFECT
// ─────────────────────────────────────────────────────────────────────────────

function useRowEffect(col: ColumnDef, r: number, currentValue: any) {
   const { values, setFieldValue } = useFormikContext<{ rows: any[] }>();
   const row = values.rows[r] ?? {};
   const rowStr = JSON.stringify(row);
   const ctx = useMemo<RowContext>(
      () => ({ row, rowIndex: r, setField: (f, v) => setFieldValue(`rows.${r}.${f}`, v), setFieldRaw: (p, v) => setFieldValue(p, v) }),
      [r, rowStr, setFieldValue]
   );
   useEffect(() => {
      if (!col.compute) return;
      const computed = col.compute(row);
      if (computed !== row[col.field]) setFieldValue(`rows.${r}.${col.field}`, computed);
   }, [rowStr]);
   const prevVal = useRef<any>(undefined);
   const firstRun = useRef(true);
   useEffect(() => {
      if (firstRun.current) {
         firstRun.current = false;
         prevVal.current = currentValue;
         return;
      }
      if (!col.onChange || prevVal.current === currentValue) return;
      prevVal.current = currentValue;
      col.onChange(currentValue, ctx);
   }, [currentValue]);
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE INPUT STYLE
// ─────────────────────────────────────────────────────────────────────────────

const iStyle = (editing: boolean, align: "left" | "center" | "right" = "left"): React.CSSProperties => ({
   width: "100%",
   height: "100%",
   border: "none",
   outline: "none",
   background: "transparent",
   fontSize: 12.5,
   fontFamily: T.mono,
   padding: "0 10px",
   textAlign: align,
   cursor: editing ? "text" : "default",
   color: editing ? T.ink0 : T.ink1
});

// ─────────────────────────────────────────────────────────────────────────────
// TEXT CELL
// ─────────────────────────────────────────────────────────────────────────────

const TextCell = memo(({ name, col, isEditing }: { name: string; col: TextCol; isEditing: boolean }) => {
   const [field, , helpers] = useField<any>(name);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (!isEditing || !ref.current) return;
      ref.current.focus();
      try {
         ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
      } catch (_) {}
   }, [isEditing]);
   return (
      <input
         ref={ref}
         type="text"
         tabIndex={-1}
         value={field.value ?? ""}
         name={field.name}
         onBlur={field.onBlur}
         onChange={(e) => helpers.setValue(col.uppercase ? e.target.value.toUpperCase() : e.target.value)}
         placeholder={isEditing ? (col.placeholder ?? "") : ""}
         readOnly={!isEditing}
         style={{ ...iStyle(isEditing, col.align), color: isEditing ? T.ink0 : field.value ? T.ink1 : T.ink3 }}
      />
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// DATE CELL
// ─────────────────────────────────────────────────────────────────────────────

const DateCell = memo(({ name, col, isEditing }: { name: string; col: DateCol; isEditing: boolean }) => {
   const [field, , helpers] = useField<any>(name);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (isEditing) ref.current?.focus();
   }, [isEditing]);
   return (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
         <input
            ref={ref}
            type="date"
            tabIndex={-1}
            value={field.value ?? ""}
            name={field.name}
            onBlur={field.onBlur}
            readOnly={!isEditing}
            onChange={(e) => helpers.setValue(e.target.value)}
            onMouseDown={(e) => {
               if (!isEditing) e.preventDefault();
            }}
            style={
               {
                  ...iStyle(isEditing, col.align),
                  colorScheme: "light",
                  color: field.value ? T.ink1 : T.ink3,
                  WebkitAppearance: isEditing ? undefined : "none"
               } as React.CSSProperties
            }
         />
      </div>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER CELL
// ─────────────────────────────────────────────────────────────────────────────

const NumberCell = memo(({ name, col, isEditing }: { name: string; col: NumberCol; isEditing: boolean }) => {
   const [field, , helpers] = useField<any>(name);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (isEditing) ref.current?.focus();
   }, [isEditing]);
   const hasVal = field.value !== "" && field.value !== undefined && field.value !== null;
   return (
      <div style={{ display: "flex", alignItems: "center", height: "100%", width: "100%", padding: "0 10px", gap: 3 }}>
         {col.prefix && <span style={{ fontSize: 11, fontFamily: T.mono, color: T.ink2, flexShrink: 0, userSelect: "none" }}>{col.prefix}</span>}
         <input
            ref={ref}
            type="number"
            tabIndex={-1}
            value={field.value ?? ""}
            name={field.name}
            onBlur={field.onBlur}
            min={col.min}
            max={col.max}
            step={col.step ?? 1}
            placeholder={isEditing ? (col.placeholder ?? "0") : ""}
            readOnly={!isEditing}
            onChange={(e) => helpers.setValue(e.target.value === "" ? "" : Number(e.target.value))}
            style={{
               ...iStyle(isEditing, col.align ?? "right"),
               padding: 0,
               flex: 1,
               color: isEditing ? T.em : hasVal ? T.em : T.ink3,
               fontWeight: hasVal ? 600 : 400
            }}
         />
         {col.suffix && <span style={{ fontSize: 11, fontFamily: T.mono, color: T.ink2, flexShrink: 0, userSelect: "none" }}>{col.suffix}</span>}
      </div>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// SELECT CELL
// ─────────────────────────────────────────────────────────────────────────────

const SelectCell = memo(({ name, col, isEditing }: { name: string; col: SelectCol; isEditing: boolean }) => {
   const [field] = useField<any>(name);
   const ref = useRef<HTMLSelectElement>(null);
   useEffect(() => {
      if (isEditing) ref.current?.focus();
   }, [isEditing]);
   return (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
         <select
            ref={ref}
            {...field}
            tabIndex={-1}
            disabled={!isEditing}
            style={{
               ...iStyle(isEditing, col.align),
               appearance: "none",
               WebkitAppearance: "none",
               padding: "0 26px 0 10px",
               cursor: isEditing ? "pointer" : "default",
               color: field.value ? T.ink1 : T.ink3
            }}
         >
            <option value="">—</option>
            {col.options.map((o) => (
               <option key={o.value} value={o.value}>
                  {o.label}
               </option>
            ))}
         </select>
         <svg style={{ position: "absolute", right: 8, pointerEvents: "none", opacity: isEditing ? 0.5 : 0.25 }} width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1 3L4.5 6.5L8 3" stroke={T.ink0} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTOCOMPLETE CELL
// ─────────────────────────────────────────────────────────────────────────────

const AutocompleteCell = memo(
   ({ name, col, isEditing, onCommit }: { name: string; col: AutocompleteCol; isEditing: boolean; onCommit: (dr: number, dc: number) => void }) => {
      const { values, setFieldValue, setFieldTouched } = useFormikContext<any>();
      const currentVal = useMemo(() => name.split(".").reduce((v: any, k) => v?.[k], values), [name, values]);
      const [filtered, setFiltered] = useState(col.options);
      const [flat, setFlat] = useState(() => flattenTree(col.options, 0, col.selectableKey));
      const [query, setQuery] = useState("");
      const [activeIdx, setActiveIdx] = useState(-1);
      const [open, setOpen] = useState(false);
      const [dropPos, setDropPos] = useState({ top: 0, left: 0, w: 0 });
      const wrapRef = useRef<HTMLDivElement>(null);
      const inputRef = useRef<HTMLInputElement>(null);
      const menuRef = useRef<HTMLDivElement>(null);
      const optRefs = useRef<(HTMLDivElement | null)[]>([]);

      const findItem = useCallback(
         (opts: typeof col.options, val: any): (typeof col.options)[0] | undefined => {
            for (const o of opts) {
               if (!Array.isArray(col.idKey) && o[col.idKey] === val) return o;
               if (o.children_recursive?.length) {
                  const f = findItem(o.children_recursive as any, val);
                  if (f) return f;
               }
            }
         },
         [col.idKey]
      );

      useEffect(() => {
         if (!currentVal && currentVal !== 0) {
            setQuery("");
            return;
         }
         const m = findItem(col.options, currentVal);
         setQuery(m ? String(m[col.labelKey]) : String(currentVal));
      }, [currentVal, col.options]);
      useEffect(() => {
         setFlat(flattenTree(filtered, 0, col.selectableKey));
      }, [filtered]);
      useEffect(() => {
         if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
         }
      }, [isEditing]);

      const calcPos = () => {
         if (!wrapRef.current) return;
         const rc = wrapRef.current.getBoundingClientRect();
         setDropPos({ top: rc.bottom + 3, left: rc.left, w: Math.max(rc.width, 260) });
      };
      const openMenu = () => {
         calcPos();
         setFiltered(col.options);
         setOpen(true);
      };
      const closeMenu = () => {
         setOpen(false);
         setActiveIdx(-1);
      };
      const canSelect = (item: (typeof col.options)[0]) => !col.selectableKey || !!item[col.selectableKey];
      const select = (item: (typeof col.options)[0]) => {
         if (!canSelect(item)) return;
         setQuery(String(item[col.labelKey]));
         if (Array.isArray(col.idKey)) col.idKey.forEach((k) => setFieldValue(name, item[k]));
         else setFieldValue(name, item[col.idKey]);
         setFieldTouched(name, true, false);
         closeMenu();
         onCommit(1, 0);
      };

      useEffect(() => {
         const h = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) closeMenu();
         };
         document.addEventListener("mousedown", h);
         return () => document.removeEventListener("mousedown", h);
      }, []);
      useEffect(() => {
         if (!open) return;
         const h = () => calcPos();
         window.addEventListener("scroll", h, true);
         window.addEventListener("resize", h);
         return () => {
            window.removeEventListener("scroll", h, true);
            window.removeEventListener("resize", h);
         };
      }, [open]);

      const handleKey = (e: React.KeyboardEvent) => {
         if (e.ctrlKey || e.metaKey) {
            const dm: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
            if (dm[e.key]) {
               e.preventDefault();
               e.stopPropagation();
               onCommit(...dm[e.key]);
               return;
            }
         }
         if (open) {
            if (e.key === "ArrowDown") {
               e.preventDefault();
               setActiveIdx((p) => {
                  const n = (p + 1) % flat.length;
                  optRefs.current[n]?.scrollIntoView({ block: "nearest" });
                  return n;
               });
            } else if (e.key === "ArrowUp") {
               e.preventDefault();
               setActiveIdx((p) => {
                  const n = p <= 0 ? flat.length - 1 : p - 1;
                  optRefs.current[n]?.scrollIntoView({ block: "nearest" });
                  return n;
               });
            } else if (e.key === "Enter") {
               e.preventDefault();
               if (activeIdx >= 0 && flat[activeIdx]?.selectable) select(flat[activeIdx].item);
            } else if (e.key === "Escape") {
               e.preventDefault();
               closeMenu();
               onCommit(0, 0);
               inputRef.current?.blur();
            } else if (e.key === "Tab") {
               e.preventDefault();
               closeMenu();
               onCommit(0, e.shiftKey ? -1 : 1);
            }
         } else {
            if (e.key === "Escape") {
               e.preventDefault();
               onCommit(0, 0);
               inputRef.current?.blur();
            } else if (e.key === "Enter") {
               e.preventDefault();
               openMenu();
            } else if (e.key === "Tab") {
               e.preventDefault();
               onCommit(0, e.shiftKey ? -1 : 1);
            } else if (e.key === "ArrowDown") {
               e.preventDefault();
               openMenu();
            }
         }
      };

      const highlight = (text: string, q: string) => {
         if (!q) return <>{text}</>;
         const idx = text.toLowerCase().indexOf(q.toLowerCase());
         if (idx < 0) return <>{text}</>;
         return (
            <>
               {text.slice(0, idx)}
               <mark style={{ background: "rgba(217,119,6,0.15)", color: T.amb, borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + q.length)}</mark>
               {text.slice(idx + q.length)}
            </>
         );
      };

      return (
         <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
            <input
               ref={inputRef}
               type="text"
               tabIndex={-1}
               value={query}
               placeholder={isEditing ? (col.placeholder ?? "buscar…") : ""}
               readOnly={!isEditing}
               onFocus={() => isEditing && openMenu()}
               onChange={(e) => {
                  if (!isEditing) return;
                  const q = e.target.value;
                  setQuery(q);
                  setFiltered(q ? filterTree(col.options, q, col.labelKey) : col.options);
                  setActiveIdx(-1);
                  if (!q) setFieldValue(name, null);
               }}
               onKeyDown={handleKey}
               onBlur={() =>
                  setTimeout(() => {
                     closeMenu();
                     setFieldTouched(name, true, false);
                  }, 150)
               }
               style={{ ...iStyle(isEditing, col.align), color: isEditing ? T.ink0 : query ? T.ink1 : T.ink3, padding: "0 28px 0 10px", flex: 1, minWidth: 0 }}
            />
            {col.loading ? (
               <div
                  style={{
                     position: "absolute",
                     right: 9,
                     width: 11,
                     height: 11,
                     border: `1.5px solid ${T.line2}`,
                     borderTopColor: T.ind,
                     borderRadius: "50%",
                     animation: "ft-spin .6s linear infinite"
                  }}
               />
            ) : (
               <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => {
                     e.preventDefault();
                     open ? closeMenu() : openMenu();
                  }}
                  style={{
                     position: "absolute",
                     right: 0,
                     width: 28,
                     height: "100%",
                     background: "none",
                     border: "none",
                     cursor: "pointer",
                     color: open ? T.ind : T.ink2,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center"
                  }}
               >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                     <path d={open ? "M1 6L4.5 2.5L8 6" : "M1 3L4.5 6.5L8 3"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               </button>
            )}
            {open && (
               <div
                  ref={menuRef}
                  style={{
                     position: "fixed",
                     top: dropPos.top,
                     left: dropPos.left,
                     width: dropPos.w,
                     zIndex: 99999,
                     background: T.bgPop,
                     border: `1px solid ${T.line2}`,
                     borderRadius: 8,
                     boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1),0 10px 30px -5px rgba(0,0,0,0.12)",
                     maxHeight: 280,
                     overflowY: "auto",
                     padding: 4,
                     animation: "ft-fadeUp .08s ease"
                  }}
               >
                  {flat.length > 0 ? (
                     flat.map(({ item, depth, isGroup, selectable }, i) => {
                        const hl = activeIdx === i;
                        const label = String(item[col.labelKey]);
                        return (
                           <div
                              key={i}
                              ref={(el) => {
                                 optRefs.current[i] = el;
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => (selectable ? select(item) : undefined)}
                              onMouseEnter={() => selectable && setActiveIdx(i)}
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 8,
                                 padding: `5px 10px 5px ${8 + depth * 16}px`,
                                 borderRadius: 5,
                                 cursor: selectable ? "pointer" : "default",
                                 background: hl ? T.indDim : "transparent"
                              }}
                           >
                              {isGroup ? (
                                 <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.ind} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                                       <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                    </svg>
                                    <span
                                       style={{
                                          fontSize: 11,
                                          fontFamily: T.sans,
                                          fontWeight: 600,
                                          color: T.ink2,
                                          letterSpacing: "0.04em",
                                          textTransform: "uppercase"
                                       }}
                                    >
                                       {label}
                                    </span>
                                 </>
                              ) : (
                                 <>
                                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: hl ? T.ind : T.line2, flexShrink: 0 }} />
                                    <span
                                       style={{
                                          fontSize: 12.5,
                                          fontFamily: T.mono,
                                          color: hl ? T.ind : selectable ? T.ink1 : T.ink3,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap"
                                       }}
                                    >
                                       {highlight(label, query)}
                                    </span>
                                 </>
                              )}
                           </div>
                        );
                     })
                  ) : (
                     <div style={{ padding: "14px 12px", textAlign: "center", fontSize: 12, fontFamily: T.mono, color: T.ink3 }}>sin resultados</div>
                  )}
               </div>
            )}
         </div>
      );
   }
);

// ─────────────────────────────────────────────────────────────────────────────
// CHECKBOX CELL
// ─────────────────────────────────────────────────────────────────────────────

const CheckboxCell = memo(({ name, col, isActive, disabled }: { name: string; col: CheckboxCol; isActive: boolean; disabled?: boolean }) => {
   const [field, , helpers] = useField<any>(name);
   const checked = !!field.value;
   return (
      <div
         style={{
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            gap: 8,
            height: "100%",
            width: "100%",
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? "none" : "auto"
         }}
      >
         <span
            style={{
               position: "relative",
               display: "inline-flex",
               alignItems: "center",
               width: 34,
               height: 19,
               borderRadius: 10,
               flexShrink: 0,
               background: checked ? T.em : T.bg3,
               border: `1.5px solid ${isActive && !disabled ? T.ind : checked ? T.em : T.line2}`,
               boxShadow: isActive && !disabled ? `0 0 0 2px ${T.indSoft}` : "none",
               transition: "all .18s",
               cursor: disabled ? "not-allowed" : "pointer"
            }}
            onClick={(e) => {
               e.stopPropagation();
               if (!disabled) helpers.setValue(!checked);
            }}
         >
            <span
               style={{
                  position: "absolute",
                  left: checked ? 16 : 2,
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: checked ? "#fff" : T.line2,
                  boxShadow: checked ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  transition: "left .18s, background .18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
               }}
            >
               {checked && (
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                     <path d="M1.5 4L3 5.5L6.5 2" stroke={T.em} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               )}
            </span>
         </span>
         {col.label && <span style={{ fontSize: 12, fontFamily: T.mono, color: disabled ? T.ink3 : checked ? T.ink1 : T.ink3, userSelect: "none" }}>{col.label}</span>}
      </div>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// CHECKBOX GROUP CELL
// ─────────────────────────────────────────────────────────────────────────────

const CheckboxGroupCell = memo(
   ({
      name,
      col,
      isEditing,
      containerRef,
      onCommit,
      disabled
   }: {
      name: string;
      col: CheckboxGroupCol;
      isEditing: boolean;
      containerRef: React.RefObject<HTMLDivElement>;
      onCommit: (dr: number, dc: number) => void;
      disabled?: boolean;
   }) => {
      const { values, setFieldValue, setFieldTouched } = useFormikContext<any>();
      const [activeItem, setActiveItem] = useState(0);
      const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
      useEffect(() => {
         if (isEditing && !disabled) btnRefs.current[activeItem]?.focus();
         else containerRef?.current?.focus();
      }, [isEditing, activeItem, disabled]);
      const getFieldName = (item: CheckboxGroupCol["items"][0]) => {
         const parts = name.split(".");
         parts[parts.length - 1] = item.field;
         return parts.join(".");
      };
      const getVal = (item: CheckboxGroupCol["items"][0]) => {
         const fn = getFieldName(item);
         return !!fn.split(".").reduce((v: any, k) => v?.[k], values);
      };
      const toggle = (item: CheckboxGroupCol["items"][0]) => {
         if (disabled) return;
         const fn = getFieldName(item);
         setFieldValue(fn, !getVal(item));
         setFieldTouched(fn, true);
      };
      const handleKey = (e: React.KeyboardEvent, idx: number) => {
         if (disabled) return;
         if (e.ctrlKey || e.metaKey) {
            const dm: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
            if (dm[e.key]) {
               e.preventDefault();
               e.stopPropagation();
               onCommit(...dm[e.key]);
               return;
            }
         }
         switch (e.key) {
            case " ":
            case "Enter":
               e.preventDefault();
               e.stopPropagation();
               toggle(col.items[idx]);
               break;
            case "ArrowRight":
               e.preventDefault();
               idx < col.items.length - 1 ? setActiveItem(idx + 1) : onCommit(0, 1);
               break;
            case "ArrowLeft":
               e.preventDefault();
               idx > 0 ? setActiveItem(idx - 1) : onCommit(0, -1);
               break;
            case "ArrowUp":
               e.preventDefault();
               onCommit(-1, 0);
               break;
            case "ArrowDown":
               e.preventDefault();
               onCommit(1, 0);
               break;
            case "Tab":
               e.preventDefault();
               onCommit(0, e.shiftKey ? -1 : 1);
               break;
            case "Escape":
               e.preventDefault();
               onCommit(0, 0);
               containerRef.current?.focus();
               break;
         }
      };
      return (
         <div
            style={{
               display: "flex",
               gap: 4,
               padding: "0 6px",
               alignItems: "center",
               height: "100%",
               width: "100%",
               overflow: "hidden",
               opacity: disabled ? 0.5 : 1,
               pointerEvents: disabled ? "none" : "auto"
            }}
         >
            {col.items.map((item, idx) => {
               const checked = getVal(item);
               const focused = isEditing && activeItem === idx && !disabled;
               return (
                  <button
                     key={idx}
                     ref={(el) => {
                        btnRefs.current[idx] = el;
                     }}
                     type="button"
                     role="checkbox"
                     aria-checked={checked}
                     tabIndex={-1}
                     disabled={disabled}
                     onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!disabled) setActiveItem(idx);
                     }}
                     onClick={(e) => {
                        e.stopPropagation();
                        toggle(item);
                     }}
                     onKeyDown={(e) => handleKey(e, idx)}
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 20,
                        padding: "0 8px 0 5px",
                        flexShrink: 0,
                        background: checked ? T.ind : "transparent",
                        border: `1px solid ${focused ? T.ind : checked ? T.ind : T.line2}`,
                        borderRadius: 4,
                        cursor: disabled ? "not-allowed" : "pointer",
                        outline: "none",
                        boxShadow: focused ? `0 0 0 2px ${T.indSoft}` : "none",
                        transition: "all .1s",
                        opacity: disabled ? 0.7 : 1
                     }}
                  >
                     <span
                        style={{
                           width: 9,
                           height: 9,
                           borderRadius: 2,
                           flexShrink: 0,
                           background: checked ? "rgba(255,255,255,0.25)" : T.bg2,
                           border: `1px solid ${checked ? "rgba(255,255,255,0.4)" : focused ? T.ind : T.line2}`,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center"
                        }}
                     >
                        {checked && (
                           <svg width="5" height="5" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                        )}
                     </span>
                     <span
                        style={{
                           fontSize: 10.5,
                           fontFamily: T.mono,
                           fontWeight: checked ? 600 : 400,
                           color: checked ? "#fff" : focused ? T.ind : T.ink1,
                           userSelect: "none"
                        }}
                     >
                        {item.label}
                     </span>
                  </button>
               );
            })}
         </div>
      );
   }
);

// ─────────────────────────────────────────────────────────────────────────────
// FILL HANDLE
// ─────────────────────────────────────────────────────────────────────────────

const FillHandle = memo(({ r, c }: { r: number; c: number }) => {
   const { nav } = useNav();
   const { startFill } = useFill();
   if (nav.r !== r || nav.c !== c || nav.mode !== "nav") return null;
   return (
      <div
         onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startFill(r, c);
         }}
         title="Arrastrar para copiar"
         style={{
            position: "absolute",
            right: -Math.floor(FILL_SZ / 2) - 1,
            bottom: -Math.floor(FILL_SZ / 2) - 1,
            width: FILL_SZ,
            height: FILL_SZ,
            background: T.ind,
            border: `1.5px solid ${T.bg0}`,
            borderRadius: 1,
            cursor: "crosshair",
            zIndex: 50
         }}
      />
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// CELL
// ─────────────────────────────────────────────────────────────────────────────

const Cell = memo(
   ({
      r,
      c,
      col,
      containerRef,
      onCellAction,
      isDescriptionCol = false,
      descriptionPlaceholder
   }: {
      r: number;
      c: number;
      col: ColumnDef;
      containerRef: React.RefObject<HTMLDivElement>;
      onCellAction: (r: number, c: number, action: "click" | "dblclick") => void;
      isDescriptionCol?: boolean;
      descriptionPlaceholder?: string;
   }) => {
      const name = `rows.${r}.${col.field}`;
      const [field, meta] = useField(name);
      const { nav } = useNav();
      const { inRange } = useFill();
      const { isSelected } = useSel();
      const mode = useMode();
      const { isCellError, toggleCellError, isCorrected, markCorrected } = useErrorCtx();

      useRowEffect(col, r, field.value);

      const isMe = nav.r === r && nav.c === c;
      const isChk = col.type === "checkbox";
      const isChkG = col.type === "checkboxgroup";
      const isDate = col.type === "date";
      const isDeleteMode = mode === "delete";
      const isEditDeleteMode = mode === "editdelete";
      const isDeleteLike = isDeleteMode || isEditDeleteMode;

    const isReadOnly = useMemo(() => {
       if (isDeleteMode) return !isDescriptionCol;
       if (isEditDeleteMode) return false;
       if (mode === "create" || mode === "edit") return false;
       if (mode === "view") return !col.editableInModes?.includes(mode); // ← sin excepción checkbox
       return false;
    }, [mode, isChk, isChkG, col, isDescriptionCol, isDeleteMode, isEditDeleteMode]);

      const isEditing = isMe && nav.mode === "edit" && !isReadOnly;
      const isComputed = !!col.compute;
      const inFill = inRange(r, c);
      const rowSel = isSelected(r);
      const colErr = col.validate ? col.validate(field.value, {}) : undefined;
      const hasErr = (meta.touched && !!meta.error) || !!colErr;
      const errMsg = hasErr ? colErr || String(meta.error) : undefined;

      // Error/corrected state
const cellHasError = (isDeleteLike || mode === "view") && !isDescriptionCol && isCellError(r, col.field);
      const cellIsCorrected = isEditDeleteMode && !isDescriptionCol && cellHasError && isCorrected(r, col.field);
      const isErrCell = cellHasError && !cellIsCorrected;

      // Auto-detect correction: when value changes in editdelete mode
      const prevValueRef = useRef(field.value);
      const mountedRef = useRef(false);
      useEffect(() => {
         if (!mountedRef.current) {
            mountedRef.current = true;
            prevValueRef.current = field.value;
            return;
         }
         if (!isEditDeleteMode) return;
         if (!isCellError(r, col.field)) return;
         if (isCorrected(r, col.field)) return;
         if (prevValueRef.current !== field.value) {
            markCorrected(r, col.field);
         }
         prevValueRef.current = field.value;
      }, [field.value]);

      const onCommit = useCallback(
         (dr: number, dc: number) => {
            containerRef.current?.dispatchEvent(new CustomEvent("ft-commit", { detail: { dr, dc }, bubbles: true }));
         },
         [containerRef]
      );

      const getCellBg = () => {
         if (cellIsCorrected) return T.emStrong;
         if (isErrCell) return T.rosStrong;
         if (isDeleteLike && isMe) return isDescriptionCol ? "rgba(79,70,229,0.04)" : isDeleteMode ? T.rosDim : T.indDim;
         if (!isDeleteLike) {
            if (isReadOnly) return `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 6px)`;
            if (inFill) return T.indDim;
            if (isMe) return isEditing ? "rgba(79,70,229,0.04)" : T.indDim;
            if (rowSel) return "rgba(79,70,229,0.04)";
            if (hasErr) return T.rosDim;
         }
         return "transparent";
      };

      const getCellOutline = () => {
         if (cellIsCorrected) return `2px solid ${T.emRim}`;
         if (isErrCell) return `2px solid ${T.ros}`;
         if (isDeleteLike && isMe) return isDescriptionCol ? `2px solid ${T.ind}` : isDeleteMode ? `2px solid ${T.rosRim}` : `2px solid ${T.ind}`;
         if (!isDeleteLike) {
            if (isMe && !isReadOnly) return `2px solid ${T.ind}`;
            if (inFill) return `1px dashed ${T.indRim}`;
         }
         return "none";
      };

      const handleMouseDown = (e: React.MouseEvent) => {
         e.preventDefault();
         if (isDeleteMode && !isDescriptionCol) {
            toggleCellError(r, col.field);
            onCellAction(r, c, "click");
         } else {
            if (isDate && isEditing) return;
            onCellAction(r, c, "click");
         }
         if (!isChkG) containerRef.current?.focus();
      };

      return (
         <td
            onMouseDown={handleMouseDown}
            onDoubleClick={() => {
               if (isDeleteMode) {
                  if (isDescriptionCol) onCellAction(r, c, "dblclick");
               } else if (!isDate && !isReadOnly) {
                  onCellAction(r, c, "dblclick");
               }
            }}
            title={
               isErrCell
                  ? isDeleteMode
                     ? "Click para desmarcar error"
                     : "Campo con error — edítalo para corregir"
                  : isDeleteMode && !isDescriptionCol
                    ? "Click para marcar como error"
                    : cellIsCorrected
                      ? "Corregido ✓"
                      : errMsg
            }
            style={{
               padding: 0,
               height: ROW_H,
               borderBottom: `1px solid ${isErrCell ? T.rosRim : cellIsCorrected ? T.emRim : T.line0}`,
               borderRight: `1px solid ${isErrCell ? T.rosRim : cellIsCorrected ? T.emRim : T.line0}`,
               width: col.width,
               minWidth: col.minWidth ?? 80,
               position: "relative",
               overflow: "visible",
               verticalAlign: "middle",
               background: getCellBg(),
               outline: getCellOutline(),
               outlineOffset: "-1px",
               cursor: isDeleteMode && !isDescriptionCol ? "pointer" : "default",
               userSelect: "none",
               transition: "background .15s, outline .15s"
            }}
         >
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
               {col.type === "number" ? (
                  <NumberCell name={name} col={col} isEditing={isEditing} />
               ) : col.type === "select" ? (
                  <SelectCell name={name} col={col} isEditing={isEditing} />
               ) : col.type === "autocomplete" ? (
                  <AutocompleteCell name={name} col={col} isEditing={isEditing} onCommit={onCommit} />
               ) : col.type === "checkbox" ? (
                  <CheckboxCell name={name} col={col} isActive={isMe && !isReadOnly} disabled={isReadOnly} />
               ) : col.type === "checkboxgroup" ? (
                  <CheckboxGroupCell name={name} col={col} isEditing={isEditing} containerRef={containerRef} onCommit={onCommit} disabled={isReadOnly} />
               ) : col.type === "date" ? (
                  <DateCell name={name} col={col} isEditing={isEditing} />
               ) : (
                  <TextCell
                     name={name}
                     col={isDescriptionCol ? { ...col, placeholder: isEditing ? (descriptionPlaceholder ?? col.placeholder) : "" } : (col as TextCol)}
                     isEditing={isEditing}
                  />
               )}
            </div>

            {!isReadOnly && !isDeleteLike && <FillHandle r={r} c={c} />}

            {isEditing && !isChk && !isChkG && (
               <div
                  style={{
                     position: "absolute",
                     right: 0,
                     bottom: 0,
                     width: 0,
                     height: 0,
                     borderStyle: "solid",
                     borderWidth: "0 0 5px 5px",
                     borderColor: `transparent transparent ${T.ind} transparent`
                  }}
               />
            )}

            {/* Error marker */}
            {isErrCell && (
               <div
                  style={{
                     position: "absolute",
                     top: 2,
                     right: 4,
                     fontSize: 8,
                     fontFamily: T.mono,
                     fontWeight: 700,
                     color: T.ros,
                     opacity: 0.8,
                     pointerEvents: "none",
                     userSelect: "none"
                  }}
               >
                  ✕
               </div>
            )}

            {/* Corrected marker */}
            {cellIsCorrected && (
               <div
                  style={{
                     position: "absolute",
                     top: 2,
                     right: 4,
                     fontSize: 8,
                     fontFamily: T.mono,
                     fontWeight: 700,
                     color: T.em,
                     opacity: 0.9,
                     pointerEvents: "none",
                     userSelect: "none"
                  }}
               >
                  ✓
               </div>
            )}

            {isComputed && !isDeleteLike && (
               <div
                  style={{
                     position: "absolute",
                     top: 2,
                     right: 4,
                     fontSize: 8,
                     fontFamily: T.mono,
                     fontWeight: 700,
                     color: T.vio,
                     opacity: 0.65,
                     pointerEvents: "none",
                     userSelect: "none"
                  }}
               >
                  ƒ
               </div>
            )}

            {errMsg && isMe && (
               <div
                  style={{
                     position: "absolute",
                     bottom: "calc(100% + 6px)",
                     left: 0,
                     background: T.bg0,
                     border: `1px solid ${T.rosRim}`,
                     color: T.ros,
                     fontSize: 11,
                     fontFamily: T.mono,
                     fontWeight: 500,
                     padding: "4px 10px",
                     borderRadius: 5,
                     whiteSpace: "nowrap",
                     zIndex: 40,
                     pointerEvents: "none",
                     boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
               >
                  ⚠ {errMsg}
               </div>
            )}
         </td>
      );
   },
   (p, n) =>
      p.r === n.r &&
      p.c === n.c &&
      p.col === n.col &&
      p.containerRef === n.containerRef &&
      p.onCellAction === n.onCellAction &&
      p.isDescriptionCol === n.isDescriptionCol
);

// ─────────────────────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────────────────────

const Row = memo(
   ({
      r,
      columns,
      showRowNum,
      containerRef,
      onCellAction,
      onRowClick,
      descriptionCol,
      descriptionPlaceholder
   }: {
      r: number;
      columns: ColumnDef[];
      showRowNum: boolean;
      containerRef: React.RefObject<HTMLDivElement>;
      onCellAction: (r: number, c: number, action: "click" | "dblclick") => void;
      onRowClick: (r: number, e: React.MouseEvent) => void;
      descriptionCol?: ColumnDef;
      descriptionPlaceholder?: string;
   }) => {
      const { nav } = useNav();
      const { isSelected } = useSel();
      const { errors, touched } = useFormikContext<{ rows: any[] }>();
      const { errorMap, correctedCells } = useErrorCtx();
      const mode = useMode();
      const re = (errors?.rows as any)?.[r] ?? {};
      const rt = (touched?.rows as any)?.[r] ?? {};
      const hasErr = Object.keys(re).some((k) => rt[k]);
      const isActive = nav.r === r;
      const sel = isSelected(r);
      const isDeleteMode = mode === "delete";
      const isEditDeleteMode = mode === "editdelete";
      const isDeleteLike = isDeleteMode || isEditDeleteMode;
      const errFields = errorMap.get(r);
      const corrFields = correctedCells.get(r);
      const isErrRow = (errFields?.size ?? 0) > 0;
      // In editdelete: row is "corrected" only if ALL error fields are corrected
      const isFullyCorrected =
         isEditDeleteMode && isErrRow && errFields !== undefined && corrFields !== undefined && Array.from(errFields).every((f) => corrFields.has(f));
      const hasAnyErr = isErrRow && !isFullyCorrected;

      const bg = hasErr ? T.rosDim : hasAnyErr ? T.rosDim : isFullyCorrected ? T.emDim : sel ? "rgba(79,70,229,0.04)" : isActive ? T.bg1 : r % 2 === 0 ? T.bg0 : T.bg1;

      return (
         <tr style={{ background: bg }}>
            {showRowNum && (
               <td
                  onMouseDown={(e) => {
                     e.preventDefault();
                     onRowClick(r, e);
                     containerRef.current?.focus();
                  }}
                  style={{
                     width: 44,
                     minWidth: 44,
                     height: ROW_H,
                     padding: 0,
                     textAlign: "center",
                     verticalAlign: "middle",
                     color: isFullyCorrected ? T.em : hasAnyErr ? T.ros : sel ? T.ind : isActive ? T.ind : T.ink3,
                     fontFamily: T.mono,
                     fontSize: 10.5,
                     fontWeight: isActive || sel || isErrRow ? 600 : 400,
                     borderBottom: `1px solid ${hasAnyErr ? T.rosRim : isFullyCorrected ? T.emRim : T.line0}`,
                     borderRight: `1px solid ${T.line1}`,
                     background: isFullyCorrected ? T.emDim : hasAnyErr ? T.rosMid : sel ? T.indSoft : isActive ? T.indDim : "transparent",
                     userSelect: "none",
                     cursor: "pointer",
                     transition: "background .08s,color .08s"
                  }}
               >
                  {isFullyCorrected ? (
                     <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ display: "block", margin: "0 auto" }}>
                        <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke={T.em} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                     </svg>
                  ) : hasAnyErr ? (
                     <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ display: "block", margin: "0 auto" }}>
                        <path d="M7 2L12.5 11.5H1.5L7 2Z" fill={T.ros} opacity="0.15" stroke={T.ros} strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M7 6v2.5" stroke={T.ros} strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="7" cy="10" r="0.75" fill={T.ros} />
                     </svg>
                  ) : sel ? (
                     <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ display: "block", margin: "0 auto" }}>
                        <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke={T.ind} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                     </svg>
                  ) : (
                     r + 1
                  )}
               </td>
            )}
            {isDeleteLike && descriptionCol && (
               <Cell
                  key={`desc-${r}`}
                  r={r}
                  c={-1}
                  col={descriptionCol}
                  containerRef={containerRef}
                  onCellAction={onCellAction}
                  isDescriptionCol={true}
                  descriptionPlaceholder={descriptionPlaceholder}
               />
            )}
            {columns.map((col, c) => (
               <Cell key={col.field} r={r} c={c} col={col} containerRef={containerRef} onCellAction={onCellAction} isDescriptionCol={false} />
            ))}
         </tr>
      );
   },
   (p, n) =>
      p.r === n.r &&
      p.showRowNum === n.showRowNum &&
      p.columns === n.columns &&
      p.onCellAction === n.onCellAction &&
      p.onRowClick === n.onRowClick &&
      p.descriptionCol === n.descriptionCol
);

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_TAG: Record<string, string> = {
   text: "txt",
   email: "mail",
   tel: "tel",
   date: "date",
   number: "num",
   select: "sel",
   autocomplete: "ac",
   checkbox: "bool",
   checkboxgroup: "flags"
};

const Header = memo(
   ({
      columns,
      showRowNum,
      onColClick,
      onSelectAll,
      allSelected,
      descriptionCol,
      totalRows
   }: {
      columns: ColumnDef[];
      showRowNum: boolean;
      onColClick: (c: number) => void;
      onSelectAll: () => void;
      allSelected: boolean;
      descriptionCol?: ColumnDef;
      totalRows: number;
   }) => {
      const { nav } = useNav();
      const mode = useMode();
      const isDeleteMode = mode === "delete";
      const { toggleColError, isColAllError } = useErrorCtx();

      return (
         <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
               {showRowNum && (
                  <th
                     onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectAll();
                     }}
                     style={{
                        width: 44,
                        height: HDR_H,
                        background: T.bg3,
                        borderBottom: `2px solid ${T.line2}`,
                        borderRight: `1px solid ${T.line1}`,
                        cursor: "pointer"
                     }}
                  >
                     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                        <div
                           style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: `1.5px solid ${allSelected ? T.ind : T.line2}`,
                              background: allSelected ? T.ind : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all .12s"
                           }}
                        >
                           {allSelected && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                 <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                           )}
                        </div>
                     </div>
                  </th>
               )}
               {(mode === "delete" || mode === "editdelete") && descriptionCol && (
                  <th
                     onMouseDown={(e) => {
                        e.preventDefault();
                        onColClick(-1);
                     }}
                     style={{
                        height: HDR_H,
                        padding: "0 10px",
                        background: nav.c === -1 ? T.bg4 : T.bg3,
                        borderBottom: `2px solid ${nav.c === -1 ? T.ind : T.line2}`,
                        borderRight: `1px solid ${T.line0}`,
                        textAlign: "left",
                        userSelect: "none",
                        width: descriptionCol.width ?? 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        cursor: "pointer"
                     }}
                  >
                     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code
                           style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: nav.c === -1 ? T.indDim : "rgba(0,0,0,0.04)",
                              border: `1px solid ${nav.c === -1 ? T.indRim : T.line2}`,
                              fontSize: 9,
                              fontFamily: T.mono,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              color: nav.c === -1 ? T.ind : T.ink2
                           }}
                        >
                           obs
                        </code>
                        <span style={{ fontSize: 12, fontFamily: T.sans, fontWeight: 600, color: nav.c === -1 ? T.ink0 : T.ink1 }}>{descriptionCol.headerName}</span>
                     </div>
                  </th>
               )}
               {columns.map((col, c) => {
                  const active = nav.c === c;
                  const tag = col.compute ? "ƒx" : (TYPE_TAG[col.type ?? "text"] ?? "txt");
                  const colAllErr = isDeleteMode && isColAllError(col.field, totalRows);
                  return (
                     <th
                        key={col.field}
                        onMouseDown={(e) => {
                           e.preventDefault();
                           if (isDeleteMode) toggleColError(col.field, totalRows);
                           onColClick(c);
                        }}
                        title={
                           isDeleteMode
                              ? colAllErr
                                 ? `Desmarcar toda la columna "${col.headerName}"`
                                 : `Marcar toda la columna "${col.headerName}" como error`
                              : undefined
                        }
                        style={{
                           height: HDR_H,
                           padding: "0 10px",
                           background: colAllErr ? T.rosMid : active ? T.bg4 : T.bg3,
                           borderBottom: `2px solid ${colAllErr ? T.ros : active ? T.ind : T.line2}`,
                           borderRight: `1px solid ${T.line0}`,
                           textAlign: "left",
                           userSelect: "none",
                           width: col.width ?? 140,
                           whiteSpace: "nowrap",
                           overflow: "hidden",
                           cursor: "pointer",
                           transition: "background .1s"
                        }}
                     >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                           <code
                              style={{
                                 display: "inline-flex",
                                 alignItems: "center",
                                 padding: "1px 5px",
                                 borderRadius: 3,
                                 background: col.compute ? T.vioDim : colAllErr ? T.rosDim : active ? T.indDim : "rgba(0,0,0,0.04)",
                                 border: `1px solid ${col.compute ? T.vio : colAllErr ? T.ros : active ? T.indRim : T.line2}`,
                                 fontSize: 9,
                                 fontFamily: T.mono,
                                 fontWeight: 700,
                                 letterSpacing: "0.06em",
                                 color: col.compute ? T.vio : colAllErr ? T.ros : active ? T.ind : T.ink2
                              }}
                           >
                              {colAllErr ? "✕" : tag}
                           </code>
                           <span style={{ fontSize: 12, fontFamily: T.sans, fontWeight: 600, color: colAllErr ? T.ros : active ? T.ink0 : T.ink1 }}>
                              {col.headerName}
                              {col.required && !colAllErr && <span style={{ color: T.ros, marginLeft: 3, fontSize: 11 }}>*</span>}
                           </span>
                           {isDeleteMode && (
                              <div
                                 style={{
                                    marginLeft: "auto",
                                    width: 12,
                                    height: 12,
                                    borderRadius: 2,
                                    border: `1.5px solid ${colAllErr ? T.ros : T.line2}`,
                                    background: colAllErr ? T.ros : "transparent",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all .12s"
                                 }}
                              >
                                 {colAllErr && (
                                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                                       <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                 )}
                              </div>
                           )}
                        </div>
                     </th>
                  );
               })}
            </tr>
         </thead>
      );
   }
);

// ─────────────────────────────────────────────────────────────────────────────
// SELECTION TOOLBAR
// ─────────────────────────────────────────────────────────────────────────────

const SelectionToolbar = memo(
   ({
      count,
      onClear,
      actions,
      getSelected
   }: {
      count: number;
      onClear: () => void;
      actions?: SelectionAction[];
      getSelected: () => { indices: number[]; rows: Record<string, any>[] };
   }) => {
      if (count === 0) return null;
      return (
         <div
            style={{
               position: "absolute",
               top: 8,
               left: "50%",
               transform: "translateX(-50%)",
               zIndex: 200,
               display: "flex",
               alignItems: "center",
               gap: 2,
               background: T.bg0,
               border: `1px solid ${T.line2}`,
               borderRadius: 8,
               padding: "3px 4px",
               boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1),0 10px 20px -5px rgba(0,0,0,0.08)",
               animation: "ft-slideDown .12s ease"
            }}
         >
            <span style={{ fontSize: 11, fontFamily: T.mono, color: T.ind, fontWeight: 700, padding: "0 8px", borderRight: `1px solid ${T.line1}` }}>
               {count} fila{count > 1 ? "s" : ""}
            </span>
            {actions?.map(({ label, color, onClick }) => (
               <button
                  key={label}
                  type="button"
                  onClick={() => {
                     const { indices, rows } = getSelected();
                     onClick(indices, rows);
                  }}
                  style={{
                     height: 26,
                     padding: "0 10px",
                     background: "transparent",
                     border: "1px solid transparent",
                     borderRadius: 5,
                     cursor: "pointer",
                     color: color ?? T.ink1,
                     fontSize: 11,
                     fontFamily: T.sans,
                     fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                     (e.currentTarget as HTMLButtonElement).style.background = T.bg2;
                  }}
                  onMouseLeave={(e) => {
                     (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
               >
                  {label}
               </button>
            ))}
            <button
               type="button"
               onClick={onClear}
               style={{
                  height: 26,
                  padding: "0 10px",
                  background: "transparent",
                  border: "1px solid transparent",
                  borderRadius: 5,
                  cursor: "pointer",
                  color: T.ink2,
                  fontSize: 11,
                  fontFamily: T.sans,
                  fontWeight: 500
               }}
               onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = T.bg2;
               }}
               onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
               }}
            >
               Limpiar sel.
            </button>
         </div>
      );
   }
);

// ─────────────────────────────────────────────────────────────────────────────
// INNER TABLE
// ─────────────────────────────────────────────────────────────────────────────

const InnerTable = ({
   columns,
   showRowNum,
   hasSubmit,
   chunkSize,
   emptyRow,
   externalRef,
   onSelectionChange,
   selectionActions,
   mode = "create",
   onErrorChange,
   errorDescriptions = {},
   errorFieldsKey,
   descriptionCol,
   descriptionPlaceholder,
   initialErrorMap
}: {
   columns: ColumnDef[];
   showRowNum: boolean;
   hasSubmit: boolean;
   chunkSize: number;
   emptyRow: () => Record<string, any>;
   externalRef?: React.MutableRefObject<{ getSelectedRows: () => number[]; clearSelection: () => void; getErrorState: () => any[] } | null>;
   onSelectionChange?: (indices: number[], rows: Record<string, any>[]) => void;
   selectionActions?: SelectionAction[];
   mode?: TableMode;
   onErrorChange?: (errors: { rowIndex: number; fields: string[]; description?: string }[]) => void;
   errorDescriptions?: Record<string, string>;
   errorFieldsKey?: string;
   descriptionCol?: ColumnDef;
   descriptionPlaceholder?: string;
   initialErrorMap?: Map<number, Set<string>>;
}) => {
   const { values, setFieldValue, isSubmitting } = useFormikContext<{ rows: any[] }>();
   const navRef = useRef<NavState>({ r: 0, c: 0, mode: "nav" });
   const [, bumpNav] = useReducer((x: number) => x + 1, 0);
   const [selected, setSelected] = useState<Set<number>>(new Set());
   const [anchorRow, setAnchorRow] = useState<number | null>(null);
   const [fill, setFill] = useState<FillState | null>(null);
   const fillRef = useRef<FillState | null>(null);
   const [errorMap, setErrorMap] = useState<Map<number, Set<string>>>(() => initialErrorMap ?? new Map());
   const [correctedCells, setCorrectedCells] = useState<Map<number, Set<string>>>(new Map());
   const containerRef = useRef<HTMLDivElement>(null);
   const tableRef = useRef<HTMLTableElement>(null);
   const busyRef = useRef(false);
   const rowsRef = useRef(values.rows);
   const colsRef = useRef(columns);
   rowsRef.current = values.rows;
   colsRef.current = columns;

   const isDeleteMode = mode === "delete";
   const isEditDeleteMode = mode === "editdelete";
   const isDeleteLike = isDeleteMode || isEditDeleteMode;
   const hasDescCol = isDeleteLike && !!descriptionCol;

   if (externalRef) {
      externalRef.current = {
         getSelectedRows: () => Array.from(selected),
         clearSelection: () => setSelected(new Set()),
         getErrorState: () => {
            const errors: { rowIndex: number; fields: string[]; description?: string }[] = [];
            errorMap.forEach((fields, rowIndex) => {
               errors.push({ rowIndex, fields: Array.from(fields), description: descriptionCol ? rowsRef.current[rowIndex]?.[descriptionCol.field] : undefined });
            });
            return errors;
         }
      };
   }

   const syncErrorFields = useCallback(
      (nextMap: Map<number, Set<string>>) => {
         if (!errorFieldsKey) return;
         nextMap.forEach((fields, rowIndex) => {
            setFieldValue(`rows.${rowIndex}.${errorFieldsKey}`, Array.from(fields).join(","));
         });
         rowsRef.current.forEach((_, rowIndex) => {
            if (!nextMap.has(rowIndex)) {
               const current = rowsRef.current[rowIndex]?.[errorFieldsKey];
               if (current == null || current !== "") setFieldValue(`rows.${rowIndex}.${errorFieldsKey}`, "");
            }
         });
      },
      [errorFieldsKey, setFieldValue]
   );

   const markCorrected = useCallback((r: number, field: string) => {
      setCorrectedCells((prev) => {
         const next = new Map(prev);
         const s = new Set(next.get(r) ?? []);
         s.add(field);
         next.set(r, s);
         return next;
      });
   }, []);

   const isCorrected = useCallback((r: number, field: string) => correctedCells.get(r)?.has(field) ?? false, [correctedCells]);

   const toggleCellError = useCallback(
      (r: number, field: string) => {
         setErrorMap((prev) => {
            const next = new Map(prev);
            const rowFields = new Set(next.get(r) ?? []);
            if (rowFields.has(field)) rowFields.delete(field);
            else rowFields.add(field);
            if (rowFields.size === 0) next.delete(r);
            else next.set(r, rowFields);
            syncErrorFields(next);
            setTimeout(() => {
               const errors = Array.from(next.entries())
                  .filter(([, fs]) => fs.size > 0)
                  .map(([rowIndex, fs]) => ({
                     rowIndex,
                     fields: Array.from(fs),
                     description: descriptionCol ? rowsRef.current[rowIndex]?.[descriptionCol.field] : undefined
                  }));
               onErrorChange?.(errors);
            }, 0);
            return next;
         });
      },
      [onErrorChange, syncErrorFields]
   );

   const isCellError = useCallback((r: number, field: string) => errorMap.get(r)?.has(field) ?? false, [errorMap]);

   const isColAllError = useCallback(
      (field: string, totalRows: number) => {
         if (totalRows === 0) return false;
         for (let r = 0; r < totalRows; r++) {
            if (!(errorMap.get(r)?.has(field) ?? false)) return false;
         }
         return true;
      },
      [errorMap]
   );

   const toggleColError = useCallback(
      (field: string, totalRows: number) => {
         setErrorMap((prev) => {
            const allMarked = (() => {
               for (let r = 0; r < totalRows; r++) {
                  if (!(prev.get(r)?.has(field) ?? false)) return false;
               }
               return totalRows > 0;
            })();
            const next = new Map(prev);
            for (let r = 0; r < totalRows; r++) {
               const rowFields = new Set(next.get(r) ?? []);
               if (allMarked) rowFields.delete(field);
               else rowFields.add(field);
               if (rowFields.size === 0) next.delete(r);
               else next.set(r, rowFields);
            }
            syncErrorFields(next);
            setTimeout(() => {
               const errors = Array.from(next.entries())
                  .filter(([, fs]) => fs.size > 0)
                  .map(([rowIndex, fs]) => ({
                     rowIndex,
                     fields: Array.from(fs),
                     description: descriptionCol ? rowsRef.current[rowIndex]?.[descriptionCol.field] : undefined
                  }));
               onErrorChange?.(errors);
            }, 0);
            return next;
         });
      },
      [syncErrorFields, onErrorChange, descriptionCol]
   );

   const errorCtxVal = useMemo<IErrorCtx>(
      () => ({ errorMap, toggleCellError, isCellError, toggleColError, isColAllError, correctedCells, markCorrected, isCorrected }),
      [errorMap, toggleCellError, isCellError, toggleColError, isColAllError, correctedCells, markCorrected, isCorrected]
   );

   const onSelChangePropRef = useRef(onSelectionChange);
   onSelChangePropRef.current = onSelectionChange;
   useEffect(() => {
      if (!onSelChangePropRef.current) return;
      const indices = Array.from(selected).sort((a, b) => a - b);
      const rows = indices.map((i) => rowsRef.current[i]).filter(Boolean);
      onSelChangePropRef.current(indices, rows);
   }, [selected]);

   const scrollToCell = useCallback(
      (r: number, c: number) => {
         const tbody = tableRef.current?.querySelector("tbody");
         if (!tbody) return;
         const tr = tbody.children[r] as HTMLElement | undefined;
         if (!tr) return;
         const colOffset = (showRowNum ? 1 : 0) + (hasDescCol ? 1 : 0);
         const tdIdx = c === -1 ? (showRowNum ? 1 : 0) : c + colOffset;
         const td = tr.children[tdIdx] as HTMLElement | undefined;
         td?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      },
      [showRowNum, hasDescCol]
   );

   const moveTo = useCallback(
      (r: number, c: number, navMode: NavMode = "nav", wrap = false) => {
         const totalR = rowsRef.current.length;
         const totalC = colsRef.current.length;
         const minC = hasDescCol ? -1 : 0;
         let nr = r,
            nc = c;
         if (wrap) {
            if (nc < minC) {
               nr -= 1;
               nc = totalC - 1;
            } else if (nc >= totalC) {
               nr += 1;
               nc = minC;
            }
         }
         nr = clamp(nr, 0, totalR - 1);
         nc = clamp(nc, minC, totalC - 1);
         navRef.current = { r: nr, c: nc, mode: navMode };
         bumpNav();
         scrollToCell(nr, nc);
         if (navMode === "nav") requestAnimationFrame(() => containerRef.current?.focus());
      },
      [scrollToCell, hasDescCol]
   );

   const exitEdit = useCallback(() => {
      navRef.current = { ...navRef.current, mode: "nav" };
      bumpNav();
      requestAnimationFrame(() => containerRef.current?.focus());
   }, []);

   const moveToRef = useRef(moveTo);
   moveToRef.current = moveTo;
   const exitEditRef = useRef(exitEdit);
   exitEditRef.current = exitEdit;
   const insertRowRef = useRef<(idx?: number) => void>(() => {});
   const deleteRowRef = useRef<(idx?: number) => void>(() => {});
   const setFVRef = useRef(setFieldValue);
   setFVRef.current = setFieldValue;
   const getCVRef = useRef<(row: Record<string, any>, col: ColumnDef) => any>(() => {});
   const setCVRef = useRef<(ri: number, col: ColumnDef, v: any) => void>(() => {});

   const moveBy = useCallback(
      (dr: number, dc: number, navMode: NavMode = "nav", wrap = false) => {
         moveTo(navRef.current.r + dr, navRef.current.c + dc, navMode, wrap);
      },
      [moveTo]
   );

   const insertRow = useCallback(
      (index?: number) => {
         const idx = index ?? navRef.current.r + 1;
         setFieldValue("rows", [...rowsRef.current.slice(0, idx), emptyRow(), ...rowsRef.current.slice(idx)]);
         setTimeout(() => moveTo(idx, navRef.current.c), 0);
      },
      [setFieldValue, emptyRow, moveTo]
   );

   const deleteRow = useCallback(
      (index?: number) => {
         const rows = rowsRef.current;
         const selArr = Array.from(selected).sort((a, b) => b - a);
         if (selArr.length > 1) {
            let newRows = [...rows];
            selArr.forEach((i) => {
               newRows.splice(i, 1);
            });
            if (newRows.length === 0) newRows = [emptyRow()];
            setFieldValue("rows", newRows);
            setSelected(new Set());
            setTimeout(() => moveTo(clamp(selArr[selArr.length - 1], 0, newRows.length - 1), navRef.current.c), 0);
            return;
         }
         const idx = index ?? navRef.current.r;
         if (rows.length <= 1) return;
         const newRows = rows.filter((_, i) => i !== idx);
         setFieldValue("rows", newRows);
         setTimeout(() => moveTo(clamp(idx, 0, newRows.length - 1), navRef.current.c), 0);
      },
      [setFieldValue, moveTo, selected, emptyRow]
   );

   const getCellVal = useCallback((row: Record<string, any>, col: ColumnDef) => {
      if (col.type === "checkboxgroup") {
         const obj: Record<string, any> = {};
         col.items.forEach((item) => {
            obj[item.field] = row[item.field] ?? false;
         });
         return obj;
      }
      return row[col.field];
   }, []);

   const setCellVal = useCallback(
      (ri: number, col: ColumnDef, value: any) => {
         if (col.compute) return;
         if (col.type === "checkboxgroup" && typeof value === "object" && value !== null)
            col.items.forEach((item) => setFieldValue(`rows.${ri}.${item.field}`, value[item.field] ?? false));
         else setFieldValue(`rows.${ri}.${col.field}`, value);
      },
      [setFieldValue]
   );

   insertRowRef.current = insertRow;
   deleteRowRef.current = deleteRow;
   getCVRef.current = getCellVal;
   setCVRef.current = setCellVal;

   const toggleRow = useCallback(
      (r: number, multi: boolean, range: boolean) => {
         setSelected((prev) => {
            const next = new Set(prev);
            if (range && anchorRow !== null) {
               const lo = Math.min(anchorRow, r),
                  hi = Math.max(anchorRow, r);
               for (let i = lo; i <= hi; i++) next.add(i);
               return next;
            }
            if (multi) {
               if (next.has(r)) next.delete(r);
               else next.add(r);
               return next;
            }
            if (next.has(r) && next.size === 1) {
               next.clear();
               return next;
            }
            next.clear();
            next.add(r);
            return next;
         });
         if (!range) setAnchorRow(r);
      },
      [anchorRow]
   );

   const totalRows = values.rows.length;
   const allSelected = selected.size > 0 && selected.size === totalRows;
   const selectAll = useCallback(() => {
      if (allSelected) setSelected(new Set());
      else setSelected(new Set(Array.from({ length: rowsRef.current.length }, (_, i) => i)));
   }, [allSelected]);
   const clearSelection = useCallback(() => setSelected(new Set()), []);
   const isSelectedFn = useCallback((r: number) => selected.has(r), [selected]);

   const copySelected = useCallback(() => {
      const rows = rowsRef.current,
         cols = colsRef.current;
      const selArr = Array.from(selected).sort((a, b) => a - b);
      const text = selArr
         .map((ri) =>
            cols
               .map((col) => {
                  const v = rows[ri]?.[col.field];
                  return v == null ? "" : String(v);
               })
               .join("\t")
         )
         .join("\n");
      navigator.clipboard?.writeText(text).catch(() => {});
   }, [selected]);

   const startFill = useCallback((r: number, c: number) => {
      const s: FillState = { active: true, srcRow: r, srcCol: c, endRow: r };
      setFill(s);
      fillRef.current = s;
   }, []);
   const updateFill = useCallback((r: number) => {
      setFill((prev) => {
         if (!prev) return prev;
         const next = { ...prev, endRow: clamp(r, 0, rowsRef.current.length - 1) };
         fillRef.current = next;
         return next;
      });
   }, []);
   const commitFill = useCallback(() => {
      const fs = fillRef.current;
      if (!fs?.active || fs.srcRow === fs.endRow) {
         setFill(null);
         fillRef.current = null;
         return;
      }
      const col = colsRef.current[fs.srcCol],
         value = getCellVal(rowsRef.current[fs.srcRow], col);
      const lo = Math.min(fs.srcRow, fs.endRow),
         hi = Math.max(fs.srcRow, fs.endRow);
      for (let ri = lo; ri <= hi; ri++) if (ri !== fs.srcRow) setCellVal(ri, col, value);
      setFill(null);
      fillRef.current = null;
      requestAnimationFrame(() => containerRef.current?.focus());
   }, [getCellVal, setCellVal]);

   const inRange = useCallback(
      (r: number, c: number) => {
         if (!fill?.active || c !== fill.srcCol) return false;
         const lo = Math.min(fill.srcRow, fill.endRow),
            hi = Math.max(fill.srcRow, fill.endRow);
         return r >= lo && r <= hi && r !== fill.srcRow;
      },
      [fill]
   );

   useEffect(() => {
      if (!fill?.active) return;
      const onMove = (e: MouseEvent) => {
         const tbody = tableRef.current?.querySelector("tbody");
         if (!tbody) return;
         const rows = Array.from(tbody.children) as HTMLElement[];
         for (let i = 0; i < rows.length; i++) {
            const rect = rows[i].getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
               updateFill(i);
               break;
            }
            if (i === rows.length - 1 && e.clientY > rect.bottom) updateFill(rows.length - 1);
         }
      };
      const onUp = () => commitFill();
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "crosshair";
      document.body.style.userSelect = "none";
      return () => {
         document.removeEventListener("mousemove", onMove);
         document.removeEventListener("mouseup", onUp);
         document.body.style.cursor = "";
         document.body.style.userSelect = "";
      };
   }, [fill?.active, updateFill, commitFill]);

   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
         const { r, c, mode: navMode } = navRef.current;
         const rows = rowsRef.current,
            cols = colsRef.current;
         const totalR = rows.length,
            totalC = cols.length;
         const minC = hasDescCol ? -1 : 0;
         const mt = moveToRef.current,
            exit = exitEditRef.current;
         const sfv = setFVRef.current;

         const isCellEditable = (colIdx: number) => {
            if (isDeleteMode) return colIdx === -1 && hasDescCol;
            if (isEditDeleteMode) return true; // todo editable
            if (colIdx < 0 || colIdx >= cols.length) return false;
            const col = cols[colIdx];
            if (!col) return false;
            if (mode === "view") {
               if (col.type === "checkbox" || col.type === "checkboxgroup") return true;
               return !!col.editableInModes?.includes(mode);
            }
            return true;
         };

         if (navMode === "edit") {
            if (e.ctrlKey || e.metaKey) {
               switch (e.key) {
                  case "ArrowUp":
                     e.preventDefault();
                     mt(r - 1, c, "nav", true);
                     return;
                  case "ArrowDown":
                     e.preventDefault();
                     mt(r + 1, c, "nav", true);
                     return;
                  case "ArrowLeft":
                     e.preventDefault();
                     mt(r, c - 1, "nav", true);
                     return;
                  case "ArrowRight":
                     e.preventDefault();
                     mt(r, c + 1, "nav", true);
                     return;
               }
            }
            switch (e.key) {
               case "Escape":
                  e.preventDefault();
                  exit();
                  return;
               case "Enter":
                  e.preventDefault();
                  e.stopPropagation();
                  return;
               case "Tab":
                  e.preventDefault();
                  mt(r, c + (e.shiftKey ? -1 : 1), "nav", true);
                  return;
            }
            return;
         }

         if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
               case "a":
                  e.preventDefault();
                  selectAll();
                  return;
               case "c":
                  e.preventDefault();
                  if (selected.size > 0) copySelected();
                  return;
               case "v": {
                  e.preventDefault();
                  navigator.clipboard
                     ?.readText()
                     .then((text) => {
                        const data = parseExcelPaste(text);
                        if (!data.length) return;
                        const startR = navRef.current.r,
                           startC = navRef.current.c;
                        data.forEach((rowData, dr) => {
                           rowData.forEach((val, dc) => {
                              const colIdx = startC + dc;
                              if (colIdx < 0 || colIdx >= colsRef.current.length) return;
                              const col = colsRef.current[colIdx];
                              if (!col || col.compute) return;
                              setFVRef.current(`rows.${startR + dr}.${col.field}`, val);
                           });
                        });
                     })
                     .catch(() => {});
                  return;
               }
               case "Insert":
                  e.preventDefault();
                  insertRowRef.current();
                  return;
               case "Delete":
                  e.preventDefault();
                  deleteRowRef.current();
                  return;
            }
         }

         switch (e.key) {
            case "ArrowUp":
               e.preventDefault();
               if (e.shiftKey) toggleRow(r - 1, false, true);
               mt(r - 1, c);
               return;
            case "ArrowDown":
               e.preventDefault();
               if (e.shiftKey) toggleRow(r + 1, false, true);
               mt(r + 1, c);
               return;
            case "ArrowLeft":
               e.preventDefault();
               mt(r, c - 1);
               return;
            case "ArrowRight":
               e.preventDefault();
               mt(r, c + 1);
               return;
            case "Tab":
               e.preventDefault();
               mt(r, c + (e.shiftKey ? -1 : 1), "nav", true);
               return;
            case "Enter":
               e.preventDefault();
               if (isDeleteMode) {
                  if (c === -1 && hasDescCol) {
                     mt(r, c, "edit");
                  } else if (c >= 0 && c < cols.length) {
                     toggleCellError(r, cols[c].field);
                  }
                  return;
               }
               if (isCellEditable(c)) mt(r, c, "edit");
               return;
            case "F2":
               e.preventDefault();
               if (isCellEditable(c)) mt(r, c, "edit");
               return;
            case "Escape":
               e.preventDefault();
               clearSelection();
               return;
            case "Home":
               e.preventDefault();
               mt(r, minC);
               return;
            case "End":
               e.preventDefault();
               mt(r, totalC - 1);
               return;
            case "PageDown":
               e.preventDefault();
               mt(r + 15, c);
               return;
            case "PageUp":
               e.preventDefault();
               mt(r - 15, c);
               return;
            case " ": {
               e.preventDefault();
               if (c < minC) return;
               if (c === -1 && hasDescCol) {
                  mt(r, c, "edit");
                  return;
               }
               if (isDeleteMode && c >= 0 && c < cols.length) {
                  toggleCellError(r, cols[c].field);
                  return;
               }
               if (c < 0 || c >= cols.length) return;
               const col = cols[c];
               if (!col || col.compute || !isCellEditable(c)) return;
               if (col.type === "checkbox") sfv(`rows.${r}.${col.field}`, !rows[r]?.[col.field]);
               else mt(r, c, "edit");
               return;
            }
            case "Delete":
            case "Backspace": {
               e.preventDefault();
               if (c === -1 && hasDescCol && descriptionCol) {
                  sfv(`rows.${r}.${descriptionCol.field}`, "");
                  return;
               }
               if (c < 0 || c >= cols.length) return;
               const col = cols[c];
               if (!col || col.compute || !isCellEditable(c)) return;
               if (!["checkbox", "checkboxgroup", "autocomplete"].includes(col.type ?? "")) sfv(`rows.${r}.${col.field}`, col.defaultValue ?? "");
               return;
            }
            default: {
               if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                  if (c === -1 && hasDescCol) {
                     mt(r, c, "edit");
                     return;
                  }
                  if (c < 0 || c >= cols.length) return;
                  const col = cols[c];
                  if (!col || col.compute || !isCellEditable(c)) return;
                  if (["checkbox", "checkboxgroup", "select", "autocomplete", "date"].includes(col.type ?? "")) {
                     mt(r, c, "edit");
                     return;
                  }
                  if (col.type === "number") {
                     const n = parseFloat(e.key);
                     if (!isNaN(n)) {
                        sfv(`rows.${r}.${col.field}`, n);
                        mt(r, c, "edit");
                     }
                  } else {
                     sfv(`rows.${r}.${col.field}`, (col as TextCol).uppercase ? e.key.toUpperCase() : e.key);
                     mt(r, c, "edit");
                  }
               }
               return;
            }
         }
      },
      [selectAll, clearSelection, toggleRow, copySelected, selected.size, mode, hasDescCol, descriptionCol, isDeleteMode, isEditDeleteMode, toggleCellError]
   );

   useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const h = (e: Event) => {
         const { dr, dc } = (e as CustomEvent).detail;
         if (dr === 0 && dc === 0) exitEditRef.current();
         else moveToRef.current(navRef.current.r + dr, navRef.current.c + dc, "nav", dc !== 0);
      };
      el.addEventListener("ft-commit", h);
      return () => el.removeEventListener("ft-commit", h);
   }, [exitEdit, moveBy]);

   const onCellAction = useCallback(
      (r: number, c: number, action: "click" | "dblclick") => {
         if (isDeleteLike && c === -1) {
            if (action === "dblclick") moveTo(r, c, "edit");
            else moveTo(r, c, "nav");
            return;
         }
         const col = colsRef.current[c];
         if (!col) return;
         let editable = false;
         if (mode === "create" || mode === "edit" || isEditDeleteMode) editable = !col?.compute;
         else if (mode === "view") editable = !!col?.editableInModes?.includes(mode);
         else if (isDeleteMode) editable = false;
         if (action === "dblclick") {
            if (editable && col?.type !== "checkbox") moveTo(r, c, "edit");
         } else {
            moveTo(r, c, "nav");
            if (editable && col?.type === "checkbox") setFieldValue(`rows.${r}.${col.field}`, !rowsRef.current[r]?.[col.field]);
         }
      },
      [moveTo, setFieldValue, mode, isDeleteMode, isEditDeleteMode, isDeleteLike]
   );

   const onRowClick = useCallback(
      (r: number, e: React.MouseEvent) => {
         moveTo(r, 0);
         toggleRow(r, e.ctrlKey || e.metaKey, e.shiftKey);
      },
      [moveTo, toggleRow]
   );
   const onColClick = useCallback((c: number) => moveTo(0, c), [moveTo]);

   useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const h = () => {
         if (busyRef.current) return;
         if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
            busyRef.current = true;
            setFieldValue("rows", [...rowsRef.current, ...Array.from({ length: chunkSize }, emptyRow)], false);
            setTimeout(() => {
               busyRef.current = false;
            }, 150);
         }
      };
      el.addEventListener("scroll", h, { passive: true });
      return () => el.removeEventListener("scroll", h);
   }, [setFieldValue, emptyRow, chunkSize]);

   const colCount = columns.length + (hasDescCol ? 1 : 0);
   const filledCount = useMemo(() => values.rows.filter((row) => !rowIsEmpty(row, columns)).length, [values.rows, columns]);
   const correctedCount = useMemo(() => {
      if (!isEditDeleteMode) return 0;
      let count = 0;
      errorMap.forEach((fields, rowIndex) => {
         const corrFields = correctedCells.get(rowIndex);
         if (corrFields && Array.from(fields).every((f) => corrFields.has(f))) count++;
      });
      return count;
   }, [isEditDeleteMode, errorMap, correctedCells]);

   const navCtx = useMemo<INav>(() => ({ nav: navRef.current, navRef }), [navRef.current.r, navRef.current.c, navRef.current.mode]);
   const fillCtx = useMemo<IFill>(() => ({ fill, startFill, updateFill, commitFill, inRange }), [fill, startFill, updateFill, commitFill, inRange]);
   const selCtx = useMemo<ISelection>(
      () => ({ selected, anchorRow, toggleRow, selectAll, clearSelection, isSelected: isSelectedFn }),
      [selected, anchorRow, toggleRow, selectAll, clearSelection, isSelectedFn]
   );

   const isReadOnlyMode = mode === "view" || isDeleteMode;

   const shortcuts: [string, string][] = [
      ["↑↓←→", "mover"],
      ["⇧↑↓", "sel."],
      ["Enter", isDeleteMode ? "marcar" : "editar"],
      ["Esc", "salir"],
      ["Tab", "col±1"],
      ["Del", "borrar"],
      ["Ctrl+C", "copiar"],
      ["Ctrl+V", "pegar"],
      ["Ctrl+A", "todo"]
   ];

   return (
      <ModeCtx.Provider value={mode}>
         <NavCtx.Provider value={navCtx}>
            <FillCtx.Provider value={fillCtx}>
               <SelCtx.Provider value={selCtx}>
                  <ErrorCtx.Provider value={errorCtxVal}>
                     {/* Shortcut bar */}
                     <div
                        style={{
                           flexShrink: 0,
                           height: 36,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "space-between",
                           padding: "0 12px",
                           background: T.bg3,
                           borderBottom: `1px solid ${T.line1}`,
                           userSelect: "none"
                        }}
                     >
                        <div style={{ display: "flex", alignItems: "center", overflow: "hidden", flex: 1 }}>
                           {shortcuts.map(([k, l]) => (
                              <div
                                 key={k}
                                 style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "0 7px",
                                    borderRight: `1px solid ${T.line0}`,
                                    height: 20,
                                    flexShrink: 0
                                 }}
                              >
                                 <kbd
                                    style={{
                                       display: "inline-flex",
                                       alignItems: "center",
                                       height: 15,
                                       padding: "0 4px",
                                       background: T.bg0,
                                       border: `1px solid ${T.line2}`,
                                       borderBottom: `2px solid ${T.line2}`,
                                       borderRadius: 3,
                                       fontSize: 8.5,
                                       fontFamily: T.mono,
                                       color: T.ink1,
                                       whiteSpace: "nowrap"
                                    }}
                                 >
                                    {k}
                                 </kbd>
                                 <span style={{ fontSize: 8.5, fontFamily: T.mono, color: T.ink2, whiteSpace: "nowrap" }}>{l}</span>
                              </div>
                           ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                           <span style={{ fontSize: 10.5, fontFamily: T.mono, color: T.ink2 }}>
                              <span style={{ color: filledCount > 0 ? T.em : T.ink2, fontWeight: 700 }}>{filledCount}</span>
                              <span style={{ color: T.ink3 }}> / {totalRows}</span>
                           </span>
                           {selected.size > 0 && (
                              <span
                                 style={{
                                    fontSize: 10,
                                    fontFamily: T.mono,
                                    color: T.ind,
                                    fontWeight: 700,
                                    background: T.indDim,
                                    border: `1px solid ${T.indRim}`,
                                    borderRadius: 4,
                                    padding: "1px 6px"
                                 }}
                              >
                                 {selected.size} sel
                              </span>
                           )}
                           {isDeleteMode && errorMap.size > 0 && (
                              <span
                                 style={{
                                    fontSize: 10,
                                    fontFamily: T.mono,
                                    color: T.ros,
                                    fontWeight: 700,
                                    background: T.rosDim,
                                    border: `1px solid ${T.rosRim}`,
                                    borderRadius: 4,
                                    padding: "1px 6px",
                                    animation: "ft-pulse 2s ease infinite"
                                 }}
                              >
                                 ⚠ {errorMap.size} error{errorMap.size > 1 ? "es" : ""}
                              </span>
                           )}
                           {isEditDeleteMode && errorMap.size > 0 && (
                              <span
                                 style={{
                                    fontSize: 10,
                                    fontFamily: T.mono,
                                    color: correctedCount === errorMap.size ? T.em : T.ros,
                                    fontWeight: 700,
                                    background: correctedCount === errorMap.size ? T.emDim : T.rosDim,
                                    border: `1px solid ${correctedCount === errorMap.size ? T.emRim : T.rosRim}`,
                                    borderRadius: 4,
                                    padding: "1px 6px",
                                    transition: "all .3s"
                                 }}
                              >
                                 {correctedCount === errorMap.size ? "✓" : "⚠"} {correctedCount}/{errorMap.size}
                              </span>
                           )}
                           <div style={{ width: 1, height: 14, background: T.line2 }} />
                           <span
                              style={{
                                 display: "inline-flex",
                                 alignItems: "center",
                                 height: 20,
                                 padding: "0 7px",
                                 background: T.bg0,
                                 border: `1px solid ${T.line2}`,
                                 borderRadius: 4,
                                 fontSize: 10.5,
                                 fontFamily: T.mono,
                                 color: T.ink1,
                                 fontWeight: 600,
                                 letterSpacing: "0.06em"
                              }}
                           >
                              {navRef.current.c === -1 ? "Obs" : String.fromCharCode(65 + navRef.current.c)}
                              {navRef.current.r + 1}
                           </span>
                           <span
                              style={{
                                 display: "inline-flex",
                                 alignItems: "center",
                                 gap: 5,
                                 height: 20,
                                 padding: "0 9px",
                                 background: fill ? T.indDim : navRef.current.mode === "edit" ? T.ambDim : T.bg0,
                                 border: `1px solid ${fill ? T.indRim : navRef.current.mode === "edit" ? T.ambRim : T.line2}`,
                                 borderRadius: 4,
                                 fontSize: 9,
                                 fontFamily: T.mono,
                                 fontWeight: 700,
                                 color: fill ? T.ind : navRef.current.mode === "edit" ? T.amb : T.ink2,
                                 letterSpacing: "0.08em",
                                 transition: "all .15s"
                              }}
                           >
                              {navRef.current.mode === "edit" && !fill && (
                                 <span
                                    style={{ width: 5, height: 5, borderRadius: "50%", background: T.amb, flexShrink: 0, animation: "ft-pulse 1.2s ease infinite" }}
                                 />
                              )}
                              {fill ? "FILL" : navRef.current.mode === "edit" ? "EDIT" : "NAV"}
                           </span>
                           {hasSubmit && mode !== "view" && (
                              <button
                                 type="submit"
                                 disabled={isSubmitting}
                                 style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    height: 26,
                                    marginLeft: 2,
                                    padding: "0 18px",
                                    background: isSubmitting ? T.bg3 : T.ind,
                                    border: `1px solid ${isSubmitting ? T.line2 : T.ind}`,
                                    borderRadius: 5,
                                    color: isSubmitting ? T.ink2 : "#fff",
                                    fontSize: 12,
                                    fontFamily: T.sans,
                                    fontWeight: 600,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                    boxShadow: isSubmitting ? "none" : "0 1px 3px rgba(79,70,229,0.25)"
                                 }}
                              >
                                 {isSubmitting && (
                                    <div
                                       style={{
                                          width: 10,
                                          height: 10,
                                          border: "1.5px solid rgba(255,255,255,0.3)",
                                          borderTopColor: "#fff",
                                          borderRadius: "50%",
                                          animation: "ft-spin .6s linear infinite"
                                       }}
                                    />
                                 )}
                                 {isSubmitting ? "Guardando…" : "Guardar"}
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Table area */}
                     <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                        <SelectionToolbar
                           count={selected.size}
                           onClear={clearSelection}
                           actions={selectionActions}
                           getSelected={() => ({
                              indices: Array.from(selected).sort((a, b) => a - b),
                              rows: Array.from(selected)
                                 .sort((a, b) => a - b)
                                 .map((i) => rowsRef.current[i])
                                 .filter(Boolean)
                           })}
                        />
                        <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} style={{ width: "100%", height: "100%", overflow: "auto", outline: "none" }}>
                           <table
                              ref={tableRef}
                              style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontFamily: T.mono, tableLayout: "fixed" }}
                           >
                              <colgroup>
                                 {showRowNum && <col style={{ width: 44 }} />}
                                 {hasDescCol && descriptionCol && <col style={{ width: descriptionCol.width ?? 200 }} />}
                                 {columns.map((col) => (
                                    <col key={col.field} style={{ width: col.width ?? 140 }} />
                                 ))}
                              </colgroup>
                              <Header
                                 columns={columns}
                                 showRowNum={showRowNum}
                                 onColClick={onColClick}
                                 onSelectAll={selectAll}
                                 allSelected={allSelected}
                                 descriptionCol={hasDescCol ? descriptionCol : undefined}
                                 totalRows={totalRows}
                              />
                              <tbody>
                                 {Array.from({ length: totalRows }, (_, i) => (
                                    <Row
                                       key={i}
                                       r={i}
                                       columns={columns}
                                       showRowNum={showRowNum}
                                       containerRef={containerRef}
                                       onCellAction={onCellAction}
                                       onRowClick={onRowClick}
                                       descriptionCol={hasDescCol ? descriptionCol : undefined}
                                       descriptionPlaceholder={descriptionPlaceholder}
                                    />
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     {/* Footer bar */}
                     <div
                        style={{
                           flexShrink: 0,
                           height: 34,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "space-between",
                           padding: "0 12px",
                           background: T.bg3,
                           borderTop: `1px solid ${T.line1}`
                        }}
                     >
                        <div style={{ display: "flex", alignItems: "center" }}>
                           {(
                              [
                                 { val: totalRows.toLocaleString(), label: "filas", show: true },
                                 { val: String(colCount), label: "cols", show: true },
                                 { val: String(filledCount), label: "con datos", show: filledCount > 0, hi: true },
                                 { val: String(selected.size), label: "selec.", show: selected.size > 0, sel: true },
                                 { val: String(errorMap.size), label: "errores", show: errorMap.size > 0 && !isEditDeleteMode, err: true },
                                 {
                                    val: `${correctedCount}/${errorMap.size}`,
                                    label: "corregidos",
                                    show: isEditDeleteMode && errorMap.size > 0,
                                    cor: correctedCount === errorMap.size
                                 }
                              ] as any[]
                           )
                              .filter((x) => x.show)
                              .map(({ val, label, hi, sel, err, cor }: any) => (
                                 <div
                                    key={label}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", borderRight: `1px solid ${T.line0}`, height: 22 }}
                                 >
                                    <span
                                       style={{
                                          fontFamily: T.mono,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: err ? T.ros : cor ? T.em : sel ? T.ind : hi ? T.em : T.ink1
                                       }}
                                    >
                                       {val}
                                    </span>
                                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.ink2 }}>{label}</span>
                                 </div>
                              ))}
                           {!isReadOnlyMode && !isEditDeleteMode && (
                              <button
                                 type="button"
                                 onClick={() => insertRow()}
                                 style={{
                                    marginLeft: 8,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    height: 22,
                                    padding: "0 9px",
                                    background: "transparent",
                                    border: `1px solid ${T.line2}`,
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    fontFamily: T.sans,
                                    color: T.ink1,
                                    cursor: "pointer"
                                 }}
                                 onMouseEnter={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.borderColor = T.ind;
                                    b.style.color = T.ind;
                                 }}
                                 onMouseLeave={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.borderColor = T.line2;
                                    b.style.color = T.ink1;
                                 }}
                              >
                                 <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                 </svg>
                                 fila
                              </button>
                           )}
                        </div>
                     </div>

                     <style>{`
                        @keyframes ft-spin      { to { transform: rotate(360deg); } }
                        @keyframes ft-pulse     { 0%,100%{opacity:1} 50%{opacity:.25} }
                        @keyframes ft-fadeUp    { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
                        @keyframes ft-slideDown { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
                        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
                        input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.45; }
                        input[type=date]::-webkit-calendar-picker-indicator:hover { opacity: 0.85; }
                     `}</style>
                  </ErrorCtx.Provider>
               </SelCtx.Provider>
            </FillCtx.Provider>
         </NavCtx.Provider>
      </ModeCtx.Provider>
   );
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const FormTable = forwardRef<FormTableHandle, FormTableProps>((props, ref) => {
   const {
      columns,
      initialRows = [],
      onSubmit,
      validate,
      showRowNum = true,
      initialSize = 30,
      chunkSize = 25,
      emptyRow,
      onSelectionChange,
      selectionActions,
      mode = "create",
      errorFieldsKey,
      errorDescriptionField,
      errorDescriptionPlaceholder,
      onErrorChange,
      errorDescriptions = {}
   } = props;

   const isDeleteMode = mode === "delete";
   const isEditDeleteMode = mode === "editdelete";
   const isDeleteLike = isDeleteMode || isEditDeleteMode;

   const descriptionCol = useMemo<ColumnDef | undefined>(() => {
      if ((!isDeleteLike && mode !== "view") || !errorDescriptionField) return undefined;
      const userCol = columns.find((c) => c.field === errorDescriptionField);
      if (userCol) return userCol;
      return {
         field: errorDescriptionField,
         headerName: "Observaciones",
         type: "text",
         width: 200,
         placeholder: errorDescriptionPlaceholder ?? "Motivo del rechazo..."
      } as TextCol;
   }, [isDeleteLike, errorDescriptionField, errorDescriptionPlaceholder, columns]);

   const visibleColumns = useMemo(() => {
      if ((!isDeleteLike && mode !== "view") || !errorDescriptionField) return columns;
      return columns.filter((c) => c.field !== errorDescriptionField);
   }, [columns, isDeleteLike, errorDescriptionField]);

   const makeEmpty = useCallback((): Record<string, any> => {
      const r: Record<string, any> = { _id: `${Date.now()}${Math.random().toString(36).slice(2)}` };
      columns.forEach((c) => {
         r[c.field] = c.defaultValue ?? "";
      });
      if (errorDescriptionField) r[errorDescriptionField] = "";
      if (errorFieldsKey) r[errorFieldsKey] = "";
      return r;
   }, [columns, errorDescriptionField, errorFieldsKey]);

   const factory = useMemo(() => emptyRow ?? makeEmpty, [emptyRow, makeEmpty]);

   // DESPUÉS — congelar initialValues en un ref para que no cambie con el modo:
   const initialValuesRef = useRef<{ rows: Record<string, any>[] } | null>(null);

   const initialValues = useMemo(() => {
      const base = initialRows.map((row) => ({
         ...(errorDescriptionField ? { [errorDescriptionField]: "" } : {}),
         ...(errorFieldsKey ? { [errorFieldsKey]: "" } : {}),
         ...row
      }));
      const noEmptyPadding = mode === "view" || isDeleteLike;
      if (!noEmptyPadding) {
         for (let i = base.length; i < initialSize; i++) base.push(factory());
      }
      return { rows: base };
   }, [initialRows, initialSize, factory, errorDescriptionField, errorFieldsKey]);
   // ↑ quitamos mode e isDeleteLike de las deps — el padding se calcula una sola vez

   // Pre-compute errorMap from initialRows for editdelete mode
   const initialErrorMap = useMemo(() => {
      if (!isDeleteLike || !errorFieldsKey) return undefined; // ← isDeleteLike en lugar de isEditDeleteMode
      const map = new Map<number, Set<string>>();
      initialRows.forEach((row, i) => {
         const raw = row[errorFieldsKey];
         if (raw && typeof raw === "string" && raw.trim() !== "") {
            const fields = raw
               .split(",")
               .map((f: string) => f.trim())
               .filter(Boolean);
            if (fields.length > 0) map.set(i, new Set(fields));
         }
      });
      return map;
   }, [isDeleteLike, errorFieldsKey, initialRows]);

   const formikRef = useRef<FormikProps<any>>(null);
   const innerRef = useRef<{ getSelectedRows: () => number[]; clearSelection: () => void; getErrorState: () => any[] } | null>(null);

   const internalValidate = useCallback(
      (values: { rows: Record<string, any>[] }) => {
         if (!validate) return {};
         const nullable = values.rows.map((r) => (rowIsEmpty(r, columns) ? null : r));
         const errs = validate(nullable) ?? [];
         return errs.some(Boolean) ? { rows: errs } : {};
      },
      [validate, columns]
   );

   const handleSubmit = useCallback(
      async (values: { rows: Record<string, any>[] }) => {
         if (isDeleteLike) {
            await onSubmit?.(values.rows);
         } else {
            await onSubmit?.(values.rows.filter((r) => !rowIsEmpty(r, columns)));
         }
      },
      [onSubmit, columns, isDeleteLike]
   );

   useImperativeHandle(
      ref,
      () => ({
         resetCheckboxes: (rowIndex?: number) => {
            if (!formikRef.current) return;
            const { values, setFieldValue } = formikRef.current;
            const doRow = (i: number) =>
               columns.forEach((col) => {
                  if (col.type === "checkbox") setFieldValue(`rows.${i}.${col.field}`, false);
                  if (col.type === "checkboxgroup") col.items.forEach((item) => setFieldValue(`rows.${i}.${item.field}`, false));
               });
            if (rowIndex !== undefined) doRow(rowIndex);
            else values.rows.forEach((_: any, i: number) => doRow(i));
         },
         resetAllCheckboxes: () => {
            if (!formikRef.current) return;
            const { values, setFieldValue } = formikRef.current;
            values.rows.forEach((_: any, i: number) =>
               columns.forEach((col) => {
                  if (col.type === "checkbox") setFieldValue(`rows.${i}.${col.field}`, false);
                  if (col.type === "checkboxgroup") col.items.forEach((item) => setFieldValue(`rows.${i}.${item.field}`, false));
               })
            );
         },
         getSelectedRows: () => innerRef.current?.getSelectedRows() ?? [],
         clearSelection: () => innerRef.current?.clearSelection(),
         getErrorState: () => innerRef.current?.getErrorState() ?? []
      }),
      [columns]
   );

   return (
      <>
         <style>{`
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
            *,*::before,*::after { box-sizing: border-box; }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: ${T.bg2}; }
            ::-webkit-scrollbar-thumb { background: ${T.line2}; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: ${T.ink3}; }
            ::-webkit-scrollbar-corner { background: ${T.bg2}; }
         `}</style>
         <div
            style={{
               background: T.bg0,
               border: `1px solid ${T.line2}`,
               borderRadius: 10,
               overflow: "hidden",
               display: "flex",
               flexDirection: "column",
               height: "100%",
               fontFamily: T.mono,
               boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)"
            }}
         >
            <Formik
               innerRef={formikRef}
               initialValues={initialValues}
               validate={internalValidate}
               onSubmit={handleSubmit}
               validateOnChange={false}
               validateOnBlur={true}
            >
               {() => (
                  <Form style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                     <InnerTable
                        columns={visibleColumns}
                        showRowNum={showRowNum}
                        hasSubmit={!!onSubmit}
                        chunkSize={chunkSize}
                        emptyRow={factory}
                        externalRef={innerRef}
                        onSelectionChange={onSelectionChange}
                        selectionActions={selectionActions}
                        mode={mode}
                        onErrorChange={onErrorChange}
                        errorDescriptions={errorDescriptions}
                        errorFieldsKey={errorFieldsKey}
                        descriptionCol={descriptionCol}
                        descriptionPlaceholder={errorDescriptionPlaceholder}
                        initialErrorMap={initialErrorMap}
                     />
                  </Form>
               )}
            </Formik>
         </div>
      </>
   );
});

export default FormTable;
