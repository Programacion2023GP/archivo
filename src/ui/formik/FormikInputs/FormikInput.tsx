import { FastField, Field, useField, useFormikContext } from "formik";
import { useEffect, useRef, useState } from "react";
import { ColComponent } from "../../components/responsive/Responsive";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";
import { FaCheck, FaEyeDropper, FaMinus, FaPalette, FaPlus } from "react-icons/fa";
import { IoMdArrowDropdown } from "react-icons/io";
import { AiOutlineCamera, AiOutlineClose, AiOutlineEye } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────────
   DESIGN SYSTEM — tokens cohesivos para todos los componentes
───────────────────────────────────────────────────────────────── */
const DS = {
   // Colores base
   bg: "#FAFAF9",
   white: "#FFFFFF",
   surface: "#F5F4F1",
   surfaceHover: "#EFEDE8",

   // Bordes
   border: "#D6D3CC",
   borderHover: "#A8A39A",
   borderFocus: "#2D2A26",
   borderError: "#C0392B",

   // Texto
   text1: "#1C1A17",
   text2: "#6B6560",
   text3: "#A8A39A",
   textPlaceholder: "#B8B3AA",

   // Accent — índigo oscuro con carácter
   accent: "#3730A3",
   accentLight: "rgba(55,48,163,0.08)",
   accentMid: "rgba(55,48,163,0.16)",
   accentGlow: "0 0 0 3px rgba(55,48,163,0.12)",

   // Estado error
   errorBg: "#FEF2F2",
   errorBorder: "#FCA5A5",
   errorText: "#DC2626",

   // Estado éxito
   successBg: "#F0FDF4",
   successText: "#16A34A",

   // Radios
   r3: "4px",
   r6: "8px",
   r8: "10px",
   r10: "12px",
   r12: "14px",

   // Sombras
   shadowSm: "0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)",
   shadowMd: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
   shadowLg: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
   shadowDropdown: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)",

   // Transiciones
   transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)"
};

/* ─────────────────────────────────────────────────────────────────
   FIELD WRAPPER — contenedor base para todos los campos
───────────────────────────────────────────────────────────────── */
const FieldShell = ({
   isFocused,
   hasError,
   disabled,
   children,
   label,
   name,
   isActive
}: {
   isFocused: boolean;
   hasError: boolean;
   disabled?: boolean;
   children: React.ReactNode;
   label: string;
   name: string;
   isActive: boolean;
}) => {
   const borderColor = hasError ? DS.borderError : isFocused ? DS.borderFocus : DS.border;

   const boxShadow = hasError ? "0 0 0 3px rgba(220,38,38,0.10)" : isFocused ? DS.accentGlow : "none";

   return (
      <div style={{ position: "relative", marginBottom: "20px" }}>
         {/* Floating label */}
         <label
            htmlFor={name}
            style={{
               position: "absolute",
               left: "12px",
               top: isActive ? "-9px" : "14px",
               fontSize: isActive ? "11px" : "14px",
               fontWeight: isActive ? 600 : 400,
               color: isActive ? (hasError ? DS.errorText : isFocused ? DS.accent : DS.text2) : DS.textPlaceholder,
               background: disabled ? DS.surface : DS.white,
               padding: "0 4px",
               pointerEvents: "none",
               transition: DS.transition,
               letterSpacing: isActive ? "0.04em" : "0",
               textTransform: isActive ? "uppercase" : "none",
               zIndex: 2
            }}
         >
            {label}
         </label>

         {/* Border container */}
         <div
            style={{
               border: `1.5px solid ${borderColor}`,
               borderRadius: DS.r8,
               background: disabled ? DS.surface : DS.white,
               boxShadow,
               transition: DS.transition,
               overflow: "hidden"
            }}
         >
            {children}
         </div>
      </div>
   );
};

/* ─────────────────────────────────────────────────────────────────
   ERROR MESSAGE
───────────────────────────────────────────────────────────────── */
const FieldError = ({ error }: { error: string | null }) =>
   error ? (
      <motion.div
         initial={{ opacity: 0, y: -4, height: 0 }}
         animate={{ opacity: 1, y: 0, height: "auto" }}
         exit={{ opacity: 0, y: -4, height: 0 }}
         transition={{ duration: 0.15 }}
         style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "6px",
            padding: "6px 10px",
            background: DS.errorBg,
            border: `1px solid ${DS.errorBorder}`,
            borderRadius: DS.r6
         }}
      >
         <div
            style={{
               width: 5,
               height: 5,
               borderRadius: "50%",
               background: DS.errorText,
               flexShrink: 0
            }}
         />
         <span
            style={{
               fontSize: "12px",
               fontWeight: 500,
               color: DS.errorText,
               lineHeight: 1.4
            }}
         >
            {error}
         </span>
      </motion.div>
   ) : null;

/* ─────────────────────────────────────────────────────────────────
   DISABLED FIELD DISPLAY
───────────────────────────────────────────────────────────────── */
const DisabledField = ({ label, value, error, multiline = false }: { label: string; value: any; error: string | null; multiline?: boolean }) => (
   <div style={{ position: "relative", marginBottom: "20px" }}>
      <label
         style={{
            position: "absolute",
            left: "12px",
            top: "-9px",
            fontSize: "11px",
            fontWeight: 600,
            color: DS.text3,
            background: DS.surface,
            padding: "0 4px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            zIndex: 2
         }}
      >
         {label}
      </label>
      <div
         style={{
            border: `1.5px solid ${DS.border}`,
            borderRadius: DS.r8,
            background: DS.surface,
            padding: multiline ? "16px 12px 10px" : "13px 12px",
            minHeight: multiline ? "80px" : "auto"
         }}
      >
         <span
            style={{
               display: "block",
               fontSize: "14px",
               color: DS.text2,
               whiteSpace: multiline ? "pre-wrap" : "normal"
            }}
         >
            {value || "—"}
         </span>
      </div>
      <FieldError error={error} />
   </div>
);

