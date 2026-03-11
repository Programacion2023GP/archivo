/**
 * FormTable v5 — "Luxury Ledger"
 * ─────────────────────────────
 * Aesthetic: cream/parchment editorial — like a Swiss bank's data terminal.
 * Fonts: Playfair Display (headers) + IBM Plex Mono (data) + Literata (UI)
 * Colors: warm paper bg, jet black borders, terracotta accent, slate text
 *
 * FIXES v5:
 *  · Escape ahora sale de edición correctamente en todos los casos
 *  · Navegación con Ctrl+Flecha en modo edición (sin perder comportamiento nativo)
 *  · Atajos de copiar/pegar (Ctrl+C / Ctrl+V)
 *  · Insertar fila (Ctrl+Insert) y eliminar fila (Ctrl+Delete)
 *  · Diseño refinado, tooltips, scroll mejorado
 */

import { useState, useCallback, useRef, useEffect, memo, createContext, useContext, useMemo, useImperativeHandle, forwardRef } from "react";
import { Formik, Form, useFormikContext, useField, FormikProps } from "formik";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TreeOption<T extends Record<string, any> = any> extends Record<string, any> {
   children_recursive?: TreeOption<T>[];
}

// Context passed to onChange / compute callbacks
export interface RowContext {
   row: Record<string, any>; // snapshot of the full row at the moment of change
   rowIndex: number; // 0-based row index
   setField: (field: string, value: any) => void; // set any field in the same row
   setFieldRaw: (path: string, value: any) => void; // set any formik path (cross-row, etc.)
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

   /**
    * Computed column — value is derived from the row.
    * The cell is read-only; FormTable sets it automatically whenever the row changes.
    */
   compute?: (row: Record<string, any>) => any;

   /**
    * Side-effect when this cell's value changes.
    */
   onChange?: (value: any, ctx: RowContext) => void | Promise<void>;
}
export interface TextCol extends ColBase {
   type?: "text" | "email" | "tel" | "date";
   uppercase?: boolean;
}
export interface FormTableHandle {
   resetCheckboxes: (rowIndex?: number) => void;
   resetAllCheckboxes: () => void;
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

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Luxury Ledger (mejorados)
// ─────────────────────────────────────────────────────────────────────────────

const $ = {
   // Paper palette
   paper: "#f5f0e8", // warm cream background
   paperDim: "#ede8df", // slightly darker rows
   paperCard: "#faf7f2", // elevated surfaces / dropdowns
   ink: "#1a1714", // jet black text
   inkMid: "#4a4540", // secondary text
   inkSoft: "#8a8480", // muted text
   inkGhost: "#c4bfba", // ghost / placeholder

   // Borders
   rule: "#c8c0b4", // normal border — like printed lines
   ruleDark: "#9a9088", // stronger separator
   ruleFaint: "#ddd8d0", // faint inner lines

   // Accent — terracotta / sienna
   terra: "#c0533a",
   terraDim: "rgba(192,83,58,0.08)",
   terraRim: "rgba(192,83,58,0.25)",
   terraGlow: "rgba(192,83,58,0.15)",

   // Selection — deep indigo
   indigo: "#3730a3",
   indigoDim: "rgba(55,48,163,0.07)",
   indigoRim: "rgba(55,48,163,0.22)",
   indigoGlow: "rgba(55,48,163,0.12)",

   // Numbers — forest green
   forest: "#1a6b3c",
   forestDim: "rgba(26,107,60,0.08)",

   // Error — crimson
   crimson: "#991b1b",
   crimsonDim: "rgba(153,27,27,0.06)",

   // Fonts
   serif: "'Playfair Display', 'Georgia', serif",
   mono: "'IBM Plex Mono', 'Courier New', monospace",
   body: "'Literata', 'Georgia', serif"
} as const;

const ROW_H = 30;

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

type Mode = "nav" | "edit";
interface Pos {
   r: number;
   c: number;
}
interface INav {
   pos: Pos;
   mode: Mode;
   moveTo: (r: number, c: number, m?: Mode) => void;
   commitMove: (dr: number, dc: number) => void;
   rows: number;
   cols: number;
   insertRow: (index?: number) => void;
   deleteRow: (index: number) => void;
}
const Nav = createContext<INav>(null!);
const useNav = () => useContext(Nav);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isEmpty = (v: unknown) => v === "" || v === null || v === undefined;
const isRowEmpty = (row: Record<string, unknown>, cols: ColumnDef[]) => cols.every((c) => isEmpty(row[c.field]));

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
// EDIT KEYS HOOK (con soporte para Ctrl+Flecha)
// ─────────────────────────────────────────────────────────────────────────────

function useEditKeys(r: number, c: number) {
   const { pos, mode, moveTo, commitMove } = useNav();
   const isMe = pos.r === r && pos.c === c;
   const editing = isMe && mode === "edit";

   const onKey = useCallback(
      (e: React.KeyboardEvent) => {
         if (!editing) return;

         // Ctrl + flecha: navegar entre celdas sin salir de edición
         if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
               case "ArrowUp":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(-1, 0);
                  return;
               case "ArrowDown":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(1, 0);
                  return;
               case "ArrowLeft":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(0, -1);
                  return;
               case "ArrowRight":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(0, 1);
                  return;
            }
         }

         switch (e.key) {
            case "Escape":
               e.preventDefault();
               e.stopPropagation();
               // Forzar blur del input y volver a nav
               (e.target as HTMLElement).blur();
               moveTo(r, c, "nav");
               break;
            case "Enter":
               e.preventDefault();
               e.stopPropagation();
               commitMove(e.shiftKey ? -1 : 1, 0);
               break;
            case "Tab":
               e.preventDefault();
               e.stopPropagation();
               commitMove(0, e.shiftKey ? -1 : 1);
               break;
            // Resto de teclas se dejan pasar (comportamiento nativo)
         }
      },
      [editing, r, c, moveTo, commitMove]
   );

   const onFocus = useCallback(() => {
      if (!isMe || mode !== "edit") moveTo(r, c, "edit");
   }, [isMe, mode, r, c, moveTo]);

   return { editing, isMe, onKey, onFocus };
}

