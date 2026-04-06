/**
 * react-excel-engine.tsx  — v6 firmas centradas + toolbar normal
 */

import React, { createContext, useState, useCallback, CSSProperties, ReactNode, ReactElement } from "react";
import ExcelJS from "exceljs";

type Align = "left" | "center" | "right";
type VAlign = "top" | "middle" | "bottom";
type CellType = "text" | "number" | "currency" | "percent" | "date";
type BorderWeight = "thin" | "medium" | "thick";

export interface BorderSides {
   all?: string | BorderWeight;
   top?: string | BorderWeight;
   bottom?: string | BorderWeight;
   left?: string | BorderWeight;
   right?: string | BorderWeight;
   h?: string | BorderWeight;
   v?: string | BorderWeight;
}
export type BorderProp = BorderWeight | BorderSides;

export interface CellProps {
   children?: ReactNode;
   value?: string | number | null;
   image?: string;
   span?: number;
   rowSpan?: number;
   bold?: boolean;
   italic?: boolean;
   underline?: boolean;
   fontSize?: number;
   fontName?: string;
   color?: string;
   bg?: string | null;
   align?: Align;
   vAlign?: VAlign;
   wrap?: boolean;
   border?: BorderProp;
   type?: CellType;
   numFmt?: string;
   style?: CSSProperties;
}

export interface RowProps {
   children?: ReactNode;
   height?: number;
   bg?: string;
}
export interface SpacerProps {
   height?: number;
}
export interface SheetProps {
   children?: ReactNode;
   name?: string;
   colWidths: number[];
   freeze?: number;
}
export interface WorkbookProps {
   children?: ReactNode;
   fileName?: string;
   title?: string;
   subtitle?: string;
   zoom?: number;
}

const SheetCtx = createContext<{ _cols: number } | null>(null);

function toARGB(hex: string | null | undefined): string | null {
   if (!hex) return null;
   const c = hex.replace("#", "").toUpperCase();
   if (c.length === 3)
      return (
         "FF" +
         c
            .split("")
            .map((x) => x + x)
            .join("")
      );
   if (c.length === 6) return "FF" + c;
   return c;
}

function fmtPreview(v: string | number | null | undefined, type: CellType = "text"): string {
   if (v == null || v === "") return "";
   switch (type) {
      case "currency":
         return isNaN(+v) ? String(v) : "$" + (+v).toLocaleString("es-MX", { minimumFractionDigits: 2 });
      case "number":
         return isNaN(+v) ? String(v) : (+v).toLocaleString("es-MX");
      case "percent":
         return isNaN(+v) ? String(v) : (+v * 100).toFixed(1) + "%";
      case "date":
         try {
            return new Date(String(v)).toLocaleDateString("es-MX");
         } catch {
            return String(v);
         }
      default:
         return String(v);
   }
}

function numFmtFor(type: CellType, custom?: string | null): string | null {
   if (custom) return custom;
   if (type === "currency") return '"$"#,##0.00';
   if (type === "number") return "#,##0";
   if (type === "percent") return "0.00%";
   return null;
}

function bdrVal(b: string | BorderWeight | undefined): string {
   if (!b || b === "none") return "none";
   if (b === "thin") return "1px solid #aaa";
   if (b === "medium") return "2px solid #666";
   if (b === "thick") return "3px solid #333";
   if (b.startsWith("#")) return `1px solid ${b}`;
   return "1px solid #aaa";
}

function normBdrCSS(border?: BorderProp | null): CSSProperties {
   if (!border) return {};
   if (typeof border === "string") {
      const v = bdrVal(border);
      return { borderTop: v, borderBottom: v, borderLeft: v, borderRight: v };
   }
   const s = border as BorderSides;
   return {
      borderTop: bdrVal(s.top ?? s.v ?? s.all),
      borderBottom: bdrVal(s.bottom ?? s.v ?? s.all),
      borderLeft: bdrVal(s.left ?? s.h ?? s.all),
      borderRight: bdrVal(s.right ?? s.h ?? s.all)
   };
}

type EJSStyle =
   | "thin"
   | "medium"
   | "thick"
   | "hair"
   | "dashed"
   | "dotted"
   | "mediumDashed"
   | "dashDot"
   | "mediumDashDot"
   | "dashDotDot"
   | "mediumDashDotDot"
   | "slantDashDot";

