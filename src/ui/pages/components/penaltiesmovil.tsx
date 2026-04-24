import {
   FiCalendar,
   FiClock,
   FiUser,
   FiFileText,
   FiHome,
   FiPhone,
   FiMapPin,
   FiBriefcase,
   FiStar,
   FiShield,
   FiAlertCircle,
   FiActivity
} from "react-icons/fi";
import { MdLocalPolice, MdMedicalServices } from "react-icons/md";
import { FaUserTie, FaCarAlt, FaWineBottle } from "react-icons/fa";
import { DataDisplayConfig } from "../../components/movil/view/customviewmovil";
import { DateFormat, formatDatetime } from "../../../utils/formats";
import { CiMoneyBill } from "react-icons/ci";

export const penalizacionesMovilView: DataDisplayConfig = {
   title: (data) => data.name || "Sin nombre",
   subtitle: (data) => `Folio: ${data.id || "N/A"}`,
   badge: (data) => {
      if (data.finish === 1) return "Finalizado";
      if (data.active) return "Activo";
      return "Pendiente";
   },
   badgeColor: (data) => {
      if (data.finish === 1) return "bg-green-100 text-green-800 border-green-200";
      if (data.active) return "bg-blue-100 text-blue-800 border-blue-200";
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
   },

   fields: [
      {
         key: "id",
         label: "Folio",
         type: "text",
         icon: <FiFileText className="text-blue-600 text-lg" />,
         color: "bg-blue-50 border border-blue-100",
         format: "uppercase"
      },
      {
         key: "name",
         label: "Nombre del detenido",
         type: "text",
         icon: <FiUser className="text-red-600 text-lg" />,
         color: "bg-red-50 border border-red-100",
         format: "capitalize"
      },
      {
         key: "detainee_released_to",
         label: "Persona que acudió",
         type: "text",
         icon: <FiUser className="text-purple-600 text-lg" />,
         color: "bg-purple-50 border border-purple-100",
         format: "capitalize",
         render: (value) => value || "No especificado"
      },
      {
         key: "time",
         label: "Hora del incidente",
         type: "text",
         icon: <FiClock className="text-indigo-600 text-lg" />,
         color: "bg-indigo-50 border border-indigo-100",
         render: (value) => formatDatetime(`2025-01-01 ${value}`, true, DateFormat.H_MM_SS_A)
      },
      {
         key: "date",
         label: "Fecha del incidente",
         type: "text",
         icon: <FiCalendar className="text-teal-600 text-lg" />,
         color: "bg-teal-50 border border-teal-100",
         render: (value) => formatDatetime(String(value), true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)
      },
      //   {
      //      key: "image_penaltie",
      //      label: "Foto de la multa",
      //      type: "image",
      //      icon: <FiFileText className="text-amber-600 text-lg" />,
      //      color: "bg-amber-50 border border-amber-100",
      //      render: (value) => (value ? <PhotoZoom src={value} alt="Foto de la multa" /> : "Sin foto")
      //   },
      //   {
      //      key: "images_evidences",
      //      label: "Foto evidencia del ciudadano",
      //      type: "image",
      //      icon: <FiAlertCircle className="text-orange-600 text-lg" />,
      //      color: "bg-orange-50 border border-orange-100",
      //      render: (value) => (value ? <PhotoZoom src={value} alt="Evidencia ciudadano" /> : "Sin evidencia")
      //   },
      {
         key: "doctor",
         label: "Doctor",
         type: "text",
         icon: <MdMedicalServices className="text-emerald-600 text-lg" />,
         color: "bg-emerald-50 border border-emerald-100",
         format: "capitalize"
      },
      {
         key: "cedula",
         label: "Cédula del doctor",
         type: "text",
         icon: <MdMedicalServices className="text-green-600 text-lg" />,
         color: "bg-green-50 border border-green-100"
      },
      {
         key: "person_contraloria",
         label: "Contraloría",
         type: "text",
         icon: <FiShield className="text-cyan-600 text-lg" />,
         color: "bg-cyan-50 border border-cyan-100"
      },
      {
         key: "oficial_payroll",
         label: "Nómina Oficial",
         type: "text",
         icon: <FaUserTie className="text-violet-600 text-lg" />,
         color: "bg-violet-50 border border-violet-100"
      },
      {
         key: "person_oficial",
         label: "Oficial",
         type: "text",
         icon: <MdLocalPolice className="text-blue-600 text-lg" />,
         color: "bg-blue-50 border border-blue-100",
         format: "capitalize"
      },
      {
         key: "vehicle_service_type",
         label: "Tipo de Servicio Vehicular",
         type: "text",
         //  icon: <FiCar className="text-rose-600 text-lg" />,
         color: "bg-rose-50 border border-rose-100"
      },
      {
         key: "alcohol_concentration",
         label: "Concentración de Alcohol",
         type: "text",
         icon: <FaWineBottle className="text-pink-600 text-lg" />,
         color: "bg-pink-50 border border-pink-100",
         render: (value) => `${value}` || "No especificado"
      },
      {
         key: "group",
         label: "Grupo",
         type: "text",
         icon: <FiUser className="text-lime-600 text-lg" />,
         color: "bg-lime-50 border border-lime-100"
      },
      {
         key: "municipal_police",
         label: "Policía Municipal",
         type: "text",
         icon: <MdLocalPolice className="text-sky-600 text-lg" />,
         color: "bg-sky-50 border border-sky-100"
      },
      {
         key: "civil_protection",
         label: "Protección Civil",
         type: "text",
         icon: <FiShield className="text-amber-600 text-lg" />,
         color: "bg-amber-50 border border-amber-100"
      },
      {
         key: "command_vehicle",
         label: "Vehículo Comando",
         type: "text",
         icon: <FaCarAlt className="text-fuchsia-600 text-lg" />,
         color: "bg-fuchsia-50 border border-fuchsia-100"
      },
      {
         key: "command_troops",
         label: "Tropa Comando",
         type: "text",
         icon: <FiBriefcase className="text-rose-600 text-lg" />,
         color: "bg-rose-50 border border-rose-100"
      },
      {
         key: "command_details",
         label: "Detalles Comando",
         type: "text",
         icon: <FiFileText className="text-indigo-600 text-lg" />,
         color: "bg-indigo-50 border border-indigo-100"
      },
      {
         key: "filter_supervisor",
         label: "Supervisor Filtro",
         type: "text",
         icon: <FiStar className="text-yellow-600 text-lg" />,
         color: "bg-yellow-50 border border-yellow-100",
         format: "capitalize"
      },
      {
         key: "cp",
         label: "Código Postal",
         type: "text",
         icon: <FiMapPin className="text-gray-600 text-lg" />,
         color: "bg-gray-50 border border-gray-100"
      },
      {
         key: "city",
         label: "Colonia",
         type: "text",
         icon: <FiHome className="text-gray-700 text-lg" />,
         color: "bg-gray-50 border border-gray-100",
         format: "capitalize"
      },
      {
         key: "finish",
         label: "Estado del caso",
         type: "badge",
         icon: <FiActivity className="text-green-600 text-lg" />,
         color: "bg-gray-50 border border-gray-100",
         render: (value) => (
            <span
               className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  value === 1 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
               }`}
            >
               {value === 1 ? (
                  <>
                     <span className="mr-1">✓</span>
                     Terminado
                  </>
               ) : (
                  <>
                     <span className="mr-1">●</span>
                     Pendiente
                  </>
               )}
            </span>
         )
      },
      {
         key: "age",
         label: "Edad",
         type: "text",
         icon: <FiUser className="text-cyan-600 text-lg" />,
         color: "bg-cyan-50 border border-cyan-100",
         render: (value) => `${value} años` || "No especificada"
      },
      {
         key: "amountAlcohol",
         label: "Cantidad de Alcohol",
         type: "text",
         icon: <FaWineBottle className="text-red-600 text-lg" />,
         color: "bg-red-50 border border-red-100",
         render: (value) => (value ? `${value} ml` : "No especificado")
      },
      {
         key: "number_of_passengers",
         label: "Número de Pasajeros",
         type: "text",
         icon: <FiUser className="text-purple-600 text-lg" />,
         color: "bg-purple-50 border border-purple-100",
         render: (value) => value || "0"
      },
      {
         key: "plate_number",
         label: "Número de Placa",
         type: "text",
         //  icon: <FiCar className="text-blue-600 text-lg" />,
         color: "bg-blue-50 border border-blue-100",
         format: "uppercase"
      },
      {
         key: "detainee_phone_number",
         label: "Teléfono del Detenido",
         type: "text",
         icon: <FiPhone className="text-green-600 text-lg" />,
         color: "bg-green-50 border border-green-100"
      },
      {
         key: "curp",
         label: "CURP",
         type: "text",
         icon: <FiFileText className="text-orange-600 text-lg" />,
         color: "bg-orange-50 border border-orange-100",
         format: "uppercase"
      },
      {
         key: "observations",
         label: "Observaciones",
         type: "text",
         icon: <FiAlertCircle className="text-gray-600 text-lg" />,
         color: "bg-gray-50 border border-gray-100",
         render: (value) => value || "Sin observaciones"
      },
      {
         key: "created_by_name",
         label: "Creado Por",
         type: "text",
         icon: <FiUser className="text-teal-600 text-lg" />,
         color: "bg-teal-50 border border-teal-100",
         format: "capitalize"
      },

       {
         key: "fine_amount",
         label: "Monto de la multa",
         type: "text",
         icon: <FiUser className="text-teal-600 text-lg" />,
         color: "bg-teal-50 border border-teal-100",
         format: "capitalize"
      },
       {
         key: "exit_reason",
         label: "Motivo de la salida",
         type: "text",
         icon: <FiUser className="text-teal-600 text-lg" />,
         color: "bg-teal-50 border border-teal-100",
         format: "capitalize"
      },
      {
         key: "active",
         label: "Estado",
         type: "badge",
         icon: <FiActivity className="text-blue-600 text-lg" />,
         color: "bg-gray-50 border border-gray-100",
         render: (value) => (
            <span
               className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
               {value ? "Activo" : "Desactivado"}
            </span>
         )
      }
   ],
   sections: [
      {
         title: "Información básica",
         icon: <FiFileText className="text-gray-600" />,
         fields: ["id", "name", "date", "time"]
      },
      {
         title: "Datos del incidente",
         icon: <FiAlertCircle className="text-gray-600" />,
         fields: ["alcohol_concentration", "amountAlcohol", "vehicle_service_type", "plate_number"]
      },
      {
         title: "Ubicación",
         icon: <FiMapPin className="text-gray-600" />,
         fields: ["city", "cp"]
      },
      {
         title: "Personal involucrado",
         icon: <FiUser className="text-gray-600" />,
         fields: ["person_oficial", "person_contraloria", "filter_supervisor", "created_by_name"]
      },
      {
         title: "Evidencias",
         icon: <FiFileText className="text-gray-600" />,
         fields: ["image_penaltie", "images_evidences"]
      },
      {
         title: "Información médica",
         icon: <MdMedicalServices className="text-gray-600" />,
         fields: ["doctor", "cedula", "age"]
      },
      {
         title: "Contacto y liberación",
         icon: <FiPhone className="text-gray-600" />,
         fields: ["detainee_phone_number", "detainee_released_to", "finish"]
      },
      {
         title: "Recursos de seguridad",
         icon: <FiShield className="text-gray-600" />,
         fields: ["municipal_police", "civil_protection", "command_vehicle", "command_troops", "command_details"]
      },
      {
         title: "Liberación",
         icon: <CiMoneyBill className="text-gray-600" />,
         fields: ["fine_amount", "exit_reason"]
      },

      {
         title: "Datos adicionales",
         icon: <FiBriefcase className="text-gray-600" />,
         fields: ["group", "oficial_payroll", "number_of_passengers", "curp", "observations", "active"]
      }
   ]
};