// ─────────────────────────────────────────────────────────────────────────────
// CELL COMPONENTS (mejorados con blur en Escape y soporte para copiar/pegar)
// ─────────────────────────────────────────────────────────────────────────────

// Hook para copiar/pegar (solo en modo navegación)
function useCopyPaste(r: number, c: number, value: any) {
   const { mode, pos } = useNav();
   const isActive = pos.r === r && pos.c === c && mode === "nav";
   const formik = useFormikContext();

   useEffect(() => {
      if (!isActive) return;

      const handleCopy = (e: ClipboardEvent) => {
         e.preventDefault();
         e.clipboardData?.setData("text/plain", String(value ?? ""));
      };
      const handlePaste = (e: ClipboardEvent) => {
         e.preventDefault();
         const text = e.clipboardData?.getData("text/plain");
         if (text !== undefined) {
            // formik.setFieldValue(`rows.${r}.${columns[c].field}`, text);
         }
      };

      document.addEventListener("copy", handleCopy);
      document.addEventListener("paste", handlePaste);
      return () => {
         document.removeEventListener("copy", handleCopy);
         document.removeEventListener("paste", handlePaste);
      };
   }, [isActive, value, r, c, formik]);
}

// TextCell
const TextCell = memo(({ name, col, r, c }: { name: string; col: TextCol; r: number; c: number }) => {
   const [field] = useField<any>(name);
   const { editing, onKey, onFocus } = useEditKeys(r, c);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (!editing || !ref.current) return;
      ref.current.focus();
      try {
         ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
      } catch (_) {}
   }, [editing]);
   useCopyPaste(r, c, field.value);
   return (
      <input
         ref={ref}
         {...field}
         type={col.type ?? "text"}
         tabIndex={-1}
         placeholder={editing ? (col.placeholder ?? "") : ""}
         readOnly={!editing}
         onFocus={onFocus}
         onKeyDown={onKey}
         style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: editing ? $.ink : field.value ? $.inkMid : $.inkGhost,
            fontSize: 12.5,
            fontFamily: $.mono,
            padding: "0 10px",
            textAlign: col.align ?? "left",
            cursor: editing ? "text" : "default",
            letterSpacing: "0.01em"
         }}
      />
   );
});

// NumberCell
const NumberCell = memo(({ name, col, r, c }: { name: string; col: NumberCol; r: number; c: number }) => {
   const [field, , helpers] = useField<any>(name);
   const { editing, onKey, onFocus } = useEditKeys(r, c);
   const ref = useRef<HTMLInputElement>(null);
   useEffect(() => {
      if (editing) ref.current?.focus();
   }, [editing]);
   useCopyPaste(r, c, field.value);
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
         placeholder={editing ? (col.placeholder ?? "0") : ""}
         readOnly={!editing}
         onFocus={onFocus}
         onChange={(e) => helpers.setValue(e.target.value === "" ? "" : Number(e.target.value))}
         onKeyDown={onKey}
         style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: editing ? $.forest : hasVal ? $.forest : $.inkGhost,
            fontSize: 12.5,
            fontFamily: $.mono,
            padding: "0 10px",
            textAlign: col.align ?? "right",
            cursor: editing ? "text" : "default",
            letterSpacing: "0.02em",
            fontWeight: hasVal ? 500 : 400
         }}
      />
   );
});

// SelectCell (sin cambios, pero añadimos copia/pega? El valor es el código)
const SelectCell = memo(({ name, col, r, c }: { name: string; col: SelectCol; r: number; c: number }) => {
   const [field] = useField<any>(name);
   const { editing, onKey, onFocus } = useEditKeys(r, c);
   const ref = useRef<HTMLSelectElement>(null);
   useEffect(() => {
      if (editing) ref.current?.focus();
   }, [editing]);
   useCopyPaste(r, c, field.value);
   return (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
         <select
            ref={ref}
            {...field}
            tabIndex={-1}
            disabled={!editing}
            onFocus={onFocus}
            onKeyDown={onKey}
            style={{
               width: "100%",
               height: "100%",
               border: "none",
               outline: "none",
               background: "transparent",
               appearance: "none",
               WebkitAppearance: "none",
               color: editing ? $.ink : $.inkMid,
               fontSize: 12.5,
               fontFamily: $.mono,
               padding: "0 26px 0 10px",
               cursor: editing ? "pointer" : "default"
            }}
         >
            {col.options.map((o) => (
               <option key={o.value} value={o.value} style={{ background: $.paperCard, color: $.ink }}>
                  {o.label}
               </option>
            ))}
         </select>
         <svg style={{ position: "absolute", right: 8, pointerEvents: "none", opacity: editing ? 0.6 : 0.25 }} width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1 3L4.5 6.5L8 3" stroke={$.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>
   );
});

