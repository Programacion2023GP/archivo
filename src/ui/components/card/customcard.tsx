import React, { useState, useRef, useEffect, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { MdMoreVert } from "react-icons/md";

type UserCardProps = {
   avatar?: string | ReactNode;
   title: string;
   subtitle?: string;
   children?: () => ReactNode;
   actions?: () => ReactNode;
};

const CustomCard: React.FC<UserCardProps> = ({ title, subtitle, children, actions }) => {
   const [showActions, setShowActions] = useState(false);
   const actionsRef = useRef<HTMLDivElement>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);

   const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

   const hasChildren = !!children;
   const hasActions = !!actions;

   // Cerrar dropdown al hacer clic fuera
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
            setShowActions(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);

      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
         document.removeEventListener("touchstart", handleClickOutside);
      };
   }, []);

   // Posicionar dropdown correctamente
   const toggleActions = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!actionsRef.current) return;

      const rect = actionsRef.current.getBoundingClientRect();
      const dropdownWidth = 160;
      const windowWidth = window.innerWidth;

      let left = rect.left + window.scrollX;
      if (left + dropdownWidth > windowWidth - 16) left = windowWidth - dropdownWidth - 16;

      const top = rect.bottom + window.scrollY + 4;

      setCoords({ top, left });
      setShowActions(!showActions);
   };

   const handleActionClick = (callback: () => void) => {
      return (event: React.MouseEvent) => {
         event.stopPropagation();
         setShowActions(false);
         callback();
      };
   };

   return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 overflow-hidden max-w-sm relative">
         {/* Header */}
         <div className="flex items-center gap-3 relative">
            {/* Title y Subtitle */}
            <div className="flex flex-col flex-1 min-w-0">
               <div className="text-gray-900 font-semibold text-base text-wrap">{title}</div>
               {subtitle && <div className="text-black text-sm text-wrap">{subtitle}</div>}
            </div>

            {/* Actions icon */}
            {hasActions && (
               <div ref={actionsRef} className="ml-1 relative">
                  <button onClick={toggleActions} className="text-gray-500 hover:text-gray-700 p-1 rounded">
                     <MdMoreVert size={20} />
                  </button>
               </div>
            )}
         </div>

         {/* Body */}
         {hasChildren && <div className="mt-1">{children && children()}</div>}

         {/* Dropdown de acciones usando portal */}
         {showActions &&
            hasActions &&
            ReactDOM.createPortal(
               <div
                  ref={dropdownRef}
                  className="fixed bg-white border border-gray-200 rounded-md shadow-md z-[999] py-1"
                  style={{
                     top: coords.top,
                     left: coords.left,
                     minWidth: "160px"
                  }}
                  onClick={(e) => e.stopPropagation()}
               >
                  {actions && actions()}
               </div>,
               document.body
            )}
      </div>
   );
};

export default CustomCard;