function ejsSide(b?: string | BorderWeight): { style: EJSStyle; color: { argb: string } } | undefined {
   if (!b || b === "none") return undefined;
   let style: EJSStyle = "thin",
      color = "FF999999";
   if (b === "medium") {
      style = "medium";
      color = "FF555555";
   } else if (b === "thick") {
      style = "thick";
      color = "FF111111";
   } else if (b.startsWith("#")) color = toARGB(b) ?? "FF000000";
   return { style, color: { argb: color } };
}

function normBdrEJS(border?: BorderProp | null) {
   if (!border) return null;
   let t, b_, l, r;
   if (typeof border === "string") {
      t = b_ = l = r = ejsSide(border);
   } else {
      const s = border as BorderSides;
      t = ejsSide(s.top ?? s.v ?? s.all);
      b_ = ejsSide(s.bottom ?? s.v ?? s.all);
      l = ejsSide(s.left ?? s.h ?? s.all);
      r = ejsSide(s.right ?? s.h ?? s.all);
   }
   const out: Record<string, unknown> = {};
   if (t) out.top = t;
   if (b_) out.bottom = b_;
   if (l) out.left = l;
   if (r) out.right = r;
   return Object.keys(out).length ? out : null;
}

const normalizeExt = (ext: string): "png" | "jpeg" | "gif" => {
   const lower = ext.toLowerCase();
   if (lower === "jpg") return "jpeg";
   if (lower === "png" || lower === "jpeg" || lower === "gif") return lower as "png" | "jpeg" | "gif";
   return "jpeg";
};

async function srcToBase64(src: string): Promise<{ base64: string; ext: "png" | "jpeg" | "gif" } | null> {
   if (!src) return null;
   if (src.startsWith("data:image")) {
      const match = src.match(/^data:image\/(\w+);base64,(.+)$/s);
      if (!match) return null;
      return { base64: match[2].replace(/\s/g, ""), ext: normalizeExt(match[1]) };
   }
   try {
      const res = await fetch(src, { credentials: "include", cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const base64Full = await new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
      });
      const match = base64Full.match(/^data:image\/(\w+);base64,(.+)$/s);
      if (!match) return null;
      return { base64: match[2].replace(/\s/g, ""), ext: normalizeExt(match[1]) };
   } catch (err) {
      console.warn("react-excel-engine: no se pudo cargar imagen →", src, err);
      return null;
   }
}

interface CellData {
   value: string | number | null;
   image?: string;
   span: number;
   rowSpan: number;
   bold: boolean;
   italic: boolean;
   underline: boolean;
   fontSize: number;
   fontName: string;
   color: string;
   bg: string | null;
   align: Align;
   vAlign: VAlign;
   wrap: boolean;
   border: BorderProp | null;
   type: CellType;
   numFmt: string | null;
}
interface RowData {
   h: number;
   cells: CellData[];
}

function extractCellData(el: ReactElement<CellProps>): CellData {
   const p = el.props;
   const hasImage = p.image && p.image.trim() !== "";

   const rawVal = !hasImage ? (p.value !== undefined ? p.value : typeof p.children === "string" || typeof p.children === "number" ? p.children : null) : null;
   return {
      value: rawVal ?? null,
      image: p.image,
      span: p.span ?? 1,
      rowSpan: p.rowSpan ?? 1,
      bold: p.bold ?? false,
      italic: p.italic ?? false,
      underline: p.underline ?? false,
      fontSize: p.fontSize ?? 9,
      fontName: p.fontName ?? "Arial Narrow",
      color: p.color ?? "#000000",
      bg: p.bg ?? null,
      align: p.align ?? "center",
      vAlign: p.vAlign ?? "middle",
      wrap: p.wrap ?? true,
      border: p.border ?? null,
      type: p.type ?? "text",
      numFmt: p.numFmt ?? null
   };
}

function flattenChildren(children: ReactNode): ReactElement[] {
   const result: ReactElement[] = [];
   React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === React.Fragment) result.push(...flattenChildren((child.props as { children?: ReactNode }).children));
      else result.push(child);
   });
   return result;
}

const EMPTY_CELL_BASE: Omit<CellData, "span"> = {
   value: "",
   image: undefined,
   rowSpan: 1,
   bold: false,
   italic: false,
   underline: false,
   fontSize: 9,
   fontName: "Arial Narrow",
   color: "#000000",
   bg: null,
   align: "center",
   vAlign: "middle",
   wrap: false,
   border: null,
   type: "text",
   numFmt: null
};

