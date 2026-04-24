import React, { useState, useEffect, useRef, useMemo } from "react";

// Types
export interface Extra {
   position: number;
   before?: boolean;
   value: any;
   label: string;
}

interface Option {
   value: any;
   label: string;
   isNull?: boolean;
   isNumber?: boolean;
}

export interface MiniStepperProps {
   label?: string;
   min?: number;
   allowNull?: boolean;
   nullLabel?: string;
   extras?: Extra[];
   onSubmit?: (value: any) => void;
   onChange?: (value: any) => void; // Nuevo: callback para cambios
   debounceMs?: number;
   initialValue?: any;
   value?: any; // Nuevo: para modo controlado
}

// Helper: construir opciones
function buildOptions(min: number, allowNull: boolean, nullLabel: string, extras: Extra[], currentMax: number): Option[] {
   const opts: Option[] = [];

   if (allowNull) opts.push({ value: null, label: nullLabel, isNull: true });

   for (let n = min; n <= currentMax; n++) {
      extras.filter((e) => e.position === n && e.before).forEach((e) => opts.push(e));
      opts.push({ value: n, label: String(n), isNumber: true });
      extras.filter((e) => e.position === n && !e.before).forEach((e) => opts.push(e));
   }

   return opts;
}

function useStepper(
   min: number,
   allowNull: boolean,
   nullLabel: string,
   extras: Extra[],
   onSubmit?: (v: any) => void,
   onChange?: (v: any) => void,
   debounceMs = 380,
   initialValue?: any,
   externalValue?: any // Nuevo: valor controlado desde fuera
) {
   const [currentMax, setCurrentMax] = useState(() => {
      if (typeof initialValue === "number") return Math.max(min, initialValue);
      if (typeof externalValue === "number") return Math.max(min, externalValue);
      return min;
   });

   const extrasKey = JSON.stringify(extras);

   const options = useMemo(() => buildOptions(min, allowNull, nullLabel, extras, currentMax), [min, allowNull, nullLabel, currentMax, extrasKey]);

   // Función para encontrar índice por valor
   const findIndexByValue = (value: any): number => {
      if (value !== undefined && value !== null) {
         const found = options.findIndex((opt) => opt.value === value);
         if (found !== -1) return found;
      }
      return 0;
   };

   // Estado interno para modo no controlado
   const [internalIdx, setInternalIdx] = useState(() => {
      const valueToUse = externalValue !== undefined ? externalValue : initialValue;
      const initMax = typeof valueToUse === "number" ? Math.max(min, valueToUse) : min;
      const initOpts = buildOptions(min, allowNull, nullLabel, extras, initMax);

      if (valueToUse !== undefined) {
         const found = initOpts.findIndex((opt) => opt.value === valueToUse);
         if (found !== -1) return found;
      }
      return 0;
   });

   // Determinar si es controlado
   const isControlled = externalValue !== undefined;

   // Usar índice externo o interno
   const idx = isControlled ? findIndexByValue(externalValue) : internalIdx;

   const setIdx = (newIdx: number | ((prev: number) => number)) => {
      if (!isControlled) {
         setInternalIdx(newIdx);
      }
   };

   // Solo se dispara cuando currentMax crece (next llegó al límite)
   const prevMaxRef = useRef(currentMax);
   useEffect(() => {
      if (currentMax === prevMaxRef.current) return;
      prevMaxRef.current = currentMax;
      const found = options.findIndex((opt) => opt.isNumber && opt.value === currentMax);
      if (found !== -1) {
         if (isControlled) {
            // Si es controlado, notificar el nuevo valor
            onChange?.(currentMax);
         } else {
            setIdx(found);
         }
      }
   }, [currentMax, options, isControlled, onChange]);

   // Sincronizar cuando cambia el valor externo
   useEffect(() => {
      if (isControlled && externalValue !== undefined) {
         const newIdx = findIndexByValue(externalValue);
         if (newIdx !== -1 && newIdx !== idx) {
            // Solo actualizamos el max si es necesario
            if (typeof externalValue === "number" && externalValue > currentMax) {
               setCurrentMax(externalValue);
            }
         }
      }
   }, [externalValue, isControlled, options, currentMax]);

   const timer = useRef<ReturnType<typeof setTimeout>>(null);
   const current = options[idx];

   // Solo true si el usuario pulsó next o prev al menos una vez
   const hasInteracted = useRef(false);

   const next = () => {
      hasInteracted.current = true;
      const currentOption = options[idx];
      const isLastNumber = currentOption?.isNumber && currentOption.value === currentMax;

      if (isLastNumber) {
         const newMax = currentMax + 1;
         setCurrentMax(newMax);
         if (!isControlled) {
            // En modo no controlado, esperar a que se actualice options
            setTimeout(() => {
               const newOptions = buildOptions(min, allowNull, nullLabel, extras, newMax);
               const newIdx = newOptions.findIndex((opt) => opt.value === newMax);
               if (newIdx !== -1) setIdx(newIdx);
            }, 0);
         } else {
            // En modo controlado, notificar el nuevo valor
            onChange?.(newMax);
         }
      } else {
         const nextIdx = (idx + 1) % options.length;
         if (isControlled) {
            onChange?.(options[nextIdx]?.value);
         } else {
            setIdx(nextIdx);
         }
      }
   };

   const prev = () => {
      hasInteracted.current = true;
      const prevIdx = (idx - 1 + options.length) % options.length;
      if (isControlled) {
         onChange?.(options[prevIdx]?.value);
      } else {
         setIdx(prevIdx);
      }
   };

   // Debounce para onSubmit (solo si el usuario interactuó)
   useEffect(() => {
      if (!hasInteracted.current) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSubmit?.(current?.value), debounceMs);
      return () => {
         if (timer.current) clearTimeout(timer.current);
      };
   }, [idx, current?.value, onSubmit, debounceMs]);

   return { current, next, prev, options, idx };
}

