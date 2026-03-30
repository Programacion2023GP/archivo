// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         colors: {
            // Tus colores personalizados aquí
         },
         fontFamily: {
            signature: ["Dancing Script", "cursive"],
            cursive: ["Great Vibes", "cursive"],
            handwriting: ["Pacifico", "cursive"]
         },
         animation: {
            "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "cursor-blink": "blink 1s step-end infinite"
         },
         keyframes: {
            blink: {
               "0%, 100%": { opacity: "1" },
               "50%": { opacity: "0" }
            }
         }
      }
   },
   plugins: []
};
