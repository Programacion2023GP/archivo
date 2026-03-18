/**
 * SheetBuilder — Motor declarativo tipado
 * Vista previa React + exportación real a .xlsx con SheetJS
 *
 * npm install xlsx
 */

import React, { createContext, useContext, useMemo } from "react";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────
// TIPOS INTERNOS DE ESTILO XLSX
// (SheetJS no los exporta en su namespace público)
// ─────────────────────────────────────────────────────────────

type XlsxBorderStyle =
   | "thin"
   | "medium"
   | "thick"
   | "dashed"
   | "dotted"
   | "hair"
   | "mediumDashed"
   | "dashDot"
   | "mediumDashDot"
   | "dashDotDot"
   | "mediumDashDotDot"
   | "slantDashDot";

interface XlsxBorderSide {
   style?: XlsxBorderStyle;
   color?: { rgb: string };
}

interface XlsxBorders {
   top?: XlsxBorderSide;
   bottom?: XlsxBorderSide;
   left?: XlsxBorderSide;
   right?: XlsxBorderSide;
   diagonal?: XlsxBorderSide;
}

interface XlsxFont {
   bold?: boolean;
   italic?: boolean;
   underline?: boolean;
   sz?: number;
   color?: { rgb: string };
   name?: string;
}

interface XlsxFill {
   patternType?: "solid" | "none";
   fgColor?: { rgb: string };
   bgColor?: { rgb: string };
}

interface XlsxAlignment {
   horizontal?: "left" | "center" | "right" | "fill" | "justify" | "centerContinuous" | "distributed";
   vertical?: "top" | "middle" | "bottom" | "justify" | "distributed";
   wrapText?: boolean;
   shrinkToFit?: boolean;
   indent?: number;
   readingOrder?: number;
   textRotation?: number;
}

interface XlsxCellStyle {
   font?: XlsxFont;
   fill?: XlsxFill;
   alignment?: XlsxAlignment;
   border?: XlsxBorders;
   numFmt?: string;
}

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type CellType = "text" | "number" | "currency" | "date";
export type Align = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";
export type BorderShorthand = boolean | "none" | "thin" | "medium" | "thick" | "dashed" | string;

export interface BorderObject {
   all?: BorderShorthand;
   top?: BorderShorthand;
   bottom?: BorderShorthand;
   left?: BorderShorthand;
   right?: BorderShorthand;
   /** h = left + right */
   h?: BorderShorthand;
   /** v = top + bottom */
   v?: BorderShorthand;
}

export type BorderProp = BorderShorthand | BorderObject;

export interface CellProps {
   children?: React.ReactNode;
   value?: string | number | boolean | null;
   /** colspan */
   span?: number;
   rowSpan?: number;
   width?: number;
   height?: number;
   type?: CellType;
   bold?: boolean;
   italic?: boolean;
   underline?: boolean;
   fontSize?: number;
   color?: string;
   bg?: string;
   align?: Align;
   vAlign?: VAlign;
   wrap?: boolean;
   border?: BorderProp;
   style?: React.CSSProperties;
   className?: string;
   onClick?: () => void;
   editable?: boolean;
   /** Inyectado internamente por Row — no usar directamente */
   _rowHeight?: number;
}

export interface RowProps {
   children: React.ReactNode;
   height?: number;
   bg?: string;
   style?: React.CSSProperties;
}

export interface SpacerProps {
   height?: number;
}

export interface SheetProps {
   children: React.ReactNode;
   colWidths?: number[];
   fontSize?: number;
   cellBg?: string;
   cellColor?: string;
   editable?: boolean;
   showHeaders?: boolean;
   showRowNums?: boolean;
   zoom?: number;
   style?: React.CSSProperties;
   tableStyle?: React.CSSProperties;
}

export interface TitleRowProps {
   children: React.ReactNode;
   height?: number;
   totalCols?: number;
   bg?: string;
   color?: string;
   fontSize?: number;
   bold?: boolean;
   border?: BorderProp;
   style?: React.CSSProperties;
}

export interface MetaRowProps {
   label: string;
   value?: string;
   totalCols?: number;
   height?: number;
   border?: BorderProp;
   fontSize?: number;
}

export interface DataRowProps {
   children: React.ReactNode;
   height?: number;
   border?: BorderProp;
}

export interface SignatureSection {
   label: string;
   note?: string;
   cols: number;
}