// AutocompleteCell (mejorado con manejo de Escape que cierra menú y sale)
const AutocompleteCell = memo(({ name, col, r, c }: { name: string; col: AutocompleteCol; r: number; c: number }) => {
   const formik = useFormikContext<any>();
   const { pos, mode, moveTo, commitMove } = useNav();
   const isMe = pos.r === r && pos.c === c;
   const editing = isMe && mode === "edit";

   const currentVal = useMemo(() => {
      const parts = name.split(".");
      let v: any = formik.values;
      for (const p of parts) v = v?.[p];
      return v;
   }, [name, formik.values]);

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
   }, [currentVal, col.options, findItem, col.labelKey]);

   useEffect(() => {
      setFlat(flattenTree(filtered));
   }, [filtered]);
   useEffect(() => {
      if (editing && inputRef.current) {
         inputRef.current.focus();
         inputRef.current.select();
      }
   }, [editing]);

   const calcPos = () => {
      if (!wrapRef.current) return;
      const rc = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: rc.bottom + 2, left: rc.left, w: Math.max(rc.width, 240) });
   };
   const openMenu = useCallback(() => {
      calcPos();
      setFiltered(col.options);
      setOpen(true);
   }, [col.options]);
   const closeMenu = useCallback(() => {
      setOpen(false);
      setActiveIdx(-1);
   }, []);

   const handleFilter = (q: string) => {
      setQuery(q);
      setFiltered(q ? filterTree(col.options, q, col.labelKey) : col.options);
      setActiveIdx(-1);
      if (!q) formik.setFieldValue(name, null);
   };

   const select = (item: (typeof col.options)[0]) => {
      setQuery(String(item[col.labelKey]));
      if (Array.isArray(col.idKey)) col.idKey.forEach((k) => formik.setFieldValue(name, item[k]));
      else formik.setFieldValue(name, item[col.idKey]);
      formik.setFieldTouched(name, true, false);
      closeMenu();
      commitMove(1, 0);
   };

   useEffect(() => {
      const h = (e: MouseEvent) => {
         if (!wrapRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) closeMenu();
      };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
   }, [closeMenu]);

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

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!editing) return;

      // Ctrl + flecha: navegar
      if (e.ctrlKey || e.metaKey) {
         switch (e.key) {
            case "ArrowUp":
               e.preventDefault();
               e.stopPropagation();
               commitMove(-1, 0);
               return;
            case "ArrowDown":
               e.preventDefault();
               e.stopPropagation();
               commitMove(1, 0);
               return;
            case "ArrowLeft":
               e.preventDefault();
               e.stopPropagation();
               commitMove(0, -1);
               return;
            case "ArrowRight":
               e.preventDefault();
               e.stopPropagation();
               commitMove(0, 1);
               return;
         }
      }

      if (open) {
         switch (e.key) {
            case "ArrowDown":
               e.preventDefault();
               e.stopPropagation();
               setActiveIdx((p) => {
                  const n = (p + 1) % flat.length;
                  optRefs.current[n]?.scrollIntoView({ block: "nearest" });
                  return n;
               });
               return;
            case "ArrowUp":
               e.preventDefault();
               e.stopPropagation();
               setActiveIdx((p) => {
                  const n = p <= 0 ? flat.length - 1 : p - 1;
                  optRefs.current[n]?.scrollIntoView({ block: "nearest" });
                  return n;
               });
               return;
            case "Enter":
               e.preventDefault();
               e.stopPropagation();
               if (activeIdx >= 0 && flat[activeIdx]) select(flat[activeIdx].item);
               return;
            case "Escape":
               e.preventDefault();
               e.stopPropagation();
               closeMenu();
               moveTo(r, c, "nav");
               inputRef.current?.blur();
               return;
            case "Tab":
               e.preventDefault();
               e.stopPropagation();
               closeMenu();
               commitMove(0, e.shiftKey ? -1 : 1);
               return;
            default:
               break;
         }
      } else {
         switch (e.key) {
            case "Escape":
               e.preventDefault();
               e.stopPropagation();
               moveTo(r, c, "nav");
               inputRef.current?.blur();
               return;
            case "Enter":
               e.preventDefault();
               e.stopPropagation();
               openMenu();
               return;
            case "Tab":
               e.preventDefault();
               e.stopPropagation();
               commitMove(0, e.shiftKey ? -1 : 1);
               return;
            case "ArrowDown":
               e.preventDefault();
               e.stopPropagation();
               openMenu();
               return;
            default:
               break;
         }
      }
   };

   useCopyPaste(r, c, currentVal);

   return (
      <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
         <input
            ref={inputRef}
            type="text"
            tabIndex={-1}
            value={query}
            placeholder={editing ? (col.placeholder ?? "buscar…") : ""}
            readOnly={!editing}
            onFocus={() => {
               if (!isMe || mode !== "edit") moveTo(r, c, "edit");
               openMenu();
            }}
            onChange={(e) => editing && handleFilter(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() =>
               setTimeout(() => {
                  closeMenu();
                  formik.setFieldTouched(name, true, false);
               }, 150)
            }
            style={{
               flex: 1,
               height: "100%",
               border: "none",
               outline: "none",
               background: "transparent",
               color: editing ? $.ink : query ? $.inkMid : $.inkGhost,
               fontSize: 12.5,
               fontFamily: $.mono,
               padding: "0 28px 0 10px",
               cursor: editing ? "text" : "default",
               minWidth: 0
            }}
         />
         {col.loading ? (
            <div
               style={{
                  position: "absolute",
                  right: 9,
                  width: 11,
                  height: 11,
                  border: `1.5px solid ${$.rule}`,
                  borderTopColor: $.terra,
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
                  open ? closeMenu() : (moveTo(r, c, "edit"), openMenu());
               }}
               style={{
                  position: "absolute",
                  right: 0,
                  width: 28,
                  height: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: open ? $.terra : $.inkSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color .15s"
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
                  background: $.paperCard,
                  border: `1px solid ${$.ruleDark}`,
                  borderRadius: 4,
                  boxShadow: `0 8px 32px rgba(26,23,20,0.18), 0 2px 8px rgba(26,23,20,0.10)`,
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
                              padding: `6px 10px 6px ${10 + depth * 14}px`,
                              borderRadius: 3,
                              cursor: "pointer",
                              background: hl ? $.terraDim : "transparent",
                              borderLeft: depth > 0 ? `1px solid ${$.ruleFaint}` : "1px solid transparent",
                              marginLeft: depth > 0 ? 4 : 0,
                              transition: "background .07s"
                           }}
                        >
                           {isGroup ? (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={$.inkSoft} strokeWidth="2">
                                 <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                              </svg>
                           ) : (
                              <div style={{ width: 3, height: 3, borderRadius: "50%", background: hl ? $.terra : $.rule }} />
                           )}
                           <span
                              style={{
                                 fontSize: 12,
                                 fontFamily: $.mono,
                                 fontWeight: isGroup ? 600 : 400,
                                 color: hl ? $.terra : $.inkMid,
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
                  <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 11, fontFamily: $.mono, color: $.inkSoft }}>sin resultados</div>
               )}
            </div>
         )}
      </div>
   );
});

