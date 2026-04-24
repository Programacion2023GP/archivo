import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFormikContext } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";
import { FaMinus, FaPlus } from "react-icons/fa";
import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";
import { ColComponent } from "../../components/responsive/Responsive";

/* ------------------------------------------------------------------
   DESIGN SYSTEM
------------------------------------------------------------------ */
const DS = {
   bg: "#FAFAF9",
   white: "#FFFFFF",
   surface: "#F5F4F1",
   surfaceHover: "#EFEDE8",
   border: "#D6D3CC",
   borderHover: "#A8A39A",
   borderFocus: "#2D2A26",
   borderError: "#C0392B",
   text1: "#1C1A17",
   text2: "#6B6560",
   text3: "#A8A39A",
   textPlaceholder: "#B8B3AA",
   accent: "#3730A3",
   accentLight: "rgba(55,48,163,0.08)",
   accentMid: "rgba(55,48,163,0.16)",
   accentGlow: "0 0 0 3px rgba(55,48,163,0.12)",
   errorBg: "#FEF2F2",
   errorBorder: "#FCA5A5",
   errorText: "#DC2626",
   successBg: "#F0FDF4",
   successText: "#16A34A",
   r3: "4px",
   r6: "8px",
   r8: "10px",
   r10: "12px",
   r12: "14px",
   shadowSm: "0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)",
   shadowMd: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
   shadowLg: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
   shadowDropdown: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)",
   transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)"
};

/* ------------------------------------------------------------------
   TIPOS
------------------------------------------------------------------ */
export type HandleModifiedFn = (values: Record<string, any>, setFieldValue: (name: string, value: any) => void) => void | Promise<void>;

type ResponsiveProps = { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };

/* ------------------------------------------------------------------
   COMPONENTES INTERNOS REUTILIZABLES
------------------------------------------------------------------ */
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
         <div style={{ width: 5, height: 5, borderRadius: "50%", background: DS.errorText }} />
         <span style={{ fontSize: "12px", fontWeight: 500, color: DS.errorText }}>{error}</span>
      </motion.div>
   ) : null;

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
         <span style={{ fontSize: "14px", color: DS.text2, whiteSpace: multiline ? "pre-wrap" : "normal" }}>{value ?? "—"}</span>
      </div>
      <FieldError error={error} />
   </div>
);

/* ------------------------------------------------------------------
   FORMIK INPUT
------------------------------------------------------------------ */
interface FormikInputProps {
   name: string;
   label: string;
   type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "datetime-local" | "time";
   disabled?: boolean;
   readOnly?: boolean;
   required?: boolean;
   placeholder?: string;
   autoComplete?: string;
   debounceMs?: number;
   mask?: (value: string) => string;
   leftIcon?: React.ReactNode;
   rightIcon?: React.ReactNode;
   onRightIconClick?: () => void;
   onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
   onChange?: (value: any) => void;
   handleModified?: HandleModifiedFn;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikInput(props: FormikInputProps) {
   const {
      name,
      label,
      type = "text",
      disabled = false,
      readOnly = false,
      required = false,
      placeholder = " ",
      autoComplete = "off",
      debounceMs,
      mask,
      leftIcon,
      rightIcon,
      onRightIconClick,
      onBlur,
      onChange,
      handleModified,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true
   } = props;

   const formik = useFormikContext<Record<string, any>>();
   const [isFocused, setIsFocused] = useState(false);
   const [localValue, setLocalValue] = useState<string>("");
   const debounceTimer = useRef<number>(null);

   useEffect(() => {
      const value = formik.values?.[name];
      setLocalValue(value ?? "");
   }, [formik.values, name]);

   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;
   const hasValue = localValue.length > 0;
   const isActive = hasValue || isFocused || type === "date" || type === "datetime-local";

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
    let processed = mask ? mask(raw) : raw;
            processed = processed.toUpperCase();

      setLocalValue(processed);

      const updateField = () => {
         formik.setFieldValue(name, processed);
         onChange?.(processed);
         if (handleModified) {
            handleModified({ ...formik.values, [name]: processed }, formik.setFieldValue);
         }
      };

      if (debounceMs) {
         if (debounceTimer.current) clearTimeout(debounceTimer.current);
         debounceTimer.current = window.setTimeout(updateField, debounceMs);
      } else {
         updateField();
      }
   };

