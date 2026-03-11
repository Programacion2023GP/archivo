import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — misma paleta que CustomTable
══════════════════════════════════════════════════════════════ */

const PALETTE = {
   ruby: { base: "#9B2242", dark: "#7a1a35", light: "#fceef2", border: "rgba(155,34,66,0.22)", glow: "rgba(155,34,66,0.20)", text: "#fff" },
   slate: { base: "#3d3d52", dark: "#2d2d3e", light: "#f2f2f6", border: "rgba(61,61,82,0.22)", glow: "rgba(61,61,82,0.18)", text: "#fff" },
   cyan: { base: "#0891b2", dark: "#0672a0", light: "#ecfeff", border: "rgba(8,145,178,0.22)", glow: "rgba(8,145,178,0.20)", text: "#fff" },
   purple: { base: "#7c3aed", dark: "#6b2ed4", light: "#f5f3ff", border: "rgba(124,58,237,0.22)", glow: "rgba(124,58,237,0.20)", text: "#fff" },
   pink: { base: "#db2777", dark: "#be1d68", light: "#fdf2f8", border: "rgba(219,39,119,0.22)", glow: "rgba(219,39,119,0.20)", text: "#fff" },
   green: { base: "#059669", dark: "#047857", light: "#ecfdf5", border: "rgba(5,150,105,0.22)", glow: "rgba(5,150,105,0.20)", text: "#fff" },
   red: { base: "#dc2626", dark: "#b91c1c", light: "#fef2f2", border: "rgba(220,38,38,0.22)", glow: "rgba(220,38,38,0.20)", text: "#fff" },
   blue: { base: "#2563eb", dark: "#1d4ed8", light: "#eff6ff", border: "rgba(37,99,235,0.22)", glow: "rgba(37,99,235,0.20)", text: "#fff" },
   yellow: { base: "#d97706", dark: "#b45309", light: "#fffbeb", border: "rgba(217,119,6,0.22)", glow: "rgba(217,119,6,0.20)", text: "#1a1a24" }
} as const;

type ColorKey = keyof typeof PALETTE;

/* ══════════════════════════════════════════════════════════════
   SIZE SCALE - MODIFICADO PARA FORMAS MÁS OVALADAS
══════════════════════════════════════════════════════════════ */

const SIZES = {
   sm: { h: 32, px: 14, fontSize: 12, fontWeight: 600, gap: 5, iconSize: 13, radius: 9999, dotW: 7, badgeH: 17, badgeFont: 9 },
   md: { h: 38, px: 18, fontSize: 13, fontWeight: 600, gap: 6, iconSize: 15, radius: 9999, dotW: 8, badgeH: 19, badgeFont: 10 },
   lg: { h: 44, px: 22, fontSize: 14, fontWeight: 600, gap: 7, iconSize: 16, radius: 9999, dotW: 9, badgeH: 21, badgeFont: 11 },
   xl: { h: 52, px: 26, fontSize: 15, fontWeight: 700, gap: 8, iconSize: 18, radius: 9999, dotW: 10, badgeH: 23, badgeFont: 12 }
} as const;

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */

export type ButtonVariant = "solid" | "soft" | "outline" | "ghost" | "icon";
export type ButtonSize = keyof typeof SIZES;
export type BadgeVariant = "solid" | "outline" | "dot" | "pulse";
export type BadgePosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type ButtonProps = {
   onClick?: () => void;
   children?: React.ReactNode;
   variant?: ButtonVariant;
   color?: ColorKey;
   size?: ButtonSize;
   type?: "button" | "submit" | "reset";
   icon?: React.ReactNode;
   iconPosition?: "left" | "right" | "only";
   className?: string;
   disabled?: boolean;
   loading?: boolean;
   fullWidth?: boolean;

   // Badge
   badge?: string | number | boolean | React.ReactNode;
   badgeColor?: ColorKey | "white" | "gray";
   badgeVariant?: BadgeVariant;
   badgePosition?: BadgePosition;
   badgeClassName?: string;
   showBadge?: boolean;
   // El badge siempre va en portal ahora
   badgePortal?: boolean;
};