function extractSheetRows(sheetChildren: ReactNode, numCols: number): RowData[] {
   const rows: RowData[] = [];
   for (const el of flattenChildren(sheetChildren)) {
      const type = el.type;
      if (type === Row) {
         const rp = el.props as RowProps;
         const cells: CellData[] = [];
         for (const child of flattenChildren(rp.children))
            if (child.type === Cell || child.type === Empty) cells.push(extractCellData(child as ReactElement<CellProps>));
         if (cells.length) rows.push({ h: rp.height ?? 22, cells });
      } else if (type === Spacer) {
         rows.push({ h: (el.props as SpacerProps).height ?? 8, cells: [{ ...EMPTY_CELL_BASE, span: numCols }] });
      } else if (type === TitleRow) {
         const p = el.props as TitleRowProps;
         rows.push({
            h: p.height ?? 30,
            cells: [
               {
                  ...EMPTY_CELL_BASE,
                  value: typeof p.children === "string" ? p.children : null,
                  span: p.span,
                  bold: true,
                  fontSize: p.fontSize ?? 12,
                  color: p.color ?? "#fff",
                  bg: p.bg ?? "#1e3a5f",
                  align: "center",
                  vAlign: "middle",
                  wrap: true
               }
            ]
         });
      } else if (type === MetaRow) {
         const p = el.props as MetaRowProps;
         rows.push({
            h: p.height ?? 20,
            cells: [
               {
                  ...EMPTY_CELL_BASE,
                  value: (p.label ? p.label + "  " : "") + (p.value ?? ""),
                  span: p.span,
                  fontSize: p.fontSize ?? 9,
                  align: "left",
                  wrap: true,
                  border: p.border ?? "thin"
               }
            ]
         });
      }
   }
   return rows;
}

// ═══════════════════════════════════════════════════════════════
//  CELL — imagen centrada perfectamente
// ═══════════════════════════════════════════════════════════════
export function Cell({
   children,
   value,
   image,
   span = 1,
   rowSpan = 1,
   bold = false,
   italic = false,
   underline = false,
   fontSize = 9,
   fontName = "Arial Narrow",
   color = "#000000",
   bg = null,
   align = "center",
   vAlign = "middle",
   wrap = true,
   border,
   type = "text",
   style: extra = {}
}: CellProps) {
   const raw = value !== undefined ? value : children;
   const shown = typeof raw === "string" || typeof raw === "number" || raw == null ? fmtPreview(raw as string | number | null, type) : raw;

   // ✅ Wrapper flex para centrar la imagen horizontal y verticalmente
   const content = image ? (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "3px 6px", boxSizing: "border-box" }}>
         <img src={image} alt="" style={{ maxWidth: "100%", maxHeight: "28px", objectFit: "contain", display: "block" }} />
      </div>
   ) : (
      (shown ?? "")
   );

   return (
      <td
         colSpan={span}
         rowSpan={rowSpan}
         style={{
            padding: image ? "0" : "2px 5px",
            boxSizing: "border-box",
            overflow: "hidden",
            verticalAlign: image ? "middle" : vAlign,
            textAlign: image ? "center" : align,
            fontSize,
            lineHeight: 1.3,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
            fontFamily: `'${fontName}', Arial, sans-serif`,
            color,
            background: bg ?? "transparent",
            whiteSpace: wrap ? "pre-wrap" : "nowrap",
            ...normBdrCSS(border),
            ...extra
         }}
      >
         {content}
      </td>
   );
}

export function Empty(props: Omit<CellProps, "value" | "children">) {
   return <Cell {...props} value="" />;
}
export function Row({ children, height = 22, bg }: RowProps) {
   return <tr style={{ height, background: bg ?? "transparent" }}>{children}</tr>;
}
export function Spacer({ height = 8 }: SpacerProps) {
   return (
      <tr style={{ height }}>
         <td />
      </tr>
   );
}

export function Sheet({ colWidths, freeze, children }: SheetProps) {
   return (
      <SheetCtx.Provider value={{ _cols: colWidths.length }}>
         <table
            style={{
               borderCollapse: "collapse",
               tableLayout: "fixed",
               fontFamily: "'Arial Narrow', Arial, sans-serif",
               fontSize: 9,
               minWidth: colWidths.reduce((s, w) => s + w, 0)
            }}
         >
            <colgroup>
               {colWidths.map((w, i) => (
                  <col key={i} style={{ width: w }} />
               ))}
            </colgroup>
            <tbody>{children}</tbody>
         </table>
      </SheetCtx.Provider>
   );
}