   const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      formik.setFieldTouched(name, true);
      onBlur?.(e);
      if (handleModified && !debounceMs) {
         handleModified(formik.values, formik.setFieldValue);
      }
   };

   if (disabled) {
      return <DisabledField label={label} value={localValue} error={error} />;
   }

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
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
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
            </label>

            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                  borderRadius: DS.r8,
                  background: DS.white,
                  boxShadow: isFocused ? (error ? "0 0 0 3px rgba(220,38,38,0.10)" : DS.accentGlow) : "none",
                  transition: DS.transition
               }}
            >
               {leftIcon && <span style={{ marginLeft: 12 }}>{leftIcon}</span>}
               <input
                  id={name}
                  name={name}
                  type={type}
                  value={localValue}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={handleBlur}
                  readOnly={readOnly}
                  required={required}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  style={{
                     flex: 1,
                     padding: `20px ${rightIcon ? "8px" : "12px"} 8px ${leftIcon ? "8px" : "12px"}`,
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     fontSize: "14px",
                     color: DS.text1,
                     fontFamily: "inherit"
                  }}
               />
               {rightIcon && (
                  <button type="button" onClick={onRightIconClick} style={{ marginRight: 12, background: "none", border: "none", cursor: "pointer", color: DS.text3 }}>
                     {rightIcon}
                  </button>
               )}
            </div>
            <FieldError error={error} />
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK TEXTAREA
------------------------------------------------------------------ */
interface FormikTextAreaProps {
   name: string;
   label: string;
   rows?: number;
   disabled?: boolean;
   readOnly?: boolean;
   required?: boolean;
   placeholder?: string;
   debounceMs?: number;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikTextArea(props: FormikTextAreaProps) {
   const {
      name,
      label,
      rows = 4,
      disabled = false,
      readOnly = false,
      required = false,
      placeholder = " ",
      debounceMs,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true
   } = props;

   const formik = useFormikContext<Record<string, any>>();
   const [isFocused, setIsFocused] = useState(false);
   const [localValue, setLocalValue] = useState("");
   const debounceTimer = useRef<number>(null);

   useEffect(() => {
      const value = formik.values?.[name];
      setLocalValue(value ?? "");
   }, [formik.values, name]);

   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;
   const hasValue = localValue.length > 0;
   const isActive = hasValue || isFocused;

   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;
            newValue = newValue.toUpperCase();

      setLocalValue(newValue);
      if (debounceMs) {
         if (debounceTimer.current) clearTimeout(debounceTimer.current);
         debounceTimer.current = window.setTimeout(() => {
            formik.setFieldValue(name, newValue);
         }, debounceMs);
      } else {
         formik.setFieldValue(name, newValue);
      }
   };

   const handleBlur = () => {
      setIsFocused(false);
      formik.setFieldTouched(name, true);
   };

