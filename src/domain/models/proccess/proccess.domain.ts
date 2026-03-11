export interface Proccess {
   id: number;
   classification_code: string;
   name: string;
   description: string;
   departament_id: number;
   process_id?: number;

   at: number;
   ac: number;
   children_recursive: [];
   total?: number;
   active?: boolean;
}
