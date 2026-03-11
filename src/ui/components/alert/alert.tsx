import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from "lucide-react";

interface SimpleAlertProps {
   type?: "success" | "error" | "warning" | "info";
   message: string;
   closable?: boolean;
   className?: string;
}

const CustomAlert: React.FC<SimpleAlertProps> = ({ type = "info", message, closable = true, className = "" }) => {
   const [isVisible, setIsVisible] = useState(true);

   const types = {
      success: {
         bg: "bg-green-50 border-green-200",
         text: "text-green-800",
         icon: <CheckCircle className="w-5 h-5 text-green-600" />
      },
      error: {
         bg: "bg-red-50 border-red-200",
         text: "text-red-800",
         icon: <AlertCircle className="w-5 h-5 text-red-600" />
      },
      warning: {
         bg: "bg-yellow-50 border-yellow-200",
         text: "text-yellow-800",
         icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
      },
      info: {
         bg: "bg-blue-50 border-blue-200",
         text: "text-blue-800",
         icon: <Info className="w-5 h-5 text-blue-600" />
      }
   }[type];

   if (!isVisible) return null;

   return (
      <div className={`flex items-center justify-between p-4 rounded-lg border ${types.bg} ${className}`}>
         <div className="flex items-center gap-3">
            {types.icon}
            <span className={`text-sm font-medium ${types.text}`}>{message}</span>
         </div>

         {/* {closable && (
            <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600">
               <X className="w-4 h-4" />
            </button>
         )} */}
      </div>
   );
};
export default CustomAlert;
// Uso:
// <SimpleAlert type="warning" message="Esta es una advertencia" />
// <SimpleAlert type="info" message="Información importante" closable={false} />
