import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Building2, Check, ChevronUp, ChevronDown } from "lucide-react";

interface ChainNode {
   [key: string]: any;
}

interface CustomTreeViewProps {
   data: ChainNode[];
   onNodeClick?: (node: ChainNode, index: number) => void;
   nameField?: string;
   groupField?: string;
   currentStatus?: string;
   levelField?: string;
   directorField?: string;
   showLevel?: boolean;
   showGroup?: boolean;
   showDirector?: boolean;
   showId?: boolean;
   showProgressBar?: boolean; // nueva: muestra barra de progreso
   autoScrollToActive?: boolean; // nueva: scroll automático al nodo activo
}

const normalize = (val: any): string => (typeof val === "string" ? val.trim().toUpperCase() : "");

// Design tokens consistentes
const TOKENS = {
   ok: {
      markerBg: "#1D9E75",
      markerBorder: "#9FE1CB",
      line: "#9FE1CB",
      cardBg: "#f0fdf8",
      cardBorder: "#5DCAA5",
      cardAccent: "#1D9E75",
      nameColor: "#085041",
      badgeColor: "#0F6E56",
      badgeBg: "#E1F5EE"
   },
   pend: {
      markerBg: "#E5A535",
      markerBorder: "#FAC775",
      line: "#FAC775",
      cardBg: "#fffbeb",
      cardBorder: "#EF9F27",
      cardAccent: "#BA7517",
      nameColor: "#633806",
      badgeColor: "#633806",
      badgeBg: "#FAEEDA"
   }
};

