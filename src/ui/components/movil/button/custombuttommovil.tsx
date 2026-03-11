
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
type ButtonPropsMovil = {
   onClick?: () => void;
   children?: React.ReactNode;
   variant?: "filled" | "outlined" | "text" | "elevated" | "tonal" | "icon";
   color?: "primary" | "secondary" | "success" | "warning" | "error" | "surface";
   size?: "sm" | "md" | "lg";
   type?: "button" | "submit" | "reset";
   disabled?: boolean;
   loading?: boolean;
   fullWidth?: boolean;
   icon?: React.ReactNode;
   iconPosition?: "left" | "right" | "only";
   className?: string;
   elevation?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export const CustomButtonMovil: React.FC<ButtonPropsMovil> = ({
   onClick,
   children,
   type = "button",
   variant = "filled",
   color = "primary",
   size = "md",
   disabled = false,
   loading = false,
   fullWidth = false,
   icon,
   iconPosition = "left",
   elevation = 1,
   className = ""
}) => {
   // Sistema de tamaños Flutter auténtico
   const sizeClasses = {
      sm: "h-9 px-4 text-sm rounded-[20px] min-w-[64px]",
      md: "h-12 px-6 text-base rounded-[28px] min-w-[88px]", // Flutter default
      lg: "h-14 px-8 text-lg rounded-[32px] min-w-[96px]"
   }[size];

   // Sistema de elevación Flutter (shadows)
   const elevationShadows = {
      0: "shadow-none",
      1: "shadow-sm", // elevation: 1 in Flutter
      2: "shadow", // elevation: 2 in Flutter
      3: "shadow-md", // elevation: 3 in Flutter
      4: "shadow-lg", // elevation: 4 in Flutter
      5: "shadow-xl" // elevation: 5 in Flutter
   }[elevation];

   // Colores Material Design 3 (Flutter Colors)
   const colorSchemes = {
      primary: {
         filled: `bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700`,
         outlined: `border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50 active:bg-blue-100`,
         text: `text-blue-500 bg-transparent hover:bg-blue-50 active:bg-blue-100`,
         elevated: `bg-white text-blue-500 shadow-sm hover:bg-blue-50 active:bg-blue-100`,
         tonal: `bg-blue-100 text-blue-800 hover:bg-blue-200 active:bg-blue-300`,
         icon: `text-blue-500 bg-transparent hover:bg-blue-50 active:bg-blue-100`
      },
      secondary: {
         filled: `bg-purple-500 text-white shadow-sm hover:bg-purple-600 active:bg-purple-700`,
         outlined: `border border-purple-500 text-purple-500 bg-transparent hover:bg-purple-50 active:bg-purple-100`,
         text: `text-purple-500 bg-transparent hover:bg-purple-50 active:bg-purple-100`,
         elevated: `bg-white text-purple-500 shadow-sm hover:bg-purple-50 active:bg-purple-100`,
         tonal: `bg-purple-100 text-purple-800 hover:bg-purple-200 active:bg-purple-300`,
         icon: `text-purple-500 bg-transparent hover:bg-purple-50 active:bg-purple-100`
      },
      success: {
         filled: `bg-green-500 text-white shadow-sm hover:bg-green-600 active:bg-green-700`,
         outlined: `border border-green-500 text-green-500 bg-transparent hover:bg-green-50 active:bg-green-100`,
         text: `text-green-500 bg-transparent hover:bg-green-50 active:bg-green-100`,
         elevated: `bg-white text-green-500 shadow-sm hover:bg-green-50 active:bg-green-100`,
         tonal: `bg-green-100 text-green-800 hover:bg-green-200 active:bg-green-300`,
         icon: `text-green-500 bg-transparent hover:bg-green-50 active:bg-green-100`
      },
      warning: {
         filled: `bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700`,
         outlined: `border border-orange-500 text-orange-500 bg-transparent hover:bg-orange-50 active:bg-orange-100`,
         text: `text-orange-500 bg-transparent hover:bg-orange-50 active:bg-orange-100`,
         elevated: `bg-white text-orange-500 shadow-sm hover:bg-orange-50 active:bg-orange-100`,
         tonal: `bg-orange-100 text-orange-800 hover:bg-orange-200 active:bg-orange-300`,
         icon: `text-orange-500 bg-transparent hover:bg-orange-50 active:bg-orange-100`
      },
      error: {
         filled: `bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700`,
         outlined: `border border-red-500 text-red-500 bg-transparent hover:bg-red-50 active:bg-red-100`,
         text: `text-red-500 bg-transparent hover:bg-red-50 active:bg-red-100`,
         elevated: `bg-white text-red-500 shadow-sm hover:bg-red-50 active:bg-red-100`,
         tonal: `bg-red-100 text-red-800 hover:bg-red-200 active:bg-red-300`,
         icon: `text-red-500 bg-transparent hover:bg-red-50 active:bg-red-100`
      },
      surface: {
         filled: `bg-gray-100 text-gray-800 shadow-sm hover:bg-gray-200 active:bg-gray-300`,
         outlined: `border border-gray-400 text-gray-700 bg-transparent hover:bg-gray-50 active:bg-gray-100`,
         text: `text-gray-700 bg-transparent hover:bg-gray-50 active:bg-gray-100`,
         elevated: `bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100`,
         tonal: `bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300`,
         icon: `text-gray-600 bg-transparent hover:bg-gray-50 active:bg-gray-100`
      }
   };

   const isIconOnly = iconPosition === "only" || (!children && icon);

   const iconSizeClasses = {
      sm: "w-9 h-9 rounded-full min-w-9",
      md: "w-12 h-12 rounded-full min-w-12",
      lg: "w-14 h-14 rounded-full min-w-14"
   }[size];

   // Ripple effect como Flutter
   const [ripple, setRipple] = React.useState<{ x: number; y: number; size: number } | null>(null);

   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      setRipple({ x, y, size });

      // Limpiar ripple después de la animación
      setTimeout(() => setRipple(null), 600);

      onClick?.();
   };

   // Spinner de carga Flutter-style
   const LoadingSpinner = () => (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="flex items-center justify-center">
         <div className={`rounded-full border-2 border-current border-t-transparent ${size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}`} />
      </motion.div>
   );

   const currentScheme = colorSchemes[color];
   const variantClass = currentScheme[variant];
   const hasElevation = ["filled", "elevated"].includes(variant);

   return (
      <motion.button
         type={type}
         onClick={handleClick}
         disabled={disabled || loading}
         whileTap={{
            scale: disabled || loading ? 1 : 0.98,
            transition: { duration: 0.1 }
         }}
         whileHover={
            !disabled && !loading
               ? {
                    y: -1,
                    transition: { duration: 0.2 }
                 }
               : {}
         }
         className={`
        relative
        inline-flex items-center justify-center
        font-medium transition-all duration-200
        overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        active:brightness-95
        ${fullWidth ? "w-full" : ""}
        ${isIconOnly ? iconSizeClasses : sizeClasses}
        ${variantClass}
        ${hasElevation ? elevationShadows : ""}
        ${variant === "outlined" || variant === "text" || variant === "icon" ? "border" : ""}
        /* Ocultar en tablets y desktop (≥1024px) */
        lg:hidden
        ${className}
      `}
         style={{
            // Flutter-like styling
            fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif",
            letterSpacing: "0.25px"
         }}
      >
         {/* Ripple Effect como Flutter */}
         <AnimatePresence>
            {ripple && (
               <motion.span
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute rounded-full bg-white"
                  style={{
                     left: ripple.x,
                     top: ripple.y,
                     width: ripple.size,
                     height: ripple.size
                  }}
               />
            )}
         </AnimatePresence>

         {/* Estado de carga */}
         {loading ? (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
               <LoadingSpinner />
               {children && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     Cargando...
                  </motion.span>
               )}
            </motion.div>
         ) : (
            <motion.div className="flex items-center justify-center gap-2" layout>
               {/* Icono izquierdo */}
               {icon && iconPosition !== "right" && !isIconOnly && (
                  <motion.span
                     whileHover={{ scale: 1.1 }}
                     transition={{ type: "spring", stiffness: 400, damping: 10 }}
                     className={`
                flex-shrink-0
                ${children ? (iconPosition === "left" ? "mr-2" : "ml-2") : ""}
              `}
                  >
                     {icon}
                  </motion.span>
               )}

               {/* Contenido del botón */}
               {children && (
                  <motion.span layout className="relative whitespace-nowrap">
                     {children}
                  </motion.span>
               )}

               {/* Icono derecho */}
               {icon && iconPosition === "right" && !isIconOnly && (
                  <motion.span whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="flex-shrink-0 ml-2">
                     {icon}
                  </motion.span>
               )}

               {/* Solo icono */}
               {isIconOnly && (
                  <motion.span whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                     {icon}
                  </motion.span>
               )}
            </motion.div>
         )}

         {/* Overlay de hover como Flutter */}
         {!disabled && !loading && <motion.div className="absolute inset-0 bg-black opacity-0 hover:opacity-5 active:opacity-10" transition={{ duration: 0.15 }} />}
      </motion.button>
   );
};

