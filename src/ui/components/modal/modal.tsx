import { ReactNode, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
   isOpen: boolean;
   onClose: () => void;
   title: string;
   children: ReactNode;
   showCloseButton?: boolean;
   titleIcon?: ReactNode;
   subtitle?: string;
   headerClassName?: string;
}

const CustomModal = ({ isOpen, onClose, title, children, showCloseButton = true, titleIcon, subtitle, headerClassName = "" }: ModalProps) => {
   useEffect(() => {
      if (isOpen) {
         document.body.style.overflow = "hidden";
      } else {
         document.body.style.overflow = "unset";
      }
      return () => {
         document.body.style.overflow = "unset";
      };
   }, [isOpen]);

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               className="fixed inset-0 z-[999] bg-white"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
            >
               {/* Header elegante */}
               <div className={`sticky top-0 bg-white border-b border-gray-100 z-10 ${headerClassName}`}>
                  <div className="px-6 py-4">
                     <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                           {titleIcon && <div className="mt-1 text-gray-700">{titleIcon}</div>}
                           <div>
                              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                           </div>
                        </div>
                        {showCloseButton && (
                           <button
                              onClick={onClose}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all"
                              aria-label="Cerrar"
                           >
                              <AiOutlineClose size={24} />
                           </button>
                        )}
                     </div>
                  </div>
               </div>

               {/* Contenido */}
               <div className="h-[calc(100vh-80px)] overflow-y-auto">
                  <div className="p-6">{children}</div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default CustomModal;