// Iconos
const ChevronLeft = () => (
   <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 4L6 8L10 12" />
   </svg>
);

const ChevronRight = () => (
   <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 4L10 8L6 12" />
   </svg>
);

// Componente principal
export default function MiniStepper({
   label,
   min = 1,
   allowNull = true,
   nullLabel = "—",
   extras = [],
   onSubmit,
   onChange,
   debounceMs = 380,
   initialValue,
   value // Nuevo: valor controlado
}: MiniStepperProps) {
   const { current, next, prev, options, idx } = useStepper(min, allowNull, nullLabel, extras, onSubmit, onChange, debounceMs, initialValue, value);

   if (!current) return null;

   return (
      <div
         style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
         }}
      >
         {label && (
            <span
               style={{
                  fontSize: 8,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  color: "#6c757d",
                  letterSpacing: "0.3px"
               }}
            >
               {label}
            </span>
         )}
         <div
            style={{
               display: "inline-flex",
               alignItems: "center",
               background: "#fff",
               border: "1px solid #e2e8f0",
               borderRadius: 4,
               overflow: "hidden",
               height: 20
            }}
         >
            <button
               type="button"
               onClick={prev}
               style={{
                  width: 20,
                  height: 20,
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  padding: 0
               }}
               onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
               onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
               <ChevronLeft />
            </button>

            <div
               style={{
                  padding: "0 6px",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 500,
                  color: current.isNull ? "#94a3b8" : "#1e293b",
                  lineHeight: "18px",
                  minWidth: 28,
                  userSelect: "none",
                  borderLeft: "1px solid #e2e8f0",
                  borderRight: "1px solid #e2e8f0"
               }}
            >
               {current.label}
            </div>

            <button
               type="button"
               onClick={next}
               style={{
                  width: 20,
                  height: 20,
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  padding: 0
               }}
               onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
               onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
               <ChevronRight />
            </button>
         </div>

         {options.length > 1 && (
            <span
               style={{
                  fontSize: 7,
                  color: "#cbd5e1",
                  fontFamily: "monospace"
               }}
            >
               {idx + 1}/{options.length}
            </span>
         )}
      </div>
   );
}
