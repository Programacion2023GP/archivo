export interface ListAutorized {
   id: number;
   user_id: number;
   name: string;
   fullName?:string,
   group: string;
   signedBy: boolean;
   procedure_id: number;
}