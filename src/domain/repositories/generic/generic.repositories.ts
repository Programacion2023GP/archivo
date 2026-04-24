export type Result<T> = { ok: true; data: T; message: string } | { ok: false; error: Error; message: string };

export interface RequestOptions<T> {
   data?: Partial<T>;
   prefix: string;
   method: "POST" | "PUT" | "GET" | "DELETE";
   formData?: boolean;
}

export interface GenericRepository<T extends object> {
   getAll(prefix: string): Promise<Result<T[]>>;
   create(data: T | T[], prefix: string, formData?: boolean): Promise<Result<T | T[]>>;
   delete(data: T, prefix: string): Promise<Result<void>>;
   request<R = T>(options: RequestOptions<T>): Promise<Result<R>>;
}
