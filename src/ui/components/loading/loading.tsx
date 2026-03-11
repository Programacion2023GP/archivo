import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../../assets/logo-c.png";

// Types and Interfaces
interface SpinnerProps {
   image?: string;
   fixed?:boolean,
   size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
   message?: string;
   overlayColor?: string;
   showParticles?: boolean;
   blurIntensity?: "sm" | "md" | "lg";
   showBouncingDots?: boolean;
   bounceHeight?: number;
   bounceDuration?: number;
   expandDelay?: number;
   onLoadingComplete?: () => void;
   loadingProgress?: number;
   maxLoadingTime?: number;
   enableVoiceOver?: boolean;
   theme?: "light" | "dark" | "auto";
   disableExpansion?: boolean;
}

// Custom hook for performance optimization
const usePerformance = () => {
   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
   }, []);

   return { isMobile };
};

// Custom hook for accessibility
const useAccessibility = (message: string, enableVoiceOver: boolean) => {
   useEffect(() => {
      if (enableVoiceOver) {
         const ariaLive = document.createElement("div");
         ariaLive.setAttribute("aria-live", "polite");
         ariaLive.setAttribute("aria-atomic", "true");
         ariaLive.className = "sr-only";
         ariaLive.textContent = `${message}, por favor espere`;
         document.body.appendChild(ariaLive);

         return () => {
            document.body.removeChild(ariaLive);
         };
      }
   }, [message, enableVoiceOver]);
};