// ═══════════════════════════════════════════════════════════════
//  WORKBOOK — toolbar NO sticky/fixed
// ═══════════════════════════════════════════════════════════════
export function Workbook({ children, fileName = "archivo.xlsx", title = "", subtitle = "", zoom: initZoom = 90 }: WorkbookProps) {
   const [zoom, setZoom] = useState(initZoom);
   const [loading, setLoading] = useState(false);

   const exportXlsx = useCallback(async () => {
      setLoading(true);
      try {
         const wb = new ExcelJS.Workbook();
         for (const el of flattenChildren(children)) {
            if (el.type !== Sheet) continue;
            const sp = el.props as SheetProps;
            const ws = wb.addWorksheet(sp.name ?? "Hoja1", { pageSetup: { paperSize: 9, orientation: "landscape" } });
            ws.columns = sp.colWidths.map((px) => ({ width: +(px * 0.133).toFixed(1) }));
            if (sp.freeze) ws.views = [{ state: "frozen", ySplit: sp.freeze }];

            const rows = extractSheetRows(sp.children, sp.colWidths.length);
            const occ: Record<string, true> = {};
            let exR = 1;
const imagesToAdd: { row: number; col: number; span: number; src: string; heightPx: number }[] = [];
            for (const row of rows) {
               ws.getRow(exR).height = row.h;
               let exC = 1;
               for (const cd of row.cells) {
                  while (occ[`${exR}_${exC}`]) exC++;
                  const sp2 = cd.span ?? 1,
                     rs = cd.rowSpan ?? 1;
                  if (sp2 > 1 || rs > 1) ws.mergeCells(exR, exC, exR + rs - 1, exC + sp2 - 1);
                  for (let dr = 0; dr < rs; dr++) for (let dc = 0; dc < sp2; dc++) if (dr || dc) occ[`${exR + dr}_${exC + dc}`] = true;
                  const cell = ws.getCell(exR, exC);
                  const v = cd.value;
                  const isNum = cd.type === "number" || cd.type === "currency" || cd.type === "percent";
                  cell.value = isNum && v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : (v ?? "");
                  cell.font = {
                     bold: cd.bold,
                     italic: cd.italic,
                     underline: cd.underline ? "single" : undefined,
                     size: cd.fontSize,
                     name: cd.fontName,
                     color: { argb: toARGB(cd.color) ?? "FF000000" }
                  };
                  const bgARGB = toARGB(cd.bg);
                  if (bgARGB) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgARGB } };
                  cell.alignment = {
                     horizontal: cd.align as ExcelJS.Alignment["horizontal"],
                     vertical: cd.vAlign as ExcelJS.Alignment["vertical"],
                     wrapText: cd.wrap
                  };
                  const bdr = normBdrEJS(cd.border);
                  if (bdr) cell.border = bdr as unknown as ExcelJS.Borders;
                  const fmt = numFmtFor(cd.type, cd.numFmt);
                  if (fmt) cell.numFmt = fmt;
if (cd.image) {
   imagesToAdd.push({ row: exR, col: exC, span: sp2, src: cd.image, heightPx: row.h });
}
                  exC += sp2;
               }
               exR++;
            }

            // Auto-fit
            for (let r = 1; r < exR; r++) {
               const wsRow = ws.getRow(r);
               let maxLines = 1;
               wsRow.eachCell({ includeEmpty: false }, (cell) => {
                  if (!cell.alignment?.wrapText) return;
                  const txt = String(cell.value ?? "");
                  if (!txt) return;
                  const colW = ws.getColumn(cell.col).width ?? 10;
                  const cpl = Math.max(1, Math.floor((colW * 7.5) / ((cell.font?.size ?? 9) * 0.58)));
                  let lines = 0;
                  for (const seg of txt.split(/\r?\n/)) lines += Math.max(1, Math.ceil((seg.length || 1) / cpl));
                  if (lines > maxLines) maxLines = lines;
               });
               const needed = maxLines * 11 + 6;
               if (needed > (wsRow.height ?? 15)) wsRow.height = needed;
            }

            // Imágenes
            // Dentro de exportXlsx, después de auto-fit de filas
            // Reemplaza el bloque ws.addImage dentro del for (const img of imagesToAdd)
    for (const img of imagesToAdd) {
       const result = await srcToBase64(img.src);
       if (!result) continue;
       try {
          const imageId = wb.addImage({ base64: result.base64, extension: result.ext });

          const COL_EMU_PER_CHAR = 914400 / 15; // 45720
          const ROW_EMU_PER_PT = 180000 / 15;

          let totalColEMU = 0;
          for (let c = 0; c < img.span; c++) {
             const chars = ws.getColumn(img.col + c).width ?? 8.43;
             totalColEMU += Math.round(chars * COL_EMU_PER_CHAR);
          }
          const totalRowEMU = Math.round((ws.getRow(img.row).height ?? 15) * ROW_EMU_PER_PT);

          // 80% de la celda, centrado = 10% de margen cada lado
          const imgWemu = Math.round(totalColEMU * 0.8);
          const imgHemu = Math.round(totalRowEMU * 0.8);

          const offXemu = Math.round(totalColEMU * 0.1);
          const offYemu = Math.round(totalRowEMU * 0.1);

          ws.addImage(imageId, {
             tl: {
                nativeCol: img.col - 1,
                nativeColOff: offXemu,
                nativeRow: img.row - 1,
                nativeRowOff: offYemu
             } as never,
             ext: {
                width: Math.round(imgWemu / 9525),
                height: Math.round(imgHemu / 9525)
             }
          });
       } catch (e) {
          console.warn("react-excel-engine: error imagen", e);
       }
    }
         }
         wb.worksheets.forEach((ws) => {
            ws.protect("", {
               selectLockedCells: true,
               selectUnlockedCells: false
            });
         });
         const buf = await wb.xlsx.writeBuffer();
         const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = fileName;
         a.click();
         URL.revokeObjectURL(url);
      } catch (e: unknown) {
         alert("Error al generar: " + (e instanceof Error ? e.message : String(e)));
      } finally {
         setLoading(false);
      }
   }, [children, fileName]);

   const zBtn: CSSProperties = {
      width: 26,
      height: 26,
      border: "1px solid #e0e3e8",
      background: "#fafafa",
      borderRadius: 5,
      cursor: "pointer",
      fontSize: 15,
      color: "#555",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
   };

   return (
      // ✅ Sin minHeight ni position fixed/sticky — fluye normal con el modal
      <div style={{ display: "flex", flexDirection: "column", background: "#f0f2f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
         {/* ✅ Toolbar — position estático, se desplaza con el scroll */}
         <div
            style={{
               background: "#fff",
               borderBottom: "1px solid #e2e5ea",
               boxShadow: "0 2px 8px rgba(0,0,0,.06)",
               padding: "0 24px",
               height: 56,
               display: "flex",
               alignItems: "center",
               gap: 14,
               flexShrink: 0
            }}
         >
            <div
               style={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: 6,
                  background: "linear-gradient(135deg,#1d6f42 0%,#21a366 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
               }}
            >
               <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255,255,255,.2)" stroke="white" strokeWidth="1.5" />
                  <path d="M14 2v6h6" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <path d="M9 13l2 3 2-3M9 16h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
            {(title || subtitle) && (
               <div style={{ lineHeight: 1.35 }}>
                  {title && <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{title}</div>}
                  {subtitle && <div style={{ fontSize: 10, color: "#999", marginTop: 1 }}>{subtitle}</div>}
               </div>
            )}
            {(title || subtitle) && <div style={{ width: 1, height: 26, background: "#e5e7eb", flexShrink: 0 }} />}
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#f0faf5",
                  border: "1px solid #bbf0d0",
                  borderRadius: 99,
                  padding: "2px 10px",
                  fontSize: 11,
                  color: "#1a7a45",
                  fontWeight: 600,
                  flexShrink: 0
               }}
            >
               <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
               Listo
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
               <span style={{ fontSize: 11, color: "#999", marginRight: 2 }}>Zoom</span>
               <button onClick={() => setZoom((z) => Math.max(40, z - 15))} style={zBtn}>
                  −
               </button>
               <div
                  style={{
                     minWidth: 46,
                     textAlign: "center",
                     fontSize: 12,
                     fontWeight: 600,
                     color: "#333",
                     background: "#f5f6f8",
                     border: "1px solid #e0e3e8",
                     borderRadius: 5,
                     padding: "4px",
                     userSelect: "none"
                  }}
               >
                  {zoom}%
               </div>
               <button onClick={() => setZoom((z) => Math.min(200, z + 15))} style={zBtn}>
                  +
               </button>
            </div>
            <div style={{ width: 1, height: 26, background: "#e5e7eb", flexShrink: 0 }} />
            <button
               onClick={exportXlsx}
               disabled={loading}
               style={{
                  background: loading ? "#f0f0f0" : "linear-gradient(135deg,#1d6f42,#27ae60)",
                  color: loading ? "#aaa" : "#fff",
                  border: "none",
                  borderRadius: 7,
                  height: 36,
                  padding: "0 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  flexShrink: 0,
                  boxShadow: loading ? "none" : "0 2px 8px rgba(29,111,66,.3)"
               }}
            >
               {loading ? (
                  <>
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "xls-spin 1s linear infinite" }}>
                        <circle cx="12" cy="12" r="9" stroke="#ccc" strokeWidth="3" />
                        <path d="M12 3a9 9 0 0 1 9 9" stroke="#999" strokeWidth="3" strokeLinecap="round" />
                     </svg>
                     Generando...
                  </>
               ) : (
                  <>
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3v13M6 11l6 6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 19h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                     Descargar .xlsx
                  </>
               )}
            </button>
         </div>

         {/* Sub-barra */}
         <div
            style={{
               padding: "7px 26px",
               display: "flex",
               alignItems: "center",
               gap: 6,
               fontSize: 11,
               color: "#aaa",
               borderBottom: "1px solid #e8eaed",
               background: "#f8f9fb",
               flexShrink: 0
            }}
         >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
               <rect x="3" y="3" width="18" height="18" rx="2" stroke="#bbb" strokeWidth="2" />
               <path d="M3 9h18M9 9v12" stroke="#bbb" strokeWidth="1.8" />
            </svg>
            Vista previa — el archivo descargado puede variar ligeramente en tipografía
         </div>

         {/* Preview */}
         <div style={{ overflow: "auto", padding: "28px 32px 48px", display: "flex", alignItems: "flex-start", justifyContent: "flex-start" }}>
            <div
               style={{
                  display: "inline-block",
                  transformOrigin: "top left",
                  transform: `scale(${zoom / 100})`,
                  background: "#fff",
                  borderRadius: 3,
                  border: "1px solid #dde1e7",
                  boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.08)",
                  overflow: "hidden"
               }}
            >
               {children}
            </div>
         </div>

         <style>{"@keyframes xls-spin { to { transform: rotate(360deg); } }"}</style>
      </div>
   );
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS DE ALTO NIVEL
// ═══════════════════════════════════════════════════════════════
export interface TitleRowProps {
   children?: ReactNode;
   span: number;
   height?: number;
   bg?: string;
   color?: string;
   fontSize?: number;
}
export function TitleRow({ children, span, height = 30, bg = "#1e3a5f", color = "#fff", fontSize = 12 }: TitleRowProps) {
   return (
      <Row height={height}>
         <Cell span={span} bold bg={bg} color={color} fontSize={fontSize} align="center">
            {children}
         </Cell>
      </Row>
   );
}