const CustomTreeView = ({
   data,
   onNodeClick,
   currentStatus,
   nameField = "name",
   groupField = "group",
   levelField = "level",
   directorField = "director_name",
   showLevel = false,
   showGroup = false,
   showDirector = true,
   showId = false,
   showProgressBar = true,
   autoScrollToActive = false
}: CustomTreeViewProps) => {
   const [focusedIndex, setFocusedIndex] = useState<number>(-1);
   const containerRef = useRef<HTMLDivElement>(null);
   const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

   if (!data || data.length === 0) {
      return (
         <div
            style={{
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               padding: "16px 0",
               gap: 6,
               color: "#9ca3af"
            }}
         >
            <Building2 size={14} strokeWidth={1.5} />
            <span style={{ fontSize: 10, letterSpacing: "0.03em" }}>Sin cadena</span>
         </div>
      );
   }

   const statusNorm = normalize(currentStatus);
   const activeIndex =
      statusNorm && data.length ? data.findIndex((item) => normalize(item[groupField]) === statusNorm || normalize(item[nameField]) === statusNorm) : -1;
   const completedUpTo = activeIndex >= 0 ? activeIndex : -1;

   // Scroll automático al nodo activo
   useEffect(() => {
      if (autoScrollToActive && activeIndex >= 0 && cardRefs.current[activeIndex]) {
         cardRefs.current[activeIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center"
         });
      }
   }, [activeIndex, autoScrollToActive]);

   // Navegación por teclado
   const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
         if (!data.length) return;
         if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((prev) => {
               const next = prev + 1;
               return next < data.length ? next : prev;
            });
         } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((prev) => {
               const next = prev - 1;
               return next >= 0 ? next : -1;
            });
         } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault();
            onNodeClick?.(data[focusedIndex], focusedIndex);
         }
      },
      [data, focusedIndex, onNodeClick]
   );

   useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [handleKeyDown]);

   // Cuando cambia el índice enfocado, hacer scroll al elemento y enfocarlo
   useEffect(() => {
      if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
         cardRefs.current[focusedIndex]?.focus();
         cardRefs.current[focusedIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
         });
      }
   }, [focusedIndex]);

   const progressPercent = data.length > 0 ? ((completedUpTo + 1) / data.length) * 100 : 0;

   return (
      <div style={{ position: "relative", padding: "4px 0" }}>
         {/* Barra de progreso */}
         {showProgressBar && (
            <div
               style={{
                  marginBottom: 20,
                  padding: "0 4px"
               }}
            >
               <div
                  style={{
                     display: "flex",
                     justifyContent: "space-between",
                     fontSize: 11,
                     color: "#4b5563",
                     marginBottom: 6
                  }}
               >
                  <span>Progreso</span>
                  <span>
                     {completedUpTo + 1} de {data.length}
                  </span>
               </div>
               <div
                  style={{
                     height: 4,
                     backgroundColor: "#e5e7eb",
                     borderRadius: 4,
                     overflow: "hidden"
                  }}
               >
                  <div
                     style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        backgroundColor: "#1D9E75",
                        transition: "width 0.3s ease"
                     }}
                  />
               </div>
            </div>
         )}

         <div ref={containerRef}>
            {data.map((item, idx) => {
               const completed = idx <= completedUpTo;
               const isActive = idx === completedUpTo;
               const token = completed ? TOKENS.ok : TOKENS.pend;

               const name = item[nameField] ?? "—";
               const group = item[groupField];
               const level = item[levelField];
               const director = item[directorField];
               const isLast = idx === data.length - 1;

               return (
                  <div
                     key={idx}
                     style={{
                        display: "flex",
                        alignItems: "flex-start",
                        position: "relative",
                        animation: "fadeInUp 0.3s ease-out",
                        animationFillMode: "both",
                        animationDelay: `${idx * 0.05}s`
                     }}
                  >
                     {/* Columna izquierda: marcador + línea */}
                     <div
                        style={{
                           position: "relative",
                           width: 36,
                           flexShrink: 0,
                           display: "flex",
                           flexDirection: "column",
                           alignItems: "center"
                        }}
                     >
                        {/* Marcador circular con número / check */}
                        <div
                           style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: token.markerBg,
                              border: `2px solid ${token.markerBorder}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 12,
                              fontWeight: "bold",
                              zIndex: 2,
                              transition: "all 0.2s",
                              boxShadow: isActive ? `0 0 0 3px ${token.markerBorder}80` : "none",
                              cursor: "help"
                           }}
                           title={`${idx + 1}. ${name}${director ? ` - ${director}` : ""}`}
                        >
                           {completed ? <Check size={14} /> : idx + 1}
                        </div>

                        {/* Línea vertical */}
                        {!isLast && (
                           <div
                              style={{
                                 position: "absolute",
                                 top: 28,
                                 bottom: -28,
                                 left: "50%",
                                 width: 2,
                                 transform: "translateX(-50%)",
                                 background: token.line,
                                 borderRadius: 1
                              }}
                           />
                        )}
                     </div>

                     {/* Tarjeta de contenido */}
                     <div
                        // ref={(el) => (cardRefs.current[idx] = el)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Nodo ${idx + 1}: ${name}`}
                        onClick={() => onNodeClick?.(item, idx)}
                        onKeyDown={(e) => {
                           if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onNodeClick?.(item, idx);
                           }
                        }}
                        style={{
                           flex: 1,
                           margin: "2px 0 2px 8px",
                           padding: "8px 12px",
                           background: token.cardBg,
                           border: `1px solid ${token.cardBorder}`,
                           borderLeft: `3px solid ${token.cardAccent}`,
                           borderRadius: "0 8px 8px 0",
                           cursor: onNodeClick ? "pointer" : "default",
                           transition: "all 0.2s",
                           boxShadow: focusedIndex === idx ? `0 0 0 2px ${token.cardAccent}` : "0 1px 2px rgba(0,0,0,0.02)",
                           outline: "none"
                        }}
                        onMouseEnter={(e) => {
                           if (onNodeClick) {
                              e.currentTarget.style.filter = "brightness(0.97)";
                              e.currentTarget.style.transform = "translateX(2px)";
                           }
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.style.filter = "brightness(1)";
                           e.currentTarget.style.transform = "translateX(0)";
                        }}
                        onFocus={() => setFocusedIndex(idx)}
                        onBlur={() => setFocusedIndex(-1)}
                     >
                        {/* Badges superiores */}
                        <div
                           style={{
                              display: "flex",
                              gap: 6,
                              marginBottom: 4,
                              flexWrap: "wrap"
                           }}
                        >
                           {showLevel && level != null && (
                              <span
                                 style={{
                                    fontSize: 9,
                                    fontFamily: "monospace",
                                    color: token.nameColor,
                                    background: "rgba(255,255,255,0.7)",
                                    border: `0.5px solid ${token.cardBorder}`,
                                    borderRadius: 4,
                                    padding: "2px 5px",
                                    lineHeight: 1,
                                    fontWeight: 600
                                 }}
                              >
                                 Nivel {level}
                              </span>
                           )}
                           {showGroup && group && (
                              <span
                                 style={{
                                    fontSize: 9,
                                    fontFamily: "monospace",
                                    color: "#6b7280",
                                    background: "#f3f4f6",
                                    border: "0.5px solid #e5e7eb",
                                    borderRadius: 4,
                                    padding: "2px 5px",
                                    lineHeight: 1
                                 }}
                              >
                                 {group}
                              </span>
                           )}
                           {isActive && currentStatus && (
                              <span
                                 style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    color: token.badgeColor,
                                    background: token.badgeBg,
                                    border: `0.5px solid ${token.cardBorder}`,
                                    borderRadius: 4,
                                    padding: "2px 6px",
                                    lineHeight: 1
                                 }}
                              >
                                 {currentStatus}
                              </span>
                           )}
                        </div>

                        {/* Nombre principal */}
                        <div
                           style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: token.nameColor,
                              lineHeight: 1.3,
                              marginBottom: director && showDirector ? 4 : 0
                           }}
                        >
                           {name}
                        </div>

                        {/* Director */}
                        {showDirector && director && (
                           <div
                              style={{
                                 fontSize: 10,
                                 color: "#9ca3af",
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 4
                              }}
                           >
                              <User size={10} />
                              <span>{director}</span>
                           </div>
                        )}

                        {/* Debug ID */}
                        {showId && (
                           <div
                              style={{
                                 fontSize: 9,
                                 fontFamily: "monospace",
                                 color: "#d1d5db",
                                 marginTop: 4,
                                 textAlign: "right"
                              }}
                           >
                              ID: {idx}
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>

         <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .custom-tree-view-card {
            padding: 6px 10px;
            font-size: 11px;
          }
          .custom-tree-view-marker {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }
          .custom-tree-view-line {
            width: 2px;
          }
        }
      `}</style>
      </div>
   );
};

export default CustomTreeView;
