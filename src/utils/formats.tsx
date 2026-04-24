import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Configurar plugins SOLO UNA VEZ
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale("es");

type DateInput = string | Date | number | null | undefined;

export enum DateFormat {
   YYYY_MM_DD = "YYYY-MM-DD",
   DD_MM_YYYY = "DD/MM/YYYY",
   MM_DD_YYYY = "MM/DD/YYYY",
   DD_MM_YYYY_DASHED = "DD-MM-YYYY",
   YYYY_MM_DD_DOTTED = "YYYY.MM.DD",
   YYYY_MM_DD_SLASHED = "YYYY/MM/DD",
   DD_MMM_YYYY = "DD MMM YYYY",
   DD_MMMM_YYYY = "DD MMMM YYYY",
   DDD_DD_MMM_YYYY = "ddd, DD MMM YYYY",
   DDDD_DD_MMMM_YYYY = "dddd, DD MMMM YYYY",
   DD_MM_YY = "DD/MM/YY",
   MMM_D_YYYY = "MMM D, YYYY",
   HH_MM = "HH:mm",
   HH_MM_SS = "HH:mm:ss",
   HH_MM_SS_A = "HH:mm:ss a ",
   H_MM_A = "h:mm A",
   H_MM_SS_A = "h:mm:ss A",
   HH_MM_DOUBLE_SS = "HH:mm::ss",
   HH_DOUBLE_MM_DOUBLE_SS = "HH::mm::ss",
   H_MM_a = "h:mm a",
   HH_MM_SS_MS = "HH:mm:ss.SSS",
   KK_MM = "kk:mm",
   KK_MM_SS = "kk:mm:ss",
   YYYY_MM_DD_HH_MM_SS = "YYYY-MM-DD HH:mm:ss",
   DD_MM_YYYY_HH_MM = "DD/MM/YYYY HH:mm",
   DD_MM_YYYY_H_MM_A = "DD-MM-YYYY h:mm A",
   MM_DD_YYYY_hh_MM_A = "MM/DD/YYYY hh:mm A",
   YYYY_MM_DD_HH_DOUBLE_MM = "YYYY.MM.DD HH::mm",
   DDD_MMM_D_YYYY_H_MM_A = "ddd, MMM D, YYYY h:mm A",
   UNIX_SECONDS = "X",
   UNIX_MILLISECONDS = "x",
   ISO = "YYYY-MM-DDTHH:mm:ssZ",
   ISO_WITH_MS = "YYYY-MM-DDTHH:mm:ss.SSSZ",
   DD_DE_MMMM_DE_YYYY = "DD [de] MMMM [de] YYYY",
   DD_DE_MMMM_DE_YYYY_H_MM_a = "DD [de] MMMM [de] YYYY, h:mm a",
   DDDD_DD_DE_MMMM_DE_YYYY = "dddd, DD [de] MMMM [de] YYYY",
   DD_MM = "DD/MM",
   MM_YY = "MM/YY",
   H_A = "h A",
   INTERNATIONAL = "YYYY-MM-DD",
   EUROPEAN = "DD.MM.YYYY",
   US = "MMMM D, YYYY",
   TODAY_IS_DDDD = "[Today is] dddd",
   YEAR_QUARTER = "YYYY-[Q]Q",
   YEAR_WEEK = "YYYY-[W]WW",
   HH_MM_HRS = "HH:mm [hrs]",
   DD_MM_YYYY_A_LAS_H_MM_a = "DD/MM/YYYY [a las] h:mm a"
}

// Función para obtener la zona horaria local del navegador
function getLocalTimezoneOffset(): number {
   return new Date().getTimezoneOffset();
}

// Función para ajustar la fecha a la zona horaria local
function adjustToLocalTimezone(date: Date): Date {
   const offset = getLocalTimezoneOffset();
   const localDate = new Date(date.getTime() - offset * 60 * 1000);
   return localDate;
}

