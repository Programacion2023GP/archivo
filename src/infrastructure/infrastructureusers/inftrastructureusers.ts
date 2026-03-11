import { AxiosRequest, GetAxios } from "../../axios/Axios";
import type { Permissions, Result, Users } from "../../domain/models/users/users.domain";
import type { UsersRepository } from "../../domain/repositories/users/users.repositories";

export class ApiUsers implements UsersRepository {
   async getPermissions(): Promise<Result<Permissions[]>> {
      try {
         const response = await GetAxios(`${import.meta.env.VITE_API_URL}/permissions/index`);

         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async delete(user: Users): Promise<Result<void>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/users/delete`, "DELETE", user);

         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async getAll(): Promise<Result<Users[]>> {
      try {
         const response = await GetAxios(`${import.meta.env.VITE_API_URL}/users/index`);

         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async register(user: Users): Promise<Result<Users>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/users/register`, "POST", user);

         if (response.status == "error") {
            return { ok: false, error: new Error(String(response.message)), message: String(response.message) };
         }
         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async logout(): Promise<Result<void>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/users/logout`, "POST");

         if (response.status == "error") {
            return { ok: false, error: new Error(String(response.message)), message: String(response.message) };
         }
         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
   async login(user: { payroll: string; password: string }): Promise<Result<void>> {
      try {
         const response = await AxiosRequest(`${import.meta.env.VITE_API_URL}/users/login`, "POST", user);
         // Validar que el status sea 200
         if (response.status === "success") {
            return { ok: true, data: response?.data, message: response?.data?.message || "Login exitoso" };
         } else {
            return { ok: false, error: new Error("Error en el servidor"), message: response?.data?.message || "Error inesperado" };
         }
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }
}