export interface SignatureRowProps {
   sections?: SignatureSection[];
   gapCols?: number;
   totalCols?: number;
   height?: number;
   signatureHeight?: number;
   borderColor?: string;
}

// ─────────────────────────────────────────────────────────────
// CONTEXTO INTERNO
// ─────────────────────────────────────────────────────────────

interface SheetContextValue {
   totalCols: number;
   colWidths: number[];
   fontSize: number;
   cellBg: string;
   cellColor: string;
   editable: boolean;
}

const SheetCtx = createContext<SheetContextValue>({
   totalCols: 1,
   colWidths: [],
   fontSize: 9,
   cellBg: "#fff",
   cellColor: "#000",
   editable: false
});

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────

export function colLetter(idx: number): string {
   let r = "",
      n = idx + 1;
   while (n > 0) {
      r = String.fromCharCode(64 + (((n - 1) % 26) + 1)) + r;
      n = Math.floor((n - 1) / 26);
   }
   return r;
}

function formatValue(value: unknown, type: CellType): string {
   if (value == null || value === "") return "";
   switch (type) {
      case "currency": {
         const n = parseFloat(String(value));
         return isNaN(n) ? String(value) : "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2 });
      }
      case "number": {
         const n = parseFloat(String(value));
         return isNaN(n) ? String(value) : n.toLocaleString("es-MX");
      }
      case "date": {
         try {
            return new Date(String(value)).toLocaleDateString("es-MX");
         } catch {
            return String(value);
         }
      }
      default:
         return String(value);
   }
}

function borderCSS(b?: BorderShorthand): string {
   if (!b || b === "none") return "none";
   if (b === true || b === "thin") return "1px solid #b0b0b0";
   if (b === "medium") return "2px solid #666";
   if (b === "thick") return "3px solid #333";
   if (b === "dashed") return "1px dashed #b0b0b0";
   if (typeof b === "string" && b.includes("px")) return b;
   return "1px solid #b0b0b0";
}

function normalizeBorder(border?: BorderProp): React.CSSProperties {
   if (!border) return {};
   if (typeof border === "string" || typeof border === "boolean") {
      const v = borderCSS(border);
      return { borderTop: v, borderBottom: v, borderLeft: v, borderRight: v };
   }
   const obj = border as BorderObject;
   return {
      borderTop: borderCSS(obj.top ?? obj.v ?? obj.all),
      borderBottom: borderCSS(obj.bottom ?? obj.v ?? obj.all),
      borderLeft: borderCSS(obj.left ?? obj.h ?? obj.all),
      borderRight: borderCSS(obj.right ?? obj.h ?? obj.all)
   };
}

// ─────────────────────────────────────────────────────────────
// CELL
// ─────────────────────────────────────────────────────────────

export function Cell({
   children,
   value,
   span = 1,
   rowSpan = 1,
   width,
   height,
   type = "text",
   bold,
   italic,
   underline,
   fontSize,
   color,
   bg,
   align = "center",
   vAlign = "middle",
   wrap = true,
   border,
   style: extraStyle = {},
   className,
   onClick,
   editable,
   _rowHeight
}: CellProps) {
   const ctx = useContext(SheetCtx);
   const content = value !== undefined ? value : children;
   const displayed = typeof content === "string" || typeof content === "number" || content == null ? formatValue(content, type) : content;
   const isEditable = editable !== undefined ? editable : ctx.editable;

   const cellStyle: React.CSSProperties = {
      padding: "2px 4px",
      verticalAlign: vAlign,
      textAlign: align,
      fontSize: fontSize ?? ctx.fontSize ?? 9,
      fontWeight: bold ? 700 : 400,
      fontStyle: italic ? "italic" : "normal",
      textDecoration: underline ? "underline" : "none",
      color: color ?? ctx.cellColor ?? "#000",
      background: bg ?? ctx.cellBg ?? "#fff",
      whiteSpace: wrap ? "pre-wrap" : "nowrap",
      overflow: "hidden",
      height: height ?? _rowHeight,
      width: width,
      boxSizing: "border-box",
      lineHeight: 1.25,
      cursor: isEditable ? "text" : onClick ? "pointer" : "default",
      ...normalizeBorder(border),
      ...extraStyle
   };

   return (
      <td
         colSpan={span}
         rowSpan={rowSpan}
         style={cellStyle}
         className={className}
         onClick={onClick}
         contentEditable={isEditable}
         suppressContentEditableWarning={isEditable}
      >
         {displayed}
      </td>
   );
}