// Floating Action Button (FAB) como Flutter - Solo móvil
export const FloatingActionButton: React.FC<{
   onClick?: () => void;
   icon: React.ReactNode;
   color?: "primary" | "secondary" | "surface" | "tertiary";
   size?: "small" | "normal" | "large";
   extended?: boolean;
   label?: string;
   className?: string;
   position?: "bottom-right" | "bottom-left" | "bottom-center" | "inline";
}> = ({ onClick, icon, color = "primary", size = "normal", extended = false, label, className = "", position = "bottom-right" }) => {
   // Clases de tamaño
   const sizeClasses = {
      small: "w-12 h-12",
      normal: "w-16 h-16",
      large: "w-24 h-24"
   }[size];

   // Clases de color (Material Design 3)
   const colorClasses = {
      primary: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
      secondary: "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700",
      surface: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
      tertiary: "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300"
   }[color];

   const positionClasses = {
      "bottom-right": "fixed bottom-6 right-6",
      "bottom-left": "fixed bottom-6 left-6",
      "bottom-center": "fixed bottom-6 left-1/2 transform -translate-x-1/2",
      inline: "relative"
   }[position];

   return (
      <motion.button
         onClick={onClick}
         whileTap={{ scale: 0.9 }}
         whileHover={{ scale: 1.05, y: -2 }}
         className={`
            ${positionClasses}
            ${extended ? "px-6 h-14 rounded-[28px]" : `${sizeClasses} rounded-full`}
            ${colorClasses}
            flex items-center justify-center
            font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            active:brightness-95
            shadow-lg
            z-40
            lg:hidden
            ${className}
         `}
         style={{
            paddingBottom: position !== "inline" ? "env(safe-area-inset-bottom, 0)" : "0"
         }}
      >
         {extended && label ? (
            <div className="flex items-center gap-3">
               {icon}
               <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            </div>
         ) : (
            <div className="flex items-center justify-center w-full h-full">{icon}</div>
         )}
      </motion.button>
   );
};

// Componente adicional para grupos de botones - Solo móvil
export const ButtonGroup: React.FC<{
   children: React.ReactNode;
   orientation?: "horizontal" | "vertical";
   className?: string;
}> = ({ children, orientation = "horizontal", className = "" }) => {
   return (
      <div
         className={`
      flex ${orientation === "horizontal" ? "flex-row space-x-2" : "flex-col space-y-2"}
      /* Ocultar en tablets y desktop (≥1024px) */
      lg:hidden
      ${className}
    `}
      >
         {children}
      </div>
   );
};
