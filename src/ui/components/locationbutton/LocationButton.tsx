import React, { useState, useEffect } from "react";
import { useFormikContext } from "formik";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// // Ícono personalizado para Leaflet
// const markerIcon = new L.Icon({
//    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
//    iconSize: [25, 41],
//    iconAnchor: [12, 41]
// });

// Props basadas en CustomButton pero adaptadas para LocationButton
type LocationButtonProps = {
   idNameLat: string;
   idNameLng: string;
   idNameUbi: string;
   label?: string;
   helperText?: string;
   variant?: "primary" | "secondary" | "gradient" | "outline" | "icon" | "glass" | "neon";
   color?: "cyan" | "purple" | "pink" | "green" | "red" | "blue" | "yellow" | "slate";
   size?: "sm" | "md" | "lg" | "xl";
   className?: string;
   disabled?: boolean;
   showMap?: boolean;
   fullWidth?: boolean;
};

export const LocationButton: React.FC<LocationButtonProps> = ({
   idNameLat,
   idNameLng,
   idNameUbi,
   label = "Obtener ubicación",
   helperText,
   variant = "primary",
   color = "blue",
   size = "md",
   className = "",
   disabled = false,
   showMap = true,
   fullWidth = true
}) => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

   const formik: any = useFormikContext<any>();
