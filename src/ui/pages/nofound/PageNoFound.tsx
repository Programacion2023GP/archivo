import { useState, useEffect } from "react";

const stampMessages = ["EXTRAVIADO", "NO ENCONTRADO", "ARCHIVADO MAL", "SIN REGISTRO"];

export default function Archivero404() {
   const [stamp, setStamp] = useState(false);
   const [drawerOpen, setDrawerOpen] = useState(false);
   const [currentStamp, setCurrentStamp] = useState(0);
   const [typedText, setTypedText] = useState("");
   const fullText = "El expediente solicitado no figura en ninguno de nuestros registros. Por favor dirígase a la ventanilla correspondiente.";

   useEffect(() => {
      // Animate stamp after 800ms
      const t1 = setTimeout(() => setStamp(true), 800);
      const t2 = setTimeout(() => setDrawerOpen(true), 1400);

      // Stamp cycling
      const stampCycle = setInterval(() => {
         setCurrentStamp((p) => (p + 1) % stampMessages.length);
      }, 3000);

      return () => {
         clearTimeout(t1);
         clearTimeout(t2);
         clearInterval(stampCycle);
      };
   }, []);

   useEffect(() => {
      let i = 0;
      setTypedText("");
      const t = setInterval(() => {
         if (i < fullText.length) {
            setTypedText(fullText.slice(0, i + 1));
            i++;
         } else {
            clearInterval(t);
         }
      }, 28);
      return () => clearInterval(t);
   }, []);

   return (
      <div
         style={{
            minHeight: "100vh",
            background: "#d4c9b0",
            backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px),
        repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(0,0,0,0.02) 27px, rgba(0,0,0,0.02) 28px)
      `,
            fontFamily: "'Courier New', Courier, monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            position: "relative",
            overflow: "hidden"
         }}
      >
         {/* Noise overlay */}
         <div
            style={{
               position: "fixed",
               inset: 0,
               pointerEvents: "none",
               zIndex: 0,
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
               opacity: 0.6
            }}
         />

         {/* Filing cabinet top bar */}
         <div
            style={{
               position: "absolute",
               top: 0,
               left: 0,
               right: 0,
               height: "6px",
               background: "repeating-linear-gradient(90deg, #5a4a3a 0px, #5a4a3a 40px, #4a3a2a 40px, #4a3a2a 80px)"
            }}
         />

         <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "720px" }}>
            {/* Cabinet drawer */}
            <div
               style={{
                  background: "#8b7355",
                  borderRadius: "4px 4px 0 0",
                  padding: "0",
                  marginBottom: "0",
                  boxShadow: "0 -4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  transform: drawerOpen ? "translateY(0)" : "translateY(-20px)",
                  transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
               }}
            >
               {/* Drawer handle */}
               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     padding: "10px",
                     borderBottom: "2px solid #5a4a3a"
                  }}
               >
                  <div
                     style={{
                        width: "120px",
                        height: "18px",
                        background: "linear-gradient(180deg, #c9a87c 0%, #a07850 50%, #8b6840 100%)",
                        borderRadius: "9px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
                        border: "1px solid #6a5040"
                     }}
                  />
               </div>

               {/* Drawer label */}
               <div
                  style={{
                     padding: "8px 20px",
                     display: "flex",
                     alignItems: "center",
                     gap: "12px"
                  }}
               >
                  <div
                     style={{
                        background: "#f5f0e8",
                        border: "1px solid #8b7355",
                        padding: "4px 12px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        letterSpacing: "3px",
                        color: "#3a2a1a",
                        boxShadow: "1px 1px 3px rgba(0,0,0,0.2)"
                     }}
                  >
                     EXPEDIENTES: 400–499
                  </div>
                  <div style={{ fontSize: "10px", color: "#c9a87c", letterSpacing: "2px" }}>CLASIFICACIÓN: ERROR</div>
               </div>
            </div>

            {/* Main document area */}
            <div
               style={{
                  background: "#f7f2e8",
                  border: "1px solid #c4b49a",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.25), inset 0 0 80px rgba(0,0,0,0.03)",
                  padding: "48px 56px",
                  position: "relative",
                  overflow: "hidden"
               }}
            >
               {/* Paper texture lines */}
               <div
                  style={{
                     position: "absolute",
                     top: 0,
                     left: 0,
                     right: 0,
                     bottom: 0,
                     pointerEvents: "none",
                     backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 31px, rgba(180,160,120,0.2) 31px, rgba(180,160,120,0.2) 32px)"
                  }}
               />

               {/* Red margin line */}
               <div
                  style={{
                     position: "absolute",
                     top: 0,
                     bottom: 0,
                     left: "72px",
                     borderLeft: "2px solid rgba(200,80,80,0.3)"
                  }}
               />

               {/* Hole punches */}
               {[80, 200, 320].map((top, i) => (
                  <div
                     key={i}
                     style={{
                        position: "absolute",
                        left: "20px",
                        top: `${top}px`,
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#d4c9b0",
                        border: "1px solid #b8ad9a",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                     }}
                  />
               ))}

               {/* Corner fold */}
               <div
                  style={{
                     position: "absolute",
                     top: 0,
                     right: 0,
                     width: 0,
                     height: 0,
                     borderStyle: "solid",
                     borderWidth: "0 40px 40px 0",
                     borderColor: `transparent #c4b49a transparent transparent`
                  }}
               />
               <div
                  style={{
                     position: "absolute",
                     top: "1px",
                     right: "1px",
                     width: 0,
                     height: 0,
                     borderStyle: "solid",
                     borderWidth: "0 38px 38px 0",
                     borderColor: `transparent #d4c9b0 transparent transparent`
                  }}
               />

               {/* Relative to content, not absolute positioning issues */}
               <div style={{ position: "relative", zIndex: 2, marginLeft: "24px" }}>
                  {/* Header */}
                  <div style={{ marginBottom: "32px", borderBottom: "2px solid #3a2a1a", paddingBottom: "16px" }}>
                     <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#7a6a5a", marginBottom: "4px" }}>DEPARTAMENTO DE GESTIÓN DIGITAL</div>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                           <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#5a4a3a" }}>FORMULARIO REF: ERR/404/∞</div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "10px", color: "#7a6a5a" }}>
                           <div>FECHA: ___/___/______</div>
                           <div style={{ marginTop: "4px" }}>FOLIO: #404-NF</div>
                        </div>
                     </div>
                  </div>

                  {/* 404 big number */}
                  <div style={{ position: "relative", marginBottom: "24px" }}>
                     <div
                        style={{
                           fontSize: "clamp(80px, 18vw, 180px)",
                           fontWeight: "900",
                           color: "transparent",
                           WebkitTextStroke: "3px #3a2a1a",
                           lineHeight: 1,
                           letterSpacing: "-4px",
                           fontFamily: "'Courier New', monospace",
                           opacity: 0.15,
                           userSelect: "none"
                        }}
                     >
                        404
                     </div>

                     {/* RED STAMP */}
                     <div
                        style={{
                           position: "absolute",
                           top: "50%",
                           left: "50%",
                           transform: `translate(-50%, -50%) rotate(-12deg) scale(${stamp ? 1 : 3})`,
                           opacity: stamp ? 1 : 0,
                           transition: "transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.15s",
                           zIndex: 10
                        }}
                     >
                        <div
                           style={{
                              border: "5px solid rgba(180,30,30,0.85)",
                              padding: "10px 28px",
                              color: "rgba(180,30,30,0.85)",
                              fontWeight: "900",
                              fontSize: "clamp(20px, 4vw, 36px)",
                              letterSpacing: "6px",
                              textAlign: "center",
                              lineHeight: 1.2,
                              fontFamily: "'Courier New', monospace",
                              boxShadow: "inset 0 0 0 2px rgba(180,30,30,0.3)",
                              backdropFilter: "blur(0px)",
                              mixBlendMode: "multiply"
                           }}
                        >
                           <div style={{ fontSize: "10px", letterSpacing: "4px", marginBottom: "2px", opacity: 0.8 }}>──────────</div>
                           {stampMessages[currentStamp]}
                           <div style={{ fontSize: "10px", letterSpacing: "4px", marginTop: "2px", opacity: 0.8 }}>──────────</div>
                        </div>
                     </div>
                  </div>

                  {/* Title */}
                  <div
                     style={{
                        fontSize: "clamp(14px, 2.5vw, 22px)",
                        fontWeight: "bold",
                        letterSpacing: "4px",
                        color: "#3a2a1a",
                        textTransform: "uppercase",
                        marginBottom: "8px"
                     }}
                  >
                     RECURSO NO ENCONTRADO
                  </div>
                  <div
                     style={{
                        borderTop: "1px solid #c4b49a",
                        borderBottom: "1px solid #c4b49a",
                        padding: "12px 0",
                        marginBottom: "28px"
                     }}
                  >
                     <p
                        style={{
                           fontSize: "13px",
                           color: "#5a4a3a",
                           lineHeight: "1.9",
                           margin: 0,
                           minHeight: "52px"
                        }}
                     >
                        {typedText}
                        <span
                           style={{
                              display: "inline-block",
                              width: "8px",
                              height: "14px",
                              background: "#5a4a3a",
                              marginLeft: "2px",
                              verticalAlign: "middle",
                              animation: "blink 1s step-end infinite"
                           }}
                        />
                     </p>
                  </div>

                  {/* Form fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                     {[
                        { label: "URL SOLICITADA", value: "Página desconocida" },
                        { label: "ESTADO", value: "EXTRAVIADO" },
                        { label: "RESPONSABLE", value: "Nadie (como siempre)" },
                        { label: "TIEMPO DE ESPERA", value: "Indefinido" }
                     ].map((field, i) => (
                        <div key={i}>
                           <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#9a8a7a", marginBottom: "4px" }}>{field.label}:</div>
                           <div
                              style={{
                                 borderBottom: "1px solid #c4b49a",
                                 padding: "4px 0",
                                 fontSize: "12px",
                                 color: "#3a2a1a",
                                 fontStyle: field.value === "EXTRAVIADO" ? "normal" : "italic",
                                 fontWeight: field.value === "EXTRAVIADO" ? "bold" : "normal",
                              
                              }}
                           >
                              {field.value}
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Observations */}
                  <div style={{ marginBottom: "32px" }}>
                     <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#9a8a7a", marginBottom: "8px" }}>OBSERVACIONES:</div>
                     <div
                        style={{
                           background: "rgba(180,160,120,0.1)",
                           border: "1px solid #c4b49a",
                           padding: "12px 16px",
                           fontSize: "11px",
                           color: "#5a4a3a",
                           lineHeight: "1.8",
                           fontStyle: "italic"
                        }}
                     >
                        "El expediente número 404 fue solicitado múltiples veces pero jamás hallado. Se presume perdido en la mudanza del servidor de 2009. El caso
                        permanece abierto indefinidamente."
                        <div style={{ textAlign: "right", marginTop: "8px", fontStyle: "normal", fontSize: "10px", letterSpacing: "2px" }}>
                           — Archivo Central, Dpto. Errores
                        </div>
                     </div>
                  </div>

                  {/* Action buttons styled as form checkboxes */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                     <button
                        onClick={() => window.history.back()}
                        style={{
                           background: "transparent",
                           border: "2px solid #3a2a1a",
                           padding: "10px 24px",
                           fontFamily: "'Courier New', monospace",
                           fontSize: "11px",
                           letterSpacing: "3px",
                           fontWeight: "bold",
                           cursor: "pointer",
                           color: "#3a2a1a",
                           textTransform: "uppercase",
                           transition: "all 0.2s",
                           display: "flex",
                           alignItems: "center",
                           gap: "8px"
                        }}
                        onMouseEnter={(e) => {
                           const el = e.currentTarget as HTMLButtonElement;
                           el.style.background = "#3a2a1a";
                           el.style.color = "#f7f2e8";
                        }}
                        onMouseLeave={(e) => {
                           const el = e.currentTarget as HTMLButtonElement;
                           el.style.background = "transparent";
                           el.style.color = "#3a2a1a";
                        }}
                     >
                        ← REGRESAR
                     </button>

                     <button
                        onClick={() => (window.location.href = "/")}
                        style={{
                           background: "#3a2a1a",
                           border: "2px solid #3a2a1a",
                           padding: "10px 24px",
                           fontFamily: "'Courier New', monospace",
                           fontSize: "11px",
                           letterSpacing: "3px",
                           fontWeight: "bold",
                           cursor: "pointer",
                           color: "#f7f2e8",
                           textTransform: "uppercase",
                           transition: "all 0.2s",
                           display: "flex",
                           alignItems: "center",
                           gap: "8px"
                        }}
                        onMouseEnter={(e) => {
                           (e.currentTarget as HTMLButtonElement).style.background = "#5a4a3a";
                        }}
                        onMouseLeave={(e) => {
                           (e.currentTarget as HTMLButtonElement).style.background = "#3a2a1a";
                        }}
                     >
                        ⌂ INICIO
                     </button>
                  </div>

                  {/* Footer */}
                  <div
                     style={{
                        marginTop: "36px",
                        paddingTop: "16px",
                        borderTop: "1px solid #c4b49a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px"
                     }}
                  >
                     <div style={{ fontSize: "9px", color: "#9a8a7a", letterSpacing: "2px" }}>FIRMA DEL RESPONSABLE: ________________</div>
                     <div style={{ fontSize: "9px", color: "#9a8a7a", letterSpacing: "2px" }}>
                        SELLO DEL DEPARTAMENTO:
                        <span
                           style={{
                              display: "inline-block",
                              marginLeft: "8px",
                              border: "1px solid rgba(9a,8a,7a,0.5)",
                              padding: "2px 8px",
                              color: "rgba(140,40,40,0.6)",
                              fontWeight: "bold",
                              transform: "rotate(-4deg)",
                           }}
                        >
                           [ ERR/404 ]
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Paper stack below */}
            <div style={{ position: "relative", height: "8px" }}>
               <div
                  style={{
                     position: "absolute",
                     left: "4px",
                     right: "4px",
                     top: "0",
                     height: "6px",
                     background: "#ede8de",
                     border: "1px solid #c4b49a",
                     borderTop: "none"
                  }}
               />
               <div
                  style={{
                     position: "absolute",
                     left: "8px",
                     right: "8px",
                     top: "4px",
                     height: "6px",
                     background: "#e8e3d9",
                     border: "1px solid #bdb0a0",
                     borderTop: "none"
                  }}
               />
            </div>
         </div>

         {/* Scattered paper corner */}
         <div
            style={{
               position: "fixed",
               bottom: "40px",
               right: "40px",
               background: "#f7f2e8",
               border: "1px solid #c4b49a",
               padding: "12px 16px",
               width: "160px",
               transform: "rotate(8deg)",
               boxShadow: "3px 3px 12px rgba(0,0,0,0.15)",
               fontSize: "9px",
               color: "#7a6a5a",
               letterSpacing: "2px",
               lineHeight: "1.8",
               zIndex: 20
            }}
         >
            NOTA INTERNA:
            <br />
            <span style={{ fontStyle: "italic", color: "#5a4a3a" }}>
               "Revisar carpetas
               <br />B través de Z.
               <br />
               Posiblemente en
               <br />
               el sótano."
            </span>
         </div>

         <div
            style={{
               position: "fixed",
               bottom: "60px",
               left: "30px",
               background: "#fffde0",
               border: "1px solid #e0d870",
               padding: "10px 12px",
               width: "130px",
               transform: "rotate(-5deg)",
               boxShadow: "2px 2px 8px rgba(0,0,0,0.12)",
               fontSize: "9px",
               color: "#6a6030",
               letterSpacing: "1px",
               lineHeight: "1.8",
               zIndex: 20
            }}
         >
            📎 PENDIENTE:
            <br />
            <span style={{ fontStyle: "italic" }}>
               Archivar errores
               <br />
               de esta semana.
            </span>
         </div>

         <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      </div>
   );
}
