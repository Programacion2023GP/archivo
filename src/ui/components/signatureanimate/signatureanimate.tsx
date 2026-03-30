import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import ReactDOM from "react-dom";

// ─── INJECT FONTS & STYLES ──────────────────────────────────────────────────
const injectStyles = () => {
   if (document.getElementById("styled-signature-styles")) return;

   const link = document.createElement("link");
   link.rel = "stylesheet";
   link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;600&family=Great+Vibes&family=Dancing+Script:wght@400;700&family=Parisienne&family=Allura&family=Sacramento&family=Alex+Brush&family=Yellowtail&family=Kaushan+Script&family=Pacifico&display=swap";
   document.head.appendChild(link);

   const style = document.createElement("style");
   style.id = "styled-signature-styles";
   style.textContent = `
    @keyframes sig-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes sig-scale-in {
      from { opacity: 0; transform: scale(0.93) translateY(12px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes sig-char-in {
      0%   { opacity: 0; transform: translateY(8px) rotate(-4deg) scaleX(0.8); }
      60%  { opacity: 1; transform: translateY(-2px) rotate(1deg) scaleX(1.05); }
      100% { opacity: 1; transform: translateY(0) rotate(0deg) scaleX(1); }
    }
    @keyframes sig-pen-bob {
      0%, 100% { transform: translate(-50%,-90%) rotate(-38deg); }
      50%       { transform: translate(-50%,-94%) rotate(-42deg); }
    }
    @keyframes sig-ink-drop {
      0%   { opacity: 0.9; transform: scale(1) translateY(0); }
      100% { opacity: 0;   transform: scale(0) translateY(-12px); }
    }
    @keyframes sig-seal-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes sig-line-draw {
      from { stroke-dashoffset: 400; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes sig-glow-pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(180,140,60,0.15), 0 0 60px rgba(180,140,60,0.05); }
      50%       { box-shadow: 0 0 30px rgba(180,140,60,0.25), 0 0 80px rgba(180,140,60,0.1); }
    }
    @keyframes sig-ribbon-in {
      from { transform: scaleX(0); opacity: 0; }
      to   { transform: scaleX(1); opacity: 1; }
    }
    @keyframes sig-checkmark {
      from { stroke-dashoffset: 40; opacity: 0; }
      to   { stroke-dashoffset: 0;  opacity: 1; }
    }
    @keyframes sig-stamp-in {
      0%   { transform: scale(1.4) rotate(-8deg); opacity: 0; }
      60%  { transform: scale(0.96) rotate(1deg); opacity: 1; }
      80%  { transform: scale(1.02) rotate(-0.5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    .sig-char {
      display: inline-block;
      animation: sig-char-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }
    .sig-pen-cursor {
      animation: sig-pen-bob 0.5s ease-in-out infinite;
    }
    .sig-ink-particle {
      animation: sig-ink-drop 0.7s ease-out forwards;
    }
    .sig-overlay {
      animation: sig-fade-in 0.35s ease forwards;
    }
    .sig-modal {
      animation: sig-scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .sig-glow {
      animation: sig-glow-pulse 3s ease-in-out infinite;
    }
    .sig-ribbon {
      transform-origin: left center;
      animation: sig-ribbon-in 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }
    .sig-stamp {
      animation: sig-stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .sig-line {
      stroke-dasharray: 400;
      animation: sig-line-draw 1.2s ease forwards;
    }
    .sig-checkmark-path {
      stroke-dasharray: 40;
      stroke-dashoffset: 40;
      animation: sig-checkmark 0.4s 0.2s ease forwards;
    }
  `;
   document.head.appendChild(style);
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type FontOption = "parisienne" | "allura" | "sacramento" | "alexBrush" | "yellowtail" | "dancingScript" | "greatVibes" | "pacifico" | "kaushanScript";

const fontOptions: Record<FontOption, string> = {
   parisienne: "'Parisienne', cursive",
   allura: "'Allura', cursive",
   sacramento: "'Sacramento', cursive",
   alexBrush: "'Alex Brush', cursive",
   yellowtail: "'Yellowtail', cursive",
   dancingScript: "'Dancing Script', cursive",
   greatVibes: "'Great Vibes', cursive",
   pacifico: "'Pacifico', cursive",
   kaushanScript: "'Kaushan Script', cursive"
};

export type StyleOption = "elegant" | "classic" | "modern" | "bold";
const styleOptions: Record<StyleOption, React.CSSProperties> = {
   elegant: { letterSpacing: "0.03em" },
   classic: { letterSpacing: "0.04em" },
   modern: { letterSpacing: "0.01em" },
   bold: { letterSpacing: "0.05em", fontWeight: "bold" }
};

export interface StyledSignatureProps {
   text: string;
   speed?: number;
   className?: string;
   fontSize?: string;
   color?: string;
   style?: StyleOption;
   showCursor?: boolean;
   onComplete?: () => void;
   onClose?: () => void;
   fontFamily?: FontOption;
   portalId?: string;
   width?: string;
   height?: string;
   title?: string;
   subtitle?: string;
   showCloseButton?: boolean;
   autoClose?: boolean;
   autoOpen?: boolean;
   signerRole?: string;
   documentId?: string;
}

// ─── SVG PEN ICON ─────────────────────────────────────────────────────────────
const PenIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
   <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
         <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D78E" />
            <stop offset="50%" stopColor="#C9973A" />
            <stop offset="100%" stopColor="#8B6220" />
         </linearGradient>
         <linearGradient id="pg2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8C878" />
            <stop offset="100%" stopColor="#6B4A18" />
         </linearGradient>
      </defs>
      {/* Barrel */}
      <path d="M20 2 L24 8 L22 30 L20 34 L18 30 L16 8 Z" fill="url(#pg1)" stroke="#7A5510" strokeWidth="0.6" />
      {/* Nib */}
      <path d="M18 30 L20 38 L22 30 Z" fill="#2C2C2C" stroke="#111" strokeWidth="0.5" />
      <path d="M20 34 L20 38" stroke="#888" strokeWidth="0.5" />
      {/* Band */}
      <rect x="17.5" y="27" width="5" height="2" rx="0.5" fill="url(#pg2)" stroke="#5A3A08" strokeWidth="0.4" />
      {/* Clip */}
      <path d="M22 6 L24 8 L24 22 L22 22" stroke="#B8860B" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Shine */}
      <path d="M18.5 6 L19.5 20" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
   </svg>
);

