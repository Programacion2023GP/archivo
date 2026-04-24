import { AxiosRequest, GetAxios } from "../../axios/Axios";
import { Result } from "../../domain/models/users/users.domain";
import type { GenericRepository, RequestOptions } from "../../domain/repositories/generic/generic.repositories";
import { genericConfig } from "../../generic.config";

export class GenericApi<T extends object> implements GenericRepository<T> {
   private cfg = genericConfig;

   private mapError(error: any): string {
      return error?.response?.data?.message ?? error?.message ?? this.cfg.messages.networkError;
   }

   async getAll(prefix: string): Promise<Result<T[]>> {
      try {
         const url = `${this.cfg.baseUrl}/${this.cfg.endpoints.getAll(prefix)}`;
         const response = await GetAxios(url);

         const ok = this.cfg.responseMap.ok(response);
         const rawData = this.cfg.responseMap.data(response);
         const data = this.cfg.middlewares.afterResponse?.(rawData) ?? rawData;
         const message = this.cfg.responseMap.message(response);

         if (ok) {
            return { ok: true, data, message };
         } else {
            return { ok: false, error: new Error(message), message };
         }
      } catch (error: any) {
         const message = this.mapError(error);
         return { ok: false, error: new Error(message), message };
      }
   }

   async create(data: T | T[], prefix: string, formData = false): Promise<Result<T | T[]>> {
      try {
         const url = `${this.cfg.baseUrl}/${this.cfg.endpoints.create(prefix)}`;
         const payload = this.cfg.middlewares.beforeRequest?.(data) ?? data;
         const response = await AxiosRequest(url, "POST", payload, formData);

         const ok = this.cfg.responseMap.ok(response);
         const rawData = this.cfg.responseMap.data(response);
         const message = this.cfg.responseMap.message(response) || this.cfg.messages.createSuccess;

         if (ok) {
            return { ok: true, data: rawData, message };
         } else {
            return { ok: false, error: new Error(message), message };
         }
      } catch (error: any) {
         const message = this.mapError(error);
         return { ok: false, error: new Error(message), message };
      }
   }

   async delete(data: T, prefix: string): Promise<Result<void>> {
      try {
         const url = `${this.cfg.baseUrl}/${this.cfg.endpoints.delete(prefix)}`;
         const payload = this.cfg.middlewares.beforeRequest?.(data) ?? data;
         const response = await AxiosRequest(url, "DELETE", payload);

         const ok = this.cfg.responseMap.ok(response);
         const message = this.cfg.responseMap.message(response) || this.cfg.messages.deleteSuccess;

         if (ok) {
            return { ok: true, data: undefined, message };
         } else {
            return { ok: false, error: new Error(message), message };
         }
      } catch (error: any) {
         const message = this.mapError(error);
         return { ok: false, error: new Error(message), message };
      }
   }

   async request<R = T>(options: RequestOptions<T>): Promise<Result<R>> {
      const { data, prefix, method, formData = false } = options;
      try {
         const url = `${this.cfg.baseUrl}/${this.cfg.endpoints.request(prefix)}`;
         const payload = data ? (this.cfg.middlewares.beforeRequest?.(data) ?? data) : data;

         const response = method === "GET" ? await GetAxios(url) : await AxiosRequest(url, method, payload, formData);

         const ok = this.cfg.responseMap.ok(response);
         const rawData = this.cfg.responseMap.data(response);
         const resData = this.cfg.middlewares.afterResponse?.(rawData) ?? rawData;
         const message = this.cfg.responseMap.message(response);

         if (ok) {
            return { ok: true, data: resData as R, message };
         } else {
            return { ok: false, error: new Error(message), message };
         }
      } catch (error: any) {
         const message = this.mapError(error);
         return { ok: false, error: new Error(message), message };
      }
   }
}