// ─────────────────────────────────────────────────────────────
// EMPTY CELL
// ─────────────────────────────────────────────────────────────

export function EmptyCell(props: Omit<CellProps, "children" | "value">) {
   return <Cell {...props}>{""}</Cell>;
}

// ─────────────────────────────────────────────────────────────
// ROW
// ─────────────────────────────────────────────────────────────

export function Row({ children, height = 24, bg, style: extraStyle = {} }: RowProps) {
   const trStyle: React.CSSProperties = { height, background: bg, ...extraStyle };

   const kids = React.Children.map(children, (child) => {
      if (!child) return null;
      const el = child as React.ReactElement<CellProps>;
      if (el.type === Cell || el.type === EmptyCell) {
         return React.cloneElement(el, { _rowHeight: height });
      }
      return child;
   });

   return <tr style={trStyle}>{kids}</tr>;
}

// ─────────────────────────────────────────────────────────────
// SPACER
// ─────────────────────────────────────────────────────────────

export function Spacer({ height = 8 }: SpacerProps) {
   const ctx = useContext(SheetCtx);
   return (
      <tr style={{ height }}>
         <td colSpan={ctx.totalCols || 1} />
      </tr>
   );
}

// ─────────────────────────────────────────────────────────────
// SHEET
// ─────────────────────────────────────────────────────────────

const headerThStyle: React.CSSProperties = {
   background: "#f1f5f9",
   color: "#64748b",
   fontSize: 10,
   fontWeight: 600,
   textAlign: "center",
   padding: "2px 4px",
   borderBottom: "2px solid #cbd5e1",
   borderRight: "1px solid #e2e8f0"
};

const rowNumStyle: React.CSSProperties = {
   background: "#f8fafc",
   color: "#94a3b8",
   fontSize: 9,
   textAlign: "center",
   borderRight: "2px solid #cbd5e1",
   userSelect: "none"
};

export function Sheet({
   children,
   colWidths = [],
   fontSize = 9,
   cellBg = "#fff",
   cellColor = "#000",
   editable = false,
   showHeaders = false,
   showRowNums = false,
   zoom = 100,
   style: extraStyle = {},
   tableStyle: extraTableStyle = {}
}: SheetProps) {
   const totalCols = colWidths.length;

   const ctx = useMemo<SheetContextValue>(
      () => ({ totalCols, colWidths, fontSize, cellBg, cellColor, editable }),
      [totalCols, colWidths, fontSize, cellBg, cellColor, editable]
   );

   const containerStyle: React.CSSProperties = {
      overflow: "auto",
      transformOrigin: "top left",
      transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
      ...extraStyle
   };

   const tableStyle: React.CSSProperties = {
      borderCollapse: "collapse",
      tableLayout: "fixed",
      fontFamily: "'Arial Narrow', Arial, sans-serif",
      fontSize,
      ...extraTableStyle
   };

   return (
      <SheetCtx.Provider value={ctx}>
         <div style={containerStyle}>
            <table style={tableStyle}>
               <colgroup>
                  {showRowNums && <col style={{ width: 32 }} />}
                  {colWidths.map((w, i) => (
                     <col key={i} style={{ width: w }} />
                  ))}
               </colgroup>
               {showHeaders && (
                  <thead>
                     <tr style={{ height: 20 }}>
                        {showRowNums && <th style={headerThStyle} />}
                        {colWidths.map((_, i) => (
                           <th key={i} style={headerThStyle}>
                              {colLetter(i)}
                           </th>
                        ))}
                     </tr>
                  </thead>
               )}
               <tbody>
                  {showRowNums
                     ? React.Children.map(children, (child, rowIdx) => {
                          if (!child) return null;
                          const el = child as React.ReactElement<RowProps>;
                          if (el.type !== Row) return child;
                          const existingChildren = Array.isArray(el.props.children) ? el.props.children : [el.props.children];
                          return React.cloneElement(el, {
                             children: [
                                <td key="rn" style={rowNumStyle}>
                                   {rowIdx + 1}
                                </td>,
                                ...existingChildren
                             ]
                          });
                       })
                     : children}
               </tbody>
            </table>
         </div>
      </SheetCtx.Provider>
   );
}

// ─────────────────────────────────────────────────────────────
// HELPERS DE ALTO NIVEL
// ─────────────────────────────────────────────────────────────