export interface MetaRowProps {
   label?: string;
   value?: string;
   span: number;
   height?: number;
   border?: BorderProp;
   fontSize?: number;
}
export function MetaRow({ label, value = "", span, height = 20, border = "thin", fontSize = 9 }: MetaRowProps) {
   return (
      <Row height={height}>
         <Cell span={span} align="left" border={border} fontSize={fontSize}>
            {label ? (
               <>
                  <b>{label}</b>
                  {"  " + value}
               </>
            ) : (
               value
            )}
         </Cell>
      </Row>
   );
}

export interface HeaderRowProps {
   children?: ReactNode;
   height?: number;
   bg?: string;
   border?: BorderProp;
}
export function HeaderRow({ children, height = 28, bg = "#e9ecef", border = "thin" }: HeaderRowProps) {
   return <Row height={height}>{injectToCell(children, { bg, border, bold: true })}</Row>;
}

export interface DataRowProps {
   children?: ReactNode;
   height?: number;
   border?: BorderProp;
}
export function DataRow({ children, height = 24, border = "thin" }: DataRowProps) {
   return <Row height={height}>{injectToCell(children, { border })}</Row>;
}

function injectToCell(children: ReactNode, defaults: Partial<CellProps>): ReactNode {
   if (!children) return children;
   const inject = (c: React.ReactElement) => {
      if (c.type !== Cell && c.type !== Empty) return c;
      const overrides: Partial<CellProps> = {};
      for (const key of Object.keys(defaults) as Array<keyof CellProps>) if (c.props[key] === undefined) (overrides as Record<string, unknown>)[key] = defaults[key];
      return React.cloneElement(c, overrides);
   };
   if (Array.isArray(children)) return children.map((c) => (React.isValidElement(c) ? inject(c) : c));
   return React.isValidElement(children) ? inject(children) : children;
}