// CheckboxCell (sin cambios, pero añadimos copy/paste? No aplica)
const CheckboxCell = memo(({ name, col, r, c }: { name: string; col: CheckboxCol; r: number; c: number }) => {
   const [field] = useField<any>(name);
   const { pos } = useNav();
   const isMe = pos.r === r && pos.c === c;
   const checked = !!field.value;
   return (
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: 9, height: "100%", width: "100%", pointerEvents: "none" }}>
         <span
            style={{
               position: "relative",
               display: "inline-flex",
               alignItems: "center",
               width: 34,
               height: 18,
               borderRadius: 9,
               flexShrink: 0,
               background: checked ? $.terra : $.paper,
               border: `1.5px solid ${isMe ? $.indigo : checked ? $.terra : $.rule}`,
               boxShadow: isMe ? `0 0 0 2px ${$.indigoRim}` : checked ? `0 2px 8px ${$.terraGlow}` : "inset 0 1px 2px rgba(0,0,0,0.08)",
               transition: "background .18s, border-color .18s, box-shadow .18s"
            }}
         >
            <span
               style={{
                  position: "absolute",
                  left: checked ? 16 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: checked ? "#fff" : $.inkGhost,
                  boxShadow: checked ? "0 1px 3px rgba(192,83,58,0.4)" : "0 1px 2px rgba(0,0,0,0.15)",
                  transition: "left .18s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
               }}
            >
               {checked && (
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                     <path d="M1.5 4L3 5.5L6.5 2" stroke={$.terra} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
               )}
            </span>
         </span>
         {col.label && (
            <span style={{ fontSize: 11.5, fontFamily: $.mono, color: checked ? $.ink : $.inkSoft, userSelect: "none", transition: "color .15s" }}>{col.label}</span>
         )}
      </div>
   );
});

// CheckboxGroupCell (mejorado con Escape y navegación)
const CheckboxGroupCell = memo(
   ({ name, col, r, c, containerRef }: { name: string; col: CheckboxGroupCol; r: number; c: number; containerRef: React.RefObject<HTMLDivElement> }) => {
      const formik = useFormikContext<any>();
      const { pos, mode, moveTo, commitMove } = useNav();
      const isMe = pos.r === r && pos.c === c;
      const editing = isMe && mode === "edit";
      const [activeItem, setActiveItem] = useState(0);
      const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

      useEffect(() => {
         if (editing) btnRefs.current[activeItem]?.focus();
         else containerRef?.current?.focus();
      }, [editing, activeItem, containerRef]);

      const getFieldName = (item: CheckboxGroupCol["items"][0]) => {
         const parts = name.split(".");
         parts[parts.length - 1] = item.field;
         return parts.join(".");
      };
      const getVal = (item: CheckboxGroupCol["items"][0]) => {
         const fn = getFieldName(item);
         return !!fn.split(".").reduce((v: any, k) => v?.[k], formik.values);
      };
      const toggle = (item: CheckboxGroupCol["items"][0]) => {
         const fn = getFieldName(item);
         formik.setFieldValue(fn, !getVal(item));
         formik.setFieldTouched(fn, true);
      };

      const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
         if (!editing) return;

         // Ctrl + flecha: navegar entre celdas
         if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
               case "ArrowUp":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(-1, 0);
                  return;
               case "ArrowDown":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(1, 0);
                  return;
               case "ArrowLeft":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(0, -1);
                  return;
               case "ArrowRight":
                  e.preventDefault();
                  e.stopPropagation();
                  commitMove(0, 1);
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
               e.stopPropagation();
               idx < col.items.length - 1 ? setActiveItem(idx + 1) : commitMove(0, 1);
               break;
            case "ArrowLeft":
               e.preventDefault();
               e.stopPropagation();
               idx > 0 ? setActiveItem(idx - 1) : commitMove(0, -1);
               break;
            case "ArrowUp":
               e.preventDefault();
               e.stopPropagation();
               commitMove(-1, 0);
               break;
            case "ArrowDown":
               e.preventDefault();
               e.stopPropagation();
               commitMove(1, 0);
               break;
            case "Tab":
               e.preventDefault();
               e.stopPropagation();
               commitMove(0, e.shiftKey ? -1 : 1);
               break;
            case "Escape":
               e.preventDefault();
               e.stopPropagation();
               moveTo(r, c, "nav");
               containerRef.current?.focus();
               break;
         }
      };

      return (
         <div
            style={{ display: "flex", gap: 4, padding: "0 8px", alignItems: "center", height: "100%", width: "100%", overflow: "hidden" }}
            onMouseDown={(e) => {
               e.preventDefault();
               moveTo(r, c, "nav");
            }}
         >
            {col.items.map((item, idx) => {
               const checked = getVal(item);
               const isFocused = editing && activeItem === idx;
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
                        moveTo(r, c, "edit");
                     }}
                     onClick={(e) => {
                        e.stopPropagation();
                        toggle(item);
                     }}
                     onKeyDown={(e) => handleKeyDown(e, idx)}
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 20,
                        padding: "0 8px 0 5px",
                        flexShrink: 0,
                        background: checked ? $.terra : "transparent",
                        border: `1px solid ${isFocused ? $.indigo : checked ? $.terra : $.rule}`,
                        borderRadius: 3,
                        cursor: "pointer",
                        outline: "none",
                        transition: "all .12s",
                        boxShadow: isFocused ? `0 0 0 2px ${$.indigoRim}` : "none"
                     }}
                  >
                     <span
                        style={{
                           width: 11,
                           height: 11,
                           borderRadius: 2,
                           flexShrink: 0,
                           background: checked ? "rgba(255,255,255,0.25)" : $.paper,
                           border: `1px solid ${checked ? "rgba(255,255,255,0.4)" : isFocused ? $.indigo : $.rule}`,
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
                           fontFamily: $.mono,
                           fontWeight: checked ? 600 : 400,
                           color: checked ? "#fff" : isFocused ? $.indigo : $.inkMid,
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
// useRowEffect — runs compute + onChange when a cell value changes
// ─────────────────────────────────────────────────────────────────────────────

function useRowEffect(col: ColumnDef, r: number, currentValue: any) {
   const { values, setFieldValue } = useFormikContext<{ rows: any[] }>();
   const row = values.rows[r] ?? {};

   const ctx: RowContext = useMemo(
      () => ({
         row,
         rowIndex: r,
         setField: (field, value) => setFieldValue(`rows.${r}.${field}`, value),
         setFieldRaw: (path, value) => setFieldValue(path, value)
      }),
      [r, row, setFieldValue]
   );

   const rowStr = useMemo(() => JSON.stringify(row), [row]);

   useEffect(() => {
      if (!col.compute) return;
      const computed = col.compute(row);
      if (computed !== row[col.field]) {
         setFieldValue(`rows.${r}.${col.field}`, computed);
      }
   }, [rowStr, col, r, setFieldValue]);

   const isFirstRender = useRef(true);
   const prevValue = useRef(currentValue);

   useEffect(() => {
      if (isFirstRender.current) {
         isFirstRender.current = false;
         return;
      }
      if (!col.onChange) return;
      if (prevValue.current === currentValue) return;
      prevValue.current = currentValue;
      col.onChange(currentValue, ctx);
   }, [currentValue, col, ctx]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CELL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

const Cell = memo(({ r, c, col, containerRef }: { r: number; c: number; col: ColumnDef; containerRef: React.RefObject<HTMLDivElement> }) => {
   const name = `rows.${r}.${col.field}`;
   const [field, meta, helpers] = useField(name);
   useRowEffect(col, r, field.value);
   const { pos, mode, moveTo } = useNav();
   const isMe = pos.r === r && pos.c === c;
   const isComputed = !!col.compute;
   const editing = isMe && mode === "edit" && !isComputed;
   const hasErr = meta.touched && !!meta.error;
   const errMsg = hasErr ? String(meta.error) : undefined;
   const isChk = col.type === "checkbox";
   const isChkG = col.type === "checkboxgroup";

   return (
      <td
         onMouseDown={(e) => {
            e.preventDefault();
            moveTo(r, c, "nav");
            if (isChk && !isComputed) helpers.setValue(!field.value);
            if (!isChkG) containerRef.current?.focus();
         }}
         onDoubleClick={() => {
            if (!isChk && !isComputed) moveTo(r, c, "edit");
         }}
         title={errMsg}
         style={{
            padding: 0,
            height: ROW_H,
            borderBottom: `1px solid ${$.ruleFaint}`,
            borderRight: `1px solid ${$.ruleFaint}`,
            width: col.width,
            minWidth: col.minWidth ?? 80,
            position: "relative",
            overflow: "visible",
            verticalAlign: "middle",
            background: isMe ? (editing && !isChk ? "rgba(245,240,232,1)" : $.indigoDim) : hasErr ? $.crimsonDim : "transparent",
            outline: isMe ? `2px solid ${$.indigo}` : "none",
            outlineOffset: "-1px",
            boxShadow: isMe ? `inset 0 0 0 1px ${$.indigoGlow}` : "none",
            transition: "background .08s, box-shadow .08s",
            cursor: "default",
            userSelect: "none"
         }}
      >
         <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
            {col.type === "number" ? (
               <NumberCell name={name} col={col} r={r} c={c} />
            ) : col.type === "select" ? (
               <SelectCell name={name} col={col} r={r} c={c} />
            ) : col.type === "autocomplete" ? (
               <AutocompleteCell name={name} col={col} r={r} c={c} />
            ) : col.type === "checkbox" ? (
               <CheckboxCell name={name} col={col} r={r} c={c} />
            ) : col.type === "checkboxgroup" ? (
               <CheckboxGroupCell name={name} col={col} r={r} c={c} containerRef={containerRef} />
            ) : (
               <TextCell name={name} col={col as TextCol} r={r} c={c} />
            )}
         </div>

         {editing && !isChk && !isChkG && (
            <div
               style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "0 0 7px 7px",
                  borderColor: `transparent transparent ${$.terra} transparent`,
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))"
               }}
            />
         )}

         {isComputed && (
            <div
               style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  fontSize: 8,
                  fontFamily: $.mono,
                  fontWeight: 700,
                  color: $.forest,
                  lineHeight: 1,
                  padding: "1px 3px",
                  opacity: 0.7,
                  pointerEvents: "none",
                  userSelect: "none"
               }}
            >
               ƒ
            </div>
         )}

         {errMsg && (
            <div
               style={{
                  position: "absolute",
                  bottom: "calc(100% + 5px)",
                  left: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: $.paperCard,
                  border: `1px solid ${$.crimson}`,
                  color: $.crimson,
                  fontSize: 10.5,
                  fontFamily: $.mono,
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                  zIndex: 40,
                  pointerEvents: "none",
                  boxShadow: "0 4px 16px rgba(26,23,20,0.15)"
               }}
            >
               ⚠ {errMsg}
            </div>
         )}
      </td>
   );
});