/* ══════════════════════════════════════════════════════════════
   GLOBAL CSS - MODIFICADO PARA ANIMACIONES MÁS SUAVES
══════════════════════════════════════════════════════════════ */

const CSS_ID = "__cb2025__";

function injectGlobalCSS() {
   if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
   const s = document.createElement("style");
   s.id = CSS_ID;
   s.textContent = `
    /* Ripple - más suave */
    @keyframes _cb_ripple {
      from { transform: scale(0); opacity: 0.4; }
      to   { transform: scale(1); opacity: 0; }
    }
    ._cb_ripple_el {
      position: absolute; border-radius: 50%; pointer-events: none;
      animation: _cb_ripple 600ms cubic-bezier(0.2, 0, 0.2, 1) forwards;
    }

    /* Badge pulse ring */
    @keyframes _cb_ring {
      0%,100% { transform: scale(1); opacity: 0.7; }
      50%      { transform: scale(2.2); opacity: 0; }
    }
    ._cb_pulse_ring::after {
      content:""; position:absolute; inset:0; border-radius:50%;
      background:inherit;
      animation: _cb_ring 2s ease-in-out infinite;
    }

    /* Spinner */
    @keyframes _cb_spin { to { transform: rotate(360deg); } }
    ._cb_spinner { animation: _cb_spin 0.7s linear infinite; }

    /* Focus ring - más suave */
    ._cb_btn:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 4px;
      outline-color: rgba(155, 34, 66, 0.5);
    }

    /* Hover/active transitions - más elásticas y modernas */
    ._cb_btn { 
      transition: transform 0.2s cubic-bezier(0.34, 1.3, 0.64, 1), 
                  box-shadow 0.25s ease, 
                  filter 0.2s ease, 
                  background-color 0.2s ease, 
                  border-color 0.2s ease, 
                  opacity 0.2s ease; 
    }
    ._cb_btn:not(:disabled):not(._cb_busy):hover  { 
      transform: translateY(-2px) scale(1.02); 
      box-shadow: 0 8px 20px var(--_cb_glow) !important;
    }
    ._cb_btn:not(:disabled):not(._cb_busy):active { 
      transform: translateY(0) scale(0.98); 
    }

    /* Solid: brillo más sutil */
    ._cb_solid:not(:disabled):not(._cb_busy):hover  { 
      filter: brightness(1.05); 
    }

    /* Soft / outline: hover más notables */
    ._cb_soft:not(:disabled):not(._cb_busy):hover   { 
      filter: brightness(0.94); 
      background-color: var(--_cb_light) !important;
    }
    ._cb_outline:not(:disabled):not(._cb_busy):hover { 
      background-color: var(--_cb_light) !important; 
      border-color: var(--_cb_base) !important;
    }
    ._cb_ghost:not(:disabled):not(._cb_busy):hover  { 
      background-color: var(--_cb_light) !important; 
      transform: translateY(-1px) scale(1.01) !important;
    }
    ._cb_icon_v:not(:disabled):not(._cb_busy):hover  { 
      filter: brightness(0.95); 
      box-shadow: 0 8px 20px var(--_cb_glow) !important; 
      transform: translateY(-1px) scale(1.05) !important;
    }

    /* CSS variables para los colores base */
    ._cb_btn {
      --_cb_base: currentColor;
    }

    /* Portal badge container - ocupa toda la pantalla pero no interfiere */
    ._cb_badge_portal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
    }

    /* Badge base styles */
    ._cb_badge {
      position: absolute;
      will-change: transform;
      pointer-events: none;
    }
  `;
   document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════════
   RIPPLE HOOK
══════════════════════════════════════════════════════════════ */

type Ripple = { id: number; x: number; y: number; size: number; light: boolean };

function useRipple() {
   const [ripples, setRipples] = useState<Ripple[]>([]);
   const counter = useRef(0);

   const trigger = (e: React.MouseEvent<HTMLButtonElement>, light: boolean) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const id = counter.current++;
      setRipples((r) => [...r, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size, light }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
   };

   return { ripples, trigger };
}

/* ══════════════════════════════════════════════════════════════
   VARIANT STYLE BUILDER - MODIFICADO PARA ESTILOS MÁS MODERNOS
══════════════════════════════════════════════════════════════ */

function buildStyle(
   variant: ButtonVariant,
   col: (typeof PALETTE)[ColorKey],
   s: (typeof SIZES)[ButtonSize],
   iconOnly: boolean,
   fullWidth: boolean,
   disabled: boolean
): React.CSSProperties {
   const shared: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.h,
      width: fullWidth ? "100%" : iconOnly ? s.h : undefined,
      padding: iconOnly ? 0 : `0 ${s.px}px`,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontFamily: "inherit",
      letterSpacing: "-0.02em",
      lineHeight: 1,
      borderRadius: s.radius,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      position: "relative",
      overflow: "hidden",
      userSelect: "none",
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      border: "none",
      backdropFilter: variant === "soft" ? "blur(4px)" : "none"
   };

   const vars = {
      "--_cb_light": col.light,
      "--_cb_glow": col.glow,
      "--_cb_base": col.base,
      "--_cb_border": col.border
   } as React.CSSProperties;

   switch (variant) {
      case "solid":
         return {
            ...shared,
            ...vars,
            background: col.base,
            color: col.text,
            border: "1px solid transparent",
            boxShadow: `0 4px 12px ${col.glow}, 0 1px 2px rgba(0,0,0,0.1)`
         };
      case "soft":
         return {
            ...shared,
            ...vars,
            background: col.light,
            color: col.base,
            border: "1px solid transparent",
            boxShadow: "none"
         };
      case "outline":
         return {
            ...shared,
            ...vars,
            background: "transparent",
            color: col.base,
            border: `1.5px solid ${col.border}`,
            boxShadow: "none"
         };
      case "ghost":
         return {
            ...shared,
            ...vars,
            background: "transparent",
            color: col.base,
            border: "1px solid transparent",
            boxShadow: "none"
         };
      case "icon":
         return {
            ...shared,
            ...vars,
            background: col.light,
            color: col.base,
            border: "1px solid transparent",
            boxShadow: `0 2px 8px ${col.glow}`,
            borderRadius: s.radius
         };
   }
}