export function TitleRow({ children, height = 32, totalCols = 1, bg = "#1e3a5f", color = "#fff", fontSize = 12, bold = true, border, style }: TitleRowProps) {
   return (
      <Row height={height}>
         <Cell span={totalCols} bg={bg} color={color} fontSize={fontSize} bold={bold} border={border} style={style}>
            {children}
         </Cell>
      </Row>
   );
}

export function MetaRow({ label, value = "", totalCols = 1, height = 22, border = "thin", fontSize = 9 }: MetaRowProps) {
   return (
      <Row height={height}>
         <Cell span={totalCols} align="left" border={border} fontSize={fontSize}>
            <b>{label}</b>
            {value ? `  ${value}` : ""}
         </Cell>
      </Row>
   );
}

export function DataRow({ children, height = 26, border = "thin" }: DataRowProps) {
   const kids = React.Children.map(children, (child) => {
      if (!child) return child;
      const el = child as React.ReactElement<CellProps>;
      if (el.type !== Cell) return child;
      if (el.props.border) return child;
      return React.cloneElement(el, { border, _rowHeight: height });
   });
   return <tr style={{ height }}>{kids}</tr>;
}

export function SignatureRow({ sections = [], gapCols = 1, totalCols, height = 22, signatureHeight = 40, borderColor = "#C41E3A" }: SignatureRowProps) {
   const border = `2px solid ${borderColor}`;
   const bObj: BorderObject = { all: border };
   const usedCols = sections.reduce((s, sec) => s + sec.cols, 0) + gapCols * (sections.length - 1);
   const remaining = totalCols ? totalCols - usedCols : 0;
   const cellBase = { border: bObj, align: "center" as Align, fontSize: 8 };

   return (
      <>
         <Row height={height}>
            {sections.map((sec, i) => (
               <React.Fragment key={i}>
                  <Cell span={sec.cols} bold {...cellBase}>
                     {sec.label}
                  </Cell>
                  {i < sections.length - 1 && <td colSpan={gapCols} />}
               </React.Fragment>
            ))}
            {remaining > 0 && <td colSpan={remaining} />}
         </Row>
         <Row height={signatureHeight}>
            {sections.map((sec, i) => (
               <React.Fragment key={i}>
                  <Cell span={sec.cols} style={{ borderLeft: border, borderRight: border }} />
                  {i < sections.length - 1 && <td colSpan={gapCols} />}
               </React.Fragment>
            ))}
            {remaining > 0 && <td colSpan={remaining} />}
         </Row>
         <Row height={height}>
            {sections.map((sec, i) => (
               <React.Fragment key={i}>
                  <Cell span={sec.cols} {...cellBase}>
                     {sec.note || "NOMBRE Y FIRMA"}
                  </Cell>
                  {i < sections.length - 1 && <td colSpan={gapCols} />}
               </React.Fragment>
            ))}
            {remaining > 0 && <td colSpan={remaining} />}
         </Row>
      </>
   );
}

// ─────────────────────────────────────────────────────────────
// EXPORTACIÓN A XLSX
// ─────────────────────────────────────────────────────────────

/**
 * Configuración de una celda para el xlsx
 */
export interface XlsxCellDef {
   /** Valor a escribir */
   value: string | number | boolean | null;
   /** Número de columnas que abarca (colspan) */
   span?: number;
   /** Número de filas que abarca (rowspan) */
   rowSpan?: number;
   bold?: boolean;
   italic?: boolean;
   fontSize?: number;
   color?: string;
   bg?: string;
   align?: Align;
   vAlign?: VAlign;
   wrap?: boolean;
   border?: BorderProp;
}

export interface XlsxRowDef {
   cells: XlsxCellDef[];
   height?: number;
}

export interface ExportXlsxOptions {
   fileName?: string;
   sheetName?: string;
   colWidths?: number[];
   /** Multiplicador para convertir px a unidades Excel (default: 0.14) */
   pxToCharWidth?: number;
}

/** Convierte un color hex #RRGGBB → RRGGBB (sin #) */
function hexToArgb(hex?: string): string | undefined {
   if (!hex) return undefined;
   const clean = hex.replace("#", "");
   if (clean.length === 3) {
      return (
         "FF" +
         clean
            .split("")
            .map((c) => c + c)
            .join("")
      );
   }
   if (clean.length === 6) return "FF" + clean.toUpperCase();
   return undefined;
}

