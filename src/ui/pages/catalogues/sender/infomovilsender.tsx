import { FiDroplet, FiUser } from "react-icons/fi";
import { DataDisplayConfig } from "../../../components/movil/view/customviewmovil";

// Ejemplo de configuración para usuario
export const senderMovilView: DataDisplayConfig = {
   title: (data) => data.name || "Remitente",
   badge: (data) => data.name || "Remitente",
   badgeColor: (data) => {
   
      return "bg-green-100 text-green-800 border-green-200";
   },

   fields: [
      {
         key: "name",
         label: "Nombre completo",
         type: "text",
         icon: <FiUser className="text-purple-600 text-lg" />,
         color: "bg-purple-50 border border-purple-100",
         format: "capitalize"
      }
   ],

   sections: [
      {
         title: "Información",
         icon: <FiUser className="text-gray-600" />,
         fields: ["name"]
      }
   ]
};