   if (disabled) {
      return <DisabledField label={label} value={localValue} error={error} multiline />;
   }

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div style={{ position: "relative", marginBottom: "28px" }}>
            <div
               style={{
                  borderRadius: "14px",
                  padding: "1.5px",
                  background: error
                     ? `linear-gradient(135deg, ${DS.errorText}, #ff8a80)`
                     : isFocused
                       ? `linear-gradient(135deg, ${DS.accent}, #7c3aed, #06b6d4)`
                       : `linear-gradient(135deg, ${DS.border}, ${DS.border})`,
                  transition: DS.transition,
                  boxShadow: isFocused ? (error ? "0 4px 20px rgba(220,38,38,0.18)" : "0 4px 24px rgba(99,102,241,0.18)") : "0 2px 8px rgba(0,0,0,0.06)"
               }}
            >
               <div style={{ borderRadius: "13px", background: DS.white, overflow: "hidden" }}>
                  <label
                     htmlFor={name}
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
                        zIndex: 2
                     }}
                  >
                     {label}
                     {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
                  </label>
                  <textarea
                     id={name}
                     value={localValue}
                     onChange={handleChange}
                     onFocus={() => setIsFocused(true)}
                     onBlur={handleBlur}
                     rows={rows}
                     readOnly={readOnly}
                     placeholder={placeholder}
                     style={{
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
                        caretColor: error ? DS.errorText : DS.accent
                     }}
                  />
               </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
               <FieldError error={error} />
               {hasValue && <span style={{ fontSize: "11px", color: isFocused ? DS.accent : DS.text3 }}>{localValue.length} caracteres</span>}
            </div>
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK PASSWORD
------------------------------------------------------------------ */
interface FormikPasswordProps {
   name: string;
   label: string;
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikPassword(props: FormikPasswordProps) {
   const { name, label, disabled = false, required = false, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 }, padding = true } = props;
   const formik = useFormikContext<Record<string, any>>();
   const [showPassword, setShowPassword] = useState(false);
   const [isFocused, setIsFocused] = useState(false);
   const value = (formik.values?.[name] as string) ?? "";
   const hasValue = value.length > 0;
   const isActive = hasValue || isFocused;
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

   if (disabled) {
      return <DisabledField label={label} value={value} error={error} />;
   }

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
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
                  transition: DS.transition,
                  letterSpacing: isActive ? "0.04em" : "0",
                  textTransform: isActive ? "uppercase" : "none",
                  zIndex: 2
               }}
            >
               {label}
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
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
                  type={showPassword ? "text" : "password"}
                  id={name}
                  value={value}
                  onChange={(e) => formik.setFieldValue(name, e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                     setIsFocused(false);
                     formik.setFieldTouched(name, true);
                  }}
                  style={{
                     flex: 1,
                     padding: "20px 12px 8px",
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     fontSize: "14px",
                     color: DS.text1
                  }}
               />
               <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: DS.text3 }}
               >
                  {showPassword ? <IoMdEye size={18} /> : <IoIosEyeOff size={18} />}
               </button>
            </div>
            <FieldError error={error} />
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK NUMBER
------------------------------------------------------------------ */
interface FormikNumberProps {
   name: string;
   label: string;
   min?: number;
   max?: number;
   step?: number;
   decimals?: boolean;
   romanNumerals?: boolean;
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikNumber(props: FormikNumberProps) {
   const {
      name,
      label,
      min = 0,
      max = Infinity,
      step = 1,
      decimals = false,
      romanNumerals = false,
      disabled = false,
      required = false,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true
   } = props;

   const formik = useFormikContext<Record<string, any>>();
   const [isFocused, setIsFocused] = useState(false);
   const value = (formik.values?.[name] as number) ?? 0;
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

   const toRoman = (num: number): string => {
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
      for (const [letter, val] of map) {
         while (num >= val) {
            roman += letter;
            num -= val;
         }
      }
      return roman;
   };

   const formatDisplay = (num: number) => {
      if (romanNumerals) return toRoman(num);
      return decimals ? num.toFixed(2) : Math.floor(num).toString();
   };

   const setValue = (newVal: number) => {
      const clamped = Math.min(max, Math.max(min, newVal));
      formik.setFieldValue(name, clamped);
   };

   if (disabled) {
      return <DisabledField label={label} value={formatDisplay(value)} error={error} />;
   }

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div style={{ position: "relative", marginBottom: "20px" }}>
            <label
               style={{
                  position: "absolute",
                  left: "12px",
                  top: "-9px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: error ? DS.errorText : isFocused ? DS.accent : DS.text2,
                  background: DS.white,
                  padding: "0 4px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  zIndex: 2
               }}
            >
               {label}
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
            </label>
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${error ? DS.borderError : DS.border}`,
                  borderRadius: DS.r8,
                  background: DS.white,
                  overflow: "hidden"
               }}
            >
               <button
                  type="button"
                  onClick={() => setValue(value - step)}
                  style={{
                     width: 40,
                     height: 44,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     background: DS.surface,
                     border: "none",
                     borderRight: `1px solid ${DS.border}`,
                     cursor: "pointer"
                  }}
               >
                  <FaMinus size={10} />
               </button>
               <input
                  type="text"
                  value={formatDisplay(value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                     setIsFocused(false);
                     formik.setFieldTouched(name, true);
                  }}
                  readOnly
                  style={{
                     flex: 1,
                     padding: "10px 8px",
                     textAlign: "center",
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     fontSize: "14px",
                     fontWeight: 600,
                     color: DS.text1
                  }}
               />
               <button
                  type="button"
                  onClick={() => setValue(value + step)}
                  style={{
                     width: 40,
                     height: 44,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     background: DS.surface,
                     border: "none",
                     borderLeft: `1px solid ${DS.border}`,
                     cursor: "pointer"
                  }}
               >
                  <FaPlus size={10} />
               </button>
            </div>
            <FieldError error={error} />
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK CHECKBOX
------------------------------------------------------------------ */
interface FormikCheckboxProps {
   name: string;
   label: string;
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikCheckbox(props: FormikCheckboxProps) {
   const { name, label, disabled = false, required = false, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 }, padding = true } = props;
   const formik = useFormikContext<Record<string, any>>();
   const value = !!formik.values?.[name];
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div
            style={{
               display: "flex",
               alignItems: "center",
               gap: "10px",
               marginBottom: "20px",
               opacity: disabled ? 0.5 : 1,
               cursor: disabled ? "not-allowed" : "pointer"
            }}
            onClick={() => !disabled && formik.setFieldValue(name, !value)}
         >
            <div
               style={{
                  width: 20,
                  height: 20,
                  borderRadius: DS.r3,
                  background: value ? DS.accent : DS.white,
                  border: `2px solid ${error ? DS.borderError : value ? DS.accent : DS.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
               }}
            >
               {value && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                     <polyline points="20 6 9 17 4 12" />
                  </svg>
               )}
            </div>
            <label style={{ fontSize: "14px", fontWeight: 500, color: value ? DS.text1 : DS.text2, userSelect: "none" }}>
               {label}
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
            </label>
         </div>
         <FieldError error={error} />
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK SWITCH
------------------------------------------------------------------ */
interface FormikSwitchProps {
   name: string;
   label: string;
   disabled?: boolean;
   responsive?: ResponsiveProps;
}