// Función principal de formateo SIN usar dayjs.tz()
export function formatDatetime(the_date: DateInput | string, long_format: boolean = true, format: DateFormat = DateFormat.DD_MM_YYYY): string {
   // Validación inicial
   if (!the_date) return "Sin Fecha";
   if (typeof the_date === "string" && the_date.trim() === "") return "Sin Fecha";
   if (typeof the_date === "number" && (isNaN(the_date) || !isFinite(the_date))) return "Sin Fecha";

   try {
      let dateObj: dayjs.Dayjs;

      // Caso especial: solo hora
      if (typeof the_date === "string") {
         const horaRegex = /^(\d{1,2}:\d{2}(:\d{2})?(\s?[ap]m)?)$/i;
         if (horaRegex.test(the_date.trim())) {
            dateObj = dayjs(the_date.trim(), ["HH:mm", "HH:mm:ss", "hh:mm:ss a"]);
            if (dateObj.isValid()) {
               return dateObj.format(format);
            }
            return "Hora inválida";
         }
      }

      // Convertir a Date nativo primero
      let nativeDate: Date;

      if (typeof the_date === "string") {
         nativeDate = new Date(the_date);
         // Si falla, intentar con formatos específicos
         if (isNaN(nativeDate.getTime())) {
            const formats = ["DD/MM/YYYY", "DD-MM-YYYY", "MM/DD/YYYY", "YYYY/MM/DD"];
            for (const fmt of formats) {
               const parsed = dayjs(the_date, fmt);
               if (parsed.isValid()) {
                  nativeDate = parsed.toDate();
                  break;
               }
            }
         }
      } else if (the_date instanceof Date) {
         nativeDate = the_date;
      } else if (typeof the_date === "number") {
         nativeDate = new Date(the_date);
      } else {
         return "Fecha inválida";
      }

      // Verificar si la fecha es válida
      if (isNaN(nativeDate.getTime())) {
         console.warn("Fecha inválida:", the_date);
         return "Fecha inválida";
      }

      // Ajustar a zona horaria local
      const localDate = adjustToLocalTimezone(nativeDate);

      // Crear objeto dayjs
      dateObj = dayjs(localDate);

      if (!dateObj.isValid()) {
         return "Fecha inválida";
      }

      return dateObj.format(format);
   } catch (error) {
      console.error("Error en formatDatetime:", error);
      return "Fecha inválida";
   }
}

// Versión ultra simple usando solo Date nativo (más confiable)
export function formatDateNative(the_date: DateInput | string, format: string = "DD/MM/YYYY"): string {
   if (!the_date) return "";

   try {
      let date: Date;

      if (typeof the_date === "string") {
         date = new Date(the_date);
      } else if (the_date instanceof Date) {
         date = the_date;
      } else if (typeof the_date === "number") {
         date = new Date(the_date);
      } else {
         return "";
      }

      if (isNaN(date.getTime())) return "";

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      let result = format;
      result = result.replace("DD", day);
      result = result.replace("MM", month);
      result = result.replace("YYYY", year.toString());
      result = result.replace("YY", year.toString().slice(-2));
      result = result.replace("HH", hours);
      result = result.replace("hh", hours);
      result = result.replace("mm", minutes);
      result = result.replace("ss", seconds);

      return result;
   } catch {
      return "";
   }
}

export function ensureLocalDate(date: DateInput): dayjs.Dayjs | null {
   if (!date) return null;

   try {
      let nativeDate: Date;

      if (typeof date === "string") {
         nativeDate = new Date(date);
      } else if (date instanceof Date) {
         nativeDate = date;
      } else if (typeof date === "number") {
         nativeDate = new Date(date);
      } else {
         return null;
      }

      if (isNaN(nativeDate.getTime())) return null;

      const localDate = adjustToLocalTimezone(nativeDate);
      return dayjs(localDate);
   } catch {
      return null;
   }
}

export function toLocalDate(date: DateInput): Date | null {
   const localDate = ensureLocalDate(date);
   return localDate ? localDate.toDate() : null;
}

// Exportar por defecto la función más segura
export default formatDateNative;
