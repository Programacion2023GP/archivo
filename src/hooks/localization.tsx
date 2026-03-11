import { useState, useCallback, useRef, useEffect } from "react";
import { showToast } from "../sweetalert/Sweetalert";

interface AddressData {
   road?: string;
   suburb?: string;
   neighbourhood?: string;
   city?: string;
   town?: string;
   village?: string;
   state?: string;
   country?: string;
   postcode?: string;
   county?: string;
   city_district?: string;
   municipality?: string;
   display_name?: string;
}

interface LocationData {
   lat: number;
   lon: number;
   accuracy?: number;
   timestamp?: number;
   address?: AddressData;
}

interface UseLocationReturn {
   location: LocationData | null;
   loading: boolean;
   error: string | null;
   address: AddressData | null;
   addressLoading: boolean;
   getLocation: (getAddress?: boolean) => Promise<LocationData | null>;
   getAddress: (lat: number, lon: number) => Promise<AddressData | null>;
   clearLocation: () => void;
   formattedAddress: string | null;
   postalCode: string | null;
   city: string | null;
   colony: string | null;
   state: string | null;
   forceGetLocation: () => Promise<LocationData | null>;
}

// Cache global con mejor estructura
const cache = {
   location: null as LocationData | null,
   address: new Map<string, { data: AddressData; timestamp: number }>(),
   lastFetch: 0,
   CACHE_DURATION: 5 * 60 * 1000 // 5 minutos
};