export function FormikSwitch(props: FormikSwitchProps) {
   const { name, label, disabled = false, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 } } = props;
   const formik = useFormikContext<Record<string, any>>();
   const value = !!formik.values?.[name];
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

   return (
      <ColComponent responsive={responsive}>
         <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", opacity: disabled ? 0.5 : 1 }}>
            <label style={{ position: "relative", display: "inline-flex", cursor: disabled ? "not-allowed" : "pointer" }}>
               <input
                  type="checkbox"
                  checked={value}
                  disabled={disabled}
                  onChange={(e) => formik.setFieldValue(name, e.target.checked ? 1 : 0)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
               />
               <div
                  style={{
                     width: 44,
                     height: 24,
                     borderRadius: 100,
                     background: value ? DS.accent : DS.border,
                     transition: DS.transition,
                     position: "relative"
                  }}
               >
                  <div
                     style={{
                        position: "absolute",
                        top: 3,
                        left: value ? 22 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: DS.white,
                        transition: DS.transition
                     }}
                  />
               </div>
            </label>
            <span style={{ fontSize: "14px", fontWeight: 500, color: value ? DS.text1 : DS.text2 }}>{label}</span>
            {error && <span style={{ fontSize: "12px", color: DS.errorText }}>{error}</span>}
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK RADIO
------------------------------------------------------------------ */
interface FormikRadioProps<TOption> {
   name: string;
   label: string;
   options: TOption[];
   idKey: keyof TOption;
   labelKey: keyof TOption;
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikRadio<TOption>(props: FormikRadioProps<TOption>) {
   const {
      name,
      label,
      options,
      idKey,
      labelKey,
      disabled = false,
      required = false,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true
   } = props;
   const formik = useFormikContext<Record<string, any>>();
   const value = formik.values?.[name];
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

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
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
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
                     const optValue = option[idKey];
                     const isSelected = String(value) === String(optValue);
                     return (
                        <label
                           key={String(optValue)}
                           style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 14px",
                              borderRadius: DS.r6,
                              border: `1.5px solid ${isSelected ? (error ? DS.borderError : DS.accent) : DS.border}`,
                              background: isSelected ? (error ? "rgba(220,38,38,0.06)" : DS.accentLight) : DS.white,
                              cursor: disabled ? "not-allowed" : "pointer",
                              transition: DS.transition
                           }}
                           onClick={() => !disabled && formik.setFieldValue(name, optValue)}
                        >
                           <div
                              style={{
                                 width: 16,
                                 height: 16,
                                 borderRadius: "50%",
                                 border: `2px solid ${isSelected ? (error ? DS.borderError : DS.accent) : DS.border}`,
                                 background: isSelected ? (error ? DS.borderError : DS.accent) : DS.white,
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center"
                              }}
                           >
                              {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "white" }} />}
                           </div>
                           <span style={{ fontSize: "13.5px", fontWeight: isSelected ? 600 : 400, color: isSelected ? DS.text1 : DS.text2 }}>
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
}