/* ═══════════════════════════════════════════════════════════════
   FORMIK TEXT AREA
═══════════════════════════════════════════════════════════════ */
type InputWithLabelProps = {
   id?: string;
   label: string;
   name: string;
   responsive?: { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
   type?: "number" | "text" | "date" | "checkbox" | "datetime-local";
   disabled?: boolean;
   padding?: boolean;
   value?: any;
   hidden?: boolean;
   render?: React.ReactNode;
   handleModified?: (values: Record<string, any>, setFieldValue: (name: string, value: any, shouldValidate?: boolean) => void) => void;
   onBlur?: (e: React.FocusEvent<HTMLInputElement>, values: Record<string, any>) => void;
   maskType?: "phone" | "curp" | "cp" | "plate" | "email" | "date" | "time" | "money" | "percentage" | "onlyLetters" | "onlyNumbers" | "alphanumeric" | "rfc";
   mask?: "phone" | "cpf" | "cnpj" | "date" | "currency" | "custom" | ((value: string) => string);
   maskPattern?: string;
   icon?: React.ReactNode;
   iconPosition?: "left" | "right";
   onIconClick?: () => void;
   saveUnmasked?: boolean;
};

export const FormikTextArea: React.FC<InputWithLabelProps> = ({
   label,
   name,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   handleModified,
   disabled = false,
   id,
   padding = true,
   value
}) => {
   const formik = useFormikContext();
   const [isFocused, setIsFocused] = useState(false);

   useEffect(() => {
      if (value !== undefined && value !== null) {
         formik.setFieldValue(name, value, false);
      }
   }, [value]);

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <FastField name={name}>
            {({ field, form: { errors, touched, values, setFieldValue, setFieldTouched } }: any) => {
               const error = touched?.[name] && errors?.[name] ? String(errors[name]) : null;
               const hasValue = values?.[name] && values[name].toString().length > 0;
               const isActive = hasValue || isFocused;
               const charCount = values?.[name]?.length || 0;

               const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const newValue = e.target.value;
                  setFieldValue(name, newValue);
                  if (values && newValue !== field.value && handleModified) {
                     handleModified({ ...values, [name]: newValue }, setFieldValue);
                  }
               };

               if (disabled) {
                  return <DisabledField label={label} value={values?.[name]} error={error} multiline />;
               }

               return (
                  <div style={{ position: "relative", marginBottom: "28px" }}>
                     {/* Wrapper con gradiente de borde animado */}
                     <div
                        style={{
                           position: "relative",
                           borderRadius: "14px",
                           padding: "1.5px",
                           background: error
                              ? `linear-gradient(135deg, ${DS.errorText}, #ff8a80)`
                              : isFocused
                                ? `linear-gradient(135deg, ${DS.accent}, #7c3aed, #06b6d4)`
                                : `linear-gradient(135deg, ${DS.border}, ${DS.border})`,
                           transition: "background 0.4s ease",
                           boxShadow: isFocused ? (error ? "0 4px 20px rgba(220,38,38,0.18)" : "0 4px 24px rgba(99,102,241,0.18)") : "0 2px 8px rgba(0,0,0,0.06)"
                        }}
                     >
                        <div
                           style={{
                              borderRadius: "13px",
                              background: DS.white,
                              overflow: "hidden"
                           }}
                        >
                           {/* Label flotante */}
                           <label
                              htmlFor={id || name}
                              style={{
                                 position: "absolute",
                                 left: "14px",
                                 top: isActive ? "8px" : "50%",
                                 transform: isActive ? "translateY(0)" : "translateY(-50%)",
                                 fontSize: isActive ? "10px" : "14px",
                                 fontWeight: isActive ? 700 : 400,
                                 color: error ? DS.errorText : isFocused ? DS.accent : isActive ? DS.text2 : DS.textPlaceholder,
                                 letterSpacing: isActive ? "0.07em" : "0",
                                 textTransform: isActive ? "uppercase" : "none",
                                 pointerEvents: "none",
                                 transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                                 zIndex: 2,
                                 lineHeight: 1
                              }}
                           >
                              {label}
                           </label>

                           <textarea
                              {...field}
                              id={id || name}
                              value={values?.[name] ?? ""}
                              onChange={handleChange}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => {
                                 setIsFocused(false);
                                 setFieldTouched(name, true, true);
                              }}
                              rows={4}
                              placeholder=" "
                              autoComplete="off"
                              style={{
                                 display: "block",
                                 width: "100%",
                                 padding: "28px 14px 12px",
                                 background: "transparent",
                                 border: "none",
                                 outline: "none",
                                 resize: "none",
                                 fontSize: "14px",
                                 lineHeight: "1.6",
                                 color: DS.text1,
                                 fontFamily: "inherit",
                                 boxSizing: "border-box",
                                 caretColor: error ? DS.errorText : DS.accent
                              }}
                           />
                        </div>
                     </div>

                     {/* Footer: error + contador */}
                     <div
                        style={{
                           display: "flex",
                           justifyContent: "space-between",
                           alignItems: "center",
                           marginTop: "6px",
                           padding: "0 2px"
                        }}
                     >
                        <div style={{ flex: 1 }}>
                           <FieldError error={error} />
                        </div>

                        {hasValue && (
                           <span
                              style={{
                                 fontSize: "11px",
                                 fontWeight: 500,
                                 color: isFocused ? DS.accent : DS.text3,
                                 letterSpacing: "0.03em",
                                 transition: "color 0.2s ease",
                                 whiteSpace: "nowrap",
                                 marginLeft: "8px"
                              }}
                           >
                              {charCount} caracteres
                           </span>
                        )}
                     </div>
                  </div>
               );
            }}
         </FastField>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK INPUT
═══════════════════════════════════════════════════════════════ */
export const FormikInput: React.FC<InputWithLabelProps> = ({
   label,
   value,
   name,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   type = "text",
   disabled = false,
   handleModified,
   padding = true,
   hidden = false,
   onBlur,
   render
}) => {
   const formik = useFormikContext();
   const [isFocused, setIsFocused] = useState(false);

   useEffect(() => {
      if (value !== undefined && value !== null) {
         formik.setFieldValue(name, value, false);
      }
   }, [value]);

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <FastField name={name}>
            {({ field, form: { values, setFieldValue, setFieldTouched, touched, errors } }: any) => {
               const error = touched?.[name] && errors?.[name] ? String(errors[name]) : null;
               const hasValue = values?.[name] && values[name].toString().length > 0;
               const isActive = hasValue || isFocused || type === "date" || type === "datetime-local";

               const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  let newValue = e.target.value.toUpperCase();
                  setFieldValue(name, newValue);
                  if (newValue !== field.value && handleModified) {
                     handleModified({ ...values, [name]: newValue }, setFieldValue);
                  }
               };

               const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
                  setIsFocused(false);
                  setFieldTouched(name, true, true);
                  if (onBlur) onBlur(e, values);
               };

               if (disabled) {
                  return <DisabledField label={label} value={values?.[name]} error={error} />;
               }

               return (
                  <div style={{ position: "relative", marginBottom: "20px" }}>
                     <label
                        htmlFor={name}
                        style={{
                           position: "absolute",
                           left: "12px",
                           top: isActive ? "-9px" : "14px",
                           fontSize: isActive ? "11px" : "14px",
                           fontWeight: isActive ? 600 : 400,
                           color: isActive ? (error ? DS.errorText : isFocused ? DS.accent : DS.text2) : DS.textPlaceholder,
                           background: DS.white,
                           padding: "0 4px",
                           pointerEvents: "none",
                           transition: DS.transition,
                           letterSpacing: isActive ? "0.04em" : "0",
                           textTransform: isActive ? "uppercase" : "none",
                           zIndex: 2
                        }}
                     >
                        {label}
                     </label>

                     <div
                        style={{
                           border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                           borderRadius: DS.r8,
                           background: DS.white,
                           boxShadow: isFocused ? (error ? "0 0 0 3px rgba(220,38,38,0.10)" : DS.accentGlow) : "none",
                           transition: DS.transition
                        }}
                     >
                        <input
                           {...field}
                           id={name}
                           type={type}
                           placeholder=" "
                           autoComplete="off"
                           value={values?.[name] ?? ""}
                           onChange={handleChange}
                           onFocus={() => setIsFocused(true)}
                           onBlur={handleBlurInternal}
                           hidden={hidden}
                           style={{
                              display: "block",
                              width: "100%",
                              padding: "20px 12px 8px",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                              color: DS.text1,
                              fontFamily: "inherit",
                              boxSizing: "border-box"
                           }}
                        />
                     </div>

                     <FieldError error={error} />
                     {render}

                     {/* {hasValue && type === "text" && (
                        <span style={{ position: "absolute", bottom: "-18px", right: 0, fontSize: "11px", color: DS.text3 }}>
                           {values?.[name]?.length } caracteres
                        </span>
                     )} */}
                  </div>
               );
            }}
         </FastField>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK NATIVE TIME INPUT