const Spinner = ({
   image = Logo,
   size = "xl",
   message = "Cargando",
   overlayColor = "bg-[#9B2242]",
   showParticles = true,
   blurIntensity = "lg",
   showBouncingDots = true,
   bounceHeight = 25,
   bounceDuration = 1.2,
   expandDelay = 3000,
   onLoadingComplete,
   loadingProgress,
   maxLoadingTime = 15000,
   enableVoiceOver = true,
   theme = "auto",
   fixed=true,
   disableExpansion = false
}: SpinnerProps) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const [isVisible, setIsVisible] = useState(true);
   const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
   const { isMobile } = usePerformance();

   // Accessibility hook
   useAccessibility(message, enableVoiceOver);

   // Theme detection
   useEffect(() => {
      if (theme === "auto") {
         const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
         setCurrentTheme(isDark ? "dark" : "light");
      } else {
         setCurrentTheme(theme);
      }
   }, [theme]);

   // Size configurations with responsive design
   const sizeClasses = useMemo(
      () => ({
         sm: "w-16 h-16 md:w-20 md:h-20",
         md: "w-24 h-24 md:w-28 md:h-28",
         lg: "w-32 h-32 md:w-36 md:h-36",
         xl: "w-44 h-44 md:w-52 md:h-52",
         "2xl": "w-64 h-64 md:w-72 md:h-72",
         "3xl": "w-88 h-88 md:w-96 md:h-96"
      }),
      []
   );

   const imageSizeClasses = useMemo(
      () => ({
         sm: "w-12 h-12 md:w-16 md:h-16",
         md: "w-20 h-20 md:w-24 md:h-24",
         lg: "w-28 h-28 md:w-32 md:h-32",
         xl: "w-40 h-40 md:w-44 md:h-44",
         "2xl": "w-56 h-56 md:w-64 md:h-64",
         "3xl": "w-80 h-80 md:w-88 md:h-88"
      }),
      []
   );

   const expandedSizeClasses = useMemo(
      () => ({
         sm: "w-24 h-24 md:w-32 md:h-32",
         md: "w-36 h-36 md:w-48 md:h-48",
         lg: "w-48 h-48 md:w-64 md:h-64",
         xl: "w-60 h-60 md:w-80 md:h-80",
         "2xl": "w-72 h-72 md:w-96 md:h-96",
         "3xl": "w-96 h-96 md:w-120 md:h-120"
      }),
      []
   );

   const blurClasses = useMemo(
      () => ({
         sm: "backdrop-blur-sm",
         md: "backdrop-blur-md",
         lg: "backdrop-blur-xl"
      }),
      []
   );

   // Theme-based colors
   const themeColors = useMemo(
      () => ({
         light: {
            primary: "#9B2242",
            secondary: "#651D32",
            tertiary: "#474C55",
            background: "bg-white/90",
            text: "text-gray-800",
            overlay: "bg-white/20"
         },
         dark: {
            primary: "#9B2242",
            secondary: "#651D32",
            tertiary: "#B8B6AF",
            background: "bg-[#130D0E]/40",
            text: "text-white",
            overlay: "bg-[#130D0E]/30"
         }
      }),
      []
   );

   const colors = themeColors[currentTheme];

   // Animation configurations
   const springTransition = useMemo(
      () => ({
         type: "spring" as const,
         damping: 20,
         stiffness: 400,
         mass: 0.5
      }),
      []
   );

   const bounceTransition = useMemo(
      () => ({
         duration: bounceDuration,
         repeat: Infinity,
         ease: "easeInOut" as const
      }),
      [bounceDuration]
   );

   // Expansion effect with safety timeout
   useEffect(() => {
      if (disableExpansion) return;

      const expansionTimer = setTimeout(() => {
         setIsExpanded(true);
      }, expandDelay);

      // Safety timeout to prevent infinite loading
      const safetyTimer = setTimeout(() => {
         if (onLoadingComplete) {
            onLoadingComplete();
         }
      }, maxLoadingTime);

      return () => {
         clearTimeout(expansionTimer);
         clearTimeout(safetyTimer);
      };
   }, [expandDelay, maxLoadingTime, onLoadingComplete, disableExpansion]);

   // Handle loading completion
   const handleLoadingComplete = useCallback(() => {
      setIsVisible(false);
      setTimeout(() => {
         if (onLoadingComplete) onLoadingComplete();
      }, 500);
   }, [onLoadingComplete]);

   // Progress-based completion
   useEffect(() => {
      if (loadingProgress >= 100) {
         handleLoadingComplete();
      }
   }, [loadingProgress, handleLoadingComplete]);

   // Optimized default spinner with reduced motion support
   const DefaultSpinner = useMemo(
      () => (
         <motion.svg
            className={`${isExpanded ? expandedSizeClasses[size] : imageSizeClasses[size]} text-[${colors.primary}] drop-shadow-2xl transition-all duration-1000`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            animate={{
               y: [0, -bounceHeight, 0],
               scale: [1, 1.15, 1],
               rotate: [0, 180, 360]
            }}
            transition={{
               ...bounceTransition,
               rotate: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
               }
            }}
         >
            <defs>
               <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.primary} />
                  <stop offset="50%" stopColor={colors.secondary} />
                  <stop offset="100%" stopColor={colors.tertiary} />
               </linearGradient>
            </defs>
            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="url(#spinner-gradient)" strokeWidth="4" />
            <path
               className="opacity-80"
               fill="url(#spinner-gradient)"
               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
         </motion.svg>
      ),
      [isExpanded, size, colors, bounceHeight, bounceTransition, expandedSizeClasses, imageSizeClasses]
   );

   // Optimized bouncing dots with reduced particles on mobile
   const BouncingDots = useMemo(
      () => (
         <div className="flex justify-center items-center space-x-2 mt-6 relative z-10">
            {message.split("").map((char, index) => (
               <motion.span
                  key={index}
                  className={`${colors.text} font-semibold text-lg md:text-xl`}
                  animate={{
                     y: [0, -12, 0],
                     scale: [1, 1.2, 1],
                     opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                     duration: bounceDuration,
                     repeat: Infinity,
                     delay: index * 0.1,
                     ease: "easeInOut"
                  }}
               >
                  {char}
               </motion.span>
            ))}
            {[0, 1, 2].map((index) => (
               <motion.span
                  key={`dot-${index}`}
                  className={`${colors.text} font-semibold text-lg md:text-xl`}
                  animate={{
                     y: [0, -12, 0],
                     scale: [1, 1.2, 1],
                     opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                     duration: bounceDuration,
                     repeat: Infinity,
                     delay: message.length * 0.1 + index * 0.15,
                     ease: "easeInOut"
                  }}
               >
                  .
               </motion.span>
            ))}
         </div>
      ),
      [message, bounceDuration, colors.text]
   );

   // Performance-optimized particles
   const EnhancedParticles = useMemo(
      () => (
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(isMobile ? 4 : 8)].map((_, i) => (
               <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                     background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                     left: `${Math.random() * 100}%`,
                     top: `${Math.random() * 100}%`
                  }}
                  animate={{
                     y: [0, -60, 0],
                     x: [0, Math.random() * 30 - 15, 0],
                     opacity: [0, 0.8, 0],
                     scale: [0, 1, 0]
                  }}
                  transition={{
                     duration: 3 + Math.random() * 2,
                     repeat: Infinity,
                     delay: Math.random() * 1,
                     ease: "easeInOut"
                  }}
               />
            ))}
         </div>
      ),
      [isMobile, colors.primary, colors.secondary]
   );

   // Progress bar component
   const ProgressBar = useMemo(
      () => (
         <div className="w-48 md:w-64 h-1 bg-white/20 rounded-full overflow-hidden relative z-10 mt-4">
            <motion.div
               className="h-full rounded-full transition-all duration-1000"
               style={{
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.tertiary})`
               }}
               animate={{
                  x: loadingProgress !== undefined ? ["-100%", "0%"] : ["-100%", "100%"]
               }}
               transition={{
                  duration: loadingProgress !== undefined ? 0.5 : 2.5,
                  repeat: loadingProgress !== undefined ? 0 : Infinity,
                  ease: "easeInOut"
               }}
               initial={false}
            />
         </div>
      ),
      [loadingProgress, colors]
   );

   if (!isVisible) return null;

   return ReactDOM.createPortal(
      <AnimatePresence>
         <motion.div
            className={`${!fixed ? 'fixed':'absolute'} z-[3000] inset-0 ${isExpanded ? "bg-[#651D32]" : overlayColor} ${
               blurClasses[blurIntensity]
            } flex flex-col justify-center items-center transition-all duration-1000`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            role="status"
            aria-live="polite"
            aria-label={`${message} en progreso`}
         >
            {/* Main container */}
            <motion.div
               className={`${
                  isExpanded ? colors.overlay : colors.background
               } backdrop-blur-2xl rounded-3xl p-6 md:p-10 shadow-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000`}
               initial={{ scale: 0.9, y: 10 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={springTransition}
            >
               {/* Animated gradient background */}
               <motion.div
                  className="absolute inset-0 transition-all duration-1000"
                  style={{
                     background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15, ${colors.tertiary}20)`
                  }}
                  animate={{
                     backgroundPosition: ["0% 0%", "100% 100%"]
                  }}
                  transition={{
                     duration: 8,
                     repeat: Infinity,
                     repeatType: "reverse",
                     ease: "linear"
                  }}
               />

               {/* Subtle glow effect */}
               <div className={`absolute inset-0 ${colors.text}/10 blur-xl transition-all duration-1000`} />

               {/* Spinner container */}
               <motion.div
                  className={`${
                     isExpanded ? expandedSizeClasses[size] : sizeClasses[size]
                  } rounded-2xl flex items-center justify-center mb-6 md:mb-8 relative z-10 transition-all duration-1000`}
               >
                  {/* Pulsing aura effect */}
                  <motion.div
                     className="absolute inset-0 rounded-2xl transition-all duration-1000"
                     style={{
                        background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`
                     }}
                     animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3]
                     }}
                     transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  />

                  {/* Animated border */}
                  <motion.div
                     className="absolute inset-0 rounded-2xl border-2 transition-all duration-1000"
                     style={{
                        borderColor: `${colors.primary}40`
                     }}
                     animate={{
                        borderColor: [`${colors.primary}40`, `${colors.secondary}60`, `${colors.primary}40`]
                     }}
                     transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  />

                  {image ? (
                     <motion.img
                        src={image}
                        alt="Cargando..."
                        className={`${
                           isExpanded ? expandedSizeClasses[size] : imageSizeClasses[size]
                        } rounded-2xl object-cover relative z-10 shadow-2xl drop-shadow-2xl transition-all duration-1000`}
                        animate={{
                           y: [0, -bounceHeight, 0],
                           scale: [1, 1.15, 1]
                        }}
                        transition={bounceTransition}
                     />
                  ) : (
                     DefaultSpinner
                  )}
               </motion.div>

               {/* Bouncing dots */}
               {showBouncingDots && BouncingDots}

               {/* Progress bar */}
               {loadingProgress !== undefined && ProgressBar}

               {/* Skip button for accessibility */}
               {onLoadingComplete && (
                  <motion.button
                     className={`mt-4 px-4 py-2 rounded-lg ${colors.text} bg-white/20 backdrop-blur-sm text-sm font-medium hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
                     onClick={handleLoadingComplete}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                  >
                     Saltar
                  </motion.button>
               )}
            </motion.div>

            {/* Particles */}
            {showParticles && EnhancedParticles}
         </motion.div>
      </AnimatePresence>,
      document.body
   );
};

