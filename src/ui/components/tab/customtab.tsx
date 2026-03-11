import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = {
   id: string;
   label: string;
   icon?: ReactNode;
   content: ReactNode;
   disabled?: boolean;
   badge?: number | string;
};

type TabsProps = {
   tabs: Tab[];
   defaultTab?: string;
   activeTab?: string;
   onTabChange?: (tabId: string) => void;
   variant?: "modern" | "minimal" | "cards" | "rounded";
   size?: "sm" | "md" | "lg";
   className?: string;
   contentClassName?: string;
   fullWidth?: boolean;
};

export function CustomTab({
   tabs,
   defaultTab,
   activeTab: externalActiveTab,
   onTabChange,
   variant = "modern",
   size = "md",
   className = "",
   contentClassName = "",
   fullWidth = false
}: TabsProps) {
   // Si solo hay un tab, devolvemos solo el contenido
   if (tabs.length === 1) {
      return <div className={`${className}`}>{tabs[0].content}</div>;
   }

   // Estado interno solo si no hay control externo
   const [internalActiveTab, setInternalActiveTab] = useState(defaultTab ?? tabs[0]?.id);

   // Determinar tab activo
   const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

   // Configuración de tamaños mejorada
   const sizeClasses = {
      sm: {
         tab: "px-3 py-2 text-xs",
         icon: "w-3 h-3",
         badge: "text-[10px] px-1.5"
      },
      md: {
         tab: "px-4 py-3 text-sm",
         icon: "w-4 h-4",
         badge: "text-xs px-2"
      },
      lg: {
         tab: "px-6 py-4 text-base",
         icon: "w-5 h-5",
         badge: "text-sm px-2.5"
      }
   };

   // Configuraciones de variantes modernas
  const variantClasses = {
     modern: {
        container: "border-b-2 border-gray-100 bg-gradient-to-b from-white to-gray-50/30",
        active: "text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/40",
        inactive: "text-gray-600 hover:text-gray-900 hover:bg-gray-50/60 hover:border-gray-200",
        content: "bg-gradient-to-br from-white to-gray-50/20"
     },
     minimal: {
        container: "space-x-2 bg-gray-50/50 rounded-2xl p-2 backdrop-blur-sm",
        active: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl shadow-lg shadow-gray-900/20",
        inactive: "text-gray-700 hover:bg-white/80 hover:text-gray-900 rounded-xl hover:shadow-sm",
        content: "bg-transparent"
     },
     cards: {
        container: "bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-3xl p-2 shadow-inner",
        active: "bg-white text-gray-900 shadow-xl shadow-gray-200/50 rounded-2xl border-2 border-blue-100",
        inactive: "text-gray-600 hover:text-gray-900 hover:bg-white/70 rounded-2xl hover:shadow-md transition-shadow",
        content: "bg-gradient-to-br from-white to-blue-50/10 rounded-2xl border-2 border-gray-100 shadow-sm"
     },
     rounded: {
        container: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full p-1.5 shadow-inner",
        active: "bg-gradient-to-br from-white to-gray-50 text-gray-900 shadow-xl shadow-gray-300/40 rounded-full border border-gray-200",
        inactive: "text-gray-600 hover:text-gray-900 rounded-full hover:bg-white/60 hover:shadow-md transition-all",
        content: "bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl shadow-sm"
     }
  };

   const currentVariant = variantClasses[variant];
   const currentSize = sizeClasses[size];

   const handleTabChange = (tabId: string) => {
      if (externalActiveTab === undefined) {
         setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
   };

   // Encontrar el contenido activo
   const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

   return (
      <div className={`w-full ${className}`}>
         {/* Header moderno */}
         <div
            className={`
          flex ${fullWidth ? "w-full" : "w-auto"} 
          ${variant === "modern" ? "border-b border-gray-200" : ""}
          ${currentVariant.container}
          ${variant === "minimal" ? "p-1" : ""}
          ${variant === "cards" ? "mb-4" : "mb-6"}
        `}
         >
            {tabs.map((tab) => {
               const isActive = activeTab === tab.id;

               return (
                  <button
                     key={tab.id}
                     onClick={() => !tab.disabled && handleTabChange(tab.id)}
                     disabled={tab.disabled}
                     className={`
                flex items-center justify-center
                transition-all duration-300 ease-out
                font-medium whitespace-nowrap
                ${currentSize.tab}
                ${isActive ? currentVariant.active : currentVariant.inactive}
                ${tab.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${variant === "modern" ? "border-b-2 border-transparent -mb-px" : ""}
                ${fullWidth ? "flex-1" : ""}
                relative group
              `}
                     role="tab"
                     aria-selected={isActive}
                  >
                     {/* Indicador sutil para hover */}
                     {!isActive && !tab.disabled && variant !== "modern" && (
                        <span className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 rounded-[inherit] transition-opacity duration-200" />
                     )}

                     {/* Ícono */}
                     {tab.icon && <span className={`${currentSize.icon} mr-2 flex items-center justify-center`}>{tab.icon}</span>}

                     {/* Label */}
                     <span className="font-medium tracking-tight">{tab.label}</span>

                     {/* Badge moderno */}
                     {tab.badge !== undefined && tab.badge !== "" && (
                        <span
                           className={`
                    ml-2 py-0.5 ${currentSize.badge}
                    rounded-full font-medium leading-none
                    transition-colors duration-200
                    ${isActive ? (variant === "minimal" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700") : "bg-gray-200 text-gray-700"}
                    ${tab.disabled ? "opacity-50" : ""}
                  `}
                        >
                           {tab.badge}
                        </span>
                     )}

                     {/* Indicador de foco sutil */}
                     {isActive && variant !== "modern" && (
                        <motion.span
                           layoutId={`tab-indicator-${variant}`}
                           className="absolute inset-0 -z-10 rounded-[inherit]"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                     )}
                  </button>
               );
            })}
         </div>

         {/* Contenido con animación moderna */}
         <AnimatePresence mode="wait">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
               transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.5
               }}
               className={`
            ${contentClassName}
            ${variant === "cards" || variant === "rounded" ? "p-6 border border-gray-200 shadow-sm" : "pt-2"}
            ${currentVariant.content}
            ${variant === "cards" ? "rounded-xl" : ""}
            ${variant === "rounded" ? "rounded-2xl" : ""}
            ${variant === "minimal" ? "px-2" : ""}
          `}
            >
               {activeTabContent}
            </motion.div>
         </AnimatePresence>
      </div>
   );
}