// Rate limiting para Nominatim
let lastNominatimCall = 0;
const NOMINATIM_DELAY = 1000; // 1 segundo entre llamadas

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useLocation = (options?: PositionOptions): UseLocationReturn => {
   const [location, setLocation] = useState<LocationData | null>(null);
   const [address, setAddress] = useState<AddressData | null>(null);
   const [loading, setLoading] = useState(false);
   const [addressLoading, setAddressLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const isFetching = useRef(false);
   const abortController = useRef<AbortController | null>(null);
   const locationPromiseRef = useRef<Promise<LocationData | null> | null>(null);

   // Limpiar al desmontar
   useEffect(() => {
      return () => {
         if (abortController.current) {
            abortController.current.abort();
         }
      };
   }, []);

   const formatAddress = useCallback((addressData: AddressData | null): string => {
      if (!addressData) return "";

      const parts = [
         addressData.road,
         addressData.suburb || addressData.neighbourhood,
         addressData.city || addressData.town || addressData.village || addressData.municipality,
         addressData.state,
         addressData.postcode
      ].filter(Boolean);

      return parts.join(", ");
   }, []);

   const getAddress = useCallback(async (lat: number, lon: number): Promise<AddressData | null> => {
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      const now = Date.now();

      // Verificar cache
      const cached = cache.address.get(cacheKey);
      if (cached && now - cached.timestamp < cache.CACHE_DURATION) {
         setAddress(cached.data);
         return cached.data;
      }

      // Rate limiting
      const timeSinceLastCall = now - lastNominatimCall;
      if (timeSinceLastCall < NOMINATIM_DELAY) {
         await wait(NOMINATIM_DELAY - timeSinceLastCall);
      }

      setAddressLoading(true);
      lastNominatimCall = Date.now();

      try {
         abortController.current = new AbortController();

         console.log("🌍 Consultando dirección...");

         // Intentar con Nominatim
         const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

         const response = await fetch(nominatimUrl, {
            signal: abortController.current.signal,
            headers: {
               "Accept-Language": "es",
               "User-Agent": "LocationApp/1.0"
            }
         });

         if (response.ok) {
            const data = await response.json();
            const addressData = data.address;

            console.log("✅ Dirección obtenida:", addressData);

            // Guardar en cache
            cache.address.set(cacheKey, {
               data: addressData,
               timestamp: now
            });

            setAddress(addressData);
            setAddressLoading(false);

            // Guardar en localStorage
            try {
               localStorage.setItem("ubicacion", JSON.stringify(addressData));
            } catch (e) {
               console.warn("No se pudo guardar en localStorage");
            }

            return addressData;
         }

         throw new Error("No se pudo obtener la dirección");
      } catch (error: any) {
         if (error.name !== "AbortError") {
            console.error("❌ Error obteniendo dirección:", error);
            showToast("No se pudo obtener la dirección completa", "warning");
         }
         setAddressLoading(false);
         return null;
      }
   }, []);

   const forceGetLocation = useCallback(
      async (getAddressData: boolean = false): Promise<LocationData | null> => {
         console.log("🚀 Forzando obtención de ubicación...");

         if (!navigator.geolocation) {
            const errorMsg = "Geolocalización no soportada por el navegador";
            setError(errorMsg);
            showToast(errorMsg, "error");
            return null;
         }

         setLoading(true);
         setError(null);
         isFetching.current = true;

         // Forzar máxima precisión y tiempos ajustados
         const forceOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 30000, // 30 segundos máximo
            maximumAge: 0, // No usar cache
            ...options
         };

         try {
            // Crear una promesa que maneje getCurrentPosition
            const locationPromise = new Promise<LocationData>((resolve, reject) => {
               let completed = false;

               const onSuccess = async (position: GeolocationPosition) => {
                  if (completed) return;
                  completed = true;

                  const locationData: LocationData = {
                     lat: position.coords.latitude,
                     lon: position.coords.longitude,
                     accuracy: position.coords.accuracy,
                     timestamp: position.timestamp
                  };

                  console.log("🎯 Ubicación obtenida forzadamente:", locationData);
                  showToast("Ubicación obtenida exitosamente", "success");

                  // Actualizar estados
                  setLocation(locationData);
                  cache.location = locationData;
                  cache.lastFetch = Date.now();

                  // Obtener dirección si se solicita
                  if (getAddressData) {
                     const addressData = await getAddress(locationData.lat, locationData.lon);
                     if (addressData) {
                        locationData.address = addressData;
                        cache.location = locationData;
                     }
                  }

                  resolve(locationData);
               };

               const onError = (error: GeolocationPositionError) => {
                  if (completed) return;
                  completed = true;

                  const errorMessages: Record<number, string> = {
                     1: "Permiso denegado. Por favor, habilita la ubicación en tu navegador.",
                     2: "Ubicación no disponible. Verifica tu conexión GPS/WiFi.",
                     3: "Tiempo de espera agotado. Intenta nuevamente."
                  };

                  const message = errorMessages[error.code] || "Error al obtener ubicación";
                  console.error("❌ Error de geolocalización:", message);

                  setError(message);
                  showToast(message, "error");
                  reject(new Error(message));
               };

               // Llamar a getCurrentPosition con manejo de timeout manual
               const timer = setTimeout(() => {
                  if (!completed) {
                     completed = true;
                     const message = "Timeout: No se pudo obtener la ubicación a tiempo";
                     setError(message);
                     showToast(message, "error");
                     reject(new Error(message));
                  }
               }, forceOptions.timeout);

               navigator.geolocation.getCurrentPosition(
                  (pos) => {
                     clearTimeout(timer);
                     onSuccess(pos);
                  },
                  (err) => {
                     clearTimeout(timer);
                     onError(err);
                  },
                  forceOptions
               );
            });

            const locationData = await locationPromise;
            return locationData;
         } catch (error: any) {
            console.error("Error forzado:", error);

            // Intentar métodos alternativos si el principal falla
            if (error.message.includes("Permiso denegado") || error.message.includes("timeout")) {
               showToast("Usando ubicación aproximada...", "info");

               // Método alternativo: usar IP para ubicación aproximada
               try {
                  const ipResponse = await fetch("https://ipapi.co/json/");
                  if (ipResponse.ok) {
                     const ipData = await ipResponse.json();
                     const fallbackLocation: LocationData = {
                        lat: ipData.latitude,
                        lon: ipData.longitude,
                        accuracy: 50000, // Baja precisión (50km)
                        timestamp: Date.now()
                     };

                     setLocation(fallbackLocation);
                     showToast("Ubicación aproximada obtenida por IP", "warning");
                     return fallbackLocation;
                  }
               } catch (ipError) {
                  console.error("Error al obtener ubicación por IP:", ipError);
               }
            }

            return null;
         } finally {
            setLoading(false);
            isFetching.current = false;
         }
      },
      [getAddress, options]
   );

   const getLocation = useCallback(
      async (getAddressData: boolean = false): Promise<LocationData | null> => {
         // Si ya hay una petición en curso, usar la existente
         if (isFetching.current && locationPromiseRef.current) {
            console.log("⏳ Usando petición existente...");
            return locationPromiseRef.current;
         }

         // Usar cache solo si es muy reciente (menos de 30 segundos)
         const now = Date.now();
         if (cache.location && now - cache.lastFetch < 30000) {
            console.log("♻️ Usando ubicación en cache");
            setLocation(cache.location);

            if (getAddressData && cache.location.address) {
               setAddress(cache.location.address);
            } else if (getAddressData) {
               getAddress(cache.location.lat, cache.location.lon);
            }

            return cache.location;
         }

         // Crear nueva promesa
         locationPromiseRef.current = forceGetLocation(getAddressData);
         const result = await locationPromiseRef.current;
         locationPromiseRef.current = null;

         return result;
      },
      [forceGetLocation, getAddress]
   );

   const clearLocation = useCallback(() => {
      setLocation(null);
      setAddress(null);
      setError(null);
      cache.location = null;
      locationPromiseRef.current = null;
   }, []);

   return {
      location,
      loading,
      error,
      address,
      addressLoading,
      getLocation,
      getAddress,
      clearLocation,
      formattedAddress: formatAddress(address),
      postalCode: address?.postcode || null,
      city: address?.city || address?.town || address?.village || address?.municipality || null,
      colony: address?.suburb || address?.neighbourhood || null,
      state: address?.state || null,
      forceGetLocation
   };
};