/* ══════════════════════════════════════════════════════════════
   BADGE COLORS
══════════════════════════════════════════════════════════════ */

const BADGE_MAP: Record<string, { bg: string; text: string }> = {
   ruby: { bg: PALETTE.ruby.base, text: "#fff" },
   slate: { bg: PALETTE.slate.base, text: "#fff" },
   cyan: { bg: PALETTE.cyan.base, text: "#fff" },
   purple: { bg: PALETTE.purple.base, text: "#fff" },
   pink: { bg: PALETTE.pink.base, text: "#fff" },
   green: { bg: PALETTE.green.base, text: "#fff" },
   red: { bg: PALETTE.red.base, text: "#fff" },
   blue: { bg: PALETTE.blue.base, text: "#fff" },
   yellow: { bg: PALETTE.yellow.base, text: "#1a1a24" },
   white: { bg: "#ffffff", text: "#1a1a24" },
   gray: { bg: "#6b7280", text: "#fff" }
};

/* ══════════════════════════════════════════════════════════════
   BADGE COMPONENT
══════════════════════════════════════════════════════════════ */

type BadgeProps = {
   badge: NonNullable<ButtonProps["badge"]>;
   badgeColor: string;
   badgeVariant: BadgeVariant;
   badgePosition: BadgePosition;
   badgeClassName: string;
   dotW: number;
   badgeH: number;
   badgeFont: number;
   style?: React.CSSProperties;
};