const isEditMode = Boolean(formik?.values?.id);

   // Tamaños consistentes con CustomButton
   const sizeClasses = {
      sm: "px-4 py-2 text-sm min-h-9",
      md: "px-6 py-3 text-base min-h-11",
      lg: "px-8 py-4 text-lg min-h-12",
      xl: "px-10 py-5 text-xl min-h-14"
   }[size];

   // Sistema de colores (mismo que CustomButton)
   const colorVariants: Record<
      string,
      {
         primary: string;
         hover: string;
         active: string;
         gradientFrom: string;
         gradientTo: string;
         border: string;
         text: string;
         glow: string;
         glass: string;
      }
   > = {
      cyan: {
         primary: "bg-cyan-500",
         hover: "hover:bg-cyan-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-cyan-700 active:translate-y-0",
         gradientFrom: "from-cyan-500",
         gradientTo: "to-blue-500",
         border: "border-cyan-400",
         text: "text-cyan-600",
         glow: "shadow-cyan-500/25",
         glass: "bg-cyan-500/10 backdrop-blur-sm border-cyan-400/20"
      },
      purple: {
         primary: "bg-purple-500",
         hover: "hover:bg-purple-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-purple-700 active:translate-y-0",
         gradientFrom: "from-purple-500",
         gradientTo: "to-indigo-500",
         border: "border-purple-400",
         text: "text-purple-600",
         glow: "shadow-purple-500/25",
         glass: "bg-purple-500/10 backdrop-blur-sm border-purple-400/20"
      },
      pink: {
         primary: "bg-pink-500",
         hover: "hover:bg-pink-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-pink-700 active:translate-y-0",
         gradientFrom: "from-pink-500",
         gradientTo: "to-rose-500",
         border: "border-pink-400",
         text: "text-pink-600",
         glow: "shadow-pink-500/25",
         glass: "bg-pink-500/10 backdrop-blur-sm border-pink-400/20"
      },
      green: {
         primary: "bg-emerald-500",
         hover: "hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-emerald-700 active:translate-y-0",
         gradientFrom: "from-emerald-500",
         gradientTo: "to-green-500",
         border: "border-emerald-400",
         text: "text-emerald-600",
         glow: "shadow-emerald-500/25",
         glass: "bg-emerald-500/10 backdrop-blur-sm border-emerald-400/20"
      },
      red: {
         primary: "bg-red-500",
         hover: "hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-red-700 active:translate-y-0",
         gradientFrom: "from-red-500",
         gradientTo: "to-orange-500",
         border: "border-red-400",
         text: "text-red-600",
         glow: "shadow-red-500/25",
         glass: "bg-red-500/10 backdrop-blur-sm border-red-400/20"
      },
      blue: {
         primary: "bg-blue-500",
         hover: "hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-blue-700 active:translate-y-0",
         gradientFrom: "from-blue-500",
         gradientTo: "to-sky-500",
         border: "border-blue-400",
         text: "text-blue-600",
         glow: "shadow-blue-500/25",
         glass: "bg-blue-500/10 backdrop-blur-sm border-blue-400/20"
      },
      yellow: {
         primary: "bg-amber-400",
         hover: "hover:bg-amber-500 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-amber-600 active:translate-y-0",
         gradientFrom: "from-amber-400",
         gradientTo: "to-yellow-400",
         border: "border-amber-400",
         text: "text-amber-600",
         glow: "shadow-amber-500/25",
         glass: "bg-amber-500/10 backdrop-blur-sm border-amber-400/20"
      },
      slate: {
         primary: "bg-slate-600",
         hover: "hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5",
         active: "active:bg-slate-800 active:translate-y-0",
         gradientFrom: "from-slate-600",
         gradientTo: "to-slate-500",
         border: "border-slate-400",
         text: "text-slate-600",
         glow: "shadow-slate-500/25",
         glass: "bg-slate-500/10 backdrop-blur-sm border-slate-400/20"
      }
   };

   const c = colorVariants[color];

   // Estilos base (mismo que CustomButton)
   const baseClasses = `
    font-semibold rounded-xl shadow-md
    flex items-center justify-center
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-3 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    relative overflow-hidden group
  `;

   // Variantes de estilo (mismo que CustomButton)
   const variantClasses = {
      primary: `
      ${c.primary} text-white ${c.hover} ${c.active}
      shadow-lg ${c.glow} focus:ring-${color}-300
    `,
      secondary: `
      bg-white text-slate-700 border border-slate-200
      hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg
      active:bg-slate-100 focus:ring-slate-300
      shadow-sm
    `,
      gradient: `
      bg-gradient-to-r ${c.gradientFrom} ${c.gradientTo} text-white
      hover:shadow-xl hover:-translate-y-0.5 ${c.glow}
      active:translate-y-0 focus:ring-${color}-300
      relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/10 after:to-transparent after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100
    `,
      outline: `
      border-2 ${c.border} ${c.text} bg-transparent
      hover:bg-${color}-50 hover:${c.text} hover:border-${color}-500
      active:bg-${color}-100 focus:ring-${color}-300
      transition-colors duration-200
    `,
      icon: `
      w-12 h-12 rounded-full ${c.primary} text-white
      hover:shadow-lg hover:-translate-y-0.5 ${c.hover}
      active:translate-y-0 focus:ring-${color}-300
      shadow-md ${c.glow}
    `,
      glass: `
      ${c.glass} ${c.text} border
      backdrop-filter backdrop-blur-sm
      hover:shadow-lg hover:-translate-y-0.5 hover:bg-${color}-500/20
      active:translate-y-0 focus:ring-${color}-300
      shadow-sm
    `,
      neon: `
      bg-${color}-500/10 border border-${color}-400/50 ${c.text}
      shadow-lg ${c.glow}
      hover:shadow-xl hover:-translate-y-0.5 hover:bg-${color}-500/20
      active:translate-y-0 focus:ring-${color}-300
      relative after:absolute after:inset-0 after:bg-${color}-400/10 after:opacity-0 after:transition-opacity hover:after:opacity-100
    `
   }[variant];

   // Cargar ubicación inicial desde Formik (modo edición)
   useEffect(() => {
      const lat = parseFloat(formik.values?.[idNameLat]);
      const lon = parseFloat(formik.values?.[idNameLng]);
      if (!isNaN(lat) && !isNaN(lon)) {
         setLocation({ lat, lon });
      }
      handleGetLocation();
   }, [formik.values?.[idNameLat], formik.values?.[idNameLng]]);

   const handleGetLocation = () => {
      if (!navigator.geolocation) {
         setError("La geolocalización no es soportada por este navegador.");
         return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
         (position) => {
            const coords = {
               lat: position.coords.latitude,
               lon: position.coords.longitude
            };
            setLocation(coords);

            // Guardar en Formik
            formik?.setFieldValue(idNameLat, coords.lat);
            formik?.setFieldValue(idNameLng, coords.lon);
            formik?.setFieldValue(idNameUbi, `https://www.google.com/maps?q=${coords.lat},${coords.lon}`);

            setLoading(false);
         },
         () => {
            setError("No se pudo obtener la ubicación. Verifica los permisos del navegador.");
            setLoading(false);
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
   };

   // Spinner de carga consistente con CustomButton
   const LoadingSpinner = () => (
      <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
         <div className={`w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin`} />
      </div>
   );

   // Ícono de ubicación SVG (reemplaza el de MUI)
   const LocationIcon = () => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
   );

   const errorFormik = formik.touched[idNameUbi] && formik.errors[idNameUbi] ? formik.errors[idNameUbi].toString() : null;
   const isError = Boolean(errorFormik);

   return (
      <div className={`${fullWidth ? "w-full" : "w-auto"} ${className}`}>
         {/* Label */}
         {label && <label className={`block font-medium mb-2 ${isError || error ? "text-red-600" : c.text}`}>{label}</label>}

         {/* Botón principal */}
         <button
            hidden={true}
            onClick={handleGetLocation}
            disabled={disabled || loading}
            className={`
          ${baseClasses}
          ${sizeClasses}
          ${variantClasses}
          ${fullWidth ? "w-full" : "w-auto"}
          transform transition-all duration-300 hover:cursor-pointer
        `}
         >
            {/* Efecto de ripple */}
            <span className="absolute inset-0 overflow-hidden rounded-xl">
               <span className="absolute inset-0 transition-all duration-300 transform scale-0 bg-white/0 group-hover:bg-white/10 group-hover:scale-100" />
            </span>

            {/* Spinner de carga */}
            {loading && <LoadingSpinner />}

            {/* Contenido del botón */}
            <span className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}>
               <LocationIcon />
               <span className="relative z-10 whitespace-nowrap">{isEditMode ? "Actualizar ubicación" : "Obtener ubicación"}</span>
            </span>
         </button>

         {/* Mensajes de error */}
         {(error || isError) && <p className="mt-2 ml-1 text-sm text-red-600">{isError ? errorFormik : error}</p>}

         {/* Mapa y coordenadas */}
         {location && showMap && (
            <div className="w-full mt-4 space-y-3 text-sm">
               {/* Coordenadas */}
               <div className="flex justify-between gap-4 ">
                  <span className="flex-1">
                     <strong>Latitud:</strong> {location.lat.toFixed(6)}
                  </span>
                  <span className="flex-1">
                     <strong>Longitud:</strong> {location.lon.toFixed(6)}
                  </span>
               </div>

               {/* Mapa */}
               {/* <div className="w-full h-64 overflow-hidden border border-gray-300 rounded-lg">
                  <MapContainer center={[location.lat, location.lon]} zoom={16} scrollWheelZoom={true} className="w-full h-full">
                     <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     />
                     <Marker position={[location.lat, location.lon]} icon={markerIcon}>
                        <Popup>Ubicación actual</Popup>
                     </Marker>
                  </MapContainer>
               </div> */}

               {/* Botón para abrir en Google Maps */}
               <button
                  hidden
                  className={`
              ${baseClasses}
              ${sizeClasses}
              ${
                 variant === "outline"
                    ? variantClasses
                    : `
                ${c.primary} text-white ${c.hover} ${c.active}
                shadow-lg ${c.glow} focus:ring-${color}-300
              `
              }
              w-full
            `}
               >
                  <a
                     href={`https://www.google.com/maps?q=${location.lat},${location.lon}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full text-center text-current no-underline"
                  >
                     Abrir en Google Maps
                  </a>
               </button>
            </div>
         )}
      </div>
   );
};

export default LocationButton;
