import { AxiosRequest, GetAxios } from "../../axios/Axios";
import type { Result } from "../../domain/models/users/users.domain";

import { GenericRepository } from "../../domain/repositories/generic/generic.repositories";

export class GenericApi<T extends object> implements GenericRepository<T> {
   async getAll(prefix: string): Promise<Result<T[]>> {
      try {
         const response = await GetAxios(`${import.meta.env.VITE_API_URL}/${prefix}/index`);
         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async create(data: T | T[], prefix: string, formData: boolean = false): Promise<Result<T>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/${prefix}/createorUpdate`, "POST", data, formData);

         return {
            ok: true,
            data: response.data,
            message: response.message
         };
      } catch (error: any) {
         if (error.response) {
            const laravelError = error.response.data;

            return {
               ok: false,
               error: new Error(laravelError.message ?? "Error desconocido desde el servidor"),
               message: laravelError.message ?? "Error en la petición"
            };
         }

         // ==========
         // 🟥 ERROR DE AXIOS O NETWORK
         // ==========
         return {
            ok: false,
            error: new Error(String(error)),
            message: "Error de conexión con el servidor"
         };
      }
   }
   async request<T>(options: { data: Partial<T>; prefix: string; method: "POST" | "PUT" | "GET" | "DELETE"; formData?: boolean }): Promise<Result<T>> {
      const { data, prefix, method, formData = false } = options;

      try {
         let response = null;

         if (method === "GET") {
            response = await GetAxios(`${import.meta.env.VITE_API_URL}/${prefix}`);
         } else {
            response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/${prefix}`, method, data, formData);
         }

         return {
            ok: true,
            data: response.data,
            message: response.message
         };
      } catch (error: any) {
         if (error.response) {
            const laravelError = error.response.data;
            const errorMessage = laravelError?.message ?? "Error desconocido desde el servidor";

            return {
               ok: false,
               error: new Error(errorMessage),
               message: errorMessage
            };
         }

         // ==========
         // 🟥 ERROR DE AXIOS O NETWORK
         // ==========
         const errorMessage = error.message || "Error de conexión con el servidor";

         return {
            ok: false,
            error: new Error(errorMessage),
            message: "Error de conexión con el servidor"
         };
      }
   }
   async delete(data: T, prefix: string): Promise<Result<void>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/${prefix}/delete`, "DELETE", data);

         // Si el backend devuelve un status de error
         if (response.status === "error") {
            return {
               ok: false,
               error: new Error(String(response.message)),
               message: String(response.message)
            };
         }

         return {
            ok: true,
            data: undefined,
            message: response.message || "Elemento eliminado correctamente"
         };
      } catch (error: any) {
         console.log("Error en delete:", error);

         // Manejo de errores específicos del backend Laravel
         if (error.response) {
            const laravelError = error.response.data;

            return {
               ok: false,
               error: new Error(laravelError.message ?? "Error al eliminar el elemento"),
               message: laravelError.message ?? "Error en la eliminación"
            };
         }

         // Error de red o de Axios
         return {
            ok: false,
            error: new Error(String(error)),
            message: "Error de conexión con el servidor"
         };
      }
   }
}
