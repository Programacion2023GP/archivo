import { Result } from "../../models/users/users.domain";

export interface GenericRepository<T extends object> {
   getAll(prefix: string): Promise<Result<T[]>>;
   create(data: T | T[], prefix: string, formData?: boolean): Promise<Result<T | T[]>>;
   delete(data: T, prefix: string): Promise<Result<void>>;
   [key: string]: any;

   // getById?(id: string | number): Promise<Result<T>>;
   // update?(id: string | number, data: Partial<T>): Promise<Result<T>>;
   // find?(filters: Partial<T>): Promise<Result<T[]>>;
   // deleteById?(id: string | number): Promise<Result<void>>;
   // count?(): Promise<Result<number>>;
   // exists?(criteria: Partial<T>): Promise<Result<boolean>>;

   // // Métodos para operaciones por lotes
   // createMany?(data: T[]): Promise<Result<T[]>>;
   // updateMany?(criteria: Partial<T>, data: Partial<T>): Promise<Result<number>>;
   // deleteMany?(criteria: Partial<T>): Promise<Result<number>>;

   // // Métodos para relaciones/paginación
   // getWithPagination?(page: number, limit: number): Promise<Result<{ data: T[]; total: number; page: number; limit: number }>>;
   // getBySpecialty?(specialtyId: string | number): Promise<Result<T[]>>;

   // // Hook para eventos/callbacks
   // onDataChange?(callback: (data: T[]) => void): void;
}