// ─── SEAL SVG ─────────────────────────────────────────────────────────────────
const SealIcon: React.FC<{ progress: number }> = ({ progress }) => (
   <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
         <radialGradient id="sealGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#E8C46A" />
            <stop offset="60%" stopColor="#C9973A" />
            <stop offset="100%" stopColor="#8B6220" />
         </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#C9973A" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      {/* Main disc */}
      <circle cx="32" cy="32" r="25" fill="url(#sealGrad)" opacity={0.15 + progress * 0.85} />
      <circle cx="32" cy="32" r="25" fill="none" stroke="#C9973A" strokeWidth="1.5" opacity={0.4 + progress * 0.6} />
      {/* Star points */}
      {[...Array(8)].map((_, i) => {
         const a = (i * 45 * Math.PI) / 180;
         return (
            <line
               key={i}
               x1={32 + 18 * Math.cos(a)}
               y1={32 + 18 * Math.sin(a)}
               x2={32 + 24 * Math.cos(a)}
               y2={32 + 24 * Math.sin(a)}
               stroke="#C9973A"
               strokeWidth="1.5"
               opacity={0.5 + progress * 0.5}
            />
         );
      })}
      {/* Center checkmark */}
      {progress >= 1 && (
         <path className="sig-checkmark-path" d="M22 32 L29 39 L42 24" stroke="#C9973A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
   </svg>
);

// ─── CORNER ORNAMENT ─────────────────────────────────────────────────────────
const CornerOrnament: React.FC<{ flip?: boolean }> = ({ flip }) => (
   <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M5 55 L5 10 Q5 5 10 5 L55 5" stroke="#C9973A" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M5 55 L5 15 Q5 8 12 8 L55 8" stroke="#C9973A" strokeWidth="0.4" fill="none" opacity="0.3" />
      <circle cx="8" cy="8" r="3" fill="none" stroke="#C9973A" strokeWidth="1" opacity="0.6" />
      <path d="M12 5 Q14 5 14 7 Q14 12 19 12" stroke="#C9973A" strokeWidth="0.8" fill="none" opacity="0.5" />
   </svg>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const StyledSignature: React.FC<StyledSignatureProps> = ({
   text,
   speed = 75,
   className = "",
   fontSize = "text-6xl",
   color = "#1a1410",
   style = "elegant",
   showCursor = true,
   onComplete,
   onClose,
   fontFamily = "greatVibes",
   portalId = "signature-portal",
   width = "860px",
   height = "560px",
   title = "Acuerdo de Confidencialidad",
   subtitle = "",
   showCloseButton = true,
   autoClose = true,
   autoOpen = true,
   signerRole = "",
   documentId
}) => {
   injectStyles();

   const [displayedText, setDisplayedText] = useState("");
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isTyping, setIsTyping] = useState(true);
   const [isOpen, setIsOpen] = useState(autoOpen && text.length > 0);
   const [isDone, setIsDone] = useState(false);
   const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
   const [inkParticles, setInkParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

   const containerRef = useRef<HTMLDivElement>(null);
   const textSpanRef = useRef<HTMLSpanElement>(null);
   const cursorRef = useRef<HTMLDivElement>(null);
   const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const particleId = useRef(0);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const rafRef = useRef<number>(0);
   const pathPoints = useRef<Array<{ x: number; y: number }>>([]);

   const docId = documentId ?? `DOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
   const progress = text.length > 0 ? currentIndex / text.length : 0;

   // ── Reset on text change ──
   useEffect(() => {
      if (autoOpen && text.length > 0) {
         setIsOpen(true);
         setDisplayedText("");
         setCurrentIndex(0);
         setIsTyping(true);
         setIsDone(false);
         pathPoints.current = [];
      }
   }, [text, autoOpen]);

   // ── Typing loop ──
   useEffect(() => {
      if (!isOpen) return;
      if (currentIndex < text.length) {
         const t = setTimeout(() => {
            setDisplayedText((p) => p + text[currentIndex]);
            setCurrentIndex((p) => p + 1);
            // spawn ink particle occasionally
            if (Math.random() < 0.25 && cursorRef.current && containerRef.current) {
               const cr = cursorRef.current.getBoundingClientRect();
               const br = containerRef.current.getBoundingClientRect();
               const id = ++particleId.current;
               setInkParticles((p) => [...p.slice(-6), { id, x: cr.left - br.left + 8, y: cr.top - br.top + 28 }]);
               setTimeout(() => setInkParticles((p) => p.filter((pt) => pt.id !== id)), 700);
            }
         }, speed);
         return () => clearTimeout(t);
      } else if (text.length > 0 && isTyping) {
         setIsTyping(false);
         setIsDone(false);
         onComplete?.();
         setTimeout(() => setIsDone(true), 200);
         if (autoClose) {
            closeTimeoutRef.current = setTimeout(() => {
               setIsOpen(false);
               onClose?.();
            }, 2200);
         }
      }
   }, [currentIndex, text, speed, isTyping, onComplete, isOpen, autoClose, onClose]);

   // ── Canvas ink trail ──
   const drawTrail = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = pathPoints.current;
      if (pts.length < 2) {
         rafRef.current = requestAnimationFrame(drawTrail);
         return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
         const mx = (pts[i].x + pts[i + 1].x) / 2;
         const my = (pts[i].y + pts[i + 1].y) / 2;
         ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, last.x, last.y);
      grad.addColorStop(0, "rgba(160,100,20,0)");
      grad.addColorStop(0.5, "rgba(160,100,20,0.18)");
      grad.addColorStop(1, "rgba(160,100,20,0.35)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      rafRef.current = requestAnimationFrame(drawTrail);
   };

   useEffect(() => {
      if (isOpen && canvasRef.current) {
         const c = canvasRef.current;
         c.width = c.offsetWidth || 860;
         c.height = c.offsetHeight || 560;
         rafRef.current = requestAnimationFrame(drawTrail);
      }
      return () => {
         if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
   }, [isOpen]);

   // ── Cursor position ──
   useLayoutEffect(() => {
      if (!showCursor || !isTyping || !isOpen) return;
      const span = textSpanRef.current;
      const cont = containerRef.current;
      const curs = cursorRef.current;
      if (!span || !cont || !curs) return;
      const node = span.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE || displayedText.length === 0) return;

      const range = document.createRange();
      range.setStart(node, Math.max(0, displayedText.length - 1));
      range.setEnd(node, displayedText.length);
      const r = range.getBoundingClientRect();
      const br = cont.getBoundingClientRect();
      const x = r.right - br.left;
      const y = r.top - br.top + r.height / 2;
      curs.style.left = `${x}px`;
      curs.style.top = `${y}px`;

      pathPoints.current = [...pathPoints.current.slice(-50), { x, y }];
   }, [displayedText, showCursor, isTyping, isOpen]);

   // ── Portal setup ──
   useEffect(() => {
      let el = document.getElementById(portalId);
      if (!el) {
         el = document.createElement("div");
         el.id = portalId;
         document.body.appendChild(el);
      }
      setPortalContainer(el);
      return () => {
         if (el?.childNodes.length === 0) el?.parentNode?.removeChild(el);
      };
   }, [portalId]);

   // ── ESC to close ──
   useEffect(() => {
      const h = (e: KeyboardEvent) => {
         if (e.key === "Escape" && isOpen) handleClose();
      };
      window.addEventListener("keydown", h);
      return () => window.removeEventListener("keydown", h);
   }, [isOpen]);

   const handleClose = () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setIsOpen(false);
      onClose?.();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
   };

   if (!isOpen || !portalContainer) return null;

   const fontStack = fontOptions[fontFamily] ?? `'${fontFamily}', cursive`;
   const styleExtra = styleOptions[style] ?? styleOptions.elegant;
   const now = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

   const content = (
      <div
         className={`sig-overlay fixed inset-0 flex items-center justify-center ${className}`}
         style={{ zIndex: 9000, background: "rgba(10,8,6,0.75)", backdropFilter: "blur(8px)" }}
         role="dialog"
         aria-modal="true"
         aria-labelledby="sig-title"
      >
         {/* Backdrop click */}
         <div className="absolute inset-0" onClick={handleClose} />

         {/* ── MODAL CARD ── */}
         <div
            className="sig-modal sig-glow relative flex flex-col"
            style={{
               width,
               maxWidth: "95vw",
               height,
               maxHeight: "95vh",
               background: "linear-gradient(160deg, #FAF6EE 0%, #F5EDD8 40%, #EFE4C6 100%)",
               borderRadius: "4px",
               border: "1px solid rgba(180,140,60,0.4)",
               overflow: "hidden",
               boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,160,70,0.2), inset 0 1px 0 rgba(255,255,255,0.6)"
            }}
         >
            {/* Paper texture overlay */}
            <div
               style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                  backgroundSize: "200px",
                  mixBlendMode: "multiply"
               }}
            />

            {/* Gold top bar */}
            <div
               style={{
                  height: "5px",
                  background: "linear-gradient(90deg, transparent, #C9973A 20%, #E8C46A 50%, #C9973A 80%, transparent)"
               }}
            />

            {/* ── HEADER ── */}
            <div
               style={{
                  padding: "20px 28px 16px",
                  borderBottom: "1px solid rgba(180,140,60,0.2)",
                  background: "linear-gradient(180deg, rgba(255,252,240,0.9) 0%, transparent 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
               }}
            >
               {/* Logo / wordmark */}
               <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                     style={{
                        width: "32px",
                        height: "32px",
                        background: "linear-gradient(135deg, #C9973A, #8B6220)",
                        borderRadius: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                     }}
                  >
                     <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 1 L11 7 L17 7 L12 11 L14 17 L9 13 L4 17 L6 11 L1 7 L7 7 Z" fill="white" opacity="0.9" />
                     </svg>
                  </div>
                  <div>
                     <div style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.12em", color: "#8B6220", textTransform: "uppercase" }}>
                        Notaría Digital
                     </div>
                     <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: "#B08040", fontStyle: "italic" }}>
                        Plataforma de Firma Electrónica
                     </div>
                  </div>
               </div>

               {/* Doc ID & close */}
               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right" }}>
                     <div style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.1em", color: "#C9973A", textTransform: "uppercase" }}>
                        ID de Documento
                     </div>
                     <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6B4A18", letterSpacing: "0.06em" }}>{docId}</div>
                  </div>
                  {showCloseButton && (
                     <button
                        onClick={handleClose}
                        style={{
                           width: "28px",
                           height: "28px",
                           borderRadius: "2px",
                           background: "rgba(180,140,60,0.1)",
                           border: "1px solid rgba(180,140,60,0.3)",
                           cursor: "pointer",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           color: "#8B6220",
                           transition: "all 0.2s"
                        }}
                        aria-label="Cerrar"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(180,140,60,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(180,140,60,0.1)")}
                     >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                           <path d="M1 1l10 10M11 1L1 11" />
                        </svg>
                     </button>
                  )}
               </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
               {/* Corner ornaments */}
               <div style={{ position: "absolute", top: "8px", left: "8px", opacity: 0.6, zIndex: 1 }}>
                  <CornerOrnament />
               </div>
               <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.6, zIndex: 1 }}>
                  <CornerOrnament flip />
               </div>

               {/* Canvas trail */}
               <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} />

               {/* Center content */}
               <div
                  style={{
                     flex: 1,
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     justifyContent: "center",
                     padding: "16px 48px 8px",
                     position: "relative",
                     zIndex: 3
                  }}
               >
                  {/* Title block */}
                  <div style={{ textAlign: "center", marginBottom: "28px" }}>
                     {/* Decorative line */}
                     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
                        <svg width="80" height="8" viewBox="0 0 80 8" fill="none">
                           <path className="sig-line" d="M2 4 Q20 1 40 4 Q60 7 78 4" stroke="#C9973A" strokeWidth="1" fill="none" />
                           <circle cx="2" cy="4" r="2" fill="#C9973A" opacity="0.6" />
                           <circle cx="78" cy="4" r="2" fill="#C9973A" opacity="0.6" />
                        </svg>
                        <div
                           style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #E8C46A, #8B6220)",
                              flexShrink: 0
                           }}
                        />
                        <svg width="80" height="8" viewBox="0 0 80 8" fill="none" style={{ transform: "scaleX(-1)" }}>
                           <path className="sig-line" d="M2 4 Q20 1 40 4 Q60 7 78 4" stroke="#C9973A" strokeWidth="1" fill="none" />
                           <circle cx="2" cy="4" r="2" fill="#C9973A" opacity="0.6" />
                           <circle cx="78" cy="4" r="2" fill="#C9973A" opacity="0.6" />
                        </svg>
                     </div>

                     <h2
                        id="sig-title"
                        style={{
                           fontFamily: "'Cinzel', serif",
                           fontSize: "clamp(14px, 1.5vw, 18px)",
                           letterSpacing: "0.18em",
                           color: "#3D2B00",
                           textTransform: "uppercase",
                           fontWeight: 400,
                           margin: "0 0 6px"
                        }}
                     >
                        {title}
                     </h2>
                     <p
                        style={{
                           fontFamily: "'Cormorant Garamond', serif",
                           fontSize: "12px",
                           fontStyle: "italic",
                           color: "#9B7A30",
                           letterSpacing: "0.06em",
                           margin: 0
                        }}
                     >
                        {subtitle}
                     </p>
                  </div>

                  {/* Progress bar */}
                  <div
                     style={{
                        width: "340px",
                        maxWidth: "100%",
                        height: "2px",
                        background: "rgba(180,140,60,0.15)",
                        borderRadius: "1px",
                        overflow: "hidden",
                        marginBottom: "28px",
                        position: "relative"
                     }}
                  >
                     <div
                        style={{
                           height: "100%",
                           borderRadius: "1px",
                           background: "linear-gradient(90deg, #8B6220, #E8C46A, #C9973A)",
                           width: `${progress * 100}%`,
                           transition: "width 0.08s linear",
                           boxShadow: progress > 0 ? "0 0 6px rgba(200,150,50,0.5)" : "none"
                        }}
                     />
                  </div>

                  {/* Signature area */}
                  <div
                     ref={containerRef}
                     style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "520px",
                        minHeight: "110px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                     }}
                  >
                     {/* Baseline */}
                     <div
                        style={{
                           position: "absolute",
                           bottom: "10px",
                           left: "10%",
                           right: "10%",
                           height: "1px",
                           background: "linear-gradient(90deg, transparent, rgba(180,140,60,0.4) 20%, rgba(180,140,60,0.6) 50%, rgba(180,140,60,0.4) 80%, transparent)"
                        }}
                     />

                     {/* Signature text */}
                     <span
                        ref={textSpanRef}
                        style={{
                           fontFamily: fontStack,
                           fontSize: "clamp(2.5rem, 5vw, 4rem)",
                           color,
                           lineHeight: 1.2,
                           display: "inline-block",
                           textShadow: "2px 3px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
                           ...styleExtra
                        }}
                     >
                        {displayedText.split("").map((char, i) => (
                           <span key={i} className="sig-char" style={{ animationDelay: `${i * 0.01}s` }}>
                              {char}
                           </span>
                        ))}
                     </span>

                     {/* Ink particles */}
                     {inkParticles.map((p) => (
                        <div
                           key={p.id}
                           className="sig-ink-particle"
                           style={{
                              position: "absolute",
                              left: p.x,
                              top: p.y,
                              width: "3px",
                              height: "3px",
                              borderRadius: "50%",
                              background: "#6B3A10",
                              pointerEvents: "none"
                           }}
                        />
                     ))}

                     {/* Pen cursor */}
                     {showCursor && isTyping && (
                        <div
                           ref={cursorRef}
                           className="sig-pen-cursor"
                           style={{
                              position: "absolute",
                              transform: "translate(-50%, -90%) rotate(-38deg)",
                              transformOrigin: "bottom center",
                              pointerEvents: "none",
                              zIndex: 10,
                              filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.2))"
                           }}
                        >
                           <PenIcon size={40} />
                           {/* Ink glow */}
                           <div
                              style={{
                                 position: "absolute",
                                 bottom: "-2px",
                                 left: "50%",
                                 transform: "translateX(-50%)",
                                 width: "6px",
                                 height: "6px",
                                 borderRadius: "50%",
                                 background: "rgba(180,100,20,0.5)",
                                 boxShadow: "0 0 8px rgba(180,100,20,0.6)"
                              }}
                           />
                        </div>
                     )}
                  </div>

                  {/* Signer info */}
                  <div
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        marginTop: "20px",
                        padding: "10px 20px",
                        background: "rgba(180,140,60,0.06)",
                        border: "1px solid rgba(180,140,60,0.15)",
                        borderRadius: "2px"
                     }}
                  >
                     {/* Seal */}
                     <div className={isDone ? "sig-stamp" : ""} style={{ flexShrink: 0 }}>
                        <SealIcon progress={progress} />
                     </div>
                     <div>
                        <div
                           style={{
                              fontFamily: "'Cinzel', serif",
                              fontSize: "9px",
                              letterSpacing: "0.14em",
                              color: "#C9973A",
                              textTransform: "uppercase",
                              marginBottom: "3px"
                           }}
                        >
                           {signerRole}
                        </div>
                        <div
                           style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "13px",
                              color: "#3D2B00",
                              fontStyle: "italic"
                           }}
                        >
                           {isTyping ? "Firmando documento…" : isDone ? "Firma autógrafa validada" : "Procesando…"}
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#9B7A30", marginTop: "2px", letterSpacing: "0.04em" }}>{now}</div>
                     </div>
                     {isDone && (
                        <div
                           style={{
                              marginLeft: "auto",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#6B8A3A",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "11px",
                              fontStyle: "italic"
                           }}
                        >
                           <svg className="sig-checkmark-path" width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M2 8 L6 12 L14 4" stroke="#6B8A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                           Verificado
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* ── FOOTER ── */}
            <div
               style={{
                  padding: "10px 28px",
                  borderTop: "1px solid rgba(180,140,60,0.15)",
                  background: "rgba(240,230,200,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
               }}
            >
               <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "10px", color: "#9B7A30", fontStyle: "italic" }}>
                  Documento cifrado con tecnología AES-256 · Cumple NOM-151-SCFI-2016
               </div>
               <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {["Autenticidad", "Integridad", "No repudio"].map((label) => (
                     <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div
                           style={{
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              background: "#C9973A",
                              opacity: 0.6
                           }}
                        />
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "0.1em", color: "#9B7A30", textTransform: "uppercase" }}>
                           {label}
                        </span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Gold bottom bar */}
            <div
               style={{
                  height: "3px",
                  background: "linear-gradient(90deg, transparent, #C9973A 20%, #E8C46A 50%, #C9973A 80%, transparent)",
                  opacity: 0.7
               }}
            />
         </div>
      </div>
   );

   return ReactDOM.createPortal(content, portalContainer);
};

export default StyledSignature;