const BadgeEl: React.FC<BadgeProps> = ({ badge, badgeColor, badgeVariant, badgePosition, badgeClassName, dotW, badgeH, badgeFont, style }) => {
   const bc = BADGE_MAP[badgeColor] ?? BADGE_MAP.red;

   if (badgeVariant === "dot" || badgeVariant === "pulse") {
      return (
         <span
            className={`_cb_badge ${badgeVariant === "pulse" ? "_cb_pulse_ring" : ""} ${badgeClassName}`}
            style={{
               width: dotW,
               height: dotW,
               borderRadius: "50%",
               background: bc.bg,
               boxShadow: `0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.15)`,
               ...style
            }}
         />
      );
   }

   const isTrue = badge === true;
   const isNum = typeof badge === "number";
   const content = isTrue ? "" : isNum && Number(badge) > 99 ? "99+" : badge;
   const isOutline = badgeVariant === "outline";

   return (
      <span
         className={`_cb_badge ${badgeClassName}`}
         style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: isTrue ? dotW + 2 : badgeH,
            height: isTrue ? dotW + 2 : badgeH,
            borderRadius: 9999,
            padding: isTrue ? 0 : "0 6px",
            fontSize: badgeFont,
            fontWeight: 700,
            lineHeight: 1,
            background: isOutline ? "transparent" : bc.bg,
            color: isOutline ? bc.bg : bc.text,
            border: isOutline ? `1.5px solid ${bc.bg}` : "none",
            boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
            ...style
         }}
      >
         {!isTrue && content}
      </span>
   );
};

/* ══════════════════════════════════════════════════════════════
   SPINNER
══════════════════════════════════════════════════════════════ */