// Enhanced AnimatedSpinner with all improvements
export const AnimatedSpinner = ({
   gifSrc = "https://cdn.dribbble.com/users/1081076/screenscreenshots/2832850/media/f4cd9d46f7e64bf6ea51a5f7830d4f21.gif",
   message = "Cargando",
   size = "xl",
   showBouncingDots = true,
   expandDelay = 3000,
   onLoadingComplete,
   loadingProgress,
   enableVoiceOver = true,
   theme = "auto"
}: {
   gifSrc?: string;
   message?: string;
   size?: "lg" | "xl" | "2xl";
   showBouncingDots?: boolean;
   expandDelay?: number;
   onLoadingComplete?: () => void;
   loadingProgress?: number;
   enableVoiceOver?: boolean;
   theme?: "light" | "dark" | "auto";
}) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const [isVisible, setIsVisible] = useState(true);
   const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
   const { isMobile } = usePerformance();

   useAccessibility(message, enableVoiceOver);

   useEffect(() => {
      if (theme === "auto") {
         const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
         setCurrentTheme(isDark ? "dark" : "light");
      } else {
         setCurrentTheme(theme);
      }
   }, [theme]);

   const themeColors = {
      light: { text: "text-gray-800", background: "bg-white/25" },
      dark: { text: "text-white", background: "bg-[#130D0E]/40" }
   };

   const colors = themeColors[currentTheme];

   const gifSizeClasses = {
      lg: "w-48 h-48 md:w-56 md:h-56",
      xl: "w-56 h-56 md:w-72 md:h-72",
      "2xl": "w-64 h-64 md:w-96 md:h-96"
   };

   const expandedGifSizeClasses = {
      lg: "w-56 h-56 md:w-72 md:h-72",
      xl: "w-64 h-64 md:w-96 md:h-96",
      "2xl": "w-72 h-72 md:w-120 md:h-120"
   };

   const springTransition = {
      type: "spring" as const,
      damping: 25,
      stiffness: 400,
      mass: 0.6
   };

   const bounceTransition = {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut" as const
   };

   useEffect(() => {
      const timer = setTimeout(() => {
         setIsExpanded(true);
      }, expandDelay);

      const safetyTimer = setTimeout(() => {
         if (onLoadingComplete) {
            handleLoadingComplete();
         }
      }, 15000);

      return () => {
         clearTimeout(timer);
         clearTimeout(safetyTimer);
      };
   }, [expandDelay, onLoadingComplete]);

   const handleLoadingComplete = () => {
      setIsVisible(false);
      setTimeout(() => {
         if (onLoadingComplete) onLoadingComplete();
      }, 500);
   };

   useEffect(() => {
      if (loadingProgress >= 100) {
         handleLoadingComplete();
      }
   }, [loadingProgress]);

   const BouncingDots = useMemo(
      () => (
         <div className="flex justify-center items-center space-x-2 mt-6 md:mt-8 relative z-10">
            {message.split("").map((char, index) => (
               <motion.span
                  key={index}
                  className={`${colors.text} font-bold text-lg md:text-xl`}
                  animate={{
                     y: [0, -15, 0],
                     scale: [1, 1.3, 1],
                     opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                     duration: 1.2,
                     repeat: Infinity,
                     delay: index * 0.1,
                     ease: "easeInOut"
                  }}
               >
                  {char}
               </motion.span>
            ))}
            {[0, 1, 2].map((index) => (
               <motion.span
                  key={`dot-${index}`}
                  className={`${colors.text} font-bold text-lg md:text-xl`}
                  animate={{
                     y: [0, -15, 0],
                     scale: [1, 1.3, 1],
                     opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                     duration: 1.2,
                     repeat: Infinity,
                     delay: message.length * 0.1 + index * 0.15,
                     ease: "easeInOut"
                  }}
               >
                  .
               </motion.span>
            ))}
         </div>
      ),
      [message, colors.text]
   );

   if (!isVisible) return null;

   return ReactDOM.createPortal(
      <AnimatePresence>
         <motion.div
            className={`fixed z-[3000] inset-0 ${
               isExpanded ? "bg-[#651D32]" : "bg-[#9B2242]"
            } backdrop-blur-2xl flex flex-col justify-center items-center transition-all duration-1000`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            role="status"
            aria-live="polite"
            aria-label={`${message} en progreso`}
         >
            <motion.div
               className={`${
                  isExpanded ? colors.background : colors.background
               } backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 flex flex-col items-center relative overflow-hidden transition-all duration-1000`}
               initial={{ scale: 0.9, y: 10 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={springTransition}
            >
               <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#9B2242]/25 via-[#651D32]/20 to-[#474C55]/25 transition-all duration-1000"
                  animate={{
                     backgroundPosition: ["0% 0%", "200% 200%"]
                  }}
                  transition={{
                     duration: 10,
                     repeat: Infinity,
                     repeatType: "reverse",
                     ease: "linear"
                  }}
               />

               <motion.img
                  src={gifSrc}
                  alt="Cargando..."
                  className={`${
                     isExpanded ? expandedGifSizeClasses[size] : gifSizeClasses[size]
                  } rounded-3xl object-cover mb-6 md:mb-8 relative z-10 shadow-3xl drop-shadow-2xl border-2 border-white/20 transition-all duration-1000`}
                  animate={{
                     y: [0, -30, 0],
                     scale: [1, 1.18, 1]
                  }}
                  transition={bounceTransition}
               />

               {showBouncingDots && BouncingDots}

               <div className="w-48 md:w-64 h-1 bg-white/20 rounded-full overflow-hidden relative z-10 mt-4">
                  <motion.div
                     className="h-full bg-gradient-to-r from-[#9B2242] via-[#651D32] to-[#474C55] rounded-full transition-all duration-1000"
                     animate={{
                        x: loadingProgress !== undefined ? ["-100%", "0%"] : ["-100%", "100%"]
                     }}
                     transition={{
                        duration: loadingProgress !== undefined ? 0.5 : 2.5,
                        repeat: loadingProgress !== undefined ? 0 : Infinity,
                        ease: "easeInOut"
                     }}
                     initial={false}
                  />
               </div>

               {onLoadingComplete && (
                  <motion.button
                     className={`mt-4 px-4 py-2 rounded-lg ${colors.text} bg-white/20 backdrop-blur-sm text-sm font-medium hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
                     onClick={handleLoadingComplete}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                  >
                     Saltar
                  </motion.button>
               )}
            </motion.div>
         </motion.div>
      </AnimatePresence>,
      document.body
   );
};

export default Spinner;