═══════════════════════════════════════════════════════════════ */
export const FormikNativeTimeInput: React.FC<InputWithLabelProps> = ({
   label,
   value,
   name,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   disabled = false,
   handleModified,
   padding = true,
   type = "time"
}) => {
   const formik = useFormikContext();
   const [isFocused, setIsFocused] = useState(false);

   useEffect(() => {
      if (value !== undefined && value !== null) {
         formik.setFieldValue(name, value, false);
      }
   }, [value]);

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <FastField name={name}>
            {({ field, form: { values, setFieldValue, setFieldTouched, touched, errors } }: any) => {
               const error = touched?.[name] && errors?.[name] ? String(errors[name]) : null;
               const hasValue = values?.[name] && values[name].toString().length > 0;
               const isActive = true; // time inputs always show label up

               const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = e?.target?.value;
                  if (newValue !== undefined) {
                     setFieldValue(name, newValue);
                  }
                  if (values && typeof values === "object" && newValue !== field?.value && handleModified) {
                     handleModified({ ...values, [name]: newValue }, setFieldValue);
                  }
               };

               if (disabled) {
                  return <DisabledField label={label} value={values?.[name]} error={error} />;
               }

               return (
                  <div style={{ position: "relative", marginBottom: "20px" }}>
                     <label
                        htmlFor={name}
                        style={{
                           position: "absolute",
                           left: "12px",
                           top: "-9px",
                           fontSize: "11px",
                           fontWeight: 600,
                           color: error ? DS.errorText : isFocused ? DS.accent : DS.text2,
                           background: DS.white,
                           padding: "0 4px",
                           pointerEvents: "none",
                           letterSpacing: "0.04em",
                           textTransform: "uppercase",
                           zIndex: 2
                        }}
                     >
                        {label}
                     </label>

                     <div
                        style={{
                           border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                           borderRadius: DS.r8,
                           background: DS.white,
                           boxShadow: isFocused ? DS.accentGlow : "none",
                           transition: DS.transition
                        }}
                     >
                        <input
                           {...field}
                           id={name}
                           type={type}
                           value={values?.[name] ?? ""}
                           onChange={handleChange}
                           onFocus={() => setIsFocused(true)}
                           onBlur={() => {
                              setIsFocused(false);
                              setFieldTouched(name, true, true);
                           }}
                           style={{
                              display: "block",
                              width: "100%",
                              padding: "16px 12px 10px",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                              color: DS.text1,
                              fontFamily: "inherit",
                              boxSizing: "border-box"
                           }}
                        />
                     </div>

                     <FieldError error={error} />
                  </div>
               );
            }}
         </FastField>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK COLOR PICKER
═══════════════════════════════════════════════════════════════ */
interface ColorPickerProps {
   label: string;
   name: string;
   colorPalette: Array<string>;
   value?: string;
   disabled?: boolean;
   responsive?: any;
   padding?: boolean;
}