function Spinner({ sz, onSolid }: { sz: number; onSolid: boolean }) {
   return (
      <svg className="_cb_spinner" width={sz + 2} height={sz + 2} viewBox="0 0 20 20" fill="none" style={{ position: "absolute" }}>
         <circle cx="10" cy="10" r="7" stroke={onSolid ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.1)"} strokeWidth="2.5" />
         <path d="M10 3a7 7 0 0 1 7 7" stroke={onSolid ? "#fff" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
   );
}

/* ══════════════════════════════════════════════════════════════
   MAIN BUTTON - CON BADGE QUE SIGUE AL BOTÓN
══════════════════════════════════════════════════════════════ */

export const CustomButton: React.FC<ButtonProps> = ({
   onClick,
   children,
   type = "button",
   variant = "solid",
   color = "ruby",
   size = "md",
   icon,
   iconPosition = "left",
   className = "",
   disabled = false,
   loading = false,
   fullWidth = false,

   badge,
   badgeColor = "red",
   badgeVariant = "solid",
   badgePosition = "top-right",
   badgeClassName = "",
   showBadge = true,
   badgePortal = true
}) => {
   injectGlobalCSS();

   const { ripples, trigger } = useRipple();
   const btnRef = useRef<HTMLButtonElement>(null);
   const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
   const [badgeStyle, setBadgeStyle] = useState<React.CSSProperties>({});
   const rafRef = useRef<number>(null);

   const s = SIZES[size];
   const col = PALETTE[color];
   const isIconOnly = iconPosition === "only" || (!children && !!icon);
   const isLightVar = variant !== "solid";
   const hasBadge = showBadge && badge !== undefined && badge !== null && badge !== false;

   const style = buildStyle(variant, col, s, isIconOnly, fullWidth, disabled);
   const variantCls = variant === "icon" ? "_cb_icon_v" : `_cb_${variant}`;

   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      trigger(e, !isLightVar);
      onClick?.();
   };

   // Función para actualizar la posición del badge usando requestAnimationFrame
   const updateBadgePosition = () => {
      if (!btnRef.current || !hasBadge) return;

      const rect = btnRef.current.getBoundingClientRect();
      const badgeSize = badgeVariant === "dot" || badgeVariant === "pulse" ? s.dotW : s.badgeH;
      const offset = badgeSize / 2;

      let top = rect.top;
      let left = rect.left;
      let transform = "";

      switch (badgePosition) {
         case "top-right":
            top = rect.top;
            left = rect.right;
            transform = "translate(-50%, -50%)";
            break;
         case "top-left":
            top = rect.top;
            left = rect.left;
            transform = "translate(50%, -50%)";
            break;
         case "bottom-right":
            top = rect.bottom;
            left = rect.right;
            transform = "translate(-50%, 50%)";
            break;
         case "bottom-left":
            top = rect.bottom;
            left = rect.left;
            transform = "translate(50%, 50%)";
            break;
      }

      setBadgeStyle({
         position: "fixed",
         top: `${top}px`,
         left: `${left}px`,
         transform,
         zIndex: 9999,
         willChange: "transform"
      });
   };

   // Setup del portal y animación
   useEffect(() => {
      if (!hasBadge) return;

      // Crear elemento portal
      const el = document.createElement("div");
      el.className = "_cb_badge_portal";
      document.body.appendChild(el);
      setPortalEl(el);

      // Función de animación que se ejecuta en cada frame
      const animate = () => {
         updateBadgePosition();
         rafRef.current = requestAnimationFrame(animate);
      };

      // Iniciar animación
      rafRef.current = requestAnimationFrame(animate);

      // Cleanup
      return () => {
         if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
         }
         if (el && el.parentNode) {
            el.parentNode.removeChild(el);
         }
         setPortalEl(null);
      };
   }, [hasBadge, badgePosition, badgeVariant, s.dotW, s.badgeH]);

   return (
      <>
         <button
            ref={btnRef}
            type={type}
            onClick={handleClick}
            disabled={disabled || loading}
            className={`_cb_btn ${variantCls} ${loading ? "_cb_busy" : ""} ${className}`}
            style={style}
            aria-busy={loading}
         >
            {ripples.map((rp) => (
               <span
                  key={rp.id}
                  className="_cb_ripple_el"
                  style={{
                     width: rp.size,
                     height: rp.size,
                     left: rp.x,
                     top: rp.y,
                     background: rp.light ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.1)"
                  }}
               />
            ))}

            {loading && <Spinner sz={s.iconSize} onSolid={!isLightVar} />}

            <span
               style={{
                  display: "flex",
                  alignItems: "center",
                  gap: s.gap,
                  opacity: loading ? 0 : 1,
                  transition: "opacity 0.2s",
                  position: "relative",
                  zIndex: 1
               }}
            >
               {isIconOnly ? (
                  icon && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
               ) : (
                  <>
                     {icon && iconPosition === "left" && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>}
                     {children && <span>{children}</span>}
                     {icon && iconPosition === "right" && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>}
                  </>
               )}
            </span>
         </button>

         {hasBadge &&
            portalEl &&
            ReactDOM.createPortal(
               <BadgeEl
                  badge={badge!}
                  badgeColor={badgeColor}
                  badgeVariant={badgeVariant}
                  badgePosition={badgePosition}
                  badgeClassName={badgeClassName}
                  dotW={s.dotW}
                  badgeH={s.badgeH}
                  badgeFont={s.badgeFont}
                  style={badgeStyle}
               />,
               portalEl
            )}
      </>
   );
};

/* ══════════════════════════════════════════════════════════════
   BUTTON GROUP
══════════════════════════════════════════════════════════════ */

export type ButtonGroupProps = {
   children: React.ReactNode;
   gap?: number;
   attached?: boolean;
   direction?: "row" | "column";
};

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, gap = 8, attached = false, direction = "row" }) => {
   if (attached) {
      return (
         <div
            style={{
               display: "inline-flex",
               flexDirection: direction,
               borderRadius: 9999,
               overflow: "hidden",
               border: "1px solid rgba(0,0,0,0.08)",
               boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
               padding: 2
            }}
         >
            {React.Children.map(children, (child) => {
               if (!React.isValidElement(child)) return child;
               return React.cloneElement(child as React.ReactElement<any>, {
                  style: {
                     ...((child as React.ReactElement<any>).props.style ?? {}),
                     borderRadius: 9999,
                     border: "none",
                     boxShadow: "none",
                     margin: 0
                  }
               });
            })}
         </div>
      );
   }

   return <div style={{ display: "inline-flex", flexDirection: direction, gap, flexWrap: "wrap", alignItems: "center" }}>{children}</div>;
};

export default CustomButton;
