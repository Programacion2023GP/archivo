import React, { useState, useMemo, useRef, useEffect } from "react";
import {
   ChevronLeft,
   ChevronRight,
   Calendar,
   BarChart3,
   Clock,
   Filter,
   MapPin,
   Search,
   Users,
   Tag,
   AlertCircle,
   MoreVertical,
   ExternalLink,
   Maximize2,
   Minimize2,
   ZoomIn,
   ZoomOut,
   Loader,
   Grid,
   Columns,
   Calendar as CalendarIcon,
   X,
   Check,
   ArrowRight,
   ChevronDown,
   ChevronUp,
   Navigation,
   Target,
   Eye,
   EyeOff,
   Layers,
   CalendarDays,
   Star,
   Zap,
   Bell,
   Download,
   Printer
} from "lucide-react";
import { DateFormat, formatDatetime } from "../../../utils/formats";

type ViewMode = "day" | "week" | "month" | "year";

export interface ModuleConfig {
   name: string;
   color: string;
   description?: string;
   icon?: string;
}

export interface EventItem {
   id: number;
   module: string;
   datetime: Date;
   title?: string;
   description?: string;
   location?: string;
   attendees?: string[];
   data?: {};
   tags?: string[];
   priority?: "low" | "medium" | "high" | "urgent";
   duration?: number;
   customAction?: () => void;
   metadata?: {
      source?: string;
      assignedTo?: string;
      department?: string;
      project?: string;
   };
}

interface CalendarProps {
   events: EventItem[];
   modules: ModuleConfig[];
   onEventClick?: (event: EventItem) => void;
   showTime?: boolean;
   initialView?: ViewMode;
   loading?: boolean;
   onDateNavigate?: (date: Date) => void;
   onModuleFilterChange?: (module: string | null) => void;
   showExportControls?: boolean;
   onExport?: (format: "pdf" | "excel" | "print") => void;
}

