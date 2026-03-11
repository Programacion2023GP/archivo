import { useEffect, useState, useMemo } from "react";
import { LuRefreshCcw, LuArrowUpDown, LuFilter, LuExternalLink } from "react-icons/lu";
import {
   FaUser,
   FaCalendarAlt,
   FaInfoCircle,
   FaExclamationTriangle,
   FaDatabase,
   FaExchangeAlt,
   FaCheck,
   FaTimes,
   FaEdit,
   FaKey,
   FaCalendar,
   FaEnvelope,
   FaPhone,
   FaMapMarker,
   FaIdCard,
   FaEye,
   FaTrash,
   FaPlus,
   FaNetworkWired,
   FaClock,
   FaArrowRight,
   FaChevronRight,
   FaChevronLeft,
   FaExpand,
   FaSync,
   FaRegCheckCircle,
   FaTag,
   FaHistory
} from "react-icons/fa";
import { CustomButton } from "../../components/button/custombuttom";
import CustomTable from "../../components/table/customtable";
import Tooltip from "../../components/toltip/Toltip";
import { useLogsState } from "../../../store/logs/logs.store";
import { LogsApi } from "../../../infrastructure/logs/logs.infra";
import Spinner from "../../components/loading/loading";

// Componente para el modal de detalles
const ChangeDetailsModal = ({ isOpen, onClose, log }: { isOpen: boolean; onClose: () => void; log: any }) => {
   if (!isOpen || !log) return null;

   const getActionColor = (action: string) => {
      switch (action?.toLowerCase()) {
         case "creado":
            return "bg-green-500";
         case "actualizado":
            return "bg-blue-500";
         case "eliminado":
            return "bg-red-500";
         default:
            return "bg-gray-500";
      }
   };

   const getActionIcon = (action: string) => {
      switch (action?.toLowerCase()) {
         case "creado":
            return FaPlus;
         case "actualizado":
            return FaExchangeAlt;
         case "eliminado":
            return FaTrash;
         default:
            return FaDatabase;
      }
   };

   const ActionIcon = getActionIcon(log.action);

   // Función para formatear valores
   const formatValue = (value: any) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "boolean") return value ? "Sí" : "No";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
   };

   // Obtener campos cambiados
   const getChangedFields = () => {
      const changed: Array<{ field: string; old: any; new: any }> = [];
      const allFields = new Set([...Object.keys(log.oldValues || {}), ...Object.keys(log.newValues || {})]);

      allFields.forEach((field) => {
         const oldVal = log.oldValues?.[field];
         const newVal = log.newValues?.[field];

         if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changed.push({ field, old: oldVal, new: newVal });
         }
      });

      return changed;
   };

   const changedFields = getChangedFields();
   // Funciones de utilidad
   const formatFieldName = (fieldName: string): string => {
      const nameMap: Record<string, string> = {
         firstName: "Nombre",
         lastName: "Apellido",
         email: "Correo electrónico",
         phone: "Teléfono",
         address: "Dirección"
         // Agrega más mapeos según tus campos
      };

      return (
         nameMap[fieldName] ||
         fieldName
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase())
      );
   };

   const getFieldCategory = (fieldName: string): string => {
      const categories: Record<string, string> = {
         firstName: "Información Personal",
         lastName: "Información Personal",
         email: "Contacto",
         phone: "Contacto",
         address: "Ubicación"
         // Agrega más categorías
      };

      return categories[fieldName] || "General";
   };

   const getChangeType = (oldValue: any, newValue: any): "added" | "removed" | "modified" | "replaced" => {
      if (!oldValue && newValue) return "added";
      if (oldValue && !newValue) return "removed";
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
         return oldValue.length !== newValue.length ? "modified" : "replaced";
      }
      return "modified";
   };

   const getChangeTypeStyles = (type: string) => {
      const styles = {
         added: {
            bg: "bg-green-100",
            text: "text-green-600",
            icon: "+"
         },
         removed: {
            bg: "bg-red-100",
            text: "text-red-600",
            icon: "-"
         },
         modified: {
            bg: "bg-blue-100",
            text: "text-blue-600",
            icon: "~"
         },
         replaced: {
            bg: "bg-purple-100",
            text: "text-purple-600",
            icon: "↔"
         }
      };

      return styles[type as keyof typeof styles] || styles.modified;
   };

   // Función mejorada para formatear valores

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl text-white ${getActionColor(log.action)}`}>
                     <ActionIcon size={24} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900">Detalles del Cambio</h2>
                     <p className="text-gray-600">Revisión completa de las modificaciones</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaTimes size={20} className="text-gray-500" />
               </button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6">
               {/* Información General */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                     <div className="text-blue-600 text-sm font-semibold mb-1">Acción</div>
                     <div className="text-blue-900 font-bold">{log.action || "N/A"}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                     <div className="text-green-600 text-sm font-semibold mb-1">Usuario</div>
                     <div className="text-green-900 font-bold">{log.user || "Desconocido"}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                     <div className="text-purple-600 text-sm font-semibold mb-1">Módulo</div>
                     <div className="text-purple-900 font-bold">{log.model || "N/A"}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                     <div className="text-orange-600 text-sm font-semibold mb-1">IP</div>
                     <div className="text-orange-900 font-mono text-sm">{log.ipAddress || "N/A"}</div>
                  </div>
               </div>

               {/* Resumen de Cambios */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Campos Modificados</h3>
                        <p className="text-sm text-gray-500 mt-1">
                           {changedFields.length} cambio{changedFields.length !== 1 ? "s" : ""} detectado{changedFields.length !== 1 ? "s" : ""}
                        </p>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                        <FaSync className="text-blue-600" size={14} />
                        <span className="text-sm font-medium text-blue-700">Modo comparación</span>
                     </div>
                  </div>

                  {changedFields.length === 0 ? (
                     <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <FaRegCheckCircle className="mx-auto mb-3 text-green-400" size={48} />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Sin cambios detectados</h4>
                        <p className="text-gray-500 max-w-md mx-auto">Todos los valores se mantienen iguales. No se han realizado modificaciones en los datos.</p>
                     </div>
                  ) : (
                     <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        {/* Header fijo */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                           <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                              <div className="col-span-4 flex items-center gap-2">
                                 <FaTag className="text-gray-400" size={14} />
                                 <span>Campo</span>
                              </div>
                              <div className="col-span-4 flex items-center gap-2 text-red-600">
                                 <FaHistory className="text-red-500" size={14} />
                                 <span>Valor Anterior</span>
                              </div>
                              <div className="col-span-4 flex items-center gap-2 text-green-600">
                                 <FaArrowRight className="text-green-500" size={14} />
                                 <span>Valor Nuevo</span>
                              </div>
                           </div>
                        </div>

                        {/* Lista de cambios */}
                        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                           {changedFields.map((change, index) => {
                              const isLast = index === changedFields.length - 1;
                              const changeType = getChangeType(change.old, change.new);

                              return (
                                 <div
                                    key={`${change.field}-${index}`}
                                    className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-200 ${!isLast ? "border-b border-gray-100" : ""}`}
                                 >
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                       {/* Nombre del campo */}
                                       <div className="col-span-4">
                                          <div className="flex items-start gap-3">
                                             <div
                                                className={`
                      mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${getChangeTypeStyles(changeType).bg} ${getChangeTypeStyles(changeType).text}
                    `}
                                             >
                                                {getChangeTypeStyles(changeType).icon}
                                             </div>
                                             <div>
                                                <span className="font-medium text-gray-900 block capitalize">{formatFieldName(change.field)}</span>
                                                <span className="text-xs text-gray-500 mt-1 block">{getFieldCategory(change.field)}</span>
                                             </div>
                                          </div>
                                       </div>

                                       {/* Valor anterior */}
                                       <div className="col-span-4">
                                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 group hover:bg-red-100 transition-colors">
                                             <div className="flex items-center gap-2 mb-1">
                                                <FaTimes className="text-red-500 flex-shrink-0" size={12} />
                                                <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Anterior</span>
                                             </div>
                                             <div className="text-red-900 font-medium break-words">{formatValue(change.old)}</div>
                                             {change.old && (
                                                <div className="text-xs text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   {typeof change.old === "string"
                                                      ? `${change.old.length} caracteres`
                                                      : typeof change.old === "number"
                                                      ? "Valor numérico"
                                                      : Array.isArray(change.old)
                                                      ? `${change.old.length} elementos`
                                                      : "Otro tipo"}
                                                </div>
                                             )}
                                          </div>
                                       </div>

                                       {/* Valor nuevo */}
                                       <div className="col-span-4">
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 group hover:bg-green-100 transition-colors">
                                             <div className="flex items-center gap-2 mb-1">
                                                <FaCheck className="text-green-500 flex-shrink-0" size={12} />
                                                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Nuevo</span>
                                             </div>
                                             <div className="text-green-900 font-medium break-words">{formatValue(change.new)}</div>
                                             {change.new && (
                                                <div className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   {typeof change.new === "string"
                                                      ? `${change.new.length} caracteres`
                                                      : typeof change.new === "number"
                                                      ? "Valor numérico"
                                                      : Array.isArray(change.new)
                                                      ? `${change.new.length} elementos`
                                                      : "Otro tipo"}
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>

                        {/* Footer con resumen */}
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                           <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4 text-gray-600">
                                 <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span>Modificado: {changedFields.length}</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Agregados: {changedFields.filter((f) => !f.old && f.new).length}</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span>Eliminados: {changedFields.filter((f) => f.old && !f.new).length}</span>
                                 </div>
                              </div>
                              <div className="text-gray-500">Actualizado: {new Date().toLocaleTimeString()}</div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Lista de Cambios */}
            
               {/* Información Adicional */}
               <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl border">
                     <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaClock className="text-blue-500" />
                        Información de Tiempo
                     </h4>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Fecha:</span>
                           <span className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Hora:</span>
                           <span className="font-medium">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border">
                     <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaNetworkWired className="text-green-500" />
                        Información de Red
                     </h4>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-gray-600">IP Address:</span>
                           <span className="font-mono font-medium">{log.ipAddress || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-600">Método HTTP:</span>
                           <span className="font-medium">{log.httpMethod || "N/A"}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
               <div className="text-sm text-gray-600">
                  ID del registro: <span className="font-mono">{log.id}</span>
               </div>
               <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">
                  Cerrar Detalles
               </button>
            </div>
         </div>
      </div>
   );
};

