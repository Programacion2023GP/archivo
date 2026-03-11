import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
   children: React.ReactNode;
   content: string;
   position?: "top" | "bottom" | "left" | "right";
   delay?: number;
   className?: string;
   maxWidth?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = "top", delay = 200, className = "", maxWidth = 280 }) => {
   const [isVisible, setIsVisible] = useState(false);
   const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
   const [showDelayed, setShowDelayed] = useState(false);
   const [calculatedPosition, setCalculatedPosition] = useState(position);

   const triggerRef = useRef<HTMLDivElement>(null);
   const tooltipRef = useRef<HTMLDivElement>(null);
   const timeoutRef = useRef(null);

   useEffect(() => {
      if (isVisible) {
         timeoutRef.current = setTimeout(() => {
            setShowDelayed(true);
         }, delay);
      } else {
         clearTimeout(timeoutRef.current);
         setShowDelayed(false);
      }

      return () => {
         clearTimeout(timeoutRef.current);
      };
   }, [isVisible, delay]);

   useEffect(() => {
      if (showDelayed && triggerRef.current) {
         updatePosition();

         window.addEventListener("scroll", updatePosition);
         window.addEventListener("resize", updatePosition);

         return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
         };
      }
   }, [showDelayed, position, calculatedPosition]);

   const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let top = 0;
      let left = 0;
      let finalPosition = position;

      const spacing = 8;
      const viewportPadding = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Try preferred position first
      let positionFound = false;
      const positions = [position, ...getAlternativePositions(position)];

      for (const pos of positions) {
         let tempTop = 0;
         let tempLeft = 0;

         switch (pos) {
            case "top":
               tempTop = triggerRect.top + scrollY - tooltipRect.height - spacing;
               tempLeft = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
               break;
            case "bottom":
               tempTop = triggerRect.bottom + scrollY + spacing;
               tempLeft = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
               break;
            case "left":
               tempTop = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
               tempLeft = triggerRect.left + scrollX - tooltipRect.width - spacing;
               break;
            case "right":
               tempTop = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
               tempLeft = triggerRect.right + scrollX + spacing;
               break;
         }

         // Check if position is valid (not covering the trigger and within viewport)
         if (isPositionValid(tempTop, tempLeft, tooltipRect, triggerRect, scrollX, scrollY, viewportWidth, viewportHeight, viewportPadding)) {
            top = tempTop;
            left = tempLeft;
            finalPosition = pos as "top" | "bottom" | "left" | "right";
            positionFound = true;
            break;
         }
      }

      // If no position found, use default with boundary adjustments
      if (!positionFound) {
         switch (position) {
            case "top":
               top = triggerRect.top + scrollY - tooltipRect.height - spacing;
               left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
               break;
            case "bottom":
               top = triggerRect.bottom + scrollY + spacing;
               left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
               break;
            default:
               top = triggerRect.bottom + scrollY + spacing;
               left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
         }

         // Apply viewport boundaries
         left = Math.max(scrollX + viewportPadding, Math.min(left, scrollX + viewportWidth - tooltipRect.width - viewportPadding));
         top = Math.max(scrollY + viewportPadding, Math.min(top, scrollY + viewportHeight - tooltipRect.height - viewportPadding));
      }

      setTooltipPosition({ top, left });
      setCalculatedPosition(finalPosition);
   };

   const isPositionValid = (
      top: number,
      left: number,
      tooltipRect: DOMRect,
      triggerRect: DOMRect,
      scrollX: number,
      scrollY: number,
      viewportWidth: number,
      viewportHeight: number,
      padding: number
   ) => {
      // Check viewport boundaries
      if (left < scrollX + padding || left + tooltipRect.width > scrollX + viewportWidth - padding) return false;
      if (top < scrollY + padding || top + tooltipRect.height > scrollY + viewportHeight - padding) return false;

      // Check if tooltip covers the trigger (we don't want that!)
      const tooltipRight = left + tooltipRect.width;
      const tooltipBottom = top + tooltipRect.height;
      const triggerRight = triggerRect.left + scrollX + triggerRect.width;
      const triggerBottom = triggerRect.top + scrollY + triggerRect.height;

      // Allow minimal overlap only at the edges (for arrow connection)
      const minOverlap = 10;

      if (left < triggerRight && tooltipRight > triggerRect.left + scrollX) {
         if (top < triggerBottom && tooltipBottom > triggerRect.top + scrollY) {
            // They overlap, check if it's too much
            const overlapWidth = Math.min(triggerRight, tooltipRight) - Math.max(triggerRect.left + scrollX, left);
            const overlapHeight = Math.min(triggerBottom, tooltipBottom) - Math.max(triggerRect.top + scrollY, top);

            if (overlapWidth > minOverlap && overlapHeight > minOverlap) {
               return false; // Too much overlap
            }
         }
      }

      return true;
   };

   const getAlternativePositions = (preferred: string): string[] => {
      const allPositions = ["top", "bottom", "left", "right"];
      return allPositions.filter((p) => p !== preferred);
   };

   const handleMouseEnter = () => {
      setIsVisible(true);
   };

   const handleMouseLeave = () => {
      setIsVisible(false);
   };

   // Tooltip arrow styles based on calculated position
   const getArrowStyles = () => {
      const baseClasses = "absolute w-2 h-2 bg-gray-900 border-gray-700 rotate-45";

      switch (calculatedPosition) {
         case "top":
            return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2 border-b border-r`;
         case "bottom":
            return `${baseClasses} -top-1 left-1/2 -translate-x-1/2 border-t border-l`;
         case "left":
            return `${baseClasses} -right-1 top-1/2 -translate-y-1/2 border-t border-r`;
         case "right":
            return `${baseClasses} -left-1 top-1/2 -translate-y-1/2 border-b border-l`;
         default:
            return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2 border-b border-r`;
      }
   };

   return (
      <div
         ref={triggerRef}
         className={`inline-block ${className}`}
         onMouseEnter={handleMouseEnter}
         onMouseLeave={handleMouseLeave}
         onFocus={handleMouseEnter}
         onBlur={handleMouseLeave}
      >
         {children}

         {showDelayed &&
            createPortal(
               <div
                  ref={tooltipRef}
                  role="tooltip"
                  style={{
                     position: "absolute",
                     top: tooltipPosition.top,
                     left: tooltipPosition.left,
                     zIndex: 9999,
                     maxWidth: `${maxWidth}px`
                  }}
                  className="
              px-3 py-2
              text-sm leading-relaxed text-white
              bg-gray-900 backdrop-blur-sm bg-opacity-95
              rounded-lg shadow-xl
              break-words whitespace-pre-wrap
              animate-in fade-in zoom-in-95 duration-150
              border border-gray-700
              pointer-events-none
              font-medium
            "
               >
                  {content}
                  {/* Elegant arrow */}
                  <div className={getArrowStyles()} />
               </div>,
               document.body
            )}
      </div>
   );
};

export default Tooltip;
