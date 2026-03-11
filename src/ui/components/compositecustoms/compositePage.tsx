import { useEffect, useState, type ReactNode } from "react";
import { AiOutlineClose, AiOutlineExpandAlt } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowSize } from "../../../hooks/windossize";

type Direction = "izq" | "der" | "modal";

interface PropsCompositePage {
   table?: () => ReactNode;
   form?: () => ReactNode;
   tableDirection?: Direction;
   formDirection?: Direction;
   isOpen?: boolean;
   onClose?: () => void;
   modalTitle?: string;
   fullModal?: boolean;
}

const CompositePage: React.FC<PropsCompositePage> = ({
   table,
   form,
   tableDirection = "izq",
   formDirection = "der",
   isOpen,
   onClose,
   modalTitle,
   fullModal = true
}) => {
   const [isExpanded, setIsExpanded] = useState(true);
   const [isClosing, setIsClosing] = useState(false);
   const { width: windowWidth } = useWindowSize();

   // Determinar tipo de dispositivo
   const isSmallMobile = windowWidth < 400;
   const isMediumMobile = windowWidth >= 400 && windowWidth < 768;
   const isTablet = windowWidth >= 768 && windowWidth < 1024;
   const isDesktop = windowWidth >= 1024;
   const isMobile = windowWidth < 1024;

   const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
         onClose && onClose();
         setIsClosing(false);
         setIsExpanded(false);
      }, 300);
   };

   const toggleExpand = () => setIsExpanded(!isExpanded);

   // Componente de botón de cerrar optimizado para iOS
   const CloseButton = ({ mobile = false }: { mobile?: boolean }) => {
      if (mobile) {
         return (
            <button
               onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
               }}
               className="fixed top-6 right-4 z-50 w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-xl border-2 border-gray-300 active:bg-gray-50 active:scale-95 transition-transform"
               style={{
                  WebkitTapHighlightColor: "transparent",
                  cursor: "pointer",
                  touchAction: "manipulation",
                  pointerEvents: "auto"
               }}
               aria-label="Cerrar modal"
            >
               <AiOutlineClose size={24} className="text-gray-800" />
            </button>
         );
      }

      return (
         <button
            onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               handleClose();
            }}
            className="p-2 text-gray-500 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
            title="Cerrar"
         >
            <AiOutlineClose size={18} />
         </button>
      );
   };

   // Renderizar contenido del modal
   const renderModalContent = (content?: () => ReactNode) => {
      if (!isOpen || !content) return null;

      // Función para calcular altura del contenido
      const getContentHeight = () => {
         if (isMobile) return `calc(100vh - 160px)`;
         if (isTablet) return `calc(90vh - 120px)`;
         return isExpanded ? `calc(100vh - 120px)` : `calc(90vh - 120px)`;
      };

      // MOBILE: Modal desde abajo con gestos optimizados para iOS
      if (isMobile) {
         return (
            <AnimatePresence>
               {isOpen && (
                  <div className="fixed inset-0 z-[120]">
                     {/* Backdrop con gesto táctil */}
                     <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                     />

                     {/* Botón de cerrar FIJO - COMPLETAMENTE SEPARADO */}
                     <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
                        <div className="pointer-events-auto">
                           <CloseButton mobile />
                        </div>
                     </div>

                     {/* Modal móvil - SIN DRAG en el contenedor principal */}
                     <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl z-40"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                           type: "spring",
                           damping: 25,
                           stiffness: 300,
                           mass: 0.8
                        }}
                        style={{
                           height: "100vh",
                           maxHeight: "100vh",
                           paddingTop: "env(safe-area-inset-top, 0px)"
                        }}
                     >
                        {/* Handle para arrastrar - SOLO ESTE DIV es draggable */}
                        <motion.div
                           className="flex justify-center pt-6 pb-2 cursor-grab active:cursor-grabbing"
                           drag="y"
                           dragConstraints={{ top: 0, bottom: 0 }}
                           dragElastic={0.2}
                           onDragEnd={(event, info) => {
                              if (info.offset.y > 100 || info.velocity.y > 500) {
                                 handleClose();
                              }
                           }}
                           style={{
                              touchAction: "pan-y",
                              WebkitUserSelect: "none",
                              userSelect: "none"
                           }}
                        >
                           <div className="w-24 h-1.5 bg-gray-300 rounded-full" />
                        </motion.div>

                        {/* Header móvil */}
                        <div className="px-6 pt-2 pb-4 bg-white border-b border-gray-200">
                           <h2 className="text-xl font-bold text-gray-900 truncate pr-16 mt-2">{modalTitle || "Modal"}</h2>
                        </div>

                        {/* Contenido scrollable con safe areas para iOS */}
                        <div
                           className="overflow-y-auto"
                           style={{
                              height: getContentHeight(),
                              WebkitOverflowScrolling: "touch",
                              paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))"
                           }}
                        >
                           <div className="px-6 py-4 pb-8">{content()}</div>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>
         );
      }

      // TABLET & DESKTOP
      return (
         <AnimatePresence>
            {isOpen && (
               <div className="fixed inset-0 z-[120]">
                  {/* Backdrop */}
                  <motion.div
                     className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                     onClick={handleClose}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                  />

                  {/* Modal para tablet/desktop */}
                  <motion.div
                     className={`absolute bottom-0 overflow-hidden bg-white shadow-2xl ${
                        isTablet ? "rounded-t-3xl left-0 right-0" : isExpanded ? "rounded-none inset-0" : "rounded-none inset-0"
                     }`}
                     initial={{ y: "100%" }}
                     animate={{ y: 0 }}
                     exit={{ y: "100%" }}
                     transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                        mass: 0.8
                     }}
                     style={{
                        height: isTablet ? "90vh" : isExpanded ? "100vh" : "100vh",
                        maxWidth: isTablet ? "100%" : isExpanded ? "100%" : "100%",
                        left: isTablet ? 0 : isExpanded ? 0 : 0,
                        right: isTablet ? 0 : isExpanded ? 0 : 0,
                        transform: isTablet ? "none" : isExpanded ? "none" : "none"
                     }}
                  >
                     {/* Handle para arrastrar - SOLO DRAG AQUÍ */}
                     <motion.div
                        className="flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(event, info) => {
                           if (info.offset.y > 150 || info.velocity.y > 600) {
                              handleClose();
                           }
                        }}
                     >
                        <div className="w-20 h-1.5 bg-gray-300 rounded-full transition-colors hover:bg-gray-400" />
                     </motion.div>

                     {/* Header */}
                     <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{modalTitle || "Modal"}</h2>

                        <div className="flex items-center gap-2">
                           {!isMobile && (
                              <button
                                 onClick={toggleExpand}
                                 className="p-2 text-gray-500 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                                 title={isExpanded ? "Contraer" : "Expandir"}
                              >
                                 <AiOutlineExpandAlt size={18} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-180"}`} />
                              </button>
                           )}
                           <CloseButton />
                        </div>
                     </div>

                     {/* Contenido */}
                     <div className="overflow-y-auto" style={{ height: getContentHeight() }}>
                        <div className="p-6">{content()}</div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      );
   };

   // El resto del componente sin cambios...
   const bothVisible =
      (tableDirection === "izq" || tableDirection === "der") && (formDirection === "izq" || formDirection === "der") && tableDirection !== formDirection;

   const getLeftWidth = () => {
      if (!bothVisible) return "w-full";
      return tableDirection === "izq" ? "w-full lg:w-3/4" : "w-full lg:w-1/4";
   };

   const getRightWidth = () => {
      if (!bothVisible) return "w-full";
      return tableDirection === "der" ? "w-full lg:w-3/4" : "w-full lg:w-1/4";
   };

   return (
      <>
         {/* Layout principal */}
         <div className={`flex flex-col ${bothVisible ? "lg:flex-row" : ""} gap-3 sm:gap-4 w-full`}>
            {/* SECCIÓN IZQUIERDA */}
            {(tableDirection === "izq" || formDirection === "izq") && (
               <div className={`${getLeftWidth()} min-w-0 transition-all duration-300`}>
                  <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                     {tableDirection === "izq" && table && table()}
                     {formDirection === "izq" && form && form()}
                  </div>
               </div>
            )}

            {/* SECCIÓN DERECHA */}
            {(tableDirection === "der" || formDirection === "der") && (
               <div className={`${getRightWidth()} min-w-0 transition-all duration-300`}>
                  <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                     {formDirection === "der" && form && form()}
                     {tableDirection === "der" && table && table()}
                  </div>
               </div>
            )}
         </div>

         {/* MODALES */}
         {tableDirection === "modal" && renderModalContent(table)}
         {formDirection === "modal" && renderModalContent(form)}
      </>
   );
};

export default CompositePage;