function xlsxBorderStyle(b?: BorderShorthand): XlsxBorderStyle | undefined {
   if (!b || b === "none" || b === false as boolean) return undefined;
   if (b === true || b === "thin") return "thin";
   if (b === "medium") return "medium";
   if (b === "thick") return "thick";
   if (b === "dashed") return "dashed";
   return "thin";
}

function buildXlsxBorder(border?: BorderProp): Partial<XlsxBorders> | undefined {
   if (!border) return undefined;

   let top: BorderShorthand | undefined;
   let bottom: BorderShorthand | undefined;
   let left: BorderShorthand | undefined;
   let right: BorderShorthand | undefined;

   if (typeof border === "string" || typeof border === "boolean") {
      top = bottom = left = right = border;
   } else {
      const obj = border as BorderObject;
      top = obj.top ?? obj.v ?? obj.all;
      bottom = obj.bottom ?? obj.v ?? obj.all;
      left = obj.left ?? obj.h ?? obj.all;
      right = obj.right ?? obj.h ?? obj.all;
   }

   const result: Partial<XlsxBorders> = {};
   const ts = xlsxBorderStyle(top);
   const bs = xlsxBorderStyle(bottom);
   const ls = xlsxBorderStyle(left);
   const rs = xlsxBorderStyle(right);
   if (ts) result.top = { style: ts };
   if (bs) result.bottom = { style: bs };
   if (ls) result.left = { style: ls };
   if (rs) result.right = { style: rs };
   return Object.keys(result).length ? result : undefined;
}

/**
 * Exporta una definición de filas a un archivo .xlsx real
 * con estilos (negrita, color, bordes, merge de celdas, ancho de columnas).
 *
 * USO:
 *   exportToXlsx(rows, colWidths, { fileName: "inventario.xlsx" });
 */
export function exportToXlsx(rows: XlsxRowDef[], colWidths: number[] = [], options: ExportXlsxOptions = {}): void {
   const { fileName = "exportacion.xlsx", sheetName = "Hoja1", pxToCharWidth = 0.14 } = options;

   const wb = XLSX.utils.book_new();
   const ws: XLSX.WorkSheet = {};
   const merges: XLSX.Range[] = [];

   // Mapa de celdas ocupadas por rowspan
   // key = "R_C", value = true
   const occupied: Record<string, true> = {};

   let excelRow = 1;
   const rowHeights: { hpx: number }[] = [];

   for (const rowDef of rows) {
      let excelCol = 1;
      rowHeights.push({ hpx: rowDef.height ?? 24 });

      for (const cellDef of rowDef.cells) {
         // Saltar columnas ocupadas por rowspan anterior
         while (occupied[`${excelRow}_${excelCol}`]) {
            excelCol++;
         }

         const colspan = cellDef.span ?? 1;
         const rowspan = cellDef.rowSpan ?? 1;

         const addr = XLSX.utils.encode_cell({ r: excelRow - 1, c: excelCol - 1 });

         // Valor
         const cell: XLSX.CellObject = {
            v: cellDef.value ?? "",
            t: typeof cellDef.value === "number" ? "n" : "s"
         };

         // Estilo — usamos any porque SheetJS no exporta los tipos de estilo
         const style: XlsxCellStyle = {};

         // Fuente
         const font: XlsxFont = {};
         if (cellDef.bold) font.bold = true;
         if (cellDef.italic) font.italic = true;
         if (cellDef.fontSize) font.sz = cellDef.fontSize;
         const fgColor = hexToArgb(cellDef.color);
         if (fgColor) font.color = { rgb: fgColor };
         if (Object.keys(font).length) style.font = font;

         // Relleno
         const bgColor = hexToArgb(cellDef.bg);
         if (bgColor) {
            style.fill = {
               patternType: "solid",
               fgColor: { rgb: bgColor }
            };
         }

         // Alineación
         const alignment: XlsxAlignment = {};
         if (cellDef.align) alignment.horizontal = cellDef.align;
         if (cellDef.vAlign) alignment.vertical = cellDef.vAlign;
         if (cellDef.wrap) alignment.wrapText = true;
         if (Object.keys(alignment).length) style.alignment = alignment;

         // Bordes
         const xlsxBorder = buildXlsxBorder(cellDef.border);
         if (xlsxBorder) style.border = xlsxBorder as XlsxBorders;

         // SheetJS lee los estilos desde cell.s — cast a any porque el tipo
         // XLSX.CellObject no declara .s en el namespace público
         if (Object.keys(style).length) (cell as any).s = style;

         ws[addr] = cell;

         // Merges
         if (colspan > 1 || rowspan > 1) {
            merges.push({
               s: { r: excelRow - 1, c: excelCol - 1 },
               e: { r: excelRow - 1 + rowspan - 1, c: excelCol - 1 + colspan - 1 }
            });
         }

         // Marcar celdas ocupadas por rowspan
         for (let dr = 1; dr < rowspan; dr++) {
            for (let dc = 0; dc < colspan; dc++) {
               occupied[`${excelRow + dr}_${excelCol + dc}`] = true;
            }
         }

         excelCol += colspan;
      }

      excelRow++;
   }

   // Rango de la hoja
   const lastRow = excelRow - 1;
   const lastCol = colWidths.length || 1;
   ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow - 1, c: lastCol - 1 }
   });

   // Merges
   if (merges.length) ws["!merges"] = merges;

   // Ancho de columnas (px → caracteres Excel aprox)
   if (colWidths.length) {
      ws["!cols"] = colWidths.map((w) => ({ wch: Math.round(w * pxToCharWidth * 10) / 10 }));
   }

   // Alto de filas
   ws["!rows"] = rowHeights;

   XLSX.utils.book_append_sheet(wb, ws, sheetName);
   XLSX.writeFile(wb, fileName);
}

