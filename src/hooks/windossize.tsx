// hooks/useWindowSize.ts
import { useState, useEffect } from "react";

export const useWindowSize = () => {
   const [windowSize, setWindowSize] = useState({
      width: typeof window !== "undefined" ? window.innerWidth : 1024,
      height: typeof window !== "undefined" ? window.innerHeight : 768
   });

   useEffect(() => {
      // Solo ejecutar en el cliente
      if (typeof window === "undefined") return;

      const handleResize = () => {
         setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
         });
      };

      window.addEventListener("resize", handleResize);

      // Llamar inmediatamente para establecer el tamaño inicial
      handleResize();

      return () => window.removeEventListener("resize", handleResize);
   }, []);

   return windowSize;
};
