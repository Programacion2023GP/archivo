// Badge.tsx
import React from "react";

export type BadgeVariant = "solid" | "outline" | "soft" | "subtle" | "dot";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "neutral";

export interface BadgeProps {
   children?: React.ReactNode;
   variant?: BadgeVariant;
   size?: BadgeSize;
   color?: BadgeColor;
   className?: string;
   icon?: React.ReactNode;
   iconPosition?: "left" | "right";
   removable?: boolean;
   onRemove?: () => void;
   dot?: boolean;
   pill?: boolean;
   pulse?: boolean;
}

const CustomBadge: React.FC<BadgeProps> = ({
   children,
   variant = "solid",
   size = "md",
   color = "primary",
   className = "",
   icon,
   iconPosition = "left",
   removable = false,
   onRemove,
   dot = false,
   pill = false,
   pulse = false
}) => {
   const baseStyles = "inline-flex items-center font-medium transition-all duration-200";

   const sizeStyles = {
      sm: "px-2 py-0.5 text-xs gap-1",
      md: "px-2.5 py-1 text-sm gap-1.5",
      lg: "px-3 py-1.5 text-base gap-2"
   };

   const pillStyles = pill ? "rounded-full" : "rounded-lg";

   const colorConfig = {
      primary: {
         solid: "bg-blue-500 text-white hover:bg-blue-600",
         outline: "border-2 border-blue-500 text-blue-600 bg-transparent hover:bg-blue-50",
         soft: "bg-blue-100 text-blue-700 hover:bg-blue-200",
         subtle: "bg-blue-50 text-blue-600 hover:bg-blue-100",
         dot: "bg-blue-500"
      },
      secondary: {
         solid: "bg-purple-500 text-white hover:bg-purple-600",
         outline: "border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50",
         soft: "bg-purple-100 text-purple-700 hover:bg-purple-200",
         subtle: "bg-purple-50 text-purple-600 hover:bg-purple-100",
         dot: "bg-purple-500"
      },
      success: {
         solid: "bg-green-500 text-white hover:bg-green-600",
         outline: "border-2 border-green-500 text-green-600 bg-transparent hover:bg-green-50",
         soft: "bg-green-100 text-green-700 hover:bg-green-200",
         subtle: "bg-green-50 text-green-600 hover:bg-green-100",
         dot: "bg-green-500"
      },
      danger: {
         solid: "bg-red-500 text-white hover:bg-red-600",
         outline: "border-2 border-red-500 text-red-600 bg-transparent hover:bg-red-50",
         soft: "bg-red-100 text-red-700 hover:bg-red-200",
         subtle: "bg-red-50 text-red-600 hover:bg-red-100",
         dot: "bg-red-500"
      },
      warning: {
         solid: "bg-yellow-500 text-white hover:bg-yellow-600",
         outline: "border-2 border-yellow-500 text-yellow-600 bg-transparent hover:bg-yellow-50",
         soft: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
         subtle: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
         dot: "bg-yellow-500"
      },
      info: {
         solid: "bg-cyan-500 text-white hover:bg-cyan-600",
         outline: "border-2 border-cyan-500 text-cyan-600 bg-transparent hover:bg-cyan-50",
         soft: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
         subtle: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
         dot: "bg-cyan-500"
      },
      neutral: {
         solid: "bg-gray-700 text-white hover:bg-gray-800",
         outline: "border-2 border-gray-500 text-gray-600 bg-transparent hover:bg-gray-50",
         soft: "bg-gray-100 text-gray-700 hover:bg-gray-200",
         subtle: "bg-gray-50 text-gray-600 hover:bg-gray-100",
         dot: "bg-gray-500"
      }
   };

   const getVariantStyles = () => {
      if (variant === "dot") {
         return "";
      }
      return colorConfig[color][variant];
   };

   const dotStyles =
      dot || variant === "dot"
         ? `before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1.5 ${variant === "dot" ? colorConfig[color].dot : ""}`
         : "";

   const pulseStyles = pulse ? "animate-pulse" : "";

   const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
   };

   if (variant === "dot") {
      return (
         <span className="inline-flex items-center">
            <span className={`w-2.5 h-2.5 rounded-full ${colorConfig[color].dot} ${pulseStyles}`} />
            {children && <span className="ml-1.5 text-sm text-gray-600 dark:text-gray-300">{children}</span>}
         </span>
      );
   }

   return (
      <span
         className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${pillStyles}
        ${getVariantStyles()}
        ${dotStyles}
        ${pulseStyles}
        ${className}
      `}
      >
         {icon && iconPosition === "left" && <span className="inline-flex">{icon}</span>}
         {children}
         {icon && iconPosition === "right" && <span className="inline-flex">{icon}</span>}
         {removable && (
            <button onClick={handleRemove} className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors" aria-label="Remove">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         )}
      </span>
   );
};

export default CustomBadge;
