import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { IoIosClose } from "react-icons/io";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { FaSpinner, FaExclamationTriangle, FaCompress, FaExpand, FaDownload, FaSearchPlus, FaSearchMinus } from "react-icons/fa";

interface PhotoZoomProps {
   src?: string;
   alt: string;
   description?: string;
   title?: string;
   placeholderText?: string;
   thumbnailSize?: "xs" | "sm" | "md" | "lg" | "xl";
   shape?: "square" | "circle" | "rounded" | "rounded-lg" | "rounded-full";
   showDownload?: boolean;
   zoomLevels?: number[];
   maxZoom?: number;
   containerClassName?: string;
   imageClassName?: string;
   onZoomChange?: (isZoomed: boolean) => void;
}

const PhotoZoom: React.FC<PhotoZoomProps> = ({
   src,
   alt,
   description,
   title,
   placeholderText = "Sin imagen",
   thumbnailSize = "md",
   shape = "square",
   showDownload = true,
   zoomLevels = [1, 1.5, 2, 3, 4],
   maxZoom = 5,
   containerClassName = "",
   imageClassName = "",
   onZoomChange
}) => {
   const [isZoomed, setIsZoomed] = useState(false);
   const [imageError, setImageError] = useState(false);
   const [imageLoaded, setImageLoaded] = useState(false);
   const [imageSrc, setImageSrc] = useState<string | undefined>(src);
   const [zoomLevel, setZoomLevel] = useState<number>(1);
   const [position, setPosition] = useState({ x: 0, y: 0 });
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [showControls, setShowControls] = useState(true);
   const controlsTimeoutRef = useRef<any | null>(null);

   const imgRef = useRef<HTMLImageElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const modalRef = useRef<HTMLDivElement>(null);
   const portalContainer = useRef<HTMLDivElement>(document.createElement("div"));

   const hasImage = imageSrc && !imageError;

   // Tamaños de miniatura
   const thumbnailSizes = {
      xs: "w-8 h-8",
      sm: "w-10 h-10",
      md: "w-12 h-12",
      lg: "w-16 h-16",
      xl: "w-20 h-20"
   };

   // Clases de forma
   const shapeClasses = {
      square: "rounded-none",
      circle: "rounded-full",
      rounded: "rounded-md",
      "rounded-lg": "rounded-lg",
      "rounded-full": "rounded-full"
   };

   // Estilo de imagen según forma
   const getImageStyle = () => {
      if (shape === "circle") {
         return "object-cover";
      }
      return "object-contain";
   };

   // Control de visibilidad de controles
   const hideControls = useCallback(() => {
      setShowControls(false);
      if (controlsTimeoutRef.current) {
         clearTimeout(controlsTimeoutRef.current);
         controlsTimeoutRef.current = null;
      }
   }, []);

   const showControlsTemporarily = useCallback(() => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
         clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
         setShowControls(false);
      }, 3000);
   }, []);

   // Pantalla completa
   const toggleFullscreen = useCallback(() => {
      if (!modalRef.current) return;

      if (!document.fullscreenElement) {
         modalRef.current.requestFullscreen?.().then(() => {
            setIsFullscreen(true);
         });
      } else {
         document.exitFullscreen?.().then(() => {
            setIsFullscreen(false);
         });
      }
   }, []);

   // Zoom functions
   const zoomIn = useCallback(() => {
      setZoomLevel((prev) => {
         const currentIndex = zoomLevels.indexOf(prev);
         const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
         return zoomLevels[nextIndex];
      });
   }, [zoomLevels]);

   const zoomOut = useCallback(() => {
      setZoomLevel((prev) => {
         const currentIndex = zoomLevels.indexOf(prev);
         const prevIndex = Math.max(currentIndex - 1, 0);
         return zoomLevels[prevIndex];
      });
   }, [zoomLevels]);

   const resetZoom = useCallback(() => {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
   }, []);

   // Panning
   const handlePan = useCallback(
      (event: any, info: PanInfo) => {
         if (zoomLevel > 1) {
            setPosition((prev) => ({
               x: prev.x + info.delta.x,
               y: prev.y + info.delta.y
            }));
         }
      },
      [zoomLevel]
   );

   // Toggle zoom
   const toggleZoom = useCallback(
      (e?: React.MouseEvent | React.KeyboardEvent) => {
         if (e) {
            e.stopPropagation();
            if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter" && (e as React.KeyboardEvent).key !== " ") {
               return;
            }
         }

         if (hasImage) {
            const newZoomedState = !isZoomed;
            setIsZoomed(newZoomedState);
            setZoomLevel(1);
            setPosition({ x: 0, y: 0 });
            setShowControls(true);

            if (onZoomChange) {
               onZoomChange(newZoomedState);
            }

            // Mostrar controles temporalmente
            showControlsTemporarily();
         }
      },
      [hasImage, isZoomed, onZoomChange, showControlsTemporarily]
   );

   const handleClose = useCallback(
      (e: React.MouseEvent) => {
         e.stopPropagation();
         setIsZoomed(false);
         setZoomLevel(1);
         setPosition({ x: 0, y: 0 });

         if (onZoomChange) {
            onZoomChange(false);
         }
      },
      [onZoomChange]
   );

   // Manejo de teclado mejorado
   const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
         if (!isZoomed) return;

         // Prevenir comportamiento por defecto solo cuando sea necesario
         switch (e.key) {
            case "Escape":
               e.preventDefault();
               setIsZoomed(false);
               setZoomLevel(1);
               setPosition({ x: 0, y: 0 });
               break;
            case "+":
            case "=":
               if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  zoomIn();
               }
               break;
            case "-":
               if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  zoomOut();
               }
               break;
            case "0":
               if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  resetZoom();
               }
               break;
            case "f":
            case "F":
               e.preventDefault();
               toggleFullscreen();
               break;
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
               if (zoomLevel > 1) {
                  e.preventDefault();
                  const step = 30;
                  setPosition((prev) => ({
                     x: prev.x + (e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0),
                     y: prev.y + (e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0)
                  }));
               }
               break;
         }
      },
      [isZoomed, zoomLevel, zoomIn, zoomOut, toggleFullscreen]
   );

   // Scroll zoom
   const handleWheel = useCallback(
      (e: WheelEvent) => {
         if (!isZoomed || !modalRef.current) return;

         e.preventDefault();
         if (e.ctrlKey || e.metaKey) {
            if (e.deltaY < 0) {
               zoomIn();
            } else {
               zoomOut();
            }
         } else if (zoomLevel > 1) {
            setPosition((prev) => ({
               x: prev.x - e.deltaX,
               y: prev.y - e.deltaY
            }));
         }
      },
      [isZoomed, zoomLevel, zoomIn, zoomOut]
   );

   // Descargar imagen
   const downloadImage = useCallback(async () => {
      if (!imageSrc) return;

      try {
         const response = await fetch(imageSrc);
         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = alt || "imagen";
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);
      } catch (error) {
         console.error("Error al descargar la imagen:", error);
      }
   }, [imageSrc, alt]);

   // Crear contenedor para portal al montar
   useEffect(() => {
      const container = portalContainer.current;
      container.id = "photo-zoom-portal";
      document.body.appendChild(container);

      return () => {
         if (document.body.contains(container)) {
            document.body.removeChild(container);
         }
         if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
         }
      };
   }, []);

   // Sincronizar imageSrc
   useEffect(() => {
      if (src !== imageSrc) {
         setImageError(false);
         setImageLoaded(false);
         setImageSrc(src);
      }
   }, [src, imageSrc]);

   // Event listeners mejorados
   useEffect(() => {
      const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
      document.addEventListener("keydown", handleKeyDownWrapper);

      const handleWheelWrapper = (e: WheelEvent) => handleWheel(e);
      document.addEventListener("wheel", handleWheelWrapper, { passive: false });

      return () => {
         document.removeEventListener("keydown", handleKeyDownWrapper);
         document.removeEventListener("wheel", handleWheelWrapper);
      };
   }, [handleKeyDown, handleWheel]);

   // Control de scroll y fullscreen
   useEffect(() => {
      if (isZoomed) {
         document.body.style.overflow = "hidden";
         document.body.style.paddingRight = "0px";
         showControlsTemporarily();
      } else {
         document.body.style.overflow = "auto";
         document.body.style.paddingRight = "0px";
         setIsFullscreen(false);
      }

      return () => {
         document.body.style.overflow = "auto";
         document.body.style.paddingRight = "0px";
      };
   }, [isZoomed, showControlsTemporarily]);

   // Preload de imagen
   useEffect(() => {
      if (src && !imageLoaded) {
         const img = new Image();
         img.src = src;
         img.onload = () => {
            if (src === imageSrc) {
               setImageLoaded(true);
               setImageError(false);
            }
         };
         img.onerror = () => {
            if (src === imageSrc) {
               setImageError(true);
               setImageLoaded(false);
            }
         };
      }
   }, [src, imageSrc, imageLoaded]);

   const handleImageError = () => {
      setImageError(true);
      setImageLoaded(false);
   };

   const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
   };

   // Render miniatura
   const renderThumbnail = () => {
      const shapeClass = shapeClasses[shape];
      const imageStyleClass = getImageStyle();

      if (hasImage) {
         return (
            <div className="relative">
               <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative overflow-hidden shadow-md cursor-zoom-in ${thumbnailSizes[thumbnailSize]} ${shapeClass} ${containerClassName}`}
                  onClick={toggleZoom}
                  role="button"
                  tabIndex={0}
                  onKeyDown={toggleZoom}
                  aria-label={`Ver imagen ampliada: ${alt}`}
               >
                  <img
                     ref={imgRef}
                     src={imageSrc}
                     alt={alt}
                     className={`w-full h-full ${imageStyleClass} transition-opacity duration-300 ${!imageLoaded ? "opacity-0" : "opacity-100"} ${imageClassName}`}
                     onError={handleImageError}
                     onLoad={handleImageLoad}
                     loading="lazy"
                     style={{
                        aspectRatio: shape === "circle" ? "1/1" : "auto"
                     }}
                  />
                  {!imageLoaded && (
                     <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 ${shapeClass}`}>
                        <FaSpinner className="text-gray-400 animate-spin" size={14} />
                     </div>
                  )}
                  <div className={`absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-300 ${shapeClass}`} />
               </motion.div>
               <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <FaSearchPlus size={10} className="text-white" />
               </div>
            </div>
         );
      }

      return (
         <div
            className={`${thumbnailSizes[thumbnailSize]} ${shapeClass} bg-gray-200 flex flex-col items-center justify-center border border-gray-300 ${containerClassName}`}
            title="No hay imagen disponible"
         >
            <FaExclamationTriangle className="text-gray-400 mb-1" size={14} />
            <span className="text-xs text-gray-500 text-center leading-tight">{placeholderText}</span>
         </div>
      );
   };

   return (
      <div className={`relative inline-block ${containerClassName}`} ref={containerRef}>
         {renderThumbnail()}

         {description && hasImage && <p className="mt-2 text-sm text-gray-600 text-center max-w-xs break-words line-clamp-2">{description}</p>}

         {/* Modal de zoom usando portal */}
         {ReactDOM.createPortal(
            <AnimatePresence>
               {isZoomed && hasImage && (
                  <motion.div
                     ref={modalRef}
                     className="fixed inset-0 bg-black z-[999]"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: isFullscreen ? 1 : 0.95 }}
                     exit={{ opacity: 0 }}
                     onClick={hideControls}
                  >
                     {/* Controles superiores */}
                     <motion.div
                        className={`fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 z-50 transition-all duration-300 ${
                           showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                        }`}
                        onMouseEnter={showControlsTemporarily}
                        onMouseLeave={hideControls}
                     >
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              zoomOut();
                           }}
                           className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                           aria-label="Alejar"
                        >
                           <FaSearchMinus size={18} />
                        </button>
                        <span className="text-white font-medium min-w-[60px] text-center text-sm">{Math.round(zoomLevel * 100)}%</span>
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              zoomIn();
                           }}
                           className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                           aria-label="Acercar"
                        >
                           <FaSearchPlus size={18} />
                        </button>
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              resetZoom();
                           }}
                           className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                           aria-label="Restablecer zoom"
                        >
                           <FaCompress size={18} />
                        </button>

                        {showDownload && (
                           <>
                              <div className="h-5 w-px bg-white/40" />
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage();
                                 }}
                                 className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                                 aria-label="Descargar imagen"
                              >
                                 <FaDownload size={18} />
                              </button>
                           </>
                        )}

                        <div className="h-5 w-px bg-white/40" />
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              toggleFullscreen();
                           }}
                           className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                           aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                           {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
                        </button>

                        <div className="h-5 w-px bg-white/40" />
                        <button onClick={handleClose} className="p-2 text-white hover:bg-red-500/80 rounded-full transition-colors" aria-label="Cerrar">
                           <IoIosClose size={24} />
                        </button>
                     </motion.div>

                     {/* Contenedor de imagen */}
                     <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        drag={zoomLevel > 1}
                        dragConstraints={{
                           left: (-window.innerWidth * (zoomLevel - 1)) / 2,
                           right: (window.innerWidth * (zoomLevel - 1)) / 2,
                           top: (-window.innerHeight * (zoomLevel - 1)) / 2,
                           bottom: (window.innerHeight * (zoomLevel - 1)) / 2
                        }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={handlePan}
                        animate={{
                           x: position.x,
                           y: position.y,
                           scale: zoomLevel
                        }}
                        transition={{
                           type: "spring",
                           stiffness: 400,
                           damping: 30
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                           cursor: zoomLevel > 1 ? "grab" : "default"
                        }}
                     >
                        <img
                           src={imageSrc}
                           alt={alt}
                           className="max-w-[95vw] max-h-[85vh] object-contain select-none"
                           draggable="false"
                           onContextMenu={(e) => e.preventDefault()}
                        />

                        {!imageLoaded && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <FaSpinner className="text-white text-3xl animate-spin mr-3" />
                              <span className="text-white text-lg">Cargando imagen...</span>
                           </div>
                        )}
                     </motion.div>

                     {/* Información inferior */}
                     {(title || description) && (
                        <motion.div
                           className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-3xl w-full px-4 z-50 transition-all duration-300 ${
                              showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                           }`}
                           onMouseEnter={showControlsTemporarily}
                           onMouseLeave={hideControls}
                        >
                           <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 text-white">
                              {title && <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>}
                              {description && <p className="text-center text-gray-200 text-sm md:text-base">{description}</p>}
                           </div>
                        </motion.div>
                     )}

                     {/* Indicador de atajos */}
                     <motion.div
                        className="fixed bottom-4 right-4 bg-black/60 text-white text-xs p-3 rounded-xl backdrop-blur-sm z-50"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 0.7, x: 0 }}
                        whileHover={{ opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                     >
                        {/* <div className="font-semibold mb-1">Atajos:</div>
                        <div>ESC: Cerrar</div>
                        <div>Ctrl + +/-: Zoom</div>
                        <div>Ctrl + 0: Reset</div>
                        <div>F: Pantalla completa</div>
                        <div className="mt-2 text-[10px] opacity-70">Click para ocultar controles</div> */}
                     </motion.div>

                     {/* Overlay para cerrar */}
                     <div className="absolute inset-0 z-40" onClick={handleClose} aria-label="Cerrar visor" role="button" tabIndex={-1} />
                  </motion.div>
               )}
            </AnimatePresence>,
            portalContainer.current
         )}
      </div>
   );
};

export default PhotoZoom;
