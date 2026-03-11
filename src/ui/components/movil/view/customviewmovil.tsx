import React from "react";
import {
   FiCalendar,
   FiDollarSign,
   FiUser,
   FiMapPin,
   FiPhone,
   FiCreditCard,
   FiAlertCircle,
   FiFileText,
   FiClock,
   FiMail,
   FiHome,
   FiStar,
   FiTag,
   FiPercent,
   FiBox,
   FiDroplet // Asegúrate de importar FiDroplet para el icono de color
} from "react-icons/fi";

// Tipos para la configuración
export type FieldType = "text" | "number" | "currency" | "date" | "datetime" | "phone" | "email" | "badge" | "percentage" | "color" | "custom"; // Agregamos "color"

export interface FieldConfig {
   key: string;
   label: string;
   type: FieldType;
   icon?: React.ReactNode;
   color?: string;
   format?: string;
   render?: (value: any, data: any) => React.ReactNode;
   priority?: number;
}

export interface SectionConfig {
   title: string;
   fields: string[]; // keys de los fields
   columns?: 1 | 2;
   color?: string;
   icon?: React.ReactNode;
}

export interface DataDisplayConfig {
   title: string | ((data: any) => string);
   subtitle?: string | ((data: any) => string);
   badge?: string | ((data: any) => string);
   badgeColor?: string | ((data: any) => string); // Cambiamos a string o función
   fields: FieldConfig[];
   sections: SectionConfig[];
   layout?: "default" | "compact" | "detailed";
}

interface DataDisplayProps {
   data: any;
   config: DataDisplayConfig;
   className?: string;
}

// Componente principal - Solo muestra data
const CustomDataDisplay: React.FC<DataDisplayProps> = ({ data, config, className = "" }) => {
   // Helper functions
   const formatCurrency = (value: number, currency: string = "MXN") => {
      return new Intl.NumberFormat("es-MX", {
         style: "currency",
         currency: currency
      }).format(value);
   };

   const formatDate = (dateString: string, includeTime: boolean = false) => {
      if (!dateString) return "No especificado";
      try {
         const date = new Date(dateString);
         if (isNaN(date.getTime())) return dateString;

         if (includeTime) {
            return new Intl.DateTimeFormat("es-MX", {
               day: "numeric",
               month: "long",
               year: "numeric",
               hour: "2-digit",
               minute: "2-digit"
            }).format(date);
         }
         return new Intl.DateTimeFormat("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long"
         }).format(date);
      } catch {
         return dateString;
      }
   };

   const formatPhone = (phone: string) => {
      if (!phone) return "No especificado";
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length === 10) {
         return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
      }
      return phone;
   };

   // Función para formatear el color
   const formatColor = (color: string) => {
      return (
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
            <span>{color}</span>
         </div>
      );
   };

   // Get field by key
   const getField = (key: string): FieldConfig | undefined => {
      return config.fields.find((field) => field.key === key);
   };

   // Get field value formatted
   const getFieldValue = (field: FieldConfig) => {
      const value = data[field.key];
      if (value === null || value === undefined || value === "") {
         return "No especificado";
      }

      if (field.render) {
         return field.render(value, data);
      }

      switch (field.type) {
         case "currency":
            return typeof value === "number" ? formatCurrency(value) : value;

         case "date":
            return typeof value === "string" ? formatDate(value, false) : value;

         case "datetime":
            return typeof value === "string" ? formatDate(value, true) : value;

         case "phone":
            return typeof value === "string" ? formatPhone(value) : value;

         case "percentage":
            return typeof value === "number" ? `${value}%` : value;

         case "color":
            return typeof value === "string" ? formatColor(value) : value;

         case "badge":
            return <span className={`px-3 py-1 rounded-full text-sm font-medium ${field.color || "bg-gray-100 text-gray-800"}`}>{value}</span>;

         default:
            return value;
      }
   };

   // Render field component
   const renderField = (fieldKey: string) => {
      const field = getField(fieldKey);
      if (!field) return null;

      const value = getFieldValue(field);

      return (
         <div key={field.key} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {field.icon && <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${field.color || "bg-gray-100"}`}>{field.icon}</div>}
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-gray-600 mb-1">{field.label}</p>
               <div className="text-gray-900 font-semibold">{value}</div>
            </div>
         </div>
      );
   };

   // Render section
   const renderSection = (section: SectionConfig) => {
      const fields = section.fields.map((fieldKey) => getField(fieldKey)).filter(Boolean) as FieldConfig[];
      if (fields.length === 0) return null;

      return (
         <div key={section.title} className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg border-b pb-2 flex items-center gap-2">
               {section.icon && <span className="text-gray-600">{section.icon}</span>}
               {section.title}
            </h3>

            <div className={`grid grid-cols-1 ${section.columns === 2 ? "lg:grid-cols-2" : ""} gap-4`}>{section.fields.map((fieldKey) => renderField(fieldKey))}</div>
         </div>
      );
   };

   // Get title and subtitle
   const title = typeof config.title === "function" ? config.title(data) : config.title;
   const subtitle = config.subtitle ? (typeof config.subtitle === "function" ? config.subtitle(data) : config.subtitle) : undefined;
   const badge = config.badge ? (typeof config.badge === "function" ? config.badge(data) : config.badge) : undefined;
   const badgeColor = config.badgeColor
      ? typeof config.badgeColor === "function"
         ? config.badgeColor(data)
         : config.badgeColor
      : "bg-red-100 text-red-800 border border-red-200";

   return (
      <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
         {/* Header */}
         <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-start justify-between">
               <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                  {subtitle && (
                     <div className="flex items-center gap-2 text-gray-600">
                        <FiFileText className="flex-shrink-0" />
                        <span className="text-sm">{subtitle}</span>
                     </div>
                  )}
               </div>

               {badge && <div className={`px-4 py-2 rounded-full text-sm font-semibold ${badgeColor}`}>{badge}</div>}
            </div>
         </div>

         {/* Content Sections */}
         <div className="p-6 space-y-8">{config.sections.map(renderSection)}</div>
      </div>
   );
};
export default CustomDataDisplay;
