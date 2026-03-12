/**
 * FormTable v8 — "Obsidian Ledger"
 * ──────────────────────────────────
 * Diseño premium papel/crema con navegación a prueba de balas.
 *
 * ARQUITECTURA DE NAVEGACIÓN (por qué las flechas ahora SÍ funcionan):
 *  · Un único `navRef` (ref síncrono) guarda {r, c, mode} — siempre fresco, sin stale closures.
 *  · Un único `useReducer` tick para disparar re-renders.
 *  · El keyboard handler lee navRef.current directamente → nunca lee posición obsoleta.
 *  · handleKeyDown tiene array de deps vacío pero igual funciona porque lee del ref.
 *
 * FEATURES:
 *  · Flechas navegan sin falla · Enter baja · Shift+Enter sube · Tab col±1
 *  · F2 / doble click / cualquier char → editar · Esc → salir edición sin mover
 *  · Ctrl+Enter → confirmar sin mover · Ctrl+↑↓←→ → navegar entre celdas en edición
 *  · Ctrl+D → fill down · Ctrl+Ins → insertar fila · Ctrl+Del → eliminar fila
 *  · Fill handle (drag esquina inferior-derecha) → copiar valor hacia abajo/arriba
 *  · Click en nº de fila → ir a col 0 · Click en header → ir a fila 0
 *  · Infinite scroll · Computed columns · onChange callbacks
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
}
export interface TextCol extends ColBase {
   type?: "text" | "email" | "tel" | "date";
   uppercase?: boolean;
}
export interface NumberCol extends ColBase {
   type: "number";
   min?: number;
   max?: number;
   step?: number;
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
export type ColumnDef = TextCol | NumberCol | SelectCol | AutocompleteCol | CheckboxCol | CheckboxGroupCol;
export interface FormTableHandle {
   resetCheckboxes: (rowIndex?: number) => void;
   resetAllCheckboxes: () => void;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — "Obsidian Ledger"
// ─────────────────────────────────────────────────────────────────────────────

const T = {
   bg0: "#f7f3ec",
   bg1: "#f0ece3",
   bg2: "#faf8f4",
   ink0: "#17140f",
   ink2: "#9a9088",
   line0: "#d6cfc3",
   line1: "#b8b0a2",
   line2: "#e8e2d8",
   accent: "#312e81",
   accentBg: "rgba(49,46,129,0.06)",
   accentBg2: "rgba(49,46,129,0.12)",
   accentRim: "rgba(49,46,129,0.28)",
   fire: "#b84c2e",
   fireBg: "rgba(184,76,46,0.07)",
   fireRim: "rgba(184,76,46,0.28)",
   fireGlow: "rgba(184,76,46,0.18)",
   forest: "#1a6040",
   forestBg: "rgba(26,96,64,0.07)",
   danger: "#8b1c1c",
   dangerBg: "rgba(139,28,28,0.05)",
   badgeBg: "rgba(0,0,0,0.04)",
   badgeBd: "rgba(0,0,0,0.09)",
   serif: "'Playfair Display', 'Georgia', serif",
   mono: "'JetBrains Mono', 'IBM Plex Mono', 'Menlo', monospace",
   sans: "'Inter', system-ui, sans-serif"
} as const;

const ROW_H = 32;
const FILL_SZ = 7;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isBlank = (v: unknown) => v === "" || v === null || v === undefined;
const rowIsEmpty = (row: Record<string, unknown>, cols: ColumnDef[]) => cols.every((c) => isBlank(row[c.field]));

function flattenTree<T extends Record<string, any>>(opts: (T & TreeOption<T>)[], depth = 0): { item: T & TreeOption<T>; depth: number; isGroup: boolean }[] {
   const out: { item: T & TreeOption<T>; depth: number; isGroup: boolean }[] = [];
   for (const item of opts) {
      const hasKids = Array.isArray(item.children_recursive) && item.children_recursive.length > 0;
      out.push({ item, depth, isGroup: hasKids });
      if (hasKids) out.push(...flattenTree(item.children_recursive as (T & TreeOption<T>)[], depth + 1));
   }
   return out;
}
function filterTree<T extends Record<string, any>>(opts: (T & TreeOption<T>)[], q: string, lk: keyof T): (T & TreeOption<T>)[] {
   const lq = q.toLowerCase();
   return opts.reduce<(T & TreeOption<T>)[]>((acc, item) => {
      const match = String(item[lk]).toLowerCase().includes(lq);
      const kids = Array.isArray(item.children_recursive) ? filterTree(item.children_recursive as (T & TreeOption<T>)[], q, lk) : [];
      if (match || kids.length) acc.push({ ...item, children_recursive: kids });
      return acc;
   }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

type NavMode = "nav" | "edit";
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

// ─────────────────────────────────────────────────────────────────────────────
// FILL CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// ROW EFFECT — compute + onChange
// ─────────────────────────────────────────────────────────────────────────────

function useRowEffect(col: ColumnDef, r: number, currentValue: any) {
   const { values, setFieldValue } = useFormikContext<{ rows: any[] }>();
   const row = values.rows[r] ?? {};
   const rowStr = JSON.stringify(row);

   const ctx = useMemo<RowContext>(
      () => ({
         row,
         rowIndex: r,
         setField: (f, v) => setFieldValue(`rows.${r}.${f}`, v),
         setFieldRaw: (p, v) => setFieldValue(p, v)
         // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
      [r, rowStr, setFieldValue]
   );

   useEffect(() => {
      if (!col.compute) return;
      const computed = col.compute(row);
      if (computed !== row[col.field]) setFieldValue(`rows.${r}.${col.field}`, computed);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [rowStr]);

   const prevVal = useRef<any>(undefined);
   const firstRender = useRef(true);
   useEffect(() => {
      if (firstRender.current) {
         firstRender.current = false;
         prevVal.current = currentValue;
         return;
      }
      if (!col.onChange || prevVal.current === currentValue) return;
      prevVal.current = currentValue;
      col.onChange(currentValue, ctx);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentValue]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CELL INNER COMPONENTS
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
   letterSpacing: "0.01em"
});

const TextCell = memo(({ name, col, isEditing }: { name: string; col: TextCol; isEditing: boolean }) => {
   const [field] = useField<any>(name);
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
         {...field}
         type={col.type ?? "text"}
         tabIndex={-1}
         placeholder={isEditing ? (col.placeholder ?? "") : ""}
         readOnly={!isEditing}
         style={{ ...iStyle(isEditing, col.align), color: isEditing ? T.ink0 : field.value ? "#3d3530" : T.ink2 }}
      />
   );
});

const NumberCell = memo(({ name, col, isEditing }: { name: string; col: NumberCol; isEditing: boolean }) => {
   const [field, , helpers] = useField<any>(name);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (isEditing) ref.current?.focus();
   }, [isEditing]);
   const hasVal = field.value !== "" && field.value !== undefined && field.value !== null;
   return (
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
            color: isEditing ? T.forest : hasVal ? T.forest : T.ink2,
            fontWeight: hasVal ? 500 : 400
         }}
      />
   );
});

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
               color: isEditing ? T.ink0 : "#3d3530",
               cursor: isEditing ? "pointer" : "default"
            }}
         >
            {col.options.map((o) => (
               <option key={o.value} value={o.value} style={{ background: T.bg2, color: T.ink0 }}>
                  {o.label}
               </option>
            ))}
         </select>
         <svg style={{ position: "absolute", right: 8, pointerEvents: "none", opacity: isEditing ? 0.6 : 0.3 }} width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1 3L4.5 6.5L8 3" stroke={T.ink0} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>
   );
});

const AutocompleteCell = memo(
   ({ name, col, isEditing, onCommit }: { name: string; col: AutocompleteCol; isEditing: boolean; onCommit: (dr: number, dc: number) => void }) => {
      const { values, setFieldValue, setFieldTouched } = useFormikContext<any>();
      const currentVal = useMemo(() => name.split(".").reduce((v: any, k) => v?.[k], values), [name, values]);
      const [filtered, setFiltered] = useState(col.options);
      const [flat, setFlat] = useState(() => flattenTree(col.options));
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
         setFlat(flattenTree(filtered));
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
         setDropPos({ top: rc.bottom + 2, left: rc.left, w: Math.max(rc.width, 240) });
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

      const select = (item: (typeof col.options)[0]) => {
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
               if (activeIdx >= 0 && flat[activeIdx]) select(flat[activeIdx].item);
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
               style={{ ...iStyle(isEditing, col.align), color: isEditing ? T.ink0 : query ? "#3d3530" : T.ink2, padding: "0 28px 0 10px", minWidth: 0, flex: 1 }}
            />
            {col.loading ? (
               <div
                  style={{
                     position: "absolute",
                     right: 9,
                     width: 11,
                     height: 11,
                     border: `1.5px solid ${T.line0}`,
                     borderTopColor: T.fire,
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
                     color: open ? T.fire : T.ink2,
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
                     background: T.bg2,
                     border: `1px solid ${T.line1}`,
                     borderRadius: 6,
                     boxShadow: `0 12px 40px rgba(15,12,8,0.18),0 2px 8px rgba(15,12,8,0.10)`,
                     maxHeight: 260,
                     overflowY: "auto",
                     padding: 4,
                     animation: "fadeInUp 0.1s ease"
                  }}
               >
                  {flat.length > 0 ? (
                     flat.map(({ item, depth, isGroup }, i) => {
                        const hl = activeIdx === i;
                        return (
                           <div
                              key={i}
                              ref={(el) => {
                                 optRefs.current[i] = el;
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => select(item)}
                              onMouseEnter={() => setActiveIdx(i)}
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 8,
                                 padding: `5px 10px 5px ${10 + depth * 14}px`,
                                 borderRadius: 4,
                                 cursor: "pointer",
                                 background: hl ? T.fireBg : "transparent",
                                 transition: "background .06s"
                              }}
                           >
                              {isGroup ? (
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.ink2} strokeWidth="2">
                                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                 </svg>
                              ) : (
                                 <div style={{ width: 3, height: 3, borderRadius: "50%", background: hl ? T.fire : T.line0 }} />
                              )}
                              <span
                                 style={{
                                    fontSize: 12.5,
                                    fontFamily: T.mono,
                                    fontWeight: isGroup ? 600 : 400,
                                    color: hl ? T.fire : "#3d3530",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                 }}
                              >
                                 {String(item[col.labelKey])}
                              </span>
                           </div>
                        );
                     })
                  ) : (
                     <div style={{ padding: "14px 12px", textAlign: "center", fontSize: 11.5, fontFamily: T.mono, color: T.ink2 }}>sin resultados</div>
                  )}
               </div>
            )}
         </div>
      );
   }
);

const CheckboxCell = memo(({ name, col, isActive }: { name: string; col: CheckboxCol; isActive: boolean }) => {
   const [field] = useField<any>(name);
   const checked = !!field.value;
   return (
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: 9, height: "100%", width: "100%", pointerEvents: "none" }}>
         <span
            style={{
               position: "relative",
               display: "inline-flex",
               alignItems: "center",
               width: 36,
               height: 20,
               borderRadius: 10,
               flexShrink: 0,
               background: checked ? T.fire : T.bg0,
               border: `1.5px solid ${isActive ? T.accent : checked ? T.fire : T.line0}`,
               boxShadow: isActive ? `0 0 0 2.5px ${T.accentRim}` : checked ? `0 2px 8px ${T.fireGlow}` : "inset 0 1px 3px rgba(0,0,0,0.07)",
               transition: "background .18s,border-color .18s,box-shadow .18s"
            }}
         >
            <span
               style={{
                  position: "absolute",
                  left: checked ? 17 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: checked ? "#fff" : T.line0,
                  boxShadow: checked ? "0 1px 4px rgba(184,76,46,0.35)" : "0 1px 2px rgba(0,0,0,0.12)",
                  transition: "left .18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
               }}
            >
               {checked && (
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                     <path d="M1.5 4L3 5.5L6.5 2" stroke={T.fire} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               )}
            </span>
         </span>
         {col.label && (
            <span style={{ fontSize: 11.5, fontFamily: T.mono, color: checked ? T.ink0 : T.ink2, userSelect: "none", transition: "color .15s" }}>{col.label}</span>
         )}
      </div>
   );
});

const CheckboxGroupCell = memo(
   ({
      name,
      col,
      isEditing,
      containerRef,
      onCommit
   }: {
      name: string;
      col: CheckboxGroupCol;
      isEditing: boolean;
      containerRef: React.RefObject<HTMLDivElement>;
      onCommit: (dr: number, dc: number) => void;
   }) => {
      const { values, setFieldValue, setFieldTouched } = useFormikContext<any>();
      const [activeItem, setActiveItem] = useState(0);
      const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

      useEffect(() => {
         if (isEditing) btnRefs.current[activeItem]?.focus();
         else containerRef?.current?.focus();
      }, [isEditing, activeItem]);

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
         const fn = getFieldName(item);
         setFieldValue(fn, !getVal(item));
         setFieldTouched(fn, true);
      };

      const handleKey = (e: React.KeyboardEvent, idx: number) => {
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
         <div style={{ display: "flex", gap: 3, padding: "0 8px", alignItems: "center", height: "100%", width: "100%", overflow: "hidden" }}>
            {col.items.map((item, idx) => {
               const checked = getVal(item);
               const focused = isEditing && activeItem === idx;
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
                     onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveItem(idx);
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
                        padding: "0 7px 0 5px",
                        flexShrink: 0,
                        background: checked ? T.fire : "transparent",
                        border: `1px solid ${focused ? T.accent : checked ? T.fire : T.line0}`,
                        borderRadius: 3,
                        cursor: "pointer",
                        outline: "none",
                        transition: "all .12s",
                        boxShadow: focused ? `0 0 0 2px ${T.accentRim}` : "none"
                     }}
                  >
                     <span
                        style={{
                           width: 10,
                           height: 10,
                           borderRadius: 2,
                           flexShrink: 0,
                           background: checked ? "rgba(255,255,255,0.22)" : T.bg0,
                           border: `1px solid ${checked ? "rgba(255,255,255,0.35)" : focused ? T.accent : T.line0}`,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           transition: "all .12s"
                        }}
                     >
                        {checked && (
                           <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                        )}
                     </span>
                     <span
                        style={{
                           fontSize: 10.5,
                           fontFamily: T.mono,
                           fontWeight: checked ? 600 : 400,
                           color: checked ? "#fff" : focused ? T.accent : "#3d3530",
                           letterSpacing: "0.03em",
                           userSelect: "none",
                           transition: "color .12s"
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
            background: T.accent,
            border: `1.5px solid ${T.bg2}`,
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
      onCellAction
   }: {
      r: number;
      c: number;
      col: ColumnDef;
      containerRef: React.RefObject<HTMLDivElement>;
      onCellAction: (r: number, c: number, action: "click" | "dblclick") => void;
   }) => {
      const name = `rows.${r}.${col.field}`;
      const [field, meta, helpers] = useField(name);
      const { nav } = useNav();
      const { inRange } = useFill();

      useRowEffect(col, r, field.value);

      const isMe = nav.r === r && nav.c === c;
      const isEditing = isMe && nav.mode === "edit";
      const isComputed = !!col.compute;
      const inFill = inRange(r, c);
      const hasErr = meta.touched && !!meta.error;
      const errMsg = hasErr ? String(meta.error) : undefined;
      const isChk = col.type === "checkbox";
      const isChkG = col.type === "checkboxgroup";

      const onCommit = useCallback(
         (dr: number, dc: number) => {
            containerRef.current?.dispatchEvent(new CustomEvent("ft-commit", { detail: { dr, dc }, bubbles: true }));
         },
         [containerRef]
      );

      return (
         <td
            onMouseDown={(e) => {
               e.preventDefault();
               onCellAction(r, c, "click");
               if (!isChkG) containerRef.current?.focus();
            }}
            onDoubleClick={() => onCellAction(r, c, "dblclick")}
            title={errMsg}
            style={{
               padding: 0,
               height: ROW_H,
               borderBottom: `1px solid ${T.line2}`,
               borderRight: `1px solid ${T.line2}`,
               width: col.width,
               minWidth: col.minWidth ?? 80,
               position: "relative",
               overflow: "visible",
               verticalAlign: "middle",
               background: inFill ? "rgba(49,46,129,0.09)" : isMe ? (isEditing && !isChk ? "rgba(252,249,244,1)" : T.accentBg) : hasErr ? T.dangerBg : "transparent",
               outline: isMe ? `2px solid ${T.accent}` : inFill ? `1px dashed ${T.accentRim}` : "none",
               outlineOffset: "-1px",
               transition: "background .07s",
               cursor: "default",
               userSelect: "none"
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
                  <CheckboxCell name={name} col={col} isActive={isMe} />
               ) : col.type === "checkboxgroup" ? (
                  <CheckboxGroupCell name={name} col={col} isEditing={isEditing} containerRef={containerRef} onCommit={onCommit} />
               ) : (
                  <TextCell name={name} col={col as TextCol} isEditing={isEditing} />
               )}
            </div>

            <FillHandle r={r} c={c} />

            {isEditing && !isChk && !isChkG && (
               <div
                  style={{
                     position: "absolute",
                     right: 0,
                     bottom: 0,
                     width: 0,
                     height: 0,
                     borderStyle: "solid",
                     borderWidth: "0 0 6px 6px",
                     borderColor: `transparent transparent ${T.fire} transparent`
                  }}
               />
            )}
            {isComputed && (
               <div
                  style={{
                     position: "absolute",
                     top: 1,
                     right: 3,
                     fontSize: 8,
                     fontFamily: T.mono,
                     fontWeight: 700,
                     color: T.forest,
                     opacity: 0.65,
                     pointerEvents: "none",
                     userSelect: "none",
                     letterSpacing: "0.05em"
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
                     background: T.bg2,
                     border: `1px solid ${T.danger}`,
                     color: T.danger,
                     fontSize: 11,
                     fontFamily: T.mono,
                     fontWeight: 500,
                     padding: "4px 10px",
                     borderRadius: 4,
                     whiteSpace: "nowrap",
                     zIndex: 40,
                     pointerEvents: "none",
                     boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
                  }}
               >
                  ⚠ {errMsg}
               </div>
            )}
         </td>
      );
   },
   (p, n) => p.r === n.r && p.c === n.c && p.col === n.col && p.containerRef === n.containerRef && p.onCellAction === n.onCellAction
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
      onRowClick
   }: {
      r: number;
      columns: ColumnDef[];
      showRowNum: boolean;
      containerRef: React.RefObject<HTMLDivElement>;
      onCellAction: (r: number, c: number, action: "click" | "dblclick") => void;
      onRowClick: (r: number) => void;
   }) => {
      const { nav } = useNav();
      const { errors, touched } = useFormikContext<{ rows: any[] }>();
      const re = (errors?.rows as any)?.[r] ?? {};
      const rt = (touched?.rows as any)?.[r] ?? {};
      const hasErr = Object.keys(re).some((k) => rt[k]);
      const isActive = nav.r === r;
      return (
         <tr style={{ background: hasErr ? T.dangerBg : r % 2 === 0 ? T.bg0 : T.bg1 }}>
            {showRowNum && (
               <td
                  onMouseDown={(e) => {
                     e.preventDefault();
                     onRowClick(r);
                     containerRef.current?.focus();
                  }}
                  title={`Fila ${r + 1}`}
                  style={{
                     width: 44,
                     minWidth: 44,
                     height: ROW_H,
                     padding: "0 10px",
                     textAlign: "right",
                     color: isActive ? T.accent : T.ink2,
                     fontFamily: T.mono,
                     fontSize: 10,
                     fontWeight: isActive ? 600 : 400,
                     borderBottom: `1px solid ${T.line2}`,
                     borderRight: `1px solid ${T.line1}`,
                     background: isActive ? T.accentBg : "transparent",
                     userSelect: "none",
                     verticalAlign: "middle",
                     letterSpacing: "0.04em",
                     transition: "color .08s,background .08s",
                     cursor: "pointer"
                  }}
               >
                  {r + 1}
               </td>
            )}
            {columns.map((col, c) => (
               <Cell key={col.field} r={r} c={c} col={col} containerRef={containerRef} onCellAction={onCellAction} />
            ))}
         </tr>
      );
   },
   (p, n) => p.r === n.r && p.showRowNum === n.showRowNum && p.columns === n.columns && p.onCellAction === n.onCellAction && p.onRowClick === n.onRowClick
);

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_TAG: Record<string, string> = {
   text: "abc",
   email: "abc",
   tel: "abc",
   date: "date",
   number: "123",
   select: "sel",
   autocomplete: "srch",
   checkbox: "bool",
   checkboxgroup: "flags"
};

const Header = memo(({ columns, showRowNum, onColClick }: { columns: ColumnDef[]; showRowNum: boolean; onColClick: (c: number) => void }) => {
   const { nav } = useNav();
   return (
      <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
         <tr>
            {showRowNum && (
               <th style={{ width: 44, background: T.bg2, borderBottom: `2px solid ${T.line1}`, borderRight: `1px solid ${T.line0}` }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                     <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" fill={T.ink2} opacity="0.5" />
                        <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.5" fill={T.ink2} opacity="0.5" />
                        <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.5" fill={T.ink2} opacity="0.5" />
                        <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.5" fill={T.ink2} opacity="0.5" />
                     </svg>
                  </div>
               </th>
            )}
            {columns.map((col, c) => {
               const active = nav.c === c;
               const tag = col.compute ? "ƒx" : (TYPE_TAG[col.type ?? "text"] ?? "abc");
               return (
                  <th
                     key={col.field}
                     onMouseDown={(e) => {
                        e.preventDefault();
                        onColClick(c);
                     }}
                     title={`${col.headerName} · ${tag}${col.required ? " · requerido" : ""}${col.compute ? " · calculado" : ""}`}
                     style={{
                        height: 38,
                        padding: "0 10px",
                        background: active ? "#eeead8" : T.bg2,
                        borderBottom: `2px solid ${active ? T.fire : T.line1}`,
                        borderRight: `1px solid ${T.line2}`,
                        textAlign: "left",
                        userSelect: "none",
                        width: col.width ?? 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        transition: "background .1s,border-color .1s",
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
                              background: col.compute ? T.forestBg : active ? T.fireBg : T.badgeBg,
                              border: `1px solid ${col.compute ? "rgba(26,96,64,0.22)" : active ? T.fireRim : T.badgeBd}`,
                              fontSize: 9,
                              fontFamily: T.mono,
                              fontWeight: 700,
                              color: col.compute ? T.forest : active ? T.fire : T.ink2,
                              letterSpacing: "0.07em",
                              transition: "all .1s"
                           }}
                        >
                           {tag}
                        </code>
                        <span
                           style={{
                              fontSize: 11.5,
                              fontFamily: T.serif,
                              fontWeight: 700,
                              color: active ? T.ink0 : "#3d3530",
                              letterSpacing: "0.015em",
                              transition: "color .1s"
                           }}
                        >
                           {col.headerName}
                           {col.required && <span style={{ color: T.fire, marginLeft: 3, fontSize: 11 }}>*</span>}
                        </span>
                     </div>
                  </th>
               );
            })}
         </tr>
      </thead>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// INNER TABLE
// ─────────────────────────────────────────────────────────────────────────────

const InnerTable = ({
   columns,
   showRowNum,
   hasSubmit,
   chunkSize,
   emptyRow
}: {
   columns: ColumnDef[];
   showRowNum: boolean;
   hasSubmit: boolean;
   chunkSize: number;
   emptyRow: () => Record<string, any>;
}) => {
   const { values, setFieldValue, isSubmitting } = useFormikContext<{ rows: any[] }>();

   // ── NAV: ref síncrono + tick ──
   const navRef = useRef<NavState>({ r: 0, c: 0, mode: "nav" });
   const [, bumpNav] = useReducer((x) => x + 1, 0);

   const setNavState = useCallback((next: Partial<NavState>) => {
      navRef.current = { ...navRef.current, ...next };
      bumpNav();
   }, []);

   // ── FILL ──
   const [fill, setFill] = useState<FillState | null>(null);
   const fillRef = useRef<FillState | null>(null);

   const containerRef = useRef<HTMLDivElement>(null);
   const tableRef = useRef<HTMLTableElement>(null);
   const busyRef = useRef(false);

   // Refs frescos de rows/cols para el handler (evita stale sin re-crear el handler)
   const rowsRef = useRef(values.rows);
   const colsRef = useRef(columns);
   rowsRef.current = values.rows;
   colsRef.current = columns;

   const scrollToCell = useCallback(
      (r: number, c: number) => {
         const tbody = tableRef.current?.querySelector("tbody");
         if (!tbody) return;
         const tr = tbody.children[r] as HTMLElement | undefined;
         if (!tr) return;
         const td = tr.children[c + (showRowNum ? 1 : 0)] as HTMLElement | undefined;
         td?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      },
      [showRowNum]
   );

   /**
    * moveToWrapped — navegación con wrap para capturistas:
    *   · Si c < 0          → sube una fila, va a última columna
    *   · Si c >= totalC    → baja una fila, va a primera columna
    *   · Si r < 0          → queda en fila 0
    *   · Si r >= totalR    → queda en última fila
    *   mode = "clamp" → sin wrap (flechas, Home, End, PageUp/Down)
    */
   const moveTo = useCallback(
      (r: number, c: number, mode: NavMode = "nav", wrap = false) => {
         const totalR = rowsRef.current.length;
         const totalC = colsRef.current.length;
         let nr = r,
            nc = c;
         if (wrap) {
            if (nc < 0) {
               nr -= 1;
               nc = totalC - 1;
            } else if (nc >= totalC) {
               nr += 1;
               nc = 0;
            }
         }
         nr = clamp(nr, 0, totalR - 1);
         nc = clamp(nc, 0, totalC - 1);
         navRef.current = { r: nr, c: nc, mode };
         bumpNav();
         scrollToCell(nr, nc);
         if (mode === "nav") requestAnimationFrame(() => containerRef.current?.focus());
      },
      [scrollToCell]
   );

   const exitEdit = useCallback(() => {
      navRef.current = { ...navRef.current, mode: "nav" };
      bumpNav();
      requestAnimationFrame(() => containerRef.current?.focus());
   }, []);

   // Guardamos funciones en refs para que handleKeyDown (deps:[]) siempre tenga la versión fresca
   const moveToRef = useRef(moveTo);
   const exitEditRef = useRef(exitEdit);
   const insertRowRef = useRef<(idx?: number) => void>(() => {});
   const deleteRowRef = useRef<(idx?: number) => void>(() => {});
   const setFVRef = useRef(setFieldValue);
   const getCVRef = useRef<(row: Record<string, any>, col: ColumnDef) => any>(() => {});
   const setCVRef = useRef<(ri: number, col: ColumnDef, v: any) => void>(() => {});
   moveToRef.current = moveTo;
   exitEditRef.current = exitEdit;
   setFVRef.current = setFieldValue;

   const moveBy = useCallback(
      (dr: number, dc: number, mode: NavMode = "nav", wrap = false) => {
         const { r, c } = navRef.current;
         moveTo(r + dr, c + dc, mode, wrap);
      },
      [moveTo]
   );

   // Insert / Delete row
   const insertRow = useCallback(
      (index?: number) => {
         const idx = index ?? navRef.current.r + 1;
         const rows = rowsRef.current;
         setFieldValue("rows", [...rows.slice(0, idx), emptyRow(), ...rows.slice(idx)]);
         setTimeout(() => moveTo(idx, navRef.current.c), 0);
      },
      [setFieldValue, emptyRow, moveTo]
   );

   const deleteRow = useCallback(
      (index?: number) => {
         const idx = index ?? navRef.current.r;
         const rows = rowsRef.current;
         if (rows.length <= 1) return;
         const newRows = rows.filter((_, i) => i !== idx);
         setFieldValue("rows", newRows);
         setTimeout(() => moveTo(Math.min(idx, newRows.length - 1), navRef.current.c), 0);
      },
      [setFieldValue, moveTo]
   );

   // Fill helpers
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
         if (col.type === "checkboxgroup" && typeof value === "object" && value !== null) {
            col.items.forEach((item) => setFieldValue(`rows.${ri}.${item.field}`, value[item.field] ?? false));
         } else {
            setFieldValue(`rows.${ri}.${col.field}`, value);
         }
      },
      [setFieldValue]
   );

   // Mantener refs frescos para el keyboard handler (que tiene deps:[])
   insertRowRef.current = insertRow;
   deleteRowRef.current = deleteRow;
   getCVRef.current = getCellVal;
   setCVRef.current = setCellVal;

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
      const col = colsRef.current[fs.srcCol];
      const value = getCellVal(rowsRef.current[fs.srcRow], col);
      const lo = Math.min(fs.srcRow, fs.endRow);
      const hi = Math.max(fs.srcRow, fs.endRow);
      for (let ri = lo; ri <= hi; ri++) if (ri !== fs.srcRow) setCellVal(ri, col, value);
      setFill(null);
      fillRef.current = null;
      requestAnimationFrame(() => containerRef.current?.focus());
   }, [getCellVal, setCellVal]);

   const inRange = useCallback(
      (r: number, c: number) => {
         if (!fill?.active) return false;
         if (c !== fill.srcCol) return false;
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

   // ─────────────────────────────────────────────────────
   // KEYBOARD HANDLER — deps:[] pero usa refs para todo
   // ─────────────────────────────────────────────────────

   const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      const { r, c, mode } = navRef.current;
      const rows = rowsRef.current;
      const cols = colsRef.current;
      const totalR = rows.length;
      const totalC = cols.length;
      const mt = moveToRef.current;
      const exit = exitEditRef.current;
      const sfv = setFVRef.current;
      const gcv = getCVRef.current;
      const scv = setCVRef.current;

      // — MODO EDICIÓN —
      if (mode === "edit") {
         if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
               // Ctrl+flechas: moverse entre celdas SIN salir de edición
               case "ArrowUp":
                  e.preventDefault();
                  mt(r + (e.shiftKey ? 1 : -1), c, "nav", true);
                  return;

               // ↓ bajar fila
               case "ArrowDown":
                  e.preventDefault();
                  mt(r + (e.shiftKey ? -1 : 1), c, "nav", true);
                  return;

               // ← columna izquierda
               case "ArrowLeft":
                  e.preventDefault();
                  mt(r, c + (e.shiftKey ? 1 : -1), "nav", true);
                  return;

               // → columna derecha
               case "ArrowRight":
                  e.preventDefault();
                  mt(r, c + (e.shiftKey ? -1 : 1), "nav", true);
                  return;

               case "Enter":
                  e.preventDefault();
                  e.stopPropagation();

                  return;
               case "d": {
                  e.preventDefault();
                  const col = cols[c];
                  if (!col || col.compute) return;
                  const v = gcv(rows[r], col);
                  let hi = r + 1;
                  while (hi < totalR && !isBlank(rows[hi]?.[col.field])) hi++;
                  for (let ri = r + 1; ri <= Math.min(hi, totalR - 1); ri++) scv(ri, col, v);
                  exit();
                  return;
               }
               case " ":
                  if (e.shiftKey) {
                     e.preventDefault();
                     // Seleccionar toda la fila: mover a columna 0 de la misma fila
                     // y podríamos añadir un indicador visual de "fila seleccionada"
                     mt(r, 0, "nav");
                     // Opcional: dispatch un evento o cambio de estado para "fila seleccionada"
                     // Podríamos añadir un contexto de selección múltiple más adelante
                     return;
                  }
            }
         }
         switch (e.key) {
            case "Escape":
               e.preventDefault();
               exit();
               return;
            // Enter: confirmar y bajar (con wrap: última col → primera col, fila siguiente)
            case "Enter":
               e.preventDefault();
                              e.stopPropagation();

               // mt(r + (e.shiftKey ? -1 : 1), c, "nav");
               return;
            // Tab: moverse entre columnas CON WRAP — al final de fila baja a col 0
            case "Tab":
               e.preventDefault();
               mt(r, c + (e.shiftKey ? -1 : 1), "nav", true);
               return;
         }
         return; // resto de teclas → input nativo las maneja
      }

      // — MODO NAVEGACIÓN —
      if (e.ctrlKey || e.metaKey) {
         switch (e.key) {
            case "Insert":
               e.preventDefault();
               insertRowRef.current();
               return;
            case "Delete":
               e.preventDefault();
               deleteRowRef.current();
               return;
            case "d": {
               e.preventDefault();
               const col = cols[c];
               if (!col || col.compute) return;
               const v = gcv(rows[r], col);
               let hi = r + 1;
               while (hi < totalR && !isBlank(rows[hi]?.[col.field])) hi++;
               for (let ri = r + 1; ri <= Math.min(hi, totalR - 1); ri++) scv(ri, col, v);
               mt(Math.min(hi, totalR - 1), c);
               return;
            }
         
         }
      }

      switch (e.key) {
         // Flechas: sin wrap (moverse dentro de los límites)
         case "ArrowUp":
            e.preventDefault();
            mt(r - 1, c);
            return;
         case "ArrowDown":
            e.preventDefault();
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

         // Tab/Enter con WRAP — el capturista puede navegar todo el grid sin mouse
         case "Tab":
            e.preventDefault();
            mt(r, c + (e.shiftKey ? -1 : 1), "nav", true);
            return;
         case "Enter":
            e.preventDefault();
            if (!cols[c]?.compute) mt(r, c, "edit");
            // mt(r + (e.shiftKey ? -1 : 1), c + 0, "nav");
            return;

         case "F2":
            e.preventDefault();
            if (!cols[c]?.compute) mt(r, c, "edit");
            return;
         case "Home":
            e.preventDefault();
            mt(r, 0);
            return;
         case "End":
            e.preventDefault();
            mt(r, totalC - 1);
            return;
         case "PageDown":
            e.preventDefault();
            mt(r + 10, c);
            return;
         case "PageUp":
            e.preventDefault();
            mt(r - 10, c);
            return;

         case " ": {
            e.preventDefault();
            const col = cols[c];
            if (!col || col.compute) return;
            if (col.type === "checkbox") sfv(`rows.${r}.${col.field}`, !rows[r]?.[col.field]);
            else mt(r, c, "edit");
            return;
         }
         case "Delete":
         case "Backspace": {
            e.preventDefault();
            const col = cols[c];
            if (!col || col.compute) return;
            if (!["checkbox", "checkboxgroup", "autocomplete"].includes(col.type ?? "")) sfv(`rows.${r}.${col.field}`, col.defaultValue ?? "");
            return;
         }
         default: {
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
               e.preventDefault();
               const col = cols[c];
               if (!col || col.compute) return;
               if (["checkbox", "checkboxgroup", "select", "autocomplete"].includes(col.type ?? "")) {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // ft-commit event (autocomplete / checkboxgroup)
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

   // Cell actions
   const onCellAction = useCallback(
      (r: number, c: number, action: "click" | "dblclick") => {
         if (action === "dblclick") {
            const col = colsRef.current[c];
            if (!col?.compute && col?.type !== "checkbox") moveTo(r, c, "edit");
         } else {
            const col = colsRef.current[c];
            moveTo(r, c, "nav");
            if (col?.type === "checkbox" && !col.compute) setFieldValue(`rows.${r}.${col.field}`, !rowsRef.current[r]?.[col.field]);
         }
      },
      [moveTo, setFieldValue]
   );

   const onRowClick = useCallback((r: number) => moveTo(r, 0), [moveTo]);
   const onColClick = useCallback((c: number) => moveTo(0, c), [moveTo]);

   // Infinite scroll
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

   const totalRows = values.rows.length;
   const colCount = columns.length;
   const filledCount = useMemo(() => values.rows.filter((row) => !rowIsEmpty(row, columns)).length, [values.rows, columns]);

   // Contexts — nav usa navRef.current que ya tiene el tick aplicado
   const navCtx = useMemo<INav>(() => ({ nav: navRef.current, navRef }), [navRef.current.r, navRef.current.c, navRef.current.mode]);
   const fillCtx = useMemo<IFill>(() => ({ fill, startFill, updateFill, commitFill, inRange }), [fill, startFill, updateFill, commitFill, inRange]);

   const shortcuts: [string, string][] = [
      ["↑↓←→", "mover"],
      ["Enter", "bajar"],
      ["F2", "editar"],
      ["Esc", "salir"],
      ["Tab", "col±1"],
      ["Del", "borrar"],
      // ["Ctrl+D", "fill↓"],
      // ["Ctrl+↵", "confirmar"],
      ["Ctrl+⇧", "navegar(edit)"],
      // ["Ctrl+Ins", "fila+"],
      ["Ctrl+Supr", "fila−"],
      ["⬛ drag", "copiar↓"]
   ];

   return (
      <NavCtx.Provider value={navCtx}>
         <FillCtx.Provider value={fillCtx}>
            {/* ── TOP BAR ── */}
            <div
               style={{
                  flexShrink: 0,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 12px",
                  background: T.bg2,
                  borderBottom: `1.5px solid ${T.line1}`,
                  userSelect: "none"
               }}
            >
               <div style={{ display: "flex", alignItems: "center", gap: 0, overflow: "hidden", minWidth: 0 }}>
                  {shortcuts.map(([k, l]) => (
                     <div
                        key={k}
                        style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 7px", borderRight: `1px solid ${T.line2}`, height: 22, flexShrink: 0 }}
                     >
                        <kbd
                           style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: 16,
                              padding: "0 5px",
                              background: T.bg0,
                              border: `1px solid ${T.line1}`,
                              borderBottom: `2px solid ${T.line1}`,
                              borderRadius: 3,
                              fontSize: 9,
                              fontFamily: T.mono,
                              color: "#3d3530",
                              letterSpacing: "0.01em",
                              whiteSpace: "nowrap"
                           }}
                        >
                           {k}
                        </kbd>
                        <span style={{ fontSize: 9, fontFamily: T.mono, color: T.ink2, whiteSpace: "nowrap" }}>{l}</span>
                     </div>
                  ))}
               </div>

               <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
                  <span style={{ fontSize: 10, fontFamily: T.mono, color: T.ink2 }}>
                     <span style={{ color: filledCount > 0 ? T.fire : T.ink2, fontWeight: 600 }}>{filledCount}</span>
                     <span> / {totalRows}</span>
                  </span>
                  <div style={{ width: 1, height: 14, background: T.line0 }} />
                  <span
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 20,
                        padding: "0 7px",
                        background: T.bg0,
                        border: `1px solid ${T.line0}`,
                        borderRadius: 3,
                        fontSize: 10,
                        fontFamily: T.mono,
                        color: "#3d3530",
                        letterSpacing: "0.06em",
                        fontWeight: 600
                     }}
                  >
                     {String.fromCharCode(65 + navRef.current.c)}
                     {navRef.current.r + 1}
                  </span>
                  <span
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 20,
                        padding: "0 9px",
                        background: fill ? T.accentBg2 : navRef.current.mode === "edit" ? T.fireBg : T.bg0,
                        border: `1px solid ${fill ? T.accentRim : navRef.current.mode === "edit" ? T.fireRim : T.line0}`,
                        borderRadius: 3,
                        fontSize: 9.5,
                        fontFamily: T.mono,
                        fontWeight: 700,
                        color: fill ? T.accent : navRef.current.mode === "edit" ? T.fire : T.ink2,
                        letterSpacing: "0.09em",
                        transition: "all .15s"
                     }}
                  >
                     {fill && <span style={{ width: 5, height: 5, borderRadius: 1, background: T.accent, flexShrink: 0 }} />}
                     {navRef.current.mode === "edit" && !fill && (
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.fire, flexShrink: 0, animation: "ft-pulse 1.2s ease infinite" }} />
                     )}
                     {fill ? "COPIANDO" : navRef.current.mode === "edit" ? "EDITANDO" : "NAVEGAR"}
                  </span>
               </div>
            </div>

            {/* ── TABLE ── */}
            <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} style={{ flex: 1, minHeight: 0, overflow: "auto", outline: "none" }}>
               <table ref={tableRef} style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontFamily: T.mono, tableLayout: "fixed" }}>
                  <colgroup>
                     {showRowNum && <col style={{ width: 44 }} />}
                     {columns.map((col) => (
                        <col key={col.field} style={{ width: col.width ?? 140 }} />
                     ))}
                  </colgroup>
                  <Header columns={columns} showRowNum={showRowNum} onColClick={onColClick} />
                  <tbody>
                     {Array.from({ length: totalRows }, (_, i) => (
                        <Row key={i} r={i} columns={columns} showRowNum={showRowNum} containerRef={containerRef} onCellAction={onCellAction} onRowClick={onRowClick} />
                     ))}
                  </tbody>
               </table>
            </div>

            {/* ── FOOTER ── */}
            <div
               style={{
                  flexShrink: 0,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 12px",
                  background: T.bg2,
                  borderTop: `1px solid ${T.line0}`
               }}
            >
               <div style={{ display: "flex", alignItems: "center" }}>
                  {[
                     { val: totalRows.toLocaleString(), label: "filas" },
                     { val: String(colCount), label: "cols" },
                     { val: String(filledCount), label: "con datos", hi: filledCount > 0 }
                  ].map(({ val, label, hi }) => (
                     <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", borderRight: `1px solid ${T.line2}`, height: 22 }}>
                        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: (hi as any) ? T.fire : "#3d3530" }}>{val}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.ink2 }}>{label}</span>
                     </div>
                  ))}
                  <button
                     type="button"
                     onClick={() => insertRow()}
                     title="Insertar fila (Ctrl+Insert)"
                     style={{
                        marginLeft: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 22,
                        padding: "0 9px",
                        background: "transparent",
                        border: `1px solid ${T.line0}`,
                        borderRadius: 3,
                        fontSize: 10,
                        fontFamily: T.mono,
                        color: "#3d3530",
                        cursor: "pointer",
                        transition: "border-color .1s,color .1s"
                     }}
                     onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = T.fire;
                        (e.currentTarget as HTMLElement).style.color = T.fire;
                     }}
                     onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = T.line0;
                        (e.currentTarget as HTMLElement).style.color = "#3d3530";
                     }}
                  >
                     <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                     </svg>
                     fila
                  </button>
               </div>

               {hasSubmit && (
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 26,
                        padding: "0 16px",
                        background: isSubmitting ? T.bg0 : T.fire,
                        border: `1px solid ${isSubmitting ? T.line0 : T.fire}`,
                        borderRadius: 4,
                        color: isSubmitting ? T.ink2 : "#fff",
                        fontSize: 11,
                        fontFamily: T.serif,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "all .15s",
                        boxShadow: isSubmitting ? "none" : `0 2px 10px ${T.fireGlow},0 1px 3px rgba(184,76,46,0.25)`
                     }}
                  >
                     {isSubmitting && (
                        <div
                           style={{
                              width: 10,
                              height: 10,
                              border: `1.5px solid rgba(255,255,255,0.3)`,
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

            <style>{`
          @keyframes ft-spin  { to{transform:rotate(360deg)} }
          @keyframes ft-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
          input[type=number]::-webkit-inner-spin-button{opacity:0}
          input[type=date]::-webkit-calendar-picker-indicator{opacity:.35;cursor:pointer}
        `}</style>
         </FillCtx.Provider>
      </NavCtx.Provider>
   );
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const FormTable = forwardRef<FormTableHandle, FormTableProps>((props, ref) => {
   const { columns, initialRows = [], onSubmit, validate, showRowNum = true, initialSize = 30, chunkSize = 25, emptyRow } = props;

   const makeEmpty = useCallback((): Record<string, any> => {
      const r: Record<string, any> = { _id: `${Date.now()}${Math.random().toString(36).slice(2)}` };
      columns.forEach((c) => {
         r[c.field] = c.defaultValue ?? "";
      });
      return r;
   }, [columns]);

   const factory = emptyRow ?? makeEmpty;

   const initialValues = useMemo(() => {
      const base = [...initialRows];
      for (let i = base.length; i < initialSize; i++) base.push(factory());
      return { rows: base };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const formikRef = useRef<FormikProps<any>>(null);

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
         await onSubmit?.(values.rows.filter((r) => !rowIsEmpty(r, columns)));
      },
      [onSubmit, columns]
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
         }
      }),
      [columns]
   );

   return (
      <>
         <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.bg1}}
        ::-webkit-scrollbar-thumb{background:${T.line0};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${T.line1}}
        ::-webkit-scrollbar-corner{background:${T.bg1}}
      `}</style>

         <div
            style={{
               background: T.bg0,
               border: `1.5px solid ${T.line1}`,
               borderRadius: 8,
               overflow: "hidden",
               display: "flex",
               flexDirection: "column",
               height: "100%",
               fontFamily: T.mono,
               boxShadow: `0 4px 28px rgba(15,12,8,0.09),0 1px 4px rgba(15,12,8,0.05),inset 0 1px 0 rgba(255,255,255,0.75)`
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
                     <InnerTable columns={columns} showRowNum={showRowNum} hasSubmit={!!onSubmit} chunkSize={chunkSize} emptyRow={factory} />
                  </Form>
               )}
            </Formik>
         </div>
      </>
   );
});

export default FormTable;
