// config/sidebarConfig.ts

import { FaChartLine, FaCode, FaFileInvoiceDollar, FaStopCircle, FaUserTie } from "react-icons/fa";
import { FaBuildingColumns, FaUserDoctor } from "react-icons/fa6";


// Definir los tipos primero
export interface SidebarItemConfig {
   readonly type: "item";
   readonly route: string;
   readonly icon: any;
   readonly label: string;
   readonly requiredPrefix?: string  |string[];
}

export interface SidebarDropdownConfig {
   readonly type: "dropdown";
   readonly label: string;
   readonly requiredPrefix?: string | string[];
   readonly children: readonly SidebarConfig[];
}

export type SidebarConfig = SidebarItemConfig | SidebarDropdownConfig;

// Configuración con tipos correctos
export const sidebarConfig: readonly SidebarConfig[] = [
   {
      type: "item",
      route: "/usuarios",
      icon: FaUserTie,
      label: "Usuarios",
      requiredPrefix: "usuarios_"
   },
   {
      type: "item",
      route: "/multa",
      icon: FaFileInvoiceDollar,
      label: "Multas",
      requiredPrefix: "multas_"
   },
   {
      type: "item",
      route: "/juzgados",
      icon: FaFileInvoiceDollar,
      label: "Juzgados",
      requiredPrefix: "multas_"
   },
   {
      type: "item",
      route: "/logs",
      icon: FaCode,
      label: "Logs",
      requiredPrefix: "vista_"
   },
   {
      type: "dropdown",
      label: "Catalogos",
      requiredPrefix: "catalogo_",
      children: [
         {
            type: "dropdown",
            label: "Alcoholimetros",
            requiredPrefix: ["catalogo_dependencia_", "catalogo_doctor_"] as const,
            children: [
               {
                  type: "item",
                  route: "/catalogos/dependencias",
                  icon: FaBuildingColumns,
                  label: "Dependencias",
                  requiredPrefix: "catalogo_dependencia_"
               },
               {
                  type: "item",
                  route: "/catalogos/doctor",
                  icon: FaUserDoctor,
                  label: "Doctores",
                  requiredPrefix: "catalogo_doctor_"
               }
            ]
         },
         {
            type: "dropdown",
            label: "Vialidad",
            requiredPrefix: "catalogo_motivo_detencion_",
            children: [
               {
                  type: "item",
                  route: "/catalogos/motivodet",
                  icon: FaStopCircle,
                  label: "Motivo detención",
                  requiredPrefix: "catalogo_motivo_detencion_"
               }
            ]
         }
      ]
   },
   {
      type: "dropdown",
      label: "Reportes",
      requiredPrefix: "reports",
      children: [
         {
            type: "item",
            route: "/reportes/dashboard",
            icon: FaChartLine,
            label: "Reporte Dinamico"
         }
      ]
   }
] as const;