export const FormikColorPicker: React.FC<ColorPickerProps> = ({
   label,
   name,
   value,
   disabled = false,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   padding = true,
   colorPalette
}) => {
   const formik = useFormikContext<any>();
   const [isOpen, setIsOpen] = useState(false);
   const [currentColor, setCurrentColor] = useState<string>(value || "#000000");
   const pickerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const val = formik.values[name] || value;
      setCurrentColor(val);
   }, [formik.values[name], value]);

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleSelectColor = (color: string) => {
      formik.setFieldValue(name, color);
      setCurrentColor(color);
      setIsOpen(false);
   };

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div ref={pickerRef} style={{ position: "relative", marginBottom: "20px" }}>
            {/* Trigger button */}
            <button
               type="button"
               onClick={() => !disabled && setIsOpen((prev) => !prev)}
               disabled={disabled}
               style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "10px 14px",
                  background: DS.white,
                  border: `1.5px solid ${isOpen ? DS.borderFocus : DS.border}`,
                  borderRadius: DS.r8,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: DS.transition,
                  boxShadow: isOpen ? DS.accentGlow : DS.shadowSm,
                  opacity: disabled ? 0.5 : 1
               }}
               onMouseEnter={(e) => {
                  if (!disabled && !isOpen) (e.currentTarget as HTMLButtonElement).style.borderColor = DS.borderHover;
               }}
               onMouseLeave={(e) => {
                  if (!isOpen) (e.currentTarget as HTMLButtonElement).style.borderColor = DS.border;
               }}
            >
               {/* Color swatch */}
               <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                     style={{
                        width: 44,
                        height: 44,
                        borderRadius: DS.r6,
                        background: currentColor,
                        boxShadow: `0 2px 8px ${currentColor}60, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        border: "1px solid rgba(0,0,0,0.08)",
                        transition: DS.transition
                     }}
                  />
               </div>

               <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: DS.text1, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: "12px", color: DS.text3, fontFamily: "monospace", letterSpacing: "0.05em" }}>{currentColor?.toUpperCase()}</div>
               </div>

               {/* Chevron */}
               <svg
                  style={{
                     width: 16,
                     height: 16,
                     color: DS.text3,
                     transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                     transition: DS.transition,
                     flexShrink: 0
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
               {isOpen && (
                  <motion.div
                     initial={{ opacity: 0, y: -8, scale: 0.97 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -8, scale: 0.97 }}
                     transition={{ duration: 0.15 }}
                     style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: DS.white,
                        border: `1.5px solid ${DS.border}`,
                        borderRadius: DS.r10,
                        boxShadow: DS.shadowDropdown,
                        overflow: "hidden"
                     }}
                  >
                     {/* Header */}
                     <div
                        style={{
                           padding: "12px 14px",
                           borderBottom: `1px solid ${DS.border}`,
                           background: DS.surface,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "space-between"
                        }}
                     >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                           <div
                              style={{
                                 width: 28,
                                 height: 28,
                                 borderRadius: DS.r3,
                                 background: currentColor,
                                 border: "1px solid rgba(0,0,0,0.10)",
                                 boxShadow: `0 1px 4px ${currentColor}50`
                              }}
                           />
                           <div>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: DS.text1 }}>Color seleccionado</div>
                              <div style={{ fontSize: "11px", color: DS.text3, fontFamily: "monospace" }}>{currentColor?.toUpperCase()}</div>
                           </div>
                        </div>
                        <span
                           style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: DS.text3,
                              background: DS.surfaceHover,
                              borderRadius: DS.r3,
                              padding: "2px 8px"
                           }}
                        >
                           {colorPalette.length} colores
                        </span>
                     </div>

                     {/* Grid */}
                     <div
                        style={{
                           padding: "14px",
                           maxHeight: "220px",
                           overflowY: "auto"
                        }}
                     >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "8px" }}>
                           {colorPalette.map((color) => (
                              <button
                                 key={color}
                                 type="button"
                                 onClick={() => handleSelectColor(color)}
                                 title={color}
                                 style={{
                                    width: "100%",
                                    paddingBottom: "100%",
                                    position: "relative",
                                    borderRadius: DS.r3,
                                    background: color,
                                    border: currentColor === color ? "2px solid white" : "2px solid transparent",
                                    cursor: "pointer",
                                    outline: currentColor === color ? `2px solid ${DS.accent}` : "none",
                                    transform: currentColor === color ? "scale(1.15)" : "scale(1)",
                                    transition: DS.transition,
                                    boxShadow: currentColor === color ? `0 2px 8px ${color}80` : "none"
                                 }}
                                 onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = currentColor === color ? "scale(1.15)" : "scale(1.1)";
                                 }}
                                 onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = currentColor === color ? "scale(1.15)" : "scale(1)";
                                 }}
                              >
                                 {currentColor === color && (
                                    <div
                                       style={{
                                          position: "absolute",
                                          inset: 0,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                       }}
                                    >
                                       <svg
                                          style={{ width: 10, height: 10, color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                       >
                                          <path
                                             fillRule="evenodd"
                                             d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                             clipRule="evenodd"
                                          />
                                       </svg>
                                    </div>
                                 )}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Footer */}
                     <div style={{ padding: "10px 14px", borderTop: `1px solid ${DS.border}`, background: DS.surface }}>
                        <button
                           type="button"
                           onClick={() => setIsOpen(false)}
                           style={{
                              width: "100%",
                              padding: "7px",
                              background: DS.white,
                              border: `1.5px solid ${DS.border}`,
                              borderRadius: DS.r6,
                              fontSize: "12px",
                              fontWeight: 600,
                              color: DS.text2,
                              cursor: "pointer",
                              transition: DS.transition
                           }}
                           onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = DS.borderHover;
                           }}
                           onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = DS.border;
                           }}
                        >
                           Cerrar
                        </button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Error */}
            <FastField name={name}>
               {({ form: { touched, errors } }: any) => {
                  const error = touched?.[name] && typeof errors?.[name] === "string" ? errors[name] : null;
                  return <FieldError error={error} />;
               }}
            </FastField>
         </div>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK CHECKBOX
═══════════════════════════════════════════════════════════════ */
type CheckboxWithLabelProps = {
   label: string;
   name: string;
   id?: string;
   value?: boolean;
   responsive?: { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
   disabled?: boolean;
   handleModified?: (values: any, setFieldValue: any) => void;
   padding?: boolean;
};

export const FormikCheckbox: React.FC<CheckboxWithLabelProps> = ({
   label,
   value,
   name,
   id,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   disabled = false,
   handleModified,
   padding = true
}) => {
   const [field, meta] = useField({ name, type: "checkbox" });
   const formik = useFormikContext<any>();

   useEffect(() => {
      if (value !== undefined && value !== null) {
         formik.setFieldValue(name, value, false);
      }
   }, [value]);

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <FastField name={name}>
            {({ field, form: { errors, touched, values, setFieldValue } }: any) => {
               const error = touched?.[name] && typeof errors?.[name] === "string" ? (errors?.[name] as string) : null;
               const isChecked = values?.[name] || false;

               if (handleModified) handleModified(values, setFieldValue);

               return (
                  <div
                     id={id}
                     style={{
                        position: "relative",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? "not-allowed" : "pointer"
                     }}
                     onClick={() => !disabled && setFieldValue(name, !isChecked, true)}
                  >
                     {/* Custom checkbox */}
                     <div
                        style={{
                           width: 20,
                           height: 20,
                           borderRadius: DS.r3,
                           background: isChecked ? DS.accent : DS.white,
                           border: `2px solid ${error ? DS.borderError : isChecked ? DS.accent : DS.border}`,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           flexShrink: 0,
                           transition: DS.transition,
                           boxShadow: isChecked ? `0 2px 8px ${DS.accent}40` : "none"
                        }}
                     >
                        <AnimatePresence>
                           {isChecked && (
                              <motion.svg
                                 initial={{ scale: 0, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 exit={{ scale: 0, opacity: 0 }}
                                 transition={{ duration: 0.12 }}
                                 style={{ width: 12, height: 12, color: "white" }}
                                 fill="none"
                                 stroke="currentColor"
                                 strokeWidth={3}
                                 viewBox="0 0 24 24"
                              >
                                 <polyline points="20 6 9 17 4 12" />
                              </motion.svg>
                           )}
                        </AnimatePresence>
                     </div>

                     {/* Hidden real input */}
                     <input
                        {...field}
                        type="checkbox"
                        id={name}
                        disabled={disabled}
                        onChange={(e) => setFieldValue(name, e.target.checked, true)}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                     />

                     <label
                        htmlFor={name}
                        style={{
                           fontSize: "14px",
                           fontWeight: 500,
                           color: isChecked ? DS.text1 : DS.text2,
                           cursor: disabled ? "not-allowed" : "pointer",
                           transition: DS.transition,
                           userSelect: "none"
                        }}
                     >
                        {label}
                     </label>

                     {error && (
                        <span
                           style={{
                              position: "absolute",
                              bottom: "-18px",
                              left: 0,
                              fontSize: "12px",
                              fontWeight: 500,
                              color: DS.errorText
                           }}
                        >
                           {error}
                        </span>
                     )}
                  </div>
               );
            }}
         </FastField>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK IMAGE INPUT
═══════════════════════════════════════════════════════════════ */
interface FormikImageInputProps {
   label: string;
   name: string;
   disabled?: boolean;
   acceptedFileTypes?: string;
   multiple?: boolean;
   maxFiles?: number;
}

interface UploadItem {
   id: string;
   preview: string;
   isExisting: boolean;
   file?: File;
   progress: number;
   loaded: boolean;
}

export const FormikImageInput: React.FC<FormikImageInputProps> = ({
   label,
   name,
   disabled = false,
   acceptedFileTypes = "image/*",
   multiple = false,
   maxFiles = 5
}) => {
   const { setFieldValue, values, errors, touched } = useFormikContext<any>();
   const [uploads, setUploads] = useState<UploadItem[]>([]);
   const [previewModal, setPreviewModal] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement | null>(null);
   const [isMobile, setIsMobile] = useState(false);
   const [useCamera, setUseCamera] = useState(true);

   useEffect(() => {
      const currentValue = values[name];
      const existingUrls: string[] = [];
      const newFiles: File[] = [];

      if (currentValue) {
         if (multiple && Array.isArray(currentValue)) {
            currentValue.forEach((item: any) => {
               if (typeof item === "string") existingUrls.push(item);
               else if (item instanceof File) newFiles.push(item);
            });
         } else if (!multiple) {
            if (typeof currentValue === "string") existingUrls.push(currentValue);
            else if (currentValue instanceof File) newFiles.push(currentValue);
         }
      }

      const newUploads: UploadItem[] = [
         ...existingUrls.map((url, i) => ({ id: `existing_${i}_${Date.now()}`, preview: url, isExisting: true, progress: 100, loaded: false })),
         ...newFiles.map((file, i) => ({ id: `new_${i}_${Date.now()}`, preview: URL.createObjectURL(file), isExisting: false, file, progress: 100, loaded: false }))
      ];
      setUploads(newUploads);

      return () => {
         newUploads.forEach((item) => {
            if (!item.isExisting && item.preview.startsWith("blob:")) URL.revokeObjectURL(item.preview);
         });
      };
   }, [values[name], multiple, name]);

   useEffect(() => {
      if (typeof window !== "undefined") {
         setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      }
   }, []);

   const handleImageLoad = (id: string) => setUploads((prev) => prev.map((item) => (item.id === id ? { ...item, loaded: true } : item)));

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
      if (!selectedFiles.length) return;

      let newFiles = multiple ? selectedFiles : [selectedFiles[0]];
      if (multiple && uploads.length + newFiles.length > maxFiles) newFiles = newFiles.slice(0, maxFiles - uploads.length);

      const newUploads: UploadItem[] = newFiles.map((file, i) => ({
         id: `new_${uploads.length + i}_${Date.now()}`,
         preview: URL.createObjectURL(file),
         isExisting: false,
         file,
         progress: 0,
         loaded: false
      }));

      let updatedUploads: UploadItem[];
      if (!multiple) {
         uploads.forEach((item) => {
            if (!item.isExisting && item.preview.startsWith("blob:")) URL.revokeObjectURL(item.preview);
         });
         updatedUploads = [...newUploads];
      } else {
         updatedUploads = [...uploads, ...newUploads];
      }

      setUploads(updatedUploads);

      const filesToSet = updatedUploads.filter((i) => !i.isExisting && i.file).map((i) => i.file as File);
      const existingUrls = updatedUploads.filter((i) => i.isExisting).map((i) => i.preview);

      if (multiple) {
         setFieldValue(name, filesToSet);
         setFieldValue(`${name}_existing`, existingUrls);
      } else {
         setFieldValue(name, filesToSet[0] || null);
         setFieldValue(`${name}_existing`, existingUrls[0] || "");
      }

      newUploads.forEach((u) => {
         const interval = setInterval(() => setUploads((prev) => prev.map((p) => (p.id === u.id ? { ...p, progress: Math.min(p.progress + 10, 100) } : p))), 100);
         setTimeout(() => clearInterval(interval), 1100);
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   const handleRemove = (index: number) => {
      const uploadToRemove = uploads[index];
      const updatedUploads = uploads.filter((_, i) => i !== index);
      setUploads(updatedUploads);
      if (uploadToRemove.isExisting) setFieldValue(`${name}_delete`, true);

      const filesToSet = updatedUploads.filter((i) => !i.isExisting && i.file).map((i) => i.file as File);
      const existingUrls = updatedUploads.filter((i) => i.isExisting).map((i) => i.preview);

      if (multiple) {
         setFieldValue(name, filesToSet);
         setFieldValue(`${name}_existing`, existingUrls);
      } else {
         setFieldValue(name, filesToSet[0] || null);
         setFieldValue(`${name}_existing`, existingUrls[0] || "");
      }

      if (!uploadToRemove.isExisting && uploadToRemove.preview.startsWith("blob:")) URL.revokeObjectURL(uploadToRemove.preview);
      if (updatedUploads.length === 0) setFieldValue(`${name}_delete`, false);
   };

   return (
      <div style={{ position: "relative", width: "100%", marginBottom: "24px" }}>
         <div style={{ fontSize: "13px", fontWeight: 700, color: DS.text1, marginBottom: "12px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>

         {/* Mobile camera toggle */}
         {isMobile && (
            <div
               style={{
                  display: "flex",
                  gap: 6,
                  padding: "8px",
                  background: DS.surface,
                  border: `1.5px solid ${DS.border}`,
                  borderRadius: DS.r8,
                  marginBottom: "12px"
               }}
            >
               {[
                  { value: true, icon: "📷", label: "Cámara" },
                  { value: false, icon: "🖼️", label: "Galería" }
               ].map((opt) => (
                  <button
                     key={String(opt.value)}
                     type="button"
                     onClick={() => setUseCamera(opt.value)}
                     style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px",
                        borderRadius: DS.r6,
                        border: "none",
                        background: useCamera === opt.value ? DS.accent : "transparent",
                        color: useCamera === opt.value ? "white" : DS.text2,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: DS.transition
                     }}
                  >
                     <span>{opt.icon}</span>
                     <span>{opt.label}</span>
                  </button>
               ))}
            </div>
         )}

         {/* Image grid */}
         <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <AnimatePresence mode="popLayout">
               {uploads.map((upload, index) => (
                  <motion.div
                     key={upload.id}
                     initial={{ opacity: 0, scale: 0.85 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.85 }}
                     transition={{ duration: 0.2 }}
                     style={{
                        position: "relative",
                        width: 130,
                        height: 130,
                        borderRadius: DS.r8,
                        overflow: "hidden",
                        border: `1.5px solid ${DS.border}`,
                        boxShadow: DS.shadowSm
                     }}
                  >
                     {!upload.loaded && <div style={{ position: "absolute", inset: 0, background: DS.surface, animation: "pulse 1.5s infinite" }} />}

                     <img
                        src={upload.preview}
                        alt={`Preview ${index}`}
                        onLoad={() => handleImageLoad(upload.id)}
                        onClick={() => upload.loaded && setPreviewModal(upload.preview)}
                        style={{
                           width: "100%",
                           height: "100%",
                           objectFit: "cover",
                           opacity: upload.loaded ? 1 : 0,
                           transition: DS.transition,
                           cursor: "pointer"
                        }}
                        onError={(e) => {
                           handleImageLoad(upload.id);
                           (e.currentTarget as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3C/svg%3E";
                        }}
                     />

                     {/* Overlay on hover */}
                     <div
                        className="img-overlay"
                        style={{
                           position: "absolute",
                           inset: 0,
                           background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))",
                           opacity: 0,
                           transition: DS.transition,
                           display: "flex",
                           alignItems: "flex-end",
                           justifyContent: "flex-end",
                           padding: "8px",
                           gap: "6px"
                        }}
                        onMouseEnter={(e) => {
                           (e.currentTarget as HTMLDivElement).style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                           (e.currentTarget as HTMLDivElement).style.opacity = "0";
                        }}
                     >
                        <button
                           type="button"
                           onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModal(upload.preview);
                           }}
                           style={{
                              width: 28,
                              height: 28,
                              borderRadius: DS.r3,
                              background: "rgba(255,255,255,0.9)",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                           }}
                        >
                           <AiOutlineEye size={14} style={{ color: DS.text1 }} />
                        </button>
                        <button
                           type="button"
                           onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(index);
                           }}
                           style={{
                              width: 28,
                              height: 28,
                              borderRadius: DS.r3,
                              background: "rgba(220,38,38,0.9)",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                           }}
                        >
                           <AiOutlineClose size={14} style={{ color: "white" }} />
                        </button>
                     </div>

                     {upload.progress < 100 && (
                        <div
                           style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                           <span style={{ color: "white", fontSize: "13px", fontWeight: 700 }}>{upload.progress}%</span>
                        </div>
                     )}

                     {upload.isExisting && upload.loaded && (
                        <div
                           style={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                              background: DS.successText,
                              color: "white",
                              borderRadius: DS.r3,
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px"
                           }}
                        >
                           ✓
                        </div>
                     )}
                  </motion.div>
               ))}
            </AnimatePresence>

            {!disabled && (multiple || uploads.length === 0) && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div
                     onClick={() => !disabled && fileInputRef.current?.click()}
                     style={{
                        width: 130,
                        height: 130,
                        borderRadius: DS.r8,
                        border: `2px dashed ${DS.border}`,
                        background: DS.surface,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        cursor: "pointer",
                        transition: DS.transition
                     }}
                     onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = DS.accent;
                        (e.currentTarget as HTMLDivElement).style.background = DS.accentLight;
                     }}
                     onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = DS.border;
                        (e.currentTarget as HTMLDivElement).style.background = DS.surface;
                     }}
                  >
                     <AiOutlineCamera size={24} style={{ color: DS.text3 }} />
                     <span style={{ fontSize: "12px", fontWeight: 600, color: DS.text3, textAlign: "center", lineHeight: 1.3 }}>
                        {uploads.length === 0 ? "Subir imagen" : "Agregar"}
                     </span>
                  </div>
               </motion.div>
            )}
         </div>

         {/* Info */}
         <div
            style={{
               marginTop: "10px",
               padding: "8px 12px",
               background: DS.surface,
               border: `1px solid ${DS.border}`,
               borderRadius: DS.r6,
               display: "flex",
               gap: "16px",
               flexWrap: "wrap"
            }}
         >
            <span style={{ fontSize: "11px", color: DS.text3 }}>Formatos: {acceptedFileTypes.replace("image/", "").split(",").join(", ")}</span>
            {multiple && maxFiles && (
               <span style={{ fontSize: "11px", color: DS.text3 }}>
                  {uploads.length}/{maxFiles} imágenes
               </span>
            )}
         </div>

         <input
            ref={fileInputRef}
            type="file"
            name={name}
            accept={acceptedFileTypes}
            multiple={multiple}
            onChange={handleChange}
            style={{ display: "none" }}
            disabled={disabled}
            capture={isMobile && useCamera ? "environment" : undefined}
         />

         {(touched as Record<string, any>)[name] && (errors as Record<string, any>)[name] && <FieldError error={(errors as Record<string, any>)[name]} />}

         <AnimatePresence>
            {previewModal && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewModal(null)}
                  style={{
                     position: "fixed",
                     inset: 0,
                     zIndex: 9999,
                     background: "rgba(0,0,0,0.85)",
                     backdropFilter: "blur(4px)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     padding: "16px"
                  }}
               >
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.9, opacity: 0 }}
                     transition={{ type: "spring", damping: 24 }}
                     onClick={(e) => e.stopPropagation()}
                     style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
                  >
                     <img
                        src={previewModal}
                        alt="Vista previa"
                        style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: DS.r10, objectFit: "contain", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
                     />
                     <button
                        onClick={() => setPreviewModal(null)}
                        style={{
                           position: "absolute",
                           top: -12,
                           right: -12,
                           width: 32,
                           height: 32,
                           borderRadius: "50%",
                           background: DS.errorText,
                           border: "none",
                           cursor: "pointer",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           boxShadow: DS.shadowMd
                        }}
                     >
                        <AiOutlineClose size={16} style={{ color: "white" }} />
                     </button>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK NUMBER INPUT
═══════════════════════════════════════════════════════════════ */
interface FormikNumberInputProps extends InputWithLabelProps {
   min?: number;
   max?: number;
   decimals?: boolean;
   romanNumerals?: boolean;
   padding?: boolean;
}

export const FormikNumberInput: React.FC<FormikNumberInputProps> = ({
   label,
   name,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   min,
   max,
   decimals = true,
   romanNumerals = false,
   padding = false,
   id
}) => {
   const [field, meta] = useField(name);
   const formik = useFormikContext<any>();

   const toRoman = (num: number) => {
      if (num < 1) return "";
      const map: [string, number][] = [
         ["M", 1000],
         ["CM", 900],
         ["D", 500],
         ["CD", 400],
         ["C", 100],
         ["XC", 90],
         ["L", 50],
         ["XL", 40],
         ["X", 10],
         ["IX", 9],
         ["V", 5],
         ["IV", 4],
         ["I", 1]
      ];
      let roman = "";
      for (const [letter, value] of map) {
         while (num >= value) {
            roman += letter;
            num -= value;
         }
      }
      return roman;
   };

   const formatNumber = (value: number) => {
      if (romanNumerals) return toRoman(value);
      return decimals ? value.toFixed(2) : Math.floor(value).toString();
   };

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <FastField name={name}>
            {({ field, form: { errors, touched, setFieldValue } }: any) => {
               const error = touched?.[name] && typeof errors?.[name] === "string" ? errors?.[name] : null;

               return (
                  <div style={{ position: "relative", marginBottom: "20px" }}>
                     <label
                        style={{
                           position: "absolute",
                           left: "12px",
                           top: "-9px",
                           fontSize: "11px",
                           fontWeight: 600,
                           color: DS.text2,
                           background: DS.white,
                           padding: "0 4px",
                           letterSpacing: "0.04em",
                           textTransform: "uppercase",
                           zIndex: 2
                        }}
                     >
                        {label}
                     </label>

                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           border: `1.5px solid ${error ? DS.borderError : DS.border}`,
                           borderRadius: DS.r8,
                           background: DS.white,
                           overflow: "hidden",
                           boxShadow: DS.shadowSm
                        }}
                     >
                        <button
                           type="button"
                           onClick={() => setFieldValue(name, Math.max((field.value || 0) - (decimals ? 0.1 : 1), min ?? 0))}
                           style={{
                              width: 40,
                              height: 44,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: DS.surface,
                              border: "none",
                              borderRight: `1px solid ${DS.border}`,
                              cursor: "pointer",
                              color: DS.text2,
                              fontSize: "16px",
                              transition: DS.transition,
                              flexShrink: 0
                           }}
                           onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = DS.surfaceHover;
                           }}
                           onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = DS.surface;
                           }}
                        >
                           <FaMinus size={10} />
                        </button>

                        <input
                           {...field}
                           type="text"
                           value={formatNumber(Number(field.value) || 0)}
                           id={id || name}
                           placeholder=" "
                           onChange={(e) => {
                              let v = e.target.value;
                              if (!decimals) v = v.replace(/\.[^0-9]/g, "");
                              if (/^\d*\.?\d*$/.test(v)) setFieldValue(name, v);
                              formik.handleChange(e);
                           }}
                           inputMode="numeric"
                           style={{
                              flex: 1,
                              padding: "10px 8px",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: DS.text1,
                              textAlign: "center",
                              fontFamily: "inherit"
                           }}
                        />

                        <button
                           type="button"
                           onClick={() => setFieldValue(name, Math.min((field.value || 0) + (decimals ? 0.1 : 1), max ?? Infinity))}
                           style={{
                              width: 40,
                              height: 44,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: DS.surface,
                              border: "none",
                              borderLeft: `1px solid ${DS.border}`,
                              cursor: "pointer",
                              color: DS.text2,
                              transition: DS.transition,
                              flexShrink: 0
                           }}
                           onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = DS.surfaceHover;
                           }}
                           onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = DS.surface;
                           }}
                        >
                           <FaPlus size={10} />
                        </button>
                     </div>

                     {meta.error && (meta.touched || formik.status) && <FieldError error={meta.error} />}
                  </div>
               );
            }}
         </FastField>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK PASSWORD INPUT
═══════════════════════════════════════════════════════════════ */
export const FormikPasswordInput: React.FC<InputWithLabelProps> = ({ label, name, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 } }) => {
   const [showPassword, setShowPassword] = useState(false);
   const [isFocused, setIsFocused] = useState(false);

   return (
      <ColComponent responsive={responsive}>
         <Field name={name}>
            {({ field, form: { errors, touched, values } }: any) => {
               const error = touched?.[name] && typeof errors?.[name] === "string" ? errors?.[name] : null;
               const hasValue = values?.[name] && values[name].toString().length > 0;
               const isActive = hasValue || isFocused;

               return (
                  <div style={{ position: "relative", marginBottom: "20px" }}>
                     <label
                        htmlFor={name}
                        style={{
                           position: "absolute",
                           left: "12px",
                           top: isActive ? "-9px" : "14px",
                           fontSize: isActive ? "11px" : "14px",
                           fontWeight: isActive ? 600 : 400,
                           color: isActive ? (error ? DS.errorText : isFocused ? DS.accent : DS.text2) : DS.textPlaceholder,
                           background: DS.white,
                           padding: "0 4px",
                           pointerEvents: "none",
                           transition: DS.transition,
                           letterSpacing: isActive ? "0.04em" : "0",
                           textTransform: isActive ? "uppercase" : "none",
                           zIndex: 2
                        }}
                     >
                        {label}
                     </label>

                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                           borderRadius: DS.r8,
                           background: DS.white,
                           boxShadow: isFocused ? DS.accentGlow : "none",
                           transition: DS.transition
                        }}
                     >
                        <input
                           {...field}
                           type={showPassword ? "text" : "password"}
                           value={values?.[name] || ""}
                           id={name}
                           autoComplete="off"
                           placeholder=" "
                           onFocus={() => setIsFocused(true)}
                           onBlur={() => setIsFocused(false)}
                           style={{
                              flex: 1,
                              padding: "20px 12px 8px",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                              color: DS.text1,
                              fontFamily: "inherit"
                           }}
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword((prev) => !prev)}
                           style={{
                              padding: "0 12px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: DS.text3,
                              display: "flex",
                              alignItems: "center",
                              transition: DS.transition
                           }}
                           onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = DS.text1;
                           }}
                           onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = DS.text3;
                           }}
                        >
                           {showPassword ? <IoMdEye size={18} /> : <IoIosEyeOff size={18} />}
                        </button>
                     </div>

                     <FieldError error={error} />
                  </div>
               );
            }}
         </Field>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK AUTOCOMPLETE (with tree support)
═══════════════════════════════════════════════════════════════ */
export interface TreeOption<T extends Record<string, any>> extends Record<string, any> {
   children_recursive?: TreeOption<T>[];
}

interface FlatOption<T> {
   item: T & TreeOption<T>;
   depth: number;
   isGroup: boolean;
}

interface AutocompleteProps<T extends Record<string, any>> {
   label: string;
   name: string | string[];
   options: (T & TreeOption<T>)[];
   idKey: keyof T | (keyof T)[];
   labelKey: keyof T;
   loading?: boolean;
   responsive?: { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
   disabled?: boolean;
   padding?: boolean;
   value?: any;
   handleModified?: (name: string, value: any) => void;
}

function flattenOptions<T extends Record<string, any>>(options: (T & TreeOption<T>)[], depth = 0): FlatOption<T>[] {
   const result: FlatOption<T>[] = [];
   for (const item of options) {
      const hasChildren = Array.isArray(item.children_recursive) && item.children_recursive.length > 0;
      result.push({ item, depth, isGroup: hasChildren });
      if (hasChildren) result.push(...flattenOptions(item.children_recursive as (T & TreeOption<T>)[], depth + 1));
   }
   return result;
}

function filterTree<T extends Record<string, any>>(options: (T & TreeOption<T>)[], query: string, labelKey: keyof T): (T & TreeOption<T>)[] {
   const lowerQuery = query.toLowerCase();
   const filtered: (T & TreeOption<T>)[] = [];
   for (const item of options) {
      const labelMatch = String(item[labelKey]).toLowerCase().includes(lowerQuery);
      const filteredChildren = Array.isArray(item.children_recursive) ? filterTree(item.children_recursive as (T & TreeOption<T>)[], query, labelKey) : [];
      if (labelMatch || filteredChildren.length > 0) filtered.push({ ...item, children_recursive: filteredChildren });
   }
   return filtered;
}

export const FormikAutocomplete = <T extends Record<string, any>>({
   label,
   name,
   options,
   idKey,
   labelKey,
   loading,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   disabled = false,
   padding = true,
   value = null,
   handleModified
}: AutocompleteProps<T>) => {
   const formik = useFormikContext<any>();
   if (!formik) throw new Error("Formik context not found");

   const [filteredOptions, setFilteredOptions] = useState<(T & TreeOption<T>)[]>(options);
   const [flatFiltered, setFlatFiltered] = useState<FlatOption<T>[]>([]);
   const [activeIndex, setActiveIndex] = useState(-1);
   const [showOptions, setShowOptions] = useState(false);
   const [textSearch, setTextSearch] = useState("");
   const [isFocused, setIsFocused] = useState(false);

   const inputRef = useRef<HTMLInputElement>(null);
   const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
   const menuRef = useRef<HTMLUListElement>(null);
   const selectingRef = useRef(false);

   const getError = () => {
      const touched = formik.touched;
      const errors = formik.errors;
      if (Array.isArray(name)) return touched[name[0]] && errors[name[0]] ? String(errors[name[0]]) : null;
      return touched[name] && errors[name] ? String(errors[name]) : null;
   };

   const error = getError();
   const hasValue = textSearch && textSearch.length > 0;
   const isActive = hasValue || isFocused;

   const getNestedValue = (obj: any, path: string[]) => path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
   const setNestedValue = (obj: any, path: string[], val: any) => {
      const lastKey = path[path.length - 1];
      const deepObj = path.slice(0, -1).reduce((acc: any, key) => {
         if (!acc[key]) acc[key] = {};
         return acc[key];
      }, obj);
      deepObj[lastKey] = val;
   };
   const getValueFromFormik = () => {
      if (!formik?.values) return undefined;
      if (Array.isArray(name)) return getNestedValue(formik.values, name);
      return formik.values?.[name];
   };

   useEffect(() => {
      setFlatFiltered(flattenOptions(filteredOptions));
   }, [filteredOptions]);
   useEffect(() => {
      setFilteredOptions(options);
   }, [options]);

   useEffect(() => {
      updateDisplayValue(getValueFromFormik());
   }, [formik.values, options]);

   const findInTree = (items: (T & TreeOption<T>)[], matchFn: (opt: T) => boolean): (T & TreeOption<T>) | undefined => {
      for (const item of items) {
         if (matchFn(item)) return item;
         if (item.children_recursive?.length) {
            const found = findInTree(item.children_recursive as (T & TreeOption<T>)[], matchFn);
            if (found) return found;
         }
      }
      return undefined;
   };

   const updateDisplayValue = (currentValue: any) => {
      if (!currentValue && currentValue !== 0) {
         setTextSearch("");
         return;
      }
      const match = findInTree(options, (opt) => {
         if (!Array.isArray(idKey)) {
            const path = Array.isArray(name) ? name[0].split(".") : [name as string];
            return getNestedValue(formik.values, path) === opt[idKey];
         }
         return false;
      });
      setTextSearch(match ? String(match[labelKey]) : String(currentValue));
   };

   const clearFormikValue = () => {
      if (Array.isArray(idKey) && Array.isArray(name)) {
         name.forEach((n) => {
            formik.setFieldValue(n, null);
            handleModified?.(n, null);
         });
      } else {
         const fieldName = Array.isArray(name) ? name[0] : name;
         formik.setFieldValue(fieldName, null);
         handleModified?.(fieldName, null);
      }
   };

   const handleFilter = (query: string) => {
      setTextSearch(query);
      if (!query) {
         clearFormikValue();
         setFilteredOptions(options);
         setActiveIndex(-1);
         return;
      }
      setFilteredOptions(filterTree(options, query, labelKey));
      setActiveIndex(-1);
   };

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (inputRef.current && !inputRef.current.contains(e.target as Node) && menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setShowOptions(false);
            setIsFocused(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showOptions) return;
      switch (e.key) {
         case "ArrowDown":
            setActiveIndex((p) => {
               const n = (p + 1) % flatFiltered.length;
               optionRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
               return n;
            });
            break;
         case "ArrowUp":
            setActiveIndex((p) => {
               const n = p <= 0 ? flatFiltered.length - 1 : p - 1;
               optionRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
               return n;
            });
            break;
         case "Enter":
            if (activeIndex >= 0) selectOption(flatFiltered[activeIndex].item);
            e.preventDefault();
            break;
         case "Escape":
            setShowOptions(false);
            setIsFocused(false);
            break;
      }
   };

   const selectOption = (option: T & TreeOption<T>) => {
      setTextSearch(String(option[labelKey]));
      if (Array.isArray(idKey) && Array.isArray(name)) {
         name.forEach((n, i) => {
            formik.setFieldValue(n, option[(idKey as (keyof T)[])[i]]);
            handleModified?.(n, option[(idKey as (keyof T)[])[i]]);
         });
      } else if (!Array.isArray(idKey)) {
         const fieldName = Array.isArray(name) ? name[0] : name;
         formik.setFieldValue(fieldName, option[idKey]);
         handleModified?.(fieldName, option[idKey]);
      }
      formik.setFieldTouched(Array.isArray(name) ? name[0] : name, true, false);
      setShowOptions(false);
      setIsFocused(false);
   };

   if (disabled) {
      return (
         <ColComponent responsive={responsive} autoPadding={padding}>
            <DisabledField label={label} value={textSearch} error={error} />
         </ColComponent>
      );
   }

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div style={{ position: "relative", marginBottom: "20px" }}>
            <label
               style={{
                  position: "absolute",
                  left: "12px",
                  top: isActive ? "-9px" : "14px",
                  fontSize: isActive ? "11px" : "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? (error ? DS.errorText : isFocused ? DS.accent : DS.text2) : DS.textPlaceholder,
                  background: DS.white,
                  padding: "0 4px",
                  pointerEvents: "none",
                  transition: DS.transition,
                  letterSpacing: isActive ? "0.04em" : "0",
                  textTransform: isActive ? "uppercase" : "none",
                  zIndex: 2
               }}
            >
               {label}
            </label>

            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                  borderRadius: DS.r8,
                  background: DS.white,
                  boxShadow: isFocused ? DS.accentGlow : "none",
                  transition: DS.transition
               }}
            >
               <input
                  ref={inputRef}
                  type="text"
                  value={textSearch}
                  placeholder=" "
                  autoComplete="off"
                  onFocus={() => {
                     setIsFocused(true);
                     if (!disabled) {
                        setFilteredOptions(options);
                        setShowOptions(true);
                     }
                  }}
                  onChange={(e) => !disabled && handleFilter(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                     setIsFocused(false);
                     setShowOptions(false);
                     formik.setFieldTouched(Array.isArray(name) ? name[0] : name, true, false);
                  }}
                  style={{
                     flex: 1,
                     padding: "20px 12px 8px",
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     fontSize: "14px",
                     color: DS.text1,
                     fontFamily: "inherit"
                  }}
               />

               {loading ? (
                  <div style={{ padding: "0 12px" }}>
                     <div
                        style={{
                           width: 16,
                           height: 16,
                           border: `2px solid ${DS.border}`,
                           borderTopColor: DS.accent,
                           borderRadius: "50%",
                           animation: "spin 0.7s linear infinite"
                        }}
                     />
                  </div>
               ) : (
                  <button
                     type="button"
                     onClick={() => !disabled && setShowOptions((s) => !s)}
                     style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: DS.text3, display: "flex", alignItems: "center" }}
                  >
                     <svg
                        style={{ width: 16, height: 16, transform: showOptions ? "rotate(180deg)" : "rotate(0)", transition: DS.transition }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </button>
               )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
               {showOptions && !disabled && (
                  <motion.ul
                     ref={menuRef}
                     initial={{ opacity: 0, y: -6, scale: 0.98 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -6, scale: 0.98 }}
                     transition={{ duration: 0.13 }}
                     style={{
                        position: "absolute",
                        zIndex: 50,
                        top: "calc(100% + 6px)",
                        left: 0,
                        right: 0,
                        background: DS.white,
                        border: `1.5px solid ${DS.border}`,
                        borderRadius: DS.r8,
                        boxShadow: DS.shadowDropdown,
                        maxHeight: 280,
                        overflowY: "auto",
                        listStyle: "none",
                        margin: 0,
                        padding: "4px"
                     }}
                  >
                     {flatFiltered.length > 0 ? (
                        flatFiltered.map(({ item, depth, isGroup }, index) => {
                           const isHighlighted = activeIndex === index;
                           const paddingLeft = 12 + depth * 18;
                           const optId = String(item[Array.isArray(idKey) ? (idKey as (keyof T)[])[0] : idKey]);

                           return (
                              <li
                                 key={`opt-${depth}-${optId}`}
                                 ref={(el) => {
                                    optionRefs.current[index] = el;
                                 }}
                                 onMouseDown={(e) => e.preventDefault()}
                                 onClick={() => selectOption(item)}
                                 style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: `8px 10px 8px ${paddingLeft}px`,
                                    borderRadius: DS.r6,
                                    cursor: "pointer",
                                    background: isHighlighted ? DS.accentLight : "transparent",
                                    transition: DS.transition,
                                    borderLeft: depth > 0 ? `2px solid ${DS.border}` : "2px solid transparent",
                                    marginLeft: depth > 0 ? 8 : 0
                                 }}
                                 onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLLIElement).style.background = DS.surface;
                                 }}
                                 onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLLIElement).style.background = isHighlighted ? DS.accentLight : "transparent";
                                 }}
                              >
                                 {depth > 0 && (
                                    <svg style={{ width: 10, height: 10, color: DS.text3, flexShrink: 0 }} viewBox="0 0 12 12" fill="none">
                                       <path d="M2 0 L2 6 L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                 )}
                                 {isGroup ? (
                                    <svg
                                       style={{ width: 13, height: 13, color: DS.accent, flexShrink: 0 }}
                                       viewBox="0 0 24 24"
                                       fill="none"
                                       stroke="currentColor"
                                       strokeWidth="2"
                                    >
                                       <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                    </svg>
                                 ) : (
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.border, flexShrink: 0 }} />
                                 )}
                                 <span
                                    style={{
                                       fontSize: "13.5px",
                                       fontWeight: isGroup ? 600 : 400,
                                       color: DS.text1,
                                       overflow: "hidden",
                                       textOverflow: "ellipsis",
                                       whiteSpace: "nowrap"
                                    }}
                                 >
                                    {String(item[labelKey])}
                                 </span>
                              </li>
                           );
                        })
                     ) : (
                        <li style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: DS.text3 }}>No se encontraron opciones</li>
                     )}
                  </motion.ul>
               )}
            </AnimatePresence>

            <FieldError error={error} />
         </div>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK RADIO
═══════════════════════════════════════════════════════════════ */
interface FormikRadioProps<T> {
   label: string;
   name: string;
   options: T[];
   idKey: keyof T;
   labelKey: keyof T;
   responsive?: { [key: string]: number };
   disabled?: boolean;
   padding?: boolean;
}

export const FormikRadio = <T extends Record<string, any>>({
   label,
   name,
   options,
   idKey,
   labelKey,
   responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
   disabled = false,
   padding = true
}: FormikRadioProps<T>) => {
   const formik = useFormikContext<any>();
   if (!formik) throw new Error("Formik context not found");

   const [field, meta] = useField(name);
   const error = meta.touched && meta.error ? String(meta.error) : null;

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div style={{ position: "relative", marginBottom: "20px", opacity: disabled ? 0.5 : 1 }}>
            <label
               style={{
                  position: "absolute",
                  left: "12px",
                  top: "-9px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: error ? DS.errorText : DS.text2,
                  background: DS.white,
                  padding: "0 4px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  zIndex: 2
               }}
            >
               {label}
            </label>

            <div
               style={{
                  border: `1.5px solid ${error ? DS.borderError : DS.border}`,
                  borderRadius: DS.r8,
                  padding: "16px 12px 10px",
                  background: DS.white
               }}
            >
               <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {options.map((option) => {
                     const optionValue = option[idKey];
                     const isSelected = String(field.value) === String(optionValue);
                     const optionId = `${name}-${String(optionValue)}`;

                     return (
                        <label
                           key={String(optionValue)}
                           htmlFor={optionId}
                           style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 14px",
                              borderRadius: DS.r6,
                              border: `1.5px solid ${isSelected ? (error ? DS.borderError : DS.accent) : DS.border}`,
                              background: isSelected ? (error ? "rgba(220,38,38,0.06)" : DS.accentLight) : DS.white,
                              cursor: disabled ? "not-allowed" : "pointer",
                              transition: DS.transition,
                              userSelect: "none"
                           }}
                           onMouseEnter={(e) => {
                              if (!isSelected && !disabled) (e.currentTarget as HTMLLabelElement).style.background = DS.surface;
                           }}
                           onMouseLeave={(e) => {
                              if (!isSelected) (e.currentTarget as HTMLLabelElement).style.background = DS.white;
                           }}
                        >
                           {/* Custom radio dot */}
                           <div
                              style={{
                                 width: 16,
                                 height: 16,
                                 borderRadius: "50%",
                                 border: `2px solid ${isSelected ? (error ? DS.borderError : DS.accent) : DS.border}`,
                                 background: isSelected ? (error ? DS.borderError : DS.accent) : DS.white,
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 flexShrink: 0,
                                 transition: DS.transition,
                                 boxShadow: isSelected ? `0 1px 4px ${DS.accent}40` : "none"
                              }}
                           >
                              {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "white" }} />}
                           </div>

                           <input
                              type="radio"
                              id={optionId}
                              name={name}
                              value={String(optionValue)}
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => {
                                 if (!disabled) formik.setFieldValue(name, optionValue);
                              }}
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                           />

                           <span
                              style={{ fontSize: "13.5px", fontWeight: isSelected ? 600 : 400, color: isSelected ? DS.text1 : DS.text2, transition: DS.transition }}
                           >
                              {String(option[labelKey])}
                           </span>
                        </label>
                     );
                  })}
               </div>
            </div>

            <FieldError error={error} />
         </div>
      </ColComponent>
   );
};

/* ═══════════════════════════════════════════════════════════════
   FORMIK SWITCH
═══════════════════════════════════════════════════════════════ */
type SwitchProps = {
   label: string;
   name: string;
   responsive?: { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
};

export const FormikSwitch: React.FC<SwitchProps> = ({ label, name, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 } }) => {
   return (
      <ColComponent responsive={responsive}>
         <Field name={name}>
            {({ field, form: { errors, touched } }: any) => {
               const error = touched?.[name] && typeof errors?.[name] === "string" ? errors?.[name] : null;
               const isOn = field.value === 1 || field.value === true;

               return (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                     <label htmlFor={name} style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                        <input
                           {...field}
                           type="checkbox"
                           id={name}
                           style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                           onChange={(e) => {
                              const val = e.target.checked ? 1 : 0;
                              field.onChange({ target: { name, value: val } });
                           }}
                        />
                        {/* Track */}
                        <div
                           style={{
                              width: 44,
                              height: 24,
                              borderRadius: 100,
                              background: isOn ? DS.accent : DS.border,
                              transition: DS.transition,
                              position: "relative",
                              boxShadow: isOn ? `0 2px 8px ${DS.accent}50` : "inset 0 1px 2px rgba(0,0,0,0.1)"
                           }}
                        >
                           {/* Thumb */}
                           <div
                              style={{
                                 position: "absolute",
                                 top: 3,
                                 left: isOn ? 22 : 3,
                                 width: 18,
                                 height: 18,
                                 borderRadius: "50%",
                                 background: DS.white,
                                 boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                                 transition: DS.transition
                              }}
                           />
                        </div>
                     </label>

                     <span style={{ fontSize: "14px", fontWeight: 500, color: isOn ? DS.text1 : DS.text2, transition: DS.transition }}>{label}</span>

                     {error && <span style={{ fontSize: "12px", fontWeight: 500, color: DS.errorText }}>{error}</span>}
                  </div>
               );
            }}
         </Field>
      </ColComponent>
   );
};

/* CSS keyframes needed */
const globalStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

if (typeof document !== "undefined") {
   const style = document.createElement("style");
   style.textContent = globalStyles;
   document.head.appendChild(style);
}
