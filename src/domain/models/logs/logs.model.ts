export interface LogsHistorial {
   success: boolean;
   message?: string;
   data: HistorialAccion[];
}

export interface HistorialAccion {
   id: number;
   usuario: string;
   modelo: string;
   accion: string;
   valores_anteriores: Record<string, any> | null;
   valores_nuevos: ValoresNuevos | null;
   ip: string;
   metodo_http: string;
   fecha: string; // formato "YYYY-MM-DD HH:mm:ss"
}

export interface ValoresNuevos {
   id: number;
   active: boolean | number; // puede venir como 1/0 o true/false
   payroll: string;
   firstName: string;
   paternalSurname?: string;
   maternalSurname?: string;
   fullName?: string;
   created_at: string;
   updated_at: string;
   email_verified_at?: string | null;
   remember_token?: string | null;
}
export interface HistorialAccion {
   id: number;
   usuario: string; // Ejemplo: "Sistema"
   modelo: string; // Ejemplo: "User"
   accion: string; // Ejemplo: "Creado"
   valores_anteriores: Record<string, any> | null; // puede ser null
   valores_nuevos: ValoresNuevos | null;
   ip: string; // Ejemplo: "186.96.142.7"
   metodo_http: string; // Ejemplo: "POST"
   fecha: string; // Ejemplo: "2025-11-06 19:23:52"
}