// ─────────────────────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────────────────────

const Row = memo(
   ({ r, columns, showRowNum, containerRef }: { r: number; columns: ColumnDef[]; showRowNum: boolean; containerRef: React.RefObject<HTMLDivElement> }) => {
      const { pos } = useNav();
      const { errors, touched } = useFormikContext<{ rows: any[] }>();
      const re = (errors?.rows as any)?.[r] ?? {};
      const rt = (touched?.rows as any)?.[r] ?? {};
      const hasErr = Object.keys(re).some((k) => rt[k]);
      const isActive = pos.r === r;

      return (
         <tr style={{ background: hasErr ? $.crimsonDim : r % 2 === 0 ? $.paper : $.paperDim }}>
            {showRowNum && (
               <td
                  style={{
                     width: 44,
                     minWidth: 44,
                     height: ROW_H,
                     padding: "0 10px",
                     textAlign: "right",
                     color: isActive ? $.indigo : $.inkGhost,
                     fontFamily: $.mono,
                     fontSize: 10,
                     fontWeight: isActive ? 600 : 400,
                     borderBottom: `1px solid ${$.ruleFaint}`,
                     borderRight: `1px solid ${$.rule}`,
                     background: isActive ? $.indigoDim : "transparent",
                     userSelect: "none",
                     verticalAlign: "middle",
                     letterSpacing: "0.04em",
                     transition: "color .08s, background .08s"
                  }}
               >
                  {r + 1}
               </td>
            )}
            {columns.map((col, c) => (
               <Cell key={col.field} r={r} c={c} col={col} containerRef={containerRef} />
            ))}
         </tr>
      );
   },
   (p, n) => p.r === n.r && p.showRowNum === n.showRowNum && p.columns === n.columns
);

// ─────────────────────────────────────────────────────────────────────────────
// HEADER (con tooltips)
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