export const CustomCalendar: React.FC<CalendarProps> = ({
   events,
   modules,
   onEventClick,
   showTime = true,
   initialView = "month",
   loading = false,
   onDateNavigate,
   onModuleFilterChange,
   showExportControls = false,
   onExport
}) => {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [viewMode, setViewMode] = useState<ViewMode>(initialView);
   const [showStats, setShowStats] = useState(false);
   const [selectedModule, setSelectedModule] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState("");
   const [expandedHour, setExpandedHour] = useState<number | null>(null);
   const [hourHeight, setHourHeight] = useState(80);
   const [customDate, setCustomDate] = useState<string>("");
   const [showDateModal, setShowDateModal] = useState(false);
   const [weekZoom, setWeekZoom] = useState(100);
   const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
   const [showYearModal, setShowYearModal] = useState(false);
   const [highlightedEvent, setHighlightedEvent] = useState<number | null>(null);
   const [showAllDayEvents, setShowAllDayEvents] = useState(true);
   const [activeViewFilters, setActiveViewFilters] = useState({
      urgent: true,
      high: true,
      medium: true,
      low: true
   });

   const dateInputRef = useRef<HTMLInputElement>(null);

   const getModuleColor = (moduleName: string) => {
      return modules.find((m) => m.name === moduleName)?.color || "#6b7280";
   };

   const getModuleIcon = (moduleName: string) => {
      const module = modules.find((m) => m.name === moduleName);
      return module?.icon || "📅";
   };

   const formatTime = (date: Date) => {
      return date.toLocaleTimeString("es-MX", {
         hour: "2-digit",
         minute: "2-digit",
         hour12: false
      });
   };

   const formatDate = (date: Date) => {
      return date.toLocaleDateString("es-MX", {
         day: "numeric",
         month: "short",
         year: "numeric"
      });
   };

   const navigate = (direction: "prev" | "next") => {
      const newDate = new Date(currentDate);
      switch (viewMode) {
         case "day":
            newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
            break;
         case "week":
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
            break;
         case "month":
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
            break;
         case "year":
            newDate.setFullYear(newDate.getFullYear() + (direction === "next" ? 1 : -1));
            setSelectedYear(newDate.getFullYear());
            break;
      }
      setCurrentDate(newDate);
      onDateNavigate?.(newDate);
   };

   const goToDate = (dateString: string) => {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
         setCurrentDate(date);
         setCustomDate("");
         setShowDateModal(false);
         onDateNavigate?.(date);
      }
   };

   const goToToday = () => {
      const today = new Date();
      setCurrentDate(today);
      setSelectedYear(today.getFullYear());
      onDateNavigate?.(today);
   };

   const goToYear = (year: number) => {
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      setCurrentDate(newDate);
      setSelectedYear(year);
      setShowYearModal(false);
      if (viewMode !== "year") {
         setViewMode("year");
      }
      onDateNavigate?.(newDate);
   };

   const jumpToEventDate = (event: EventItem) => {
      setCurrentDate(event.datetime);
      setViewMode("day");
      setHighlightedEvent(event.id);
      onDateNavigate?.(event.datetime);

      // Remover el highlight después de 3 segundos
      setTimeout(() => {
         setHighlightedEvent(null);
      }, 3000);
   };

   const getMonthDays = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];

      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
         days.push({
            date: new Date(year, month - 1, prevMonthLastDay - i),
            isCurrentMonth: false,
            isToday: false
         });
      }

      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
         const dayDate = new Date(year, month, i);
         days.push({
            date: dayDate,
            isCurrentMonth: true,
            isToday: dayDate.toDateString() === today.toDateString()
         });
      }

      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
         days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
            isToday: false
         });
      }

      return days;
   };

   const filteredEvents = useMemo(() => {
      let filtered = events;

      // Filtrar por módulo seleccionado
      if (selectedModule) {
         filtered = filtered.filter((e) => e.module === selectedModule);
      }

      // Filtrar por término de búsqueda
      if (searchTerm) {
         filtered = filtered.filter(
            (e) =>
               e.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
               e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               e.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               e.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
               e.attendees?.some((attendee) => attendee.toLowerCase().includes(searchTerm.toLowerCase()))
         );
      }

      // Filtrar por prioridades activas
      filtered = filtered.filter((event) => {
         if (!event.priority) return true;
         return activeViewFilters[event.priority];
      });

      return filtered;
   }, [events, selectedModule, searchTerm, activeViewFilters]);

  const getEventsForDay = (date: Date) => {
     const targetDate = new Date(date);
     targetDate.setHours(0, 0, 0, 0);

     const nextDay = new Date(targetDate);
     nextDay.setDate(nextDay.getDate() + 1);

     return filteredEvents
        .filter((e) => e.datetime && e.datetime instanceof Date && !isNaN(e.datetime.getTime()))
        .filter((e) => {
           const eventDate = new Date(e.datetime);
           return eventDate >= targetDate && eventDate < nextDay;
        })
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  };

  const getEventsForHour = (date: Date, hour: number) => {
     // Crear un rango de tiempo para esa hora específica
     const hourStart = new Date(date);
     hourStart.setHours(hour, 0, 0, 0);

     const hourEnd = new Date(date);
     hourEnd.setHours(hour, 59, 59, 999);

     return filteredEvents
        .filter((e) => e.datetime && e.datetime instanceof Date)
        .filter((e) => {
           const eventTime = new Date(e.datetime);
           // Verificar si el evento cae dentro de esta hora específica
           return eventTime >= hourStart && eventTime <= hourEnd;
        })
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  };

   const getAllDayEvents = (date: Date) => {
      return filteredEvents.filter((e) => {
         if (!e.datetime) return false;
         const eventDate = new Date(e.datetime);
         return eventDate.toDateString() === date.toDateString();
      });
   };

   const stats = useMemo(() => {
      const byModule = modules.map((m) => ({
         name: m.name,
         color: m.color,
         count: filteredEvents.filter((e) => e.module === m.name).length,
         urgent: filteredEvents.filter((e) => e.module === m.name && e.priority === "urgent").length,
         high: filteredEvents.filter((e) => e.module === m.name && e.priority === "high").length
      }));

      const total = filteredEvents.length;
      const todayEvents = getEventsForDay(new Date()).length;
      const upcoming = filteredEvents.filter((e) => e.datetime > new Date()).length;
      const urgent = filteredEvents.filter((e) => e.priority === "urgent").length;
      const past = filteredEvents.filter((e) => e.datetime < new Date()).length;

      return {
         byModule,
         total,
         todayEvents,
         upcoming,
         urgent,
         past
      };
   }, [filteredEvents, modules]);

   const getPeriodTitle = () => {
      switch (viewMode) {
         case "day":
            return currentDate.toLocaleDateString("es-MX", {
               weekday: "long",
               day: "numeric",
               month: "long",
               year: "numeric"
            });
         case "week":
            const weekStart = new Date(currentDate);
            const day = weekStart.getDay();
            weekStart.setDate(weekStart.getDate() - day);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.toLocaleDateString("es-MX", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("es-MX", {
               month: "short",
               day: "numeric",
               year: "numeric"
            })}`;
         case "month":
            return currentDate.toLocaleDateString("es-MX", {
               month: "long",
               year: "numeric"
            });
         case "year":
            return currentDate.getFullYear().toString();
      }
   };

   const handleModuleFilter = (moduleName: string | null) => {
      const newModule = moduleName === selectedModule ? null : moduleName;
      setSelectedModule(newModule);
      onModuleFilterChange?.(newModule);
   };

   const renderDayView = () => {
      const dayEvents = getEventsForDay(currentDate);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isToday = currentDate.toDateString() === now.toDateString();
      console.log("Fecha actual:", currentDate.toISOString().split("T")[0]);
      console.log("Eventos del día:", dayEvents);
      console.log("Todos los eventos:", events);
      return (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="presidencia text-white p-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/20 p-3 rounded-xl">
                        <Clock className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold">
                           {currentDate.toLocaleDateString("es-MX", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                           })}
                        </h3>
                        <p className="text-slate-300 text-sm mt-1">
                           {dayEvents.length} multas • {isToday ? "Hoy" : formatDate(currentDate)}
                           {highlightedEvent && <span className="ml-2 text-yellow-300 animate-pulse">• Evento resaltado</span>}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="bg-white/10 px-3 py-2 rounded-lg">
                        <div className="text-xs text-slate-300">Altura</div>
                        <div className="font-bold flex items-center gap-2">
                           {hourHeight}px
                           <div className="flex gap-1">
                              <button onClick={() => setHourHeight(Math.max(60, hourHeight - 20))} className="p-1 hover:bg-white/10 rounded">
                                 <Minimize2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => setHourHeight(Math.min(150, hourHeight + 20))} className="p-1 hover:bg-white/10 rounded">
                                 <Maximize2 className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                     </div>

                     <button
                        onClick={() => setShowAllDayEvents(!showAllDayEvents)}
                        className={`p-2 rounded-lg transition-all ${showAllDayEvents ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
                        title={showAllDayEvents ? "Ocultar multas de todo el día" : "Mostrar multas de todo el día"}
                     >
                        {showAllDayEvents ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-6">
               <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 shadow-sm mb-6">
                  <div className="text-sm font-medium text-blue-700 mb-1">Total de multas del día</div>
                  <div className="text-3xl font-bold text-blue-900">{dayEvents.length}</div>
               </div>

               {showAllDayEvents && getAllDayEvents(currentDate).length > 0 && (
                  <div className="mb-6">
                     <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        multas de todo el día
                     </h4>
                  </div>
               )}

               <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
                     <div className="col-span-2 p-3 text-sm font-semibold text-gray-700 border-r border-gray-200">HORA</div>
                     <div className="col-span-10 p-3 text-sm font-semibold text-gray-700">multas</div>
                  </div>

                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                     {Array.from({ length: 24 }, (_, hour:any) => {
                        const hourEvents = getEventsForHour(currentDate, hour);
                        const isCurrentHour = isToday && hour === currentHour;
                       
                        return (
                           <div key={hour} className={`grid grid-cols-12 hover:bg-gray-50 transition-colors ${isCurrentHour ? "bg-blue-50" : ""}`}>
                              <div className="col-span-2 p-3 border-r border-gray-200">
                                 <div className="flex flex-col items-center">
                                    <div className={`text-lg font-bold ${isCurrentHour ? "text-blue-600" : "text-gray-800"}`}>
                                       {formatDatetime(`2025-12-12 ${hour}`, true, DateFormat.H_MM_A)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{formatDatetime(`2025-12-12 ${hour}`, true, DateFormat.H_MM_A)}</div>
                                    {isCurrentHour && (
                                       <div className="text-xs text-blue-600 font-medium mt-1">Actual: {formatDatetime(new Date(), true, DateFormat.H_MM_A)}</div>
                                    )}
                                 </div>
                              </div>

                              <div className="col-span-10 p-3">
                                 {hourEvents.length === 0 ? (
                                    <div className="text-gray-400 text-sm italic py-4">Sin multas</div>
                                 ) : (
                                    <div className="space-y-2">
                                       {hourEvents.map((event, idx) => {
                                          const eventHour = event.datetime.getHours();
                                          const eventMinute = event.datetime.getMinutes();
                                          const isPast = event.datetime < now;
                                          const isHighlighted = highlightedEvent === event.id;

                                          return (
                                             <div
                                                key={idx}
                                                onClick={() => {
                                                   onEventClick?.(event);
                                                   event.customAction?.();
                                                }}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${isPast ? "opacity-90" : ""} ${
                                                   isHighlighted ? "ring-2 ring-yellow-400 ring-offset-2 animate-pulse" : ""
                                                }`}
                                                style={{
                                                   borderLeftColor: getModuleColor(event.module),
                                                   borderLeftWidth: "4px",
                                                   backgroundColor: `${getModuleColor(event.module)}08`,
                                                   borderColor: getModuleColor(event.module)
                                                }}
                                             >
                                                <div className="flex justify-between items-start">
                                                   <div className="flex-1">
                                                      <div className="flex items-center justify-between mb-2">
                                                         <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getModuleColor(event.module) }} />
                                                            <span className="text-sm font-semibold text-gray-700">{event.module}</span>
                                                            {event.priority === "urgent" && (
                                                               <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-bold">URGENTE</span>
                                                            )}
                                                         </div>
                                                         <button
                                                            onClick={(e) => {
                                                               e.stopPropagation();
                                                               jumpToEventDate(event);
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded"
                                                            title="Ir al evento"
                                                         >
                                                            <Navigation className="w-4 h-4 text-gray-500" />
                                                         </button>
                                                      </div>

                                                      <h4 className="font-bold text-gray-900 mb-2">{event.title || `Evento #${event.id}`}</h4>

                                                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                                                         <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {eventHour.toString().padStart(2, "0")}:{eventMinute.toString().padStart(2, "0")}
                                                            {/* {event.duration && ` • ${event.duration} min`} */}
                                                            {formatDatetime(event.datetime, true, DateFormat.HH_MM_SS_A)}
                                                         </div>

                                                         {event.location && (
                                                            <div className="flex items-center gap-1">
                                                               <MapPin className="w-3 h-3" />
                                                               {event.location}
                                                            </div>
                                                         )}
                                                      </div>

                                                      {event.description && <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>}

                                                      {(event.tags || event.attendees) && (
                                                         <div className="flex flex-wrap gap-2 mt-2">
                                                            {event.tags?.map((tag, i) => (
                                                               <span key={i} className="text-xs px-2 py-1 bg-white border border-gray-300 text-gray-700 rounded">
                                                                  {tag}
                                                               </span>
                                                            ))}

                                                            {event.attendees && event.attendees.length > 0 && (
                                                               <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center gap-1">
                                                                  <Users className="w-3 h-3" />
                                                                  {event.attendees.length} asistentes
                                                               </span>
                                                            )}
                                                         </div>
                                                      )}
                                                   </div>
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {dayEvents.length === 0 && (
                  <div className="text-center py-12">
                     <div className="text-4xl mb-4">📅</div>
                     <h3 className="text-xl font-bold text-gray-400 mb-2">No hay multas </h3>
                     <p className="text-gray-500">No se encontraron multas para {formatDate(currentDate)}</p>
                  </div>
               )}
            </div>
         </div>
      );
   };

   const renderWeekView = () => {
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);

      const days = Array.from({ length: 7 }, (_, i) => {
         const date = new Date(weekStart);
         date.setDate(date.getDate() + i);
         return {
            date,
            name: date.toLocaleDateString("es-MX", { weekday: "short" }),
            fullName: date.toLocaleDateString("es-MX", { weekday: "long" }),
            isToday: date.toDateString() === new Date().toDateString(),
            events: getEventsForDay(date)
         };
      });

      return (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="presidencia text-white p-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/20 p-3 rounded-xl">
                        <Columns className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold">
                           Semana {weekStart.getDate()}-{days[6].date.getDate()} de {weekStart.toLocaleDateString("es-MX", { month: "long" })}
                        </h3>
                        <p className="text-slate-300 text-sm mt-1">{days.reduce((sum, day) => sum + day.events.length, 0)} multas en total</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="bg-white/10 px-3 py-2 rounded-lg">
                        <div className="text-xs text-slate-300">Zoom</div>
                        <div className="font-bold flex items-center gap-2">
                           {weekZoom}%
                           <div className="flex gap-1">
                              <button onClick={() => setWeekZoom(Math.max(80, weekZoom - 10))} className="p-1 hover:bg-white/10 rounded">
                                 <ZoomOut className="w-3 h-3" />
                              </button>
                              <button onClick={() => setWeekZoom(Math.min(150, weekZoom + 10))} className="p-1 hover:bg-white/10 rounded">
                                 <ZoomIn className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* <div className="overflow-x-auto">
               <div className="min-w-[1200px]" style={{ zoom: `${weekZoom}%` }}>
                  <div className="grid grid-cols-8 border-b border-gray-200">
                     <div className="p-3 bg-gray-50 border-r border-gray-200"></div>
                     {days.map((day, i) => (
                        <div
                           key={i}
                           className={`p-3 text-center border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${day.isToday ? "bg-blue-50" : "bg-white"}`}
                           onClick={() => {
                              setCurrentDate(day.date);
                              setViewMode("day");
                              onDateNavigate?.(day.date);
                           }}
                        >
                           <div className={`text-sm font-medium uppercase ${day.isToday ? "text-blue-600" : "text-gray-500"}`}>{day.name}</div>
                           <div className={`text-xl font-bold mt-1 ${day.isToday ? "text-blue-600" : "text-gray-800"}`}>{day.date.getDate()}</div>
                           <div className="text-xs text-gray-500 mt-1">{day.events.length} multas</div>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-8">
                     <div className="border-r border-gray-200 bg-gray-50">
                        {Array.from({ length: 24 }, (_, hour) => (
                           <div key={hour} className="h-16 border-b border-gray-200 flex items-center justify-end pr-3">
                              <div className="text-right">
                                 <div className="text-sm font-semibold text-gray-700">{hour.toString().padStart(2, "0")}:00</div>
                                 <div className="text-xs text-gray-500">{hour >= 12 ? "PM" : "AM"}</div>
                              </div>
                           </div>
                        ))}
                     </div>

                     {days.map((day, dayIdx) => (
                        <div key={dayIdx} className="border-r border-gray-200">
                           {Array.from({ length: 24 }, (_, hour) => {
                              const hourEvents = getEventsForHour(day.date, hour);

                              return (
                                 <div key={hour} className="h-16 border-b border-gray-200 p-1 hover:bg-gray-50">
                                    {hourEvents.slice(0, 3).map((event, idx) => (
                                       <div
                                          key={idx}
                                          onClick={() => {
                                             onEventClick?.(event);
                                             event.customAction?.();
                                          }}
                                          className="text-xs p-1.5 rounded mb-1 cursor-pointer hover:shadow-sm truncate border border-white/30"
                                          style={{
                                             backgroundColor: getModuleColor(event.module),
                                             color: "white",
                                             borderLeft: `3px solid ${getModuleColor(event.module)}`
                                          }}
                                          title={`${event.title || event.id} - ${formatTime(event.datetime)}`}
                                       >
                                          <div className="font-bold truncate">{event.title || event.id}</div>
                                          <div className="text-xs opacity-90">{formatDatetime(event.datetime,true,DateFormat.HH_MM_SS_A)}</div>
                                       </div>
                                    ))}

                                    {hourEvents.length > 3 && (
                                       <div
                                          onClick={() => {
                                             setCurrentDate(day.date);
                                             setViewMode("day");
                                             onDateNavigate?.(day.date);
                                          }}
                                          className="text-xs text-blue-600 font-medium p-1 hover:bg-blue-50 rounded cursor-pointer text-center"
                                       >
                                          +{hourEvents.length - 3} más
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     ))}
                  </div>
               </div>
            </div> */}
            <div className="overflow-x-auto">
               <div className="min-w-[1200px]" style={{ zoom: `${weekZoom}%` }}>
                  <div className="grid grid-cols-8 border-b border-gray-200">
                     <div className="p-3 bg-gray-50 border-r border-gray-200"></div>
                     {days.map((day, i) => (
                        <div
                           key={i}
                           className={`p-3 text-center border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${day.isToday ? "bg-blue-50" : "bg-white"}`}
                           onClick={() => {
                              setCurrentDate(day.date);
                              setViewMode("day");
                              onDateNavigate?.(day.date);
                           }}
                        >
                           <div className={`text-sm font-medium uppercase ${day.isToday ? "text-blue-600" : "text-gray-500"}`}>{day.name}</div>
                           <div className={`text-xl font-bold mt-1 ${day.isToday ? "text-blue-600" : "text-gray-800"}`}>{day.date.getDate()}</div>
                           <div className="text-xs text-gray-500 mt-1">{day.events.length} multas</div>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-8">
                     <div className="border-r border-gray-200 bg-gray-50">
                        {Array.from({ length: 24 }, (_, hour: any) => (
                           <div key={hour} className="h-20 border-b border-gray-200 flex items-center justify-end pr-3">
                              <div className="text-right">
                                 <div className="text-sm font-semibold text-gray-700">{formatDatetime(`2025-11-22 ${hour}`, true, DateFormat.H_MM_A)}</div>
                                 <div className="text-xs text-gray-500">{formatDatetime(`2025-11-22 ${hour}`, true, DateFormat.H_MM_A)}</div>
                              </div>
                           </div>
                        ))}
                     </div>

                     {days.map((day, dayIdx) => (
                        <div key={dayIdx} className="border-r border-gray-200 relative">
                           {Array.from({ length: 24 }, (_, hour) => {
                              const hourEvents = getEventsForHour(day.date, hour);
                              const eventCount = hourEvents.length;
                              const maxVisibleEvents = 4; // Máximo de eventos visibles por hora

                              return (
                                 <div
                                    key={hour}
                                    className="h-20 border-b border-gray-200 p-1 hover:bg-gray-50 relative"
                                    style={{ minHeight: eventCount > 0 ? `${Math.min(eventCount, maxVisibleEvents) * 2.5}rem` : "5rem" }}
                                 >
                                    {/* Contenedor con scroll para eventos */}
                                    <div className="absolute inset-1 overflow-y-auto scrollbar-thin">
                                       <div className="space-y-1 pr-1">
                                          {hourEvents.slice(0, maxVisibleEvents).map((event, idx) => (
                                             <div
                                                key={`${dayIdx}-${hour}-${idx}`}
                                                onClick={() => {
                                                   onEventClick?.(event);
                                                   event.customAction?.();
                                                }}
                                                className="text-xs p-1.5 rounded cursor-pointer hover:shadow-sm truncate border border-white/30 transition-all duration-200 hover:scale-[1.02]"
                                                style={{
                                                   backgroundColor: getModuleColor(event.module),
                                                   color: "white",
                                                   borderLeft: `3px solid ${getModuleColor(event.module)}`,
                                                   minHeight: "2rem",
                                                   maxHeight: "2.5rem",
                                                   overflow: "hidden"
                                                }}
                                                title={`${event.title || event.id} - ${formatTime(event.datetime)}`}
                                             >
                                                <div className="font-bold truncate leading-tight">{event.title || event.id}</div>
                                                <div className="text-xs opacity-90 truncate leading-tight">
                                                   {formatDatetime(event.datetime, true, DateFormat.HH_MM_SS_A)}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    {hourEvents.length > maxVisibleEvents && (
                                       <div
                                          onClick={() => {
                                             setCurrentDate(day.date);
                                             setViewMode("day");
                                             onDateNavigate?.(day.date);
                                          }}
                                          className="absolute bottom-1 left-1 right-1 text-xs text-blue-600 font-medium p-1.5 hover:bg-blue-50 rounded cursor-pointer text-center bg-white border border-blue-100 shadow-sm z-10"
                                       >
                                          +{hourEvents.length - maxVisibleEvents} más
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
            <div className="border-t border-gray-200 p-6 bg-gray-50">
               <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Resumen de la semana
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {days.map((day, idx) => {
                     const urgentCount = day.events.filter((e) => e.priority === "urgent").length;
                     const highCount = day.events.filter((e) => e.priority === "high").length;

                     return (
                        <div
                           key={idx}
                           onClick={() => {
                              setCurrentDate(day.date);
                              setViewMode("day");
                              onDateNavigate?.(day.date);
                           }}
                           className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              day.isToday ? "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300" : "bg-white border border-gray-200"
                           }`}
                        >
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <div className={`text-sm font-semibold ${day.isToday ? "text-blue-700" : "text-gray-600"}`}>{day.fullName}</div>
                                 <div className={`text-xl font-bold ${day.isToday ? "text-blue-800" : "text-gray-800"}`}>{day.date.getDate()}</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-lg font-bold text-gray-800">{day.events.length}</div>
                                 <div className="text-xs text-gray-500">multas</div>
                              </div>
                           </div>

                           {(urgentCount > 0 || highCount > 0) && (
                              <div className="flex gap-2 mt-2">
                                 {urgentCount > 0 && (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                                       {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
                                    </span>
                                 )}
                                 {highCount > 0 && <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{highCount} alta</span>}
                              </div>
                           )}

                           <div className="text-xs text-blue-600 mt-2 font-medium hover:underline">Ver día →</div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      );
   };

   const renderMonthView = () => {
      const monthDays = getMonthDays(currentDate);
      const today = new Date();
      const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

      return (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
               {weekDays.map((day, i) => (
                  <div key={i} className="py-3 text-center font-medium text-sm">
                     {day}
                  </div>
               ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
               {monthDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day.date);
                  const isToday = day.date.toDateString() === today.toDateString();
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                  const urgentCount = dayEvents.filter((e) => e.priority === "urgent").length;
                  const highCount = dayEvents.filter((e) => e.priority === "high").length;

                  return (
                     <div
                        key={idx}
                        onClick={() => {
                           setCurrentDate(day.date);
                           setViewMode("day");
                           onDateNavigate?.(day.date);
                        }}
                        className={`min-h-36 p-2 cursor-pointer transition-all hover:shadow-inner ${isWeekend ? "bg-gray-50" : "bg-white"} ${
                           !day.isCurrentMonth ? "opacity-50" : ""
                        } ${isToday ? "bg-blue-50" : ""}`}
                     >
                        <div className="flex flex-col h-full">
                           <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-700"}`}>
                              <div className="flex items-center gap-2">
                                 <span className={`${isToday ? "bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md" : ""}`}>
                                    {day.date.getDate()}
                                 </span>
                                 {isToday && <span className="text-xs text-blue-600 font-medium">Hoy</span>}
                              </div>
                              <div className="flex items-center gap-1">
                                 {urgentCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{urgentCount}</span>}
                                 {dayEvents.length > 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{dayEvents.length}</span>
                                 )}
                              </div>
                           </div>

                           <div className="flex-1 space-y-1 overflow-y-auto">
                              {dayEvents.slice(0, 4).map((event, i) => (
                                 <div
                                    key={i}
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       onEventClick?.(event);
                                       event.customAction?.();
                                    }}
                                    className="text-xs p-2 rounded font-medium cursor-pointer hover:shadow-sm transition-all border border-gray-200 hover:border-blue-300 group"
                                    style={{
                                       backgroundColor: `${getModuleColor(event.module)}15`,
                                       borderLeftColor: getModuleColor(event.module),
                                       borderLeftWidth: "3px"
                                    }}
                                 >
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getModuleColor(event.module) }} />
                                          <span className="font-semibold text-gray-800 truncate">{event.title || event.id}</span>
                                       </div>
                                       {event.priority === "urgent" && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                                       {event.priority === "high" && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                       {showTime && <span className="text-gray-600 text-xs">{formatDatetime(event.datetime, true, DateFormat.HH_MM_SS_A)}</span>}
                                       <span className="text-gray-500 text-xs">{event.module.substring(0, 3)}</span>
                                    </div>
                                 </div>
                              ))}

                              {dayEvents.length > 4 && (
                                 <div
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       setCurrentDate(day.date);
                                       setViewMode("day");
                                       onDateNavigate?.(day.date);
                                    }}
                                    className="text-xs text-blue-600 font-medium px-2 py-1 hover:bg-blue-50 rounded cursor-pointer text-center"
                                 >
                                    +{dayEvents.length - 4} más
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      );
   };

   const renderYearView = () => {
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      return (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="presidencia text-white p-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/20 p-3 rounded-xl">
                        <Calendar className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold">Año {selectedYear}</h3>
                        <p className="text-slate-300 text-sm mt-1">Vista anual - Haz clic en cualquier mes para ver detalles</p>
                     </div>
                  </div>

                  <button
                     onClick={() => setShowYearModal(true)}
                     className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all border border-white/20 flex items-center gap-2"
                  >
                     <CalendarIcon className="w-4 h-4" />
                     Cambiar año
                  </button>
               </div>
            </div>

            <div className="p-6">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {months.map((month, idx) => {
                     const monthEvents = filteredEvents.filter((e) => e.datetime.getFullYear() === selectedYear && e.datetime.getMonth() === idx);
                     const urgentCount = monthEvents.filter((e) => e.priority === "urgent").length;
                     const today = new Date();
                     const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === idx;

                     return (
                        <div
                           key={idx}
                           onClick={() => {
                              const date = new Date(selectedYear, idx, 1);
                              setCurrentDate(date);
                              setViewMode("month");
                              onDateNavigate?.(date);
                           }}
                           className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                              isCurrentMonth ? "border-blue-300 bg-gradient-to-br from-blue-50 to-white" : "border-gray-200 bg-white"
                           }`}
                        >
                           <div className="flex justify-between items-center mb-3">
                              <div className={`text-lg font-bold ${isCurrentMonth ? "text-blue-700" : "text-gray-800"}`}>{month}</div>
                              <div className="text-right">
                                 <div className="text-2xl font-bold" style={{ color: monthEvents.length > 0 ? "#3b82f6" : "#9ca3af" }}>
                                    {monthEvents.length}
                                 </div>
                                 {urgentCount > 0 && (
                                    <div className="text-xs text-red-600 font-semibold mt-1">
                                       {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="text-sm text-gray-600 mb-4">
                              {monthEvents.length === 0 ? "Sin multas" : `${monthEvents.length} evento${monthEvents.length !== 1 ? "s" : ""}`}
                           </div>

                           <div className="h-20 grid grid-cols-7 gap-0.5">
                              {Array.from({ length: 35 }, (_, i) => {
                                 const date = new Date(selectedYear, idx, i + 1);
                                 const hasEvents = getEventsForDay(date).length > 0;
                                 const hasUrgentEvents = getEventsForDay(date).filter((e) => e.priority === "urgent").length > 0;

                                 return (
                                    <div
                                       key={i}
                                       className={`rounded-sm ${hasUrgentEvents ? "bg-red-500" : hasEvents ? "bg-blue-500" : "bg-gray-100"} ${
                                          date.getMonth() !== idx ? "opacity-30" : ""
                                       }`}
                                       title={`${date.getDate()}: ${getEventsForDay(date).length} multas`}
                                    />
                                 );
                              })}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      );
   };

   const renderDatePickerModal = () => {
      if (!showDateModal) return null;

      return (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
               <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900">Ir a fecha específica</h3>
                     <button onClick={() => setShowDateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="space-y-4">
                     {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una fecha</label>
                        <input
                           ref={dateInputRef}
                           type="date"
                           value={customDate}
                           onChange={(e) => {
                              const date = new Date(e.target.value);
                              date.setDate(date.getDate() + 2); // ← SUMA UN DÍA

                              const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
                              console.log(formatted);
                              setCustomDate(formatted);
                           }}
                           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div> */}

                     <div className="grid grid-cols-2 gap-3">
                        <button
                           onClick={() => {
                              const today = new Date();
                              const todayStr = today.toISOString().split("T")[0];
                              setCustomDate(todayStr);
                              goToDate(todayStr);
                           }}
                           className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                           Hoy
                        </button>
                        <button
                           onClick={() => {
                              const tomorrow = new Date();
                              // tomorrow.setDate(tomorrow.getDate() + 1);
                              const tomorrowStr = tomorrow.toISOString().split("T")[0];
                              setCustomDate(tomorrowStr);
                              goToDate(tomorrowStr);
                           }}
                           className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                           Mañana
                        </button>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-gray-50 rounded-b-xl">
                  {/* <div className="flex gap-3">
                     <button onClick={() => setShowDateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                     </button>
                     <button
                        onClick={() => customDate && goToDate(customDate)}
                        disabled={!customDate}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                           customDate ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                     >
                        <Check className="w-4 h-4" />
                        Ir a fecha
                     </button>
                  </div> */}
               </div>
            </div>
         </div>
      );
   };

   const renderYearPickerModal = () => {
      if (!showYearModal) return null;

      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

      return (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
               <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900">Seleccionar año</h3>
                     <button onClick={() => setShowYearModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                     {years.map((year) => (
                        <button
                           key={year}
                           onClick={() => goToYear(year)}
                           className={`p-4 rounded-lg border transition-all ${
                              year === selectedYear
                                 ? "bg-blue-600 text-white border-blue-600"
                                 : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
                           }`}
                        >
                           <div className="text-center">
                              <div className="text-lg font-bold">{year}</div>
                              {year === currentYear && <div className="text-xs mt-1 opacity-75">Actual</div>}
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="p-6 bg-gray-50 rounded-b-xl">
                  <div className="flex gap-3">
                     <button onClick={() => setShowYearModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                     </button>
                     <button onClick={goToToday} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Ir al año actual
                     </button>
                  </div>
               </div>
            </div>
         </div>
      );
   };

   const renderPriorityFilters = () => <></>;

   return (
      <div className="w-full mx-auto">
         {loading && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
               <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Cargando multas...</p>
               </div>
            </div>
         )}

         <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="presidencia text-white p-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-white/10 p-3 rounded-xl">
                        <Calendar className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold capitalize">{getPeriodTitle()}</h2>
                        <p className="text-slate-300 text-sm mt-1">
                           {filteredEvents.length} multas
                           {selectedModule && ` en ${selectedModule}`}
                           {stats.urgent > 0 && ` • ${stats.urgent} urgentes`}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                     {showExportControls && onExport && (
                        <div className="flex gap-1">
                           <button onClick={() => onExport("pdf")} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg" title="Exportar PDF">
                              <Download className="w-4 h-4" />
                           </button>
                           <button onClick={() => onExport("print")} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg" title="Imprimir">
                              <Printer className="w-4 h-4" />
                           </button>
                        </div>
                     )}

                     {/* <button
                        onClick={() => setShowDateModal(true)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all border border-white/20 flex items-center gap-2"
                     >
                        <CalendarIcon className="w-4 h-4" />
                        Ir a fecha
                     </button> */}

                     <button onClick={goToToday} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all">
                        Hoy
                     </button>

                     <div className="flex items-center bg-white/10 rounded-lg border border-white/20">
                        <button onClick={() => navigate("prev")} className="p-2 hover:bg-white/10 rounded-l-lg transition-all">
                           <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-white/20" />
                        <button onClick={() => navigate("next")} className="p-2 hover:bg-white/10 rounded-r-lg transition-all">
                           <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>

                     <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as ViewMode)}
                        className="
    px-3 py-2 rounded-lg cursor-pointer text-sm font-medium 
    border bg-white text-slate-800
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  "
                     >
                        <option className="text-slate-800 bg-white" value="day">
                           Día
                        </option>
                        <option className="text-slate-800 bg-white" value="week">
                           Semana
                        </option>
                        <option className="text-slate-800 bg-white" value="month">
                           Mes
                        </option>
                        <option className="text-slate-800 bg-white" value="year">
                           Año
                        </option>
                     </select>

                     <button
                        onClick={() => setShowStats(!showStats)}
                        className={`p-2 rounded-lg transition-all border border-white/20 ${showStats ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
                        title="Mostrar estadísticas"
                     >
                        <BarChart3 className="w-4 h-4" />
                     </button>
                  </div>
               </div>

               {/* Filtros */}
               {/* <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Buscador por seccion"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                     <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded">
                        <X className="w-4 h-4 text-gray-300" />
                     </button>
                  )}
               </div> */}

               {renderPriorityFilters()}

               <div className="flex flex-wrap gap-2">
                  {/* Tag: Todos */}
                  <button
                     onClick={() => handleModuleFilter(null)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all
      ${!selectedModule ? "bg-white text-slate-900 border-slate-300" : "bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200"}`}
                  >
                     <Filter className="w-3 h-3" />
                     <span>Todos</span>
                  </button>

                  {/* Tags por módulo */}
                  {modules.map((mod, idx) => {
                     const moduleStats = stats.byModule.find((m) => m.name === mod.name);
                     const count = moduleStats?.count || 0;
                     const urgentCount = moduleStats?.urgent || 0;

                     return (
                        <button
                           key={idx}
                           onClick={() => handleModuleFilter(mod.name)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all
          ${selectedModule === mod.name ? "bg-white text-slate-900 border-slate-300" : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"}`}
                        >
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mod.color }} />

                           <span>{mod.name}</span>

                           {/* Cantidad */}

                           {/* Urgentes */}
                           {urgentCount > 0 && <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[11px]">{urgentCount}</span>}
                        </button>
                     );
                  })}
               </div>
            </div>

            {/* Estadísticas */}

            {/* Contenido */}
            <div className="p-6">
               {viewMode === "day" && renderDayView()}
               {viewMode === "week" && renderWeekView()}
               {viewMode === "month" && renderMonthView()}
               {viewMode === "year" && renderYearView()}

               {filteredEvents.length === 0 && !loading && (
                  <div className="text-center py-12">
                     <div className="text-2xl font-bold text-gray-300 mb-3">No hay multas</div>
                     <p className="text-gray-500">
                        {searchTerm || selectedModule ? "Intenta con otros términos de búsqueda o módulos" : "No se encontraron multas para mostrar"}
                     </p>
                     {(searchTerm || selectedModule) && (
                        <button
                           onClick={() => {
                              setSearchTerm("");
                              setSelectedModule(null);
                           }}
                           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                           Limpiar filtros
                        </button>
                     )}
                  </div>
               )}
            </div>
         </div>

         {/* Modales */}
         {renderDatePickerModal()}
         {renderYearPickerModal()}
      </div>
   );
};
