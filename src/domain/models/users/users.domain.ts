export interface Users {
   id: number;
   role: string;
   firstName: string;
   paternalSurname: string;
   maternalSurname: string;
   fullName: string;
   password: string;
   dependence_id: number | null;
   active: boolean;
   payroll: number;
   permissions: number[];
   departament?:string;
}     
export type Result<T> =
  | { ok: true; data: T,message:string }
  | { ok: false; error: Error,message:string };

export interface Permissions {
    id: number,
    name:string,
   
    active:boolean,
}    
  // c-36 
  // c-334