/**
 * Helper: convierte children React de un <Sheet> a XlsxRowDef[]
 * para pasarlos a exportToXlsx.
 *
 * NOTA: Solo procesa componentes Row/Cell/TitleRow/MetaRow/DataRow
 * que sean hijos directos. Para layouts complejos, construye el array
 * manualmente con XlsxRowDef[].
 */
export function sheetChildrenToRows(children: React.ReactNode): XlsxRowDef[] {
   const rows: XlsxRowDef[] = [];

   React.Children.forEach(children, (child) => {
      if (!child || !React.isValidElement(child)) return;

      const el = child as React.ReactElement<any>;

      // Row directo
      if (el.type === Row || el.type === DataRow) {
         const cells: XlsxCellDef[] = [];
         React.Children.forEach(el.props.children, (c) => {
            if (!c || !React.isValidElement(c)) return;
            const cellEl = c as React.ReactElement<CellProps>;
            if (cellEl.type === Cell || cellEl.type === EmptyCell) {
               const v =
                  cellEl.props.value !== undefined
                     ? cellEl.props.value
                     : typeof cellEl.props.children === "string" || typeof cellEl.props.children === "number"
                       ? cellEl.props.children
                       : null;
               cells.push({
                  value: v as string | number | null,
                  span: cellEl.props.span,
                  rowSpan: cellEl.props.rowSpan,
                  bold: cellEl.props.bold,
                  italic: cellEl.props.italic,
                  fontSize: cellEl.props.fontSize,
                  color: cellEl.props.color,
                  bg: cellEl.props.bg,
                  align: cellEl.props.align,
                  vAlign: cellEl.props.vAlign,
                  wrap: cellEl.props.wrap,
                  border: cellEl.props.border ?? (el.type === DataRow ? el.props.border : undefined)
               });
            }
         });
         if (cells.length) rows.push({ cells, height: el.props.height });
      }

      // TitleRow
      if (el.type === TitleRow) {
         const text = typeof el.props.children === "string" ? el.props.children : String(el.props.children ?? "");
         rows.push({
            height: el.props.height,
            cells: [
               {
                  value: text,
                  span: el.props.totalCols ?? 1,
                  bold: el.props.bold ?? true,
                  bg: el.props.bg ?? "#1e3a5f",
                  color: el.props.color ?? "#fff",
                  fontSize: el.props.fontSize ?? 12,
                  align: "center",
                  border: el.props.border
               }
            ]
         });
      }

      // MetaRow
      if (el.type === MetaRow) {
         rows.push({
            height: el.props.height ?? 22,
            cells: [
               {
                  value: `${el.props.label}  ${el.props.value ?? ""}`,
                  span: el.props.totalCols ?? 1,
                  bold: false,
                  fontSize: el.props.fontSize ?? 9,
                  align: "left",
                  border: el.props.border ?? "thin"
               }
            ]
         });
      }

      // Spacer → fila vacía
      if (el.type === Spacer) {
         rows.push({ height: el.props.height ?? 8, cells: [{ value: "" }] });
      }
   });

   return rows;
}
