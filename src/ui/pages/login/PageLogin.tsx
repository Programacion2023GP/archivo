import { memo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { useUsersState } from "../../../store/storeusers/users.store";
import { ApiUsers } from "../../../infrastructure/infrastructureusers/inftrastructureusers";
import Spinner from "../../components/loading/loading";
import { useNavigate } from "react-router-dom";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";
import { FiEye, FiEyeOff, FiFileText, FiFolder, FiBarChart2, FiPieChart, FiDatabase, FiHardDrive, FiCpu, FiBox, FiArchive } from "react-icons/fi";
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaFileExcel, FaFilePowerpoint, FaFileArchive } from "react-icons/fa";

// Declaración temporal para extender los tipos de Particles si es necesario
declare module "@tsparticles/react" {
   interface IParticlesProps {
      init?: (engine: Engine) => Promise<void>;
      particlesLoaded?: (container?: Container) => Promise<void>;
   }
}

const PageLoginMorena = () => {
   const { login, loading } = useUsersState();
   const [showPassword, setShowPassword] = useState(false);
   const api = new ApiUsers();
   const navigate = useNavigate();

   // Inicializar partículas
   const particlesInit = async (engine: Engine) => {
      await loadSlim(engine);
   };

   const particlesLoaded = async (container?: Container) => {
      // console.log("Partículas cargadas", container);
   };

   const validationSchema = Yup.object({
      payroll: Yup.string().required("El usuario es requerido"),
      password: Yup.string().required("La contraseña es requerida")
   });

   const initialValues = {
      payroll: "",
      password: ""
   };

   const handleSubmit = async (values: typeof initialValues, { setSubmitting, setStatus }: any) => {
      try {
         await login(values, api);
      } catch (err: any) {
         setStatus(err.message || "Error al iniciar sesión");
      } finally {
         setSubmitting(false);
      }
   };

   // ========== NUEVOS ELEMENTOS DE ARCHIVO ==========

   // Cajas apiladas (simulan cajas de archivo)
   const stackedBoxes = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      rotate: Math.random() * 10 - 5,
      scale: 0.5 + Math.random() * 0.5,
      delay: i * 0.3,
      color: i % 2 === 0 ? "#9B2242" : "#651D32"
   }));

   // Estanterías (shelves) - líneas horizontales que simulan estantes
   const shelves = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: `${15 + i * 20}%`, // posiciones verticales
      width: `${60 + Math.random() * 30}%`,
      left: `${Math.random() * 20}%`
   }));

   // Cajones de archivo (drawers) con animación de apertura/cierre
   const fileDrawers = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: i * 0.5
   }));

   // Documentos voladores (hojas sueltas)
   const flyingPapers = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      rotate: Math.random() * 360,
      delay: i * 0.2
   }));

   // Iconos de archivos (versión extendida)
   const fileIcons = [
      // PDFs
      { icon: FaFilePdf, color: "#F40F02", size: 24, delay: 0, duration: 20, x: "5%", y: "10%" },
      { icon: FaFilePdf, color: "#F40F02", size: 28, delay: 1.2, duration: 22, x: "92%", y: "15%" },
      { icon: FaFilePdf, color: "#F40F02", size: 22, delay: 2.5, duration: 25, x: "78%", y: "85%" },
      // Word
      { icon: FaFileWord, color: "#2B5797", size: 26, delay: 0.8, duration: 24, x: "12%", y: "70%" },
      { icon: FaFileWord, color: "#2B5797", size: 30, delay: 3, duration: 28, x: "65%", y: "20%" },
      // Excel
      { icon: FaFileExcel, color: "#217346", size: 28, delay: 1.5, duration: 26, x: "20%", y: "40%" },
      { icon: FaFileExcel, color: "#217346", size: 24, delay: 4, duration: 30, x: "88%", y: "50%" },
      // PowerPoint
      { icon: FaFilePowerpoint, color: "#D24726", size: 32, delay: 2, duration: 23, x: "40%", y: "12%" },
      { icon: FaFilePowerpoint, color: "#D24726", size: 26, delay: 5, duration: 27, x: "55%", y: "80%" },
      // Imagen
      { icon: FaFileImage, color: "#00A4E4", size: 30, delay: 1, duration: 21, x: "70%", y: "60%" },
      { icon: FaFileImage, color: "#00A4E4", size: 24, delay: 3.5, duration: 29, x: "15%", y: "85%" },
      // Archivo genérico
      { icon: FaFileAlt, color: "#E8A735", size: 26, delay: 2.2, duration: 25, x: "82%", y: "30%" },
      { icon: FaFileAlt, color: "#E8A735", size: 22, delay: 4.5, duration: 32, x: "25%", y: "92%" },
      // Carpetas
      { icon: FiFolder, color: "#FFD966", size: 36, delay: 0.5, duration: 30, x: "8%", y: "25%" },
      { icon: FiFolder, color: "#FFD966", size: 32, delay: 2.8, duration: 28, x: "48%", y: "45%" },
      { icon: FiFolder, color: "#FFD966", size: 40, delay: 4.2, duration: 35, x: "95%", y: "70%" },
      // Archivos de texto
      { icon: FiFileText, color: "#B8B6AF", size: 22, delay: 1.8, duration: 22, x: "35%", y: "18%" },
      { icon: FiFileText, color: "#B8B6AF", size: 20, delay: 3.8, duration: 26, x: "72%", y: "40%" },
      // Comprimidos
      { icon: FaFileArchive, color: "#8B6B4D", size: 28, delay: 2.5, duration: 27, x: "60%", y: "95%" },
      // Base de datos, disco duro, etc.
      { icon: FiDatabase, color: "#4CAF50", size: 32, delay: 1.3, duration: 29, x: "18%", y: "55%" },
      { icon: FiHardDrive, color: "#607D8B", size: 36, delay: 3.2, duration: 33, x: "50%", y: "65%" },
      { icon: FiCpu, color: "#FF5722", size: 30, delay: 4.8, duration: 31, x: "85%", y: "12%" },
      // Gráficos
      { icon: FiBarChart2, color: "#9C27B0", size: 28, delay: 2, duration: 24, x: "30%", y: "75%" },
      { icon: FiPieChart, color: "#FF9800", size: 32, delay: 4, duration: 28, x: "75%", y: "48%" },
      // NUEVOS: Cajas y archivadores
      { icon: FiBox, color: "#CD7F32", size: 40, delay: 1.1, duration: 26, x: "22%", y: "33%" },
      { icon: FiBox, color: "#CD7F32", size: 36, delay: 3.3, duration: 31, x: "68%", y: "55%" },
      { icon: FiArchive, color: "#A0522D", size: 44, delay: 2.2, duration: 29, x: "45%", y: "22%" },
      { icon: FiArchive, color: "#A0522D", size: 38, delay: 4.4, duration: 34, x: "12%", y: "48%" }
   ];

   // Líneas de datos (ondas)
   const dataLines = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      width: Math.random() * 300 + 200,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: i * 0.5,
      duration: 15 + i * 2
   }));

   // Barras de progreso animadas alrededor del formulario
   const progressBars = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: i * 45, // grados
      delay: i * 0.3
   }));

   return (
      <>
         {loading && <Spinner />}
         <div className="min-h-screen bg-gradient-to-br from-[#9B2242] via-[#651D32] to-[#130D0E] flex items-center justify-center p-4 relative overflow-hidden">
            {/* ===== FONDO MULTICAPA CON ARCHIVOS ===== */}

            {/* Capa 1: Partículas con formas variadas */}
            <Particles
               id="tsparticles"
               init={particlesInit}
               particlesLoaded={particlesLoaded}
               options={{
                  background: { color: { value: "transparent" } },
                  fpsLimit: 60,
                  particles: {
                     color: { value: "#B8B6AF" },
                     links: {
                        color: "#B8B6AF",
                        distance: 150,
                        enable: true,
                        opacity: 0.15,
                        width: 1
                     },
                     move: {
                        enable: true,
                        speed: 0.8,
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: { default: "out" }
                     },
                     number: {
                        density: { enable: true },
                        value: 80
                     },
                     opacity: { value: 0.25 },
                     shape: {
                        type: ["circle", "square", "triangle", "polygon"],
                        options: {
                           polygon: { sides: 5 }
                        }
                     },
                     size: { value: { min: 2, max: 5 } }
                  },
                  detectRetina: true
               }}
               className="absolute inset-0 -z-5"
            />

            {/* Capa 2: Estanterías (líneas horizontales) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
               {shelves.map((shelf) => (
                  <motion.div
                     key={shelf.id}
                     className="absolute h-0.5 bg-[#B8B6AF]"
                     style={{
                        top: shelf.top,
                        left: shelf.left,
                        width: shelf.width,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                     }}
                     initial={{ scaleX: 0, opacity: 0 }}
                     animate={{ scaleX: 1, opacity: 0.6 }}
                     transition={{ duration: 1.5, delay: shelf.id * 0.1, ease: "easeOut" }}
                  />
               ))}
               {/* Soportes verticales de las estanterías */}
               {[10, 30, 50, 70, 90].map((left, i) => (
                  <motion.div
                     key={`vertical-${i}`}
                     className="absolute top-0 bottom-0 w-0.5 bg-[#B8B6AF]/30"
                     style={{ left: `${left}%` }}
                     initial={{ height: 0 }}
                     animate={{ height: "100%" }}
                     transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  />
               ))}
            </div>

            {/* Capa 3: Cajas apiladas (stacked boxes) */}
            <div className="absolute inset-0 pointer-events-none">
               {stackedBoxes.map((box) => (
                  <motion.div
                     key={box.id}
                     className="absolute"
                     style={{ left: box.left, top: box.top }}
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [box.scale, box.scale * 1.1, box.scale],
                        rotate: [box.rotate, box.rotate + 5, box.rotate - 5, box.rotate],
                        y: [0, -10, 0]
                     }}
                     transition={{
                        duration: 8 + box.id,
                        delay: box.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  >
                     {/* Caja principal */}
                     <div
                        className="relative"
                        style={{
                           width: 60,
                           height: 60,
                           backgroundColor: box.color,
                           borderRadius: 4,
                           boxShadow: "0 10px 15px -5px rgba(0,0,0,0.5)",
                           border: "1px solid rgba(255,255,255,0.2)"
                        }}
                     >
                        {/* Tapa de la caja */}
                        <div className="absolute -top-1 left-0 right-0 h-2 bg-gradient-to-b from-white/30 to-transparent rounded-t" />
                        {/* Etiqueta */}
                        <div className="absolute top-2 left-2 right-2 h-3 bg-white/20 rounded-sm flex items-center justify-center">
                           <div className="w-2 h-2 bg-[#FFD966] rounded-full" />
                        </div>
                        {/* Sombra interior */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent rounded" />
                     </div>
                     {/* Segunda caja (apilada) */}
                     <div
                        className="absolute -top-3 left-1"
                        style={{
                           width: 50,
                           height: 50,
                           backgroundColor: box.color,
                           borderRadius: 4,
                           boxShadow: "0 8px 12px -4px rgba(0,0,0,0.5)",
                           border: "1px solid rgba(255,255,255,0.2)",
                           filter: "brightness(0.9)"
                        }}
                     />
                  </motion.div>
               ))}
            </div>

            {/* Capa 4: Cajones de archivo (drawers) */}
            <div className="absolute inset-0 pointer-events-none">
               {fileDrawers.map((drawer) => (
                  <motion.div
                     key={drawer.id}
                     className="absolute"
                     style={{ left: drawer.left, top: drawer.top }}
                     animate={{
                        x: [0, 5, 0, -5, 0],
                        opacity: [0.3, 0.5, 0.3]
                     }}
                     transition={{
                        duration: 10,
                        delay: drawer.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  >
                     <div className="relative w-16 h-20 bg-[#8B5A2B] rounded border border-[#B8B6AF]/30 shadow-lg">
                        {/* Tirador */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-6 bg-[#FFD966] rounded-sm" />
                        {/* Líneas de cajón */}
                        <div className="absolute inset-x-2 top-4 h-px bg-white/20" />
                        <div className="absolute inset-x-2 bottom-4 h-px bg-white/20" />
                     </div>
                  </motion.div>
               ))}
            </div>

            {/* Capa 5: Documentos volando (hojas sueltas) */}
            <div className="absolute inset-0 pointer-events-none">
               {flyingPapers.map((paper) => (
                  <motion.div
                     key={paper.id}
                     className="absolute w-8 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-sm shadow-lg"
                     style={{ left: paper.left, top: paper.top, rotate: paper.rotate }}
                     animate={{
                        x: [0, 30, 0, -30, 0],
                        y: [0, -20, 0, 20, 0],
                        rotate: [paper.rotate, paper.rotate + 10, paper.rotate - 10, paper.rotate],
                        opacity: [0.2, 0.4, 0.2]
                     }}
                     transition={{
                        duration: 12 + paper.id,
                        delay: paper.delay,
                        repeat: Infinity,
                        ease: "linear"
                     }}
                  >
                     {/* Líneas de texto simuladas */}
                     <div className="p-1">
                        <div className="w-full h-1 bg-white/40 mb-1" />
                        <div className="w-3/4 h-1 bg-white/40 mb-1" />
                        <div className="w-1/2 h-1 bg-white/40" />
                     </div>
                  </motion.div>
               ))}
            </div>

            {/* Capa 6: Iconos flotantes de archivos (ya existentes) */}
            <div className="absolute inset-0 pointer-events-none z-0">
               {fileIcons.map((item, index) => {
                  const Icon = item.icon;
                  return (
                     <motion.div
                        key={index}
                        className="absolute"
                        style={{ left: item.x, top: item.y }}
                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                        animate={{
                           opacity: [0.2, 0.6, 0.2],
                           scale: [1, 1.2, 1],
                           rotate: [-10, 10, -10],
                           y: [0, -25, 0]
                        }}
                        transition={{
                           duration: item.duration,
                           delay: item.delay,
                           repeat: Infinity,
                           ease: "easeInOut"
                        }}
                        whileHover={{ scale: 1.5, opacity: 0.8, transition: { duration: 0.3 } }}
                     >
                        <Icon size={item.size} color={item.color} />
                     </motion.div>
                  );
               })}
            </div>

            {/* Capa 7: Líneas de datos ondulantes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
               {dataLines.map((line) => (
                  <motion.path
                     key={line.id}
                     d={`M ${line.left} ${line.top} Q ${parseFloat(line.left) + 50} ${parseFloat(line.top) - 30} ${parseFloat(line.left) + 100} ${parseFloat(line.top)}`}
                     stroke="#9B2242"
                     strokeWidth="1.5"
                     fill="transparent"
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 0.5 }}
                     transition={{
                        duration: line.duration,
                        delay: line.delay,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear"
                     }}
                  />
               ))}
            </svg>

            {/* Capa 8: Números binarios flotando */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                     key={`binary-${i}`}
                     className="absolute text-[#B8B6AF] font-mono text-xs opacity-10"
                     style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                     }}
                     animate={{
                        y: [0, -30, 0],
                        opacity: [0.1, 0.3, 0.1],
                        rotate: [0, 5, -5, 0]
                     }}
                     transition={{
                        duration: 8 + Math.random() * 10,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  >
                     {Math.random() > 0.5 ? "1011" : "0100"}
                  </motion.div>
               ))}
            </div>

            {/* Capa 9: Elementos decorativos animados (manchas de color) */}
            <div className="absolute inset-0 overflow-hidden">
               <motion.div
                  className="absolute -top-32 -right-32 w-96 h-96 bg-[#9B2242] rounded-full mix-blend-multiply filter blur-3xl opacity-30"
                  animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
               />
               <motion.div
                  className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#651D32] rounded-full mix-blend-multiply filter blur-3xl opacity-30"
                  animate={{ y: [20, -30, 20], x: [0, -20, 0] }}
                  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
               />
               <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#130D0E] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               />
            </div>

            {/* Capa 10: Barras de progreso animadas alrededor del formulario */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
               {progressBars.map((bar) => (
                  <motion.div
                     key={bar.id}
                     className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-t from-[#9B2242] to-transparent origin-bottom"
                     style={{
                        rotate: `${bar.angle}deg`,
                        translateX: "-50%",
                        translateY: "-100%"
                     }}
                     animate={{
                        height: [16, 32, 16],
                        opacity: [0.3, 0.7, 0.3]
                     }}
                     transition={{
                        duration: 2,
                        delay: bar.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                  />
               ))}
            </div>

            {/* ===== CONTENIDO PRINCIPAL ===== */}
            <div className="max-w-6xl w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-20">
               {/* Formulario con diseño de carpeta mejorado */}
               <div className="xl:col-span-4 xl:col-start-5">
                  <motion.div
                     className="relative"
                     initial={{ opacity: 0, y: 40 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                     {/* Pestaña de carpeta */}
                     <motion.div
                        className="absolute -top-6 left-8 bg-gradient-to-r from-[#9B2242] to-[#651D32] rounded-t-lg px-6 py-2 shadow-lg border border-[#B8B6AF]/20 z-10"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        whileHover={{ y: -2 }}
                     >
                        <div className="flex items-center gap-2">
                           <FiArchive className="text-[#FFD966]" size={18} />
                           <span className="text-white text-sm font-semibold tracking-wide">ARCHIVO CENTRAL</span>
                        </div>
                     </motion.div>

                     {/* Tarjeta principal con efecto scan */}
                     <motion.div
                        className="bg-gradient-to-b from-[#130D0E] to-[#1a0f10] rounded-3xl p-8 border-2 border-[#9B2242] shadow-2xl relative overflow-hidden backdrop-blur-sm bg-opacity-90 pt-10"
                        whileHover={{ y: -3, transition: { duration: 0.8 } }}
                     >
                        {/* Efecto de escaneo */}
                        <motion.div
                           className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9B2242]/10 to-transparent"
                           animate={{ top: ["-100%", "200%"] }}
                           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                           style={{ pointerEvents: "none" }}
                        />

                        {/* Borde animado */}
                        <motion.div
                           className="absolute inset-0 border-2 border-[#9B2242]/50 rounded-3xl"
                           animate={{ boxShadow: ["0 0 0 0 rgba(155,34,66,0.3)", "0 0 20px 5px rgba(155,34,66,0.5)", "0 0 0 0 rgba(155,34,66,0.3)"] }}
                           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Línea superior animada */}
                        <motion.div
                           className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#9B2242] via-[#651D32] to-[#130D0E]"
                           animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                           style={{ backgroundSize: "200% 100%" }}
                        />

                        <div className="text-center mb-8 relative z-10">
                           <motion.div
                              className="w-20 h-20 bg-gradient-to-br from-[#9B2242] to-[#651D32] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-[#B8B6AF]/20"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                           >
                              <motion.span
                                 className="text-white text-3xl"
                                 animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                              >
                                 📦
                              </motion.span>
                           </motion.div>
                           <motion.h2
                              className="text-2xl font-bold text-white mb-2"
                              initial={{ opacity: 0, y: -25 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                           >
                              Bóveda de Documentos
                           </motion.h2>
                           <motion.p
                              className="text-[#B8B6AF] text-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                           >
                              Ingrese sus credenciales para acceder al depósito
                           </motion.p>
                        </div>

                        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                           {({ isSubmitting, status }) => (
                              <Form className="space-y-6 relative z-10">
                                 {/* Mensaje de error general */}
                                 <AnimatePresence>
                                    {status && (
                                       <motion.div
                                          className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-sm"
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                       >
                                          {status}
                                       </motion.div>
                                    )}
                                 </AnimatePresence>

                                 <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                 >
                                    <label htmlFor="payroll" className="block text-sm font-semibold text-white mb-3">
                                       Nómina
                                    </label>
                                    <Field name="payroll">
                                       {({ field }) => (
                                          <motion.input
                                             {...field}
                                             type="text"
                                             id="payroll"
                                             className="w-full px-4 py-3 bg-[#130D0E] border-2 border-[#474C55] rounded-xl focus:ring-2 focus:ring-[#9B2242] focus:border-[#9B2242] transition-all duration-500 text-white placeholder-[#727372]"
                                             placeholder="Ej. 123456"
                                             whileFocus={{ scale: 1.01, borderColor: "#9B2242", transition: { duration: 0.3 } }}
                                             whileHover={{ borderColor: "#9B2242", transition: { duration: 0.4 } }}
                                          />
                                       )}
                                    </Field>
                                    <ErrorMessage name="payroll">
                                       {(error) => (
                                          <motion.div
                                             className="text-red-400 text-sm mt-2"
                                             initial={{ opacity: 0, y: -10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             exit={{ opacity: 0, y: -10 }}
                                             transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                          >
                                             {error}
                                          </motion.div>
                                       )}
                                    </ErrorMessage>
                                 </motion.div>

                                 <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                                 >
                                    <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                                       Contraseña
                                    </label>
                                    <div className="relative">
                                       <Field name="password">
                                          {({ field }) => (
                                             <motion.input
                                                {...field}
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                className="w-full px-4 py-3 bg-[#130D0E] border-2 border-[#474C55] rounded-xl focus:ring-2 focus:ring-[#9B2242] focus:border-[#9B2242] transition-all duration-500 text-white placeholder-[#727372] pr-12"
                                                placeholder="••••••••"
                                                whileFocus={{ scale: 1.01, borderColor: "#9B2242", transition: { duration: 0.3 } }}
                                                whileHover={{ borderColor: "#9B2242", transition: { duration: 0.4 } }}
                                             />
                                          )}
                                       </Field>
                                       <button
                                          type="button"
                                          onClick={() => setShowPassword(!showPassword)}
                                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B8B6AF] hover:text-white transition-colors"
                                       >
                                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                       </button>
                                    </div>
                                    <ErrorMessage name="password">
                                       {(error) => (
                                          <motion.div
                                             className="text-red-400 text-sm mt-2"
                                             initial={{ opacity: 0, y: -10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             exit={{ opacity: 0, y: -10 }}
                                             transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                          >
                                             {error}
                                          </motion.div>
                                       )}
                                    </ErrorMessage>
                                 </motion.div>

                                 <motion.button
                                    type="submit"
                                    disabled={isSubmitting || loading}
                                    initial={{ opacity: 0, y: 25 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                                    whileHover={{ scale: 1.02, transition: { duration: 0.6 } }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full hover:cursor-pointer bg-gradient-to-r from-[#9B2242] to-[#651D32] hover:from-[#8a1e3a] hover:to-[#7a1b2a] text-white font-bold py-4 px-4 rounded-xl transition-all duration-500 shadow-lg hover:shadow-xl border border-[#B8B6AF]/20 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                 >
                                    {isSubmitting || loading ? (
                                       <>
                                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                             <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                             ></path>
                                          </svg>
                                          <span>Ingresando...</span>
                                       </>
                                    ) : (
                                       <>
                                          <FiArchive size={20} />
                                          <span>Abrir Bóveda</span>
                                       </>
                                    )}
                                 </motion.button>

                                 {/* Estadísticas de archivos en tiempo real */}
                                 <motion.div
                                    className="grid grid-cols-3 gap-2 text-center text-xs text-[#B8B6AF] pt-4 border-t border-[#474C55]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.4 }}
                                 >
                                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}>
                                       <div className="font-mono text-white text-sm">1,284</div>
                                       <div>Documentos</div>
                                    </motion.div>
                                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
                                       <div className="font-mono text-white text-sm">64</div>
                                       <div>Cajas</div>
                                    </motion.div>
                                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}>
                                       <div className="font-mono text-white text-sm">2.3GB</div>
                                       <div>Espacio</div>
                                    </motion.div>
                                 </motion.div>

                                 <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.2 }}>
                                    <div className="p-2 border-t border-white/10">
                                       <p className="text-white/65 text-xs">Versión {import.meta.env.VITE_APP_VERSION}</p>
                                    </div>
                                 </motion.div>
                              </Form>
                           )}
                        </Formik>
                     </motion.div>
                  </motion.div>
               </div>
            </div>

            {/* Barra inferior animada */}
            <motion.div
               className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#9B2242] via-[#651D32] to-[#130D0E]"
               animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               style={{ backgroundSize: "200% 100%" }}
            />
         </div>
      </>
   );
};

export default memo(PageLoginMorena);