// Componente para el badge de acción en la tabla
const ActionBadge = ({ action }: { action: string }) => {
   const getActionConfig = (action: string) => {
      const config = {
         creado: {
            icon: FaPlus,
            color: "bg-green-100 text-green-800 border-green-200",
            gradient: "from-green-500 to-green-600"
         },
         actualizado: {
            icon: FaExchangeAlt,
            color: "bg-blue-100 text-blue-800 border-blue-200",
            gradient: "from-blue-500 to-blue-600"
         },
         eliminado: {
            icon: FaTrash,
            color: "bg-red-100 text-red-800 border-red-200",
            gradient: "from-red-500 to-red-600"
         },
         login: {
            icon: FaUser,
            color: "bg-purple-100 text-purple-800 border-purple-200",
            gradient: "from-purple-500 to-purple-600"
         }
      };

      const actionLower = action?.toLowerCase() || "";
      return (
         config[actionLower as keyof typeof config] || {
            icon: FaDatabase,
            color: "bg-gray-100 text-gray-800 border-gray-200",
            gradient: "from-gray-500 to-gray-600"
         }
      );
   };

   const { icon: Icon, color, gradient } = getActionConfig(action);

   return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${color} shadow-sm`}>
         <div className={`p-1 rounded-full bg-gradient-to-r ${gradient} text-white`}>
            <Icon size={12} />
         </div>
         <span className="font-semibold text-sm">{action ? action.charAt(0).toUpperCase() + action.slice(1) : "N/A"}</span>
      </div>
   );
};

// Componente para la tarjeta de estadísticas
const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
   <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
         <div>
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
         </div>
         <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="text-white" size={24} />
         </div>
      </div>
   </div>
);

const PageLogs = () => {
   const { fetchLogs, logs, loading } = useLogsState();
   const api = new LogsApi();
   const [selectedLog, setSelectedLog] = useState<any>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [logsMap, setLogsMap] = useState<Record<number, any>>({});

   useEffect(() => {
      fetchLogs(api);
   }, []);

   /** 🎯 Traducción de nombres de modelo */
   const translateModelName = (model: string) => {
      const map: Record<string, string> = {
         Penalty: "Multas",
         User: "Usuarios",
         Official: "Oficiales",
         Driver: "Conductores",
         Vehicle: "Vehículos",
         Payment: "Pagos"
      };
      return map[model] || model;
   };

   /** 🕒 Formato fecha mejorado */
   const formatDateTime = (dateString: string) => {
      if (!dateString) return "-";
      const date = new Date(dateString.replace(" ", "T"));
      return (
         <div className="flex flex-col bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center gap-2 text-gray-600">
               <FaCalendar className="text-blue-500" size={12} />
               <span className="font-medium text-sm">{date.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
               <FaClock className="text-green-500" size={10} />
               <span className="text-xs">{date.toLocaleTimeString()}</span>
            </div>
         </div>
      );
   };

   // Función para contar cambios
   const countChanges = (oldValues: any, newValues: any) => {
      const allFields = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);

      let changes = 0;
      allFields.forEach((field) => {
         if (JSON.stringify(oldValues?.[field]) !== JSON.stringify(newValues?.[field])) {
            changes++;
         }
      });

      return changes;
   };

   /** 🔄 Adaptar datos del backend */
   const formattedLogs = useMemo(() => {
      return logs.map((log: any) => {
         const changesCount = countChanges(log.valores_anteriores || {}, log.valores_nuevos || {});

         return {
            id: log.id,
            action: log.accion,
            user: log.usuario,
            model: translateModelName(log.modelo),
            ipAddress: log.ip,
            httpMethod: log.metodo_http,
            createdAt: log.fecha,
            oldValues: log.valores_anteriores || {},
            newValues: log.valores_nuevos || {},
            changesCount: changesCount
         };
      });
   }, [logs]);

   // Crear mapa de logs para acceso rápido por ID
   useEffect(() => {
      const map: Record<number, any> = {};
      formattedLogs.forEach((log) => {
         map[log.id] = log;
      });
      setLogsMap(map);
   }, [formattedLogs]);

   // Función para abrir el modal de detalles
   const openDetailsModal = (logId: number) => {
      const log = logsMap[logId];
      if (log) {
         setSelectedLog(log);
         setIsModalOpen(true);
      }
   };

   // Función para cerrar el modal
   const closeDetailsModal = () => {
      setIsModalOpen(false);
      setSelectedLog(null);
   };

   // Estadísticas
   const stats = {
      total: formattedLogs.length,
      created: formattedLogs.filter((log) => log.action?.toLowerCase() === "creado").length,
      updated: formattedLogs.filter((log) => log.action?.toLowerCase() === "actualizado").length,
      deleted: formattedLogs.filter((log) => log.action?.toLowerCase() === "eliminado").length
   };

   return (
      <>
      {loading && <Spinner/>}
         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            {/* 🔹 Header Mejorado */}
            <div className="mb-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white rounded-2xl shadow-lg">
                     <FaDatabase className="text-blue-600" size={32} />
                  </div>
                  <div>
                     <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Actividades</h1>
                     <p className="text-gray-600 text-lg">Monitorea todas las acciones realizadas en el sistema en tiempo real</p>
                  </div>
               </div>
            </div>

            {/* 🔹 Estadísticas Mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <StatCard title="Total de Registros" value={stats.total} icon={FaDatabase} color="bg-gradient-to-r from-blue-500 to-blue-600" />
               <StatCard title="Creaciones" value={stats.created} icon={FaPlus} color="bg-gradient-to-r from-green-500 to-green-600" />
               <StatCard title="Actualizaciones" value={stats.updated} icon={FaExchangeAlt} color="bg-gradient-to-r from-yellow-500 to-yellow-600" />
               <StatCard title="Eliminaciones" value={stats.deleted} icon={FaTrash} color="bg-gradient-to-r from-red-500 to-red-600" />
            </div>

            {/* 🔹 Tabla de registros */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
               <CustomTable
                  headerActions={() => (
                     <div className="flex items-center gap-3 p-4 bg-gray-50 border-b">
                        <Tooltip content="Actualizar registros">
                           <CustomButton color="blue" onClick={() => fetchLogs(api)} className="flex items-center gap-2 px-4 py-2 rounded-xl">
                              <LuRefreshCcw className={`${loading ? "animate-spin" : ""}`} />
                              <span>Actualizar</span>
                           </CustomButton>
                        </Tooltip>

                        <div className="flex-1" />

                        <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                           Mostrando <span className="font-bold">{formattedLogs.length}</span> registros
                        </div>
                     </div>
                  )}
                  data={formattedLogs}
                  paginate={[10, 25, 50, 100]}
                  loading={loading}
                  columns={[
                     {
                        field: "action",
                        headerName: "Acción",
                        renderField: (action) => <ActionBadge action={action} />
                     },
                     {
                        field: "user",
                        headerName: "Usuario",
                        renderField: (user) => (
                           <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                              <div className="p-2 bg-blue-100 rounded-full">
                                 <FaUser className="text-blue-600" size={14} />
                              </div>
                              <span className="font-semibold text-gray-800">{user || "Desconocido"}</span>
                           </div>
                        )
                     },
                     {
                        field: "model",
                        headerName: "Módulo",
                        renderField: (model) => (
                           <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-xl border border-purple-200">
                              <span className="font-bold text-purple-800 text-sm">{model || "-"}</span>
                           </div>
                        )
                     },
                     {
                        field: "changesCount",
                        headerName: "Cambios",
                        renderField: (changesCount) => (
                           <div className="flex items-center gap-3">
                              <div
                                 className={`px-3 py-2 rounded-full text-sm font-semibold ${
                                    changesCount > 0 ? "bg-orange-100 text-orange-800 border border-orange-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                                 }`}
                              >
                                 {changesCount} cambio{changesCount !== 1 ? "s" : ""}
                              </div>
                           </div>
                        )
                     },
                     {
                        field: "id",
                        headerName: "Detalles",
                        renderField: (id) => (
                           <Tooltip content="Ver detalles de cambios">
                              <button onClick={() => openDetailsModal(id)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                                 <FaExpand size={14} />
                              </button>
                           </Tooltip>
                        )
                     },
                     {
                        field: "ipAddress",
                        headerName: "Dirección IP",
                        renderField: (ip) => (
                           <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg font-mono text-sm">
                              <FaNetworkWired className="text-green-400" />
                              {ip || "N/A"}
                           </div>
                        )
                     },
                     {
                        field: "createdAt",
                        headerName: "Fecha/Hora",
                        renderField: (date) => formatDateTime(date)
                     }
                  ]}
               />
            </div>

            {/* Modal de Detalles */}
            <ChangeDetailsModal isOpen={isModalOpen} onClose={closeDetailsModal} log={selectedLog} />

            {/* 🔹 Footer Informativo */}
            {formattedLogs.length > 0 && (
               <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <FaInfoCircle className="text-blue-500" />
                        <span className="text-gray-700">Sistema de auditoría en tiempo real - Todos los cambios son registrados automáticamente</span>
                     </div>
                     <div className="text-sm text-gray-500">Última actualización: {new Date().toLocaleString()}</div>
                  </div>
               </div>
            )}
         </div>
      </>
   );
};

export default PageLogs;