/* ------------------------------------------------------------------
   FORMIK AUTOCOMPLETE (con soporte de árbol)
------------------------------------------------------------------ */
type TreeNode<T> = T & { children_recursive?: TreeNode<T>[] };

interface FormikAutocompleteProps<TOption> {
   name: string;
   label: string;
   options: TreeNode<TOption>[];
   idKey: keyof TOption;
   labelKey: keyof TOption;
   loading?: boolean;
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
   onSelect?: (value: TOption) => void;
}

export function FormikAutocomplete<TOption>(props: FormikAutocompleteProps<TOption>) {
   const {
      name,
      label,
      options,
      idKey,
      labelKey,
      loading = false,
      disabled = false,
      required = false,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true,
      onSelect
   } = props;

   const formik = useFormikContext<Record<string, any>>();
   const [filteredOptions, setFilteredOptions] = useState(options);
   const [textSearch, setTextSearch] = useState("");
   const [showOptions, setShowOptions] = useState(false);
   const [isFocused, setIsFocused] = useState(false);
   const [activeIndex, setActiveIndex] = useState(-1);
   const inputRef = useRef<HTMLInputElement>(null);
   const menuRef = useRef<HTMLUListElement>(null);

   const value = formik.values?.[name];
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;
   const hasValue = textSearch.length > 0;
   const isActive = hasValue || isFocused;

   const flattenOptions = (opts: TreeNode<TOption>[], depth = 0): Array<{ item: TreeNode<TOption>; depth: number; isGroup: boolean }> => {
      const result: Array<{ item: TreeNode<TOption>; depth: number; isGroup: boolean }> = [];
      for (const item of opts) {
         const hasChildren = Array.isArray(item.children_recursive) && item.children_recursive.length > 0;
         result.push({ item, depth, isGroup: hasChildren });
         if (hasChildren) result.push(...flattenOptions(item.children_recursive!, depth + 1));
      }
      return result;
   };

   const flatList = flattenOptions(filteredOptions);

   const filterTree = (opts: TreeNode<TOption>[], query: string): TreeNode<TOption>[] => {
      const lower = query.toLowerCase();
      return opts.reduce<TreeNode<TOption>[]>((acc, item) => {
         const labelMatch = String(item[labelKey]).toLowerCase().includes(lower);
         const filteredChildren = item.children_recursive ? filterTree(item.children_recursive, query) : [];
         if (labelMatch || filteredChildren.length) acc.push({ ...item, children_recursive: filteredChildren });
         return acc;
      }, []);
   };

   const updateTextFromValue = useCallback(() => {
      const findInTree = (opts: TreeNode<TOption>[]): TreeNode<TOption> | null => {
         for (const opt of opts) {
            const optValue = String(opt[idKey]);
            const currentValue = value !== null && value !== undefined ? String(value) : "";
            if (optValue === currentValue) return opt;
            if (opt.children_recursive) {
               const found = findInTree(opt.children_recursive);
               if (found) return found;
            }
         }
         return null;
      };
      const selected = findInTree(options);
      setTextSearch(selected ? String(selected[labelKey]) : "");
   }, [value, options, idKey, labelKey]);

   useEffect(() => {
      updateTextFromValue();
   }, [updateTextFromValue]);
   useEffect(() => {
      setFilteredOptions(options);
   }, [options]);

   const handleFilter = (query: string) => {
      setTextSearch(query);
      if (!query) {
         setFilteredOptions(options);
         if (value) formik.setFieldValue(name, null);
      } else {
         setFilteredOptions(filterTree(options, query));
      }
      setActiveIndex(-1);
   };

   const selectOption = (item: TreeNode<TOption>) => {
      setTextSearch(String(item[labelKey]));
      formik.setFieldValue(name, item[idKey]);
      formik.setFieldTouched(name, true);
      setShowOptions(false);
      setIsFocused(false);
      onSelect?.(item);
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

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showOptions || flatList.length === 0) return;
      if (e.key === "ArrowDown") setActiveIndex((prev) => (prev + 1) % flatList.length);
      else if (e.key === "ArrowUp") setActiveIndex((prev) => (prev - 1 + flatList.length) % flatList.length);
      else if (e.key === "Enter" && activeIndex >= 0) selectOption(flatList[activeIndex].item);
      else if (e.key === "Escape") {
         setShowOptions(false);
         setIsFocused(false);
      }
   };

   if (disabled) return <DisabledField label={label} value={textSearch} error={error} />;

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
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
                  transition: DS.transition,
                  letterSpacing: isActive ? "0.04em" : "0",
                  textTransform: isActive ? "uppercase" : "none",
                  zIndex: 2
               }}
            >
               {label}
               {required && <span style={{ color: DS.errorText, marginLeft: 2 }}>*</span>}
            </label>
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${error ? DS.borderError : isFocused ? DS.borderFocus : DS.border}`,
                  borderRadius: DS.r8,
                  background: DS.white,
                  boxShadow: isFocused ? DS.accentGlow : "none"
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
                     setShowOptions(true);
                     setFilteredOptions(options);
                  }}
                  onChange={(e) => handleFilter(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                     setIsFocused(false);
                     formik.setFieldTouched(name, true);
                  }}
                  style={{
                     flex: 1,
                     padding: "20px 12px 8px",
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     fontSize: "14px",
                     color: DS.text1
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
                     onClick={() => setShowOptions((s) => !s)}
                     style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: DS.text3 }}
                  >
                     <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ transform: showOptions ? "rotate(180deg)" : "none" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </button>
               )}
            </div>
            <AnimatePresence>
               {showOptions && (
                  <motion.ul
                     ref={menuRef}
                     initial={{ opacity: 0, y: -6 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -6 }}
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
                     {flatList.length ? (
                        flatList.map(({ item, depth, isGroup }, idx) => (
                           <li
                              key={`${depth}-${String(item[idKey])}`}
                              onClick={() => selectOption(item)}
                              style={{
                                 padding: `8px 10px 8px ${12 + depth * 18}px`,
                                 borderRadius: DS.r6,
                                 background: activeIndex === idx ? DS.accentLight : "transparent",
                                 cursor: "pointer",
                                 display: "flex",
                                 alignItems: "center",
                                 gap: "8px"
                              }}
                              onMouseEnter={() => setActiveIndex(idx)}
                           >
                              {depth > 0 && (
                                 <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                                    <path d="M2 0 L2 6 L12 6" stroke="currentColor" strokeWidth="1.5" />
                                 </svg>
                              )}
                              {isGroup ? (
                                 <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={DS.accent}>
                                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                                 </svg>
                              ) : (
                                 <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.border }} />
                              )}
                              <span style={{ fontSize: "13.5px", fontWeight: isGroup ? 600 : 400 }}>{String(item[labelKey])}</span>
                           </li>
                        ))
                     ) : (
                        <li style={{ padding: "16px", textAlign: "center", color: DS.text3 }}>No hay opciones</li>
                     )}
                  </motion.ul>
               )}
            </AnimatePresence>
            <FieldError error={error} />
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK COLOR PICKER
------------------------------------------------------------------ */
interface FormikColorPickerProps {
   name: string;
   label: string;
   colorPalette: string[];
   disabled?: boolean;
   required?: boolean;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikColorPicker(props: FormikColorPickerProps) {
   const { name, label, colorPalette, disabled = false, required = false, responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 }, padding = true } = props;
   const formik = useFormikContext<Record<string, any>>();
   const [isOpen, setIsOpen] = useState(false);
   const pickerRef = useRef<HTMLDivElement>(null);
   const currentColor = (formik.values?.[name] as string) || colorPalette[0] || "#000000";
   const error = formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : null;

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setIsOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const selectColor = (color: string) => {
      formik.setFieldValue(name, color);
      setIsOpen(false);
   };

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div ref={pickerRef} style={{ position: "relative", marginBottom: "20px" }}>
            <button
               type="button"
               onClick={() => !disabled && setIsOpen((o) => !o)}
               disabled={disabled}
               style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "10px 14px",
                  background: DS.white,
                  border: `1.5px solid ${isOpen ? DS.borderFocus : error ? DS.borderError : DS.border}`,
                  borderRadius: DS.r8,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: DS.transition,
                  boxShadow: isOpen ? DS.accentGlow : DS.shadowSm,
                  opacity: disabled ? 0.5 : 1
               }}
            >
               <div style={{ width: 44, height: 44, borderRadius: DS.r6, background: currentColor, border: "1px solid rgba(0,0,0,0.08)" }} />
               <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: DS.text1 }}>{label}</div>
                  <div style={{ fontSize: "12px", color: DS.text3, fontFamily: "monospace" }}>{currentColor.toUpperCase()}</div>
               </div>
               <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
            </button>
            <AnimatePresence>
               {isOpen && (
                  <motion.div
                     initial={{ opacity: 0, y: -8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -8 }}
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
                        boxShadow: DS.shadowDropdown
                     }}
                  >
                     <div style={{ padding: "12px 14px", borderBottom: `1px solid ${DS.border}`, background: DS.surface }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                           <div style={{ width: 28, height: 28, borderRadius: DS.r3, background: currentColor }} />
                           <div>
                              <div style={{ fontSize: "12px", fontWeight: 600 }}>Color seleccionado</div>
                              <div style={{ fontSize: "11px", fontFamily: "monospace" }}>{currentColor.toUpperCase()}</div>
                           </div>
                        </div>
                     </div>
                     <div style={{ padding: "14px", maxHeight: "220px", overflowY: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "8px" }}>
                           {colorPalette.map((color) => (
                              <button
                                 key={color}
                                 type="button"
                                 onClick={() => selectColor(color)}
                                 style={{
                                    paddingBottom: "100%",
                                    position: "relative",
                                    borderRadius: DS.r3,
                                    background: color,
                                    border: currentColor === color ? "2px solid white" : "2px solid transparent",
                                    outline: currentColor === color ? `2px solid ${DS.accent}` : "none",
                                    transform: currentColor === color ? "scale(1.15)" : "scale(1)",
                                    transition: DS.transition
                                 }}
                              />
                           ))}
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
            <FieldError error={error} />
         </div>
      </ColComponent>
   );
}

/* ------------------------------------------------------------------
   FORMIK IMAGE INPUT
------------------------------------------------------------------ */
interface FormikImageInputProps {
   name: string;
   label: string;
   disabled?: boolean;
   acceptedFileTypes?: string;
   multiple?: boolean;
   maxFiles?: number;
   responsive?: ResponsiveProps;
   padding?: boolean;
}

export function FormikImageInput(props: FormikImageInputProps) {
   const {
      name,
      label,
      disabled = false,
      acceptedFileTypes = "image/*",
      multiple = false,
      maxFiles = 5,
      responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
      padding = true
   } = props;

   const { setFieldValue, values, errors, touched } = useFormikContext<Record<string, any>>();
   const [previews, setPreviews] = useState<string[]>([]);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      const currentValue = values[name];
      if (multiple && Array.isArray(currentValue)) {
         setPreviews(currentValue.filter((f: any) => typeof f === "string") as string[]);
      } else if (!multiple && typeof currentValue === "string") {
         setPreviews([currentValue]);
      } else {
         setPreviews([]);
      }
   }, [values, name, multiple]);

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      const fileList = Array.from(files);
      if (multiple) {
         if (fileList.length + previews.length > maxFiles) return;
         const newPreviews = fileList.map((f) => URL.createObjectURL(f));
         setPreviews((prev) => [...prev, ...newPreviews]);
         const currentFiles = (values[name] as File[]) || [];
         setFieldValue(name, [...currentFiles, ...fileList]);
      } else {
         setPreviews([URL.createObjectURL(fileList[0])]);
         setFieldValue(name, fileList[0]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
   };

   const handleRemove = (index: number) => {
      if (multiple) {
         const currentFiles = (values[name] as File[]) || [];
         setFieldValue(
            name,
            currentFiles.filter((_, i) => i !== index)
         );
         URL.revokeObjectURL(previews[index]);
         setPreviews(previews.filter((_, i) => i !== index));
      } else {
         if (previews[0]) URL.revokeObjectURL(previews[0]);
         setPreviews([]);
         setFieldValue(name, null);
      }
   };

   const error = touched[name] && errors[name] ? String(errors[name]) : null;

   return (
      <ColComponent responsive={responsive} autoPadding={padding}>
         <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: DS.text1 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
               {previews.map((src, idx) => (
                  <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                     <img
                        src={src}
                        alt="preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: DS.r6, border: `1px solid ${DS.border}` }}
                     />
                     <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        style={{
                           position: "absolute",
                           top: "-8px",
                           right: "-8px",
                           width: "24px",
                           height: "24px",
                           borderRadius: "50%",
                           background: DS.errorText,
                           color: "white",
                           border: "none",
                           cursor: "pointer",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center"
                        }}
                     >
                        <AiOutlineClose size={12} />
                     </button>
                  </div>
               ))}
               {(!multiple || previews.length < maxFiles) && !disabled && (
                  <div
                     onClick={() => fileInputRef.current?.click()}
                     style={{
                        width: "100px",
                        height: "100px",
                        border: `2px dashed ${DS.border}`,
                        borderRadius: DS.r6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: DS.surface
                     }}
                  >
                     <AiOutlineCamera size={24} color={DS.text3} />
                     <span style={{ fontSize: "12px", color: DS.text3 }}>Subir</span>
                  </div>
               )}
            </div>
            <input
               ref={fileInputRef}
               type="file"
               accept={acceptedFileTypes}
               multiple={multiple}
               onChange={handleChange}
               style={{ display: "none" }}
               disabled={disabled}
            />
            {error && <div style={{ color: DS.errorText, fontSize: "12px", marginTop: "8px" }}>{error}</div>}
         </div>
      </ColComponent>
   );
}
