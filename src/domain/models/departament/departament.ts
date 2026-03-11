export interface Departament {
   id: number;
   name: string;
   active: boolean;
   level?:number
   departament_id: number | null;
   responsible?: string;
   authorized?: boolean;
   abbreviation: string;
   classification_code:string,
   children_recursive: Departament[];
}