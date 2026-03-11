import { AxiosRequest, GetAxios } from "../../axios/Axios";
import { LogsHistorial } from "../../domain/models/logs/logs.model";
import type { Result } from "../../domain/models/users/users.domain";
import { LogsRepository } from "../../domain/repositories/logs/logs.repositories";

export class LogsApi implements LogsRepository {


   async getAll(): Promise<Result<LogsHistorial[]>> {
      try {
         const response = await GetAxios(`${import.meta.env.VITE_API_URL}/logs`);
         return { ok: true, data: response?.data, message: response.message };
      } catch (error: any) {
         return { ok: false, error: new Error(String(error)), message: String(error) };
      }
   }

 
}