import React from "react";
import { User, Building2 } from "lucide-react";

interface ChainNode {
   [key: string]: any;
}

interface CustomTreeViewProps {
   data: ChainNode[];
   onNodeClick?: (node: ChainNode, index: number) => void;
   nameField?: string;
   groupField?: string;
   autorized?: string;

   levelField?: string;
   directorField?: string;
   statusField?: string;
   showLevel?: boolean;
   showGroup?: boolean;
   showDirector?: boolean;
   showId?: boolean;
}

const isAuthorized = (val: any) => val === true || val === 1;
const hasStatus = (val: any) => val !== null && val !== undefined;

// ✅ Colores como objetos de estilo inline — no dependen de Tailwind purge
const COLORS = {
   ok: {
      dot: { background: "#1D9E75" },
      line: { background: "#9FE1CB" },
      card: { borderColor: "#1D9E75", background: "#f0fdf8", borderLeftWidth: "2.5px", borderLeftStyle: "solid" as const },
      border: { borderColor: "#bbf7e0" },
      name: { color: "#085041" },
      pip: { background: "#1D9E75", boxShadow: "0 0 0 2px #9FE1CB" }
   },
   pend: {
      dot: { background: "#BA7517" },
      line: { background: "#FAC775" },
      card: { borderColor: "#BA7517", background: "#fffbeb", borderLeftWidth: "2.5px", borderLeftStyle: "solid" as const },
      border: { borderColor: "#fde68a" },
      name: { color: "#633806" },
      pip: { background: "#BA7517", boxShadow: "0 0 0 2px #FAC775" }
   },
   none: {
      dot: { background: "#d1d5db" },
      line: { background: "#e5e7eb" },
      card: { borderColor: "#e5e7eb", background: "#ffffff", borderLeftWidth: "2.5px", borderLeftStyle: "solid" as const },
      border: { borderColor: "#e5e7eb" },
      name: { color: "#1f2937" },
      pip: null
   }
};

const CustomTreeView = ({
   data,
   onNodeClick,
   autorized = "autorized",
   nameField = "name",
   groupField = "group",
   levelField = "level",
   directorField = "director_name",
   statusField = "authorized",
   showLevel = false,
   showGroup = false,
   showDirector = true,
   showId = false
}: CustomTreeViewProps) => {
   if (!data || data.length === 0) {
      return (
         <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 4, color: "#9ca3af" }}>
            <Building2 size={16} />
            <span style={{ fontSize: 11 }}>Sin cadena</span>
         </div>
      );
   }

   return (
      <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
         {data.map((item, idx) => {
            const auth = item[autorized];
            const ok = isAuthorized(auth); // true o 1 → verde
            const isExplicitFalse = auth === false || auth === 0; // false o 0 → amarillo
            const colors = ok ? COLORS.ok : isExplicitFalse || !hasStatus(auth) ? COLORS.pend : COLORS.none;
            console.log("colors", colors);
            const isLast = idx === data.length - 1;

            const name = item[nameField] ?? "—";
            const group = item[groupField];
            const level = item[levelField];
            const director = item[directorField];

            return (
               <div key={idx} style={{ display: "flex", alignItems: "stretch", minHeight: 38 }}>
                  {/* Rail */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                     <div
                        style={{
                           width: 8,
                           height: 8,
                           borderRadius: "50%",
                           flexShrink: 0,
                           marginTop: 15,
                           border: "2px solid white",
                           zIndex: 1,
                           ...colors.dot
                        }}
                     />
                     {!isLast && <div style={{ width: 2, flex: 1, borderRadius: 1, ...colors.line }} />}
                  </div>

                  {/* Card */}
                  <div
                     onClick={() => onNodeClick?.(item, idx)}
                     style={{
                        flex: 1,
                        margin: "3px 0 3px 4px",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "0.5px solid",
                        transition: "filter 0.12s",
                        ...colors.card
                     }}
                     onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.96)")}
                     onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                  >
                     {/* Chips */}
                     {showGroup && group && (
                        <span
                           style={{
                              fontSize: 9,
                              fontFamily: "monospace",
                              color: "#9ca3af",
                              background: "rgba(255,255,255,0.7)",
                              border: "0.5px solid #e5e7eb",
                              borderRadius: 3,
                              padding: "0 4px",
                              lineHeight: "16px",
                              flexShrink: 0
                           }}
                        >
                           {group}
                        </span>
                     )}
                     {showLevel && level != null && (
                        <span
                           style={{
                              fontSize: 9,
                              fontFamily: "monospace",
                              color: "#9ca3af",
                              background: "rgba(255,255,255,0.7)",
                              border: "0.5px solid #e5e7eb",
                              borderRadius: 3,
                              padding: "0 4px",
                              lineHeight: "16px",
                              flexShrink: 0
                           }}
                        >
                           L{level}
                        </span>
                     )}

                     {/* Texto */}
                     <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                           style={{
                              fontSize: 12,
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.3,
                              ...colors.name
                           }}
                        >
                           {name}
                        </div>
                        {showDirector && director && (
                           <div
                              style={{
                                 fontSize: 10,
                                 color: "#9ca3af",
                                 marginTop: 1,
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 3,
                                 overflow: "hidden",
                                 textOverflow: "ellipsis",
                                 whiteSpace: "nowrap"
                              }}
                           >
                              <User size={10} style={{ flexShrink: 0 }} />
                              {director}
                           </div>
                        )}
                     </div>

                     {/* ID */}
                     {showId && <span style={{ fontSize: 9, fontFamily: "monospace", color: "#d1d5db", flexShrink: 0 }}>#{idx}</span>}

                     {/* Pip */}
                     {colors.pip && <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginLeft: "auto", ...colors.pip }} />}
                  </div>
               </div>
            );
         })}
      </div>
   );
};

export default CustomTreeView;