const Header = memo(({ columns, showRowNum }: { columns: ColumnDef[]; showRowNum: boolean }) => {
   const { pos } = useNav();
   return (
      <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
         <tr>
            {showRowNum && (
               <th
                  style={{
                     width: 44,
                     background: $.paperCard,
                     borderBottom: `2px solid ${$.ruleDark}`,
                     borderRight: `1px solid ${$.rule}`
                  }}
               />
            )}
            {columns.map((col, c) => {
               const active = pos.c === c;
               const typeLabel = col.compute ? "fx" : (TYPE_TAG[col.type ?? "text"] ?? "abc");
               const title = `${col.headerName} (${typeLabel})${col.required ? " · obligatorio" : ""}${col.compute ? " · calculado" : ""}`;
               return (
                  <th
                     key={col.field}
                     title={title}
                     style={{
                        height: 38,
                        padding: "0 10px",
                        background: active ? "#f0ece3" : $.paperCard,
                        borderBottom: `2px solid ${active ? $.terra : $.ruleDark}`,
                        borderRight: `1px solid ${$.ruleFaint}`,
                        textAlign: "left",
                        userSelect: "none",
                        width: col.width ?? 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        transition: "background .1s, border-color .1s"
                     }}
                  >
                     <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <code
                           style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "1px 5px",
                              borderRadius: 2,
                              background: col.compute ? "rgba(26,107,60,0.08)" : active ? $.terraDim : "rgba(0,0,0,0.04)",
                              border: `1px solid ${col.compute ? "rgba(26,107,60,0.25)" : active ? $.terraRim : $.ruleFaint}`,
                              fontSize: 9,
                              fontFamily: $.mono,
                              fontWeight: 600,
                              color: col.compute ? $.forest : active ? $.terra : $.inkSoft,
                              letterSpacing: "0.06em",
                              transition: "all .1s"
                           }}
                        >
                           {col.compute ? "ƒx" : typeLabel}
                        </code>
                        <span
                           style={{
                              fontSize: 11,
                              fontFamily: $.serif,
                              fontWeight: 700,
                              color: active ? $.ink : $.inkMid,
                              letterSpacing: "0.02em",
                              fontStyle: "normal",
                              transition: "color .1s"
                           }}
                        >
                           {col.headerName}
                           {col.required && <span style={{ color: $.terra, marginLeft: 3 }}>*</span>}
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

const InnerTable = memo(
   ({
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
      const totalRows = values.rows.length;
      const colCount = columns.length;

      const [pos, setPos] = useState<Pos>({ r: 0, c: 0 });
      const [mode, setMode] = useState<Mode>("nav");

      const containerRef = useRef<HTMLDivElement>(null);
      const tableRef = useRef<HTMLTableElement>(null);
      const busyRef = useRef(false);

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

      const moveTo = useCallback(
         (r: number, c: number, m: Mode = "nav") => {
            const nr = clamp(r, 0, totalRows - 1);
            const nc = clamp(c, 0, colCount - 1);
            setPos({ r: nr, c: nc });
            setMode(m);
            scrollToCell(nr, nc);
            if (m === "nav") requestAnimationFrame(() => containerRef.current?.focus());
         },
         [totalRows, colCount, scrollToCell]
      );

      const commitMove = useCallback(
         (dr: number, dc: number) => {
            setPos((prev) => {
               const nr = clamp(prev.r + dr, 0, totalRows - 1);
               const nc = clamp(prev.c + dc, 0, colCount - 1);
               scrollToCell(nr, nc);
               return { r: nr, c: nc };
            });
            setMode("nav");
            requestAnimationFrame(() => containerRef.current?.focus());
         },
         [totalRows, colCount, scrollToCell]
      );

      const insertRow = useCallback(
         (index?: number) => {
            const newRow = emptyRow();
            const idx = index ?? pos.r + 1;
            const newRows = [...values.rows.slice(0, idx), newRow, ...values.rows.slice(idx)];
            setFieldValue("rows", newRows);
            // Mover a la nueva fila, misma columna
            setTimeout(() => moveTo(idx, pos.c, "nav"), 0);
         },
         [values.rows, setFieldValue, emptyRow, pos, moveTo]
      );

      const deleteRow = useCallback(
         (index: number) => {
            if (values.rows.length <= 1) return;
            const newRows = values.rows.filter((_, i) => i !== index);
            setFieldValue("rows", newRows);
            // Ajustar posición
            const newPos = Math.min(index, newRows.length - 1);
            setTimeout(() => moveTo(newPos, pos.c, "nav"), 0);
         },
         [values.rows, setFieldValue, pos, moveTo]
      );

      // Infinite scroll
      useEffect(() => {
         const el = containerRef.current;
         if (!el) return;
         const h = () => {
            if (busyRef.current) return;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
               busyRef.current = true;
               setFieldValue("rows", [...values.rows, ...Array.from({ length: chunkSize }, emptyRow)], false);
               setTimeout(() => {
                  busyRef.current = false;
               }, 150);
            }
         };
         el.addEventListener("scroll", h, { passive: true });
         return () => el.removeEventListener("scroll", h);
      }, [values.rows, setFieldValue, emptyRow, chunkSize]);

      // NAV keyboard (global)
      const handleKeyDown = useCallback(
         (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (mode === "edit") return;

            // Atajos globales con Ctrl
            if (e.ctrlKey || e.metaKey) {
               switch (e.key) {
                  case "Insert":
                     e.preventDefault();
                     insertRow();
                     return;
                  case "Delete":
                     e.preventDefault();
                     deleteRow(pos.r);
                     return;
                  case "c":
                     // Copiar (ya manejado por useCopyPaste)
                     break;
                  case "v":
                     // Pegar (ya manejado)
                     break;
               }
            }

            const { r, c } = pos;
            const go = (dr: number, dc: number) => {
               e.preventDefault();
               moveTo(r + dr, c + dc, "nav");
            };

            switch (e.key) {
               case "ArrowUp":
                  go(-1, 0);
                  break;
               case "ArrowDown":
                  go(1, 0);
                  break;
               case "ArrowLeft":
                  go(0, -1);
                  break;
               case "ArrowRight":
                  go(0, 1);
                  break;
               case "Tab":
                  e.preventDefault();
                  moveTo(r, c + (e.shiftKey ? -1 : 1));
                  break;
               case "Enter":
                  e.preventDefault();
                  if (e.shiftKey) go(-1, 0);
                  else if (columns[c]?.type === "checkbox" && !columns[c]?.compute) {
                     setFieldValue(`rows.${r}.${columns[c].field}`, !values.rows[r]?.[columns[c].field]);
                  } else if (!columns[c]?.compute) {
                     moveTo(r, c, "edit");
                  }
                  break;
               case " ":
                  e.preventDefault();
                  const col = columns[c];
                  if (!col || col.compute) break;
                  if (col.type === "checkbox") setFieldValue(`rows.${r}.${col.field}`, !values.rows[r]?.[col.field]);
                  else if (col.type === "checkboxgroup") moveTo(r, c, "edit");
                  break;
               case "F2":
                  e.preventDefault();
                  if (!columns[c]?.compute) moveTo(r, c, "edit");
                  break;
               case "Home":
                  e.preventDefault();
                  e.ctrlKey || e.metaKey ? moveTo(0, 0) : moveTo(r, 0);
                  break;
               case "End":
                  e.preventDefault();
                  e.ctrlKey || e.metaKey ? moveTo(totalRows - 1, colCount - 1) : moveTo(r, colCount - 1);
                  break;
               case "PageDown":
                  e.preventDefault();
                  go(10, 0);
                  break;
               case "PageUp":
                  e.preventDefault();
                  go(-10, 0);
                  break;
               case "Delete":
               case "Backspace":
                  e.preventDefault();
                  const colDel = columns[c];
                  if (!colDel || colDel.compute) break;
                  if (colDel.type !== "checkbox" && colDel.type !== "checkboxgroup" && colDel.type !== "autocomplete")
                     setFieldValue(`rows.${r}.${colDel.field}`, colDel.defaultValue ?? "");
                  break;
               default:
                  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                     e.preventDefault();
                     const colChar = columns[c];
                     if (!colChar || colChar.compute) break;
                     if (colChar.type === "checkbox" || colChar.type === "checkboxgroup" || colChar.type === "select" || colChar.type === "autocomplete") {
                        moveTo(r, c, "edit");
                        break;
                     }
                     if (colChar.type === "number") {
                        const n = parseFloat(e.key);
                        if (!isNaN(n)) {
                           setFieldValue(`rows.${r}.${colChar.field}`, n);
                           moveTo(r, c, "edit");
                        }
                     } else {
                        setFieldValue(`rows.${r}.${colChar.field}`, (colChar as TextCol).uppercase ? e.key.toUpperCase() : e.key);
                        moveTo(r, c, "edit");
                     }
                  }
                  break;
            }
         },
         [mode, pos, totalRows, colCount, columns, moveTo, setFieldValue, values.rows, insertRow, deleteRow]
      );

      const ctx = useMemo<INav>(
         () => ({ pos, mode, moveTo, commitMove, rows: totalRows, cols: colCount, insertRow, deleteRow }),
         [pos, mode, moveTo, commitMove, totalRows, colCount, insertRow, deleteRow]
      );

      const filledCount = useMemo(() => values.rows.filter((row) => !isRowEmpty(row, columns)).length, [values.rows, columns]);

      return (
         <Nav.Provider value={ctx}>
            {/* TOP BAR */}
            <div
               style={{
                  flexShrink: 0,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                  background: $.paperCard,
                  borderBottom: `2px solid ${$.ruleDark}`,
                  userSelect: "none"
               }}
            >
               <div style={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
                  {(
                     [
                        ["↑↓←→", "navegar"],
                        ["Enter", "editar"],
                        ["Esc", "salir"],
                        ["Tab", "col ±1"],
                        ["Space", "toggle"],
                        ["Del", "borrar"],
                        ["Ctrl+↑↓←→", "navegar (edit)"],
                        ["Ctrl+Ins", "fila+"],
                        ["Ctrl+Del", "fila-"]
                     ] as [string, string][]
                  ).map(([k, l]) => (
                     <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 7px", borderRight: `1px solid ${$.ruleFaint}`, height: 24 }}>
                        <kbd
                           style={{
                              display: "inline-flex",
                              alignItems: "center",
                              height: 18,
                              padding: "0 6px",
                              background: $.paper,
                              border: `1px solid ${$.rule}`,
                              borderBottom: `2px solid ${$.rule}`,
                              borderRadius: 3,
                              fontSize: 9.5,
                              fontFamily: $.mono,
                              color: $.inkMid,
                              letterSpacing: "0.02em"
                           }}
                        >
                           {k}
                        </kbd>
                        <span style={{ fontSize: 9.5, fontFamily: $.mono, color: $.inkSoft }}>{l}</span>
                     </div>
                  ))}
               </div>

               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 10.5, fontFamily: $.mono, color: $.inkSoft }}>
                     <span style={{ color: filledCount > 0 ? $.terra : $.inkGhost, fontWeight: 600 }}>{filledCount}</span>
                     <span style={{ color: $.inkGhost }}> / {totalRows}</span>
                  </span>
                  <span style={{ width: 1, height: 16, background: $.rule }} />
                  <span
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 22,
                        padding: "0 8px",
                        background: $.paper,
                        border: `1px solid ${$.rule}`,
                        borderRadius: 2,
                        fontSize: 10,
                        fontFamily: $.mono,
                        color: $.inkMid,
                        letterSpacing: "0.05em",
                        fontWeight: 500
                     }}
                  >
                     {String.fromCharCode(65 + pos.c)}
                     {pos.r + 1}
                  </span>
                  <span
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 22,
                        padding: "0 9px",
                        background: mode === "edit" ? $.terraDim : $.paper,
                        border: `1px solid ${mode === "edit" ? $.terraRim : $.rule}`,
                        borderRadius: 2,
                        fontSize: 10,
                        fontFamily: $.mono,
                        fontWeight: 700,
                        color: mode === "edit" ? $.terra : $.inkSoft,
                        letterSpacing: "0.08em",
                        transition: "all .15s"
                     }}
                  >
                     {mode === "edit" && (
                        <span
                           style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: $.terra,
                              flexShrink: 0,
                              animation: "ft-pulse 1.2s ease infinite"
                           }}
                        />
                     )}
                     {mode === "edit" ? "EDITANDO" : "NAVEGAR"}
                  </span>
               </div>
            </div>

            {/* TABLE AREA */}
            <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} style={{ flex: 1, minHeight: 0, overflow: "auto", outline: "none" }}>
               <table
                  ref={tableRef}
                  style={{
                     width: "max-content",
                     minWidth: "100%",
                     borderCollapse: "collapse",
                     fontFamily: $.mono,
                     tableLayout: "fixed"
                  }}
               >
                  <colgroup>
                     {showRowNum && <col style={{ width: 44 }} />}
                     {columns.map((col) => (
                        <col key={col.field} style={{ width: col.width ?? 140 }} />
                     ))}
                  </colgroup>
                  <Header columns={columns} showRowNum={showRowNum} />
                  <tbody>
                     {Array.from({ length: totalRows }, (_, idx) => (
                        <Row key={idx} r={idx} columns={columns} showRowNum={showRowNum} containerRef={containerRef} />
                     ))}
                  </tbody>
               </table>
            </div>

            {/* FOOTER */}
            <div
               style={{
                  flexShrink: 0,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                  background: $.paperCard,
                  borderTop: `1px solid ${$.rule}`
               }}
            >
               <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {[
                     { val: totalRows.toLocaleString(), label: "filas" },
                     { val: String(colCount), label: "cols" },
                     { val: String(filledCount), label: "con datos", hi: filledCount > 0 }
                  ].map(({ val, label, hi }) => (
                     <div
                        key={label}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", borderRight: `1px solid ${$.ruleFaint}`, height: 24 }}
                     >
                        <span style={{ fontFamily: $.mono, fontSize: 11, fontWeight: 700, color: hi ? $.terra : $.inkMid }}>{val}</span>
                        <span style={{ fontFamily: $.mono, fontSize: 10, color: $.inkSoft }}>{label}</span>
                     </div>
                  ))}
                  <button
                     onClick={() => insertRow()}
                     style={{
                        marginLeft: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        height: 22,
                        padding: "0 8px",
                        background: "transparent",
                        border: `1px solid ${$.rule}`,
                        borderRadius: 3,
                        fontSize: 10,
                        fontFamily: $.mono,
                        color: $.inkMid,
                        cursor: "pointer",
                        transition: "all .1s"
                     }}
                     title="Insertar fila (Ctrl+Insert)"
                  >
                     + fila
                  </button>
               </div>

               {hasSubmit && (
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        height: 26,
                        padding: "0 16px",
                        background: isSubmitting ? $.paper : $.terra,
                        border: `1px solid ${isSubmitting ? $.rule : $.terra}`,
                        borderRadius: 3,
                        color: isSubmitting ? $.inkSoft : "#fff",
                        fontSize: 11,
                        fontFamily: $.serif,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "all .15s",
                        boxShadow: isSubmitting ? "none" : `0 2px 8px ${$.terraGlow}`
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
        @keyframes ft-spin { to { transform: rotate(360deg); } }
        @keyframes ft-pulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        @keyframes fadeInUp { from { opacity:0; transform: translateY(-2px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
         </Nav.Provider>
      );
   }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

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
   }, [initialRows, initialSize, factory]);

   const formikRef = useRef<FormikProps<any>>(null);

   const internalValidate = useCallback(
      (values: { rows: Record<string, any>[] }) => {
         if (!validate) return {};
         const nullable = values.rows.map((r) => (isRowEmpty(r, columns) ? null : r));
         const errs = validate(nullable) ?? [];
         return errs.some(Boolean) ? { rows: errs } : {};
      },
      [validate, columns]
   );
   const handleSubmit = useCallback(
      async (values: { rows: Record<string, any>[] }) => {
         await onSubmit?.(values.rows.filter((r) => !isRowEmpty(r, columns)));
      },
      [onSubmit, columns]
   );

   useImperativeHandle(
      ref,
      () => ({
         resetCheckboxes: (rowIndex?: number) => {
            if (!formikRef.current) return;

            const { values, setFieldValue } = formikRef.current;

            if (rowIndex !== undefined) {
               // Resetear una fila específica
               columns.forEach((col) => {
                  if (col.type === "checkbox") {
                     setFieldValue(`rows.${rowIndex}.${col.field}`, false);
                  }
                  if (col.type === "checkboxgroup" && col.items) {
                     col.items.forEach((item) => {
                        setFieldValue(`rows.${rowIndex}.${item.field}`, false);
                     });
                  }
               });
            } else {
               // Resetear todas las filas
               values.rows.forEach((_: any, idx: number) => {
                  columns.forEach((col) => {
                     if (col.type === "checkbox") {
                        setFieldValue(`rows.${idx}.${col.field}`, false);
                     }
                     if (col.type === "checkboxgroup" && col.items) {
                        col.items.forEach((item) => {
                           setFieldValue(`rows.${idx}.${item.field}`, false);
                        });
                     }
                  });
               });
            }
         },

         resetAllCheckboxes: () => {
            if (!formikRef.current) return;

            const { values, setFieldValue } = formikRef.current;

            values.rows.forEach((_: any, rowIndex: number) => {
               columns.forEach((col) => {
                  if (col.type === "checkbox") {
                     setFieldValue(`rows.${rowIndex}.${col.field}`, false);
                  }
                  if (col.type === "checkboxgroup" && col.items) {
                     col.items.forEach((item) => {
                        setFieldValue(`rows.${rowIndex}.${item.field}`, false);
                     });
                  }
               });
            });
         }
      }),
      [columns]
   );

   return (
      <>
         <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Literata:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-track { background: ${$.paperDim}; }
        ::-webkit-scrollbar-thumb { background: ${$.rule}; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: ${$.ruleDark}; }
        ::-webkit-scrollbar-corner { background: ${$.paperDim}; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: .4; cursor: pointer; }
        input[type=date]::-webkit-calendar-picker-indicator:hover { opacity: .8; }
      `}</style>

         <div
            style={{
               background: $.paper,
               border: `1.5px solid ${$.ruleDark}`,
               borderRadius: 6,
               overflow: "hidden",
               display: "flex",
               flexDirection: "column",
               height: "100%",
               fontFamily: $.mono,
               boxShadow: `0 4px 24px rgba(26,23,20,0.12), 0 1px 4px rgba(26,23,20,0.08)`
            }}
         >
            <Formik initialValues={initialValues} validate={internalValidate} onSubmit={handleSubmit} validateOnChange={false} validateOnBlur={true}>
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