export interface Proccess {
   id: number;
   classification_code: string;
   name: string;
   description: string;
   departament_id: number;
   proccess_id?: number;
   boxes: number;
   endDate: string;
   observation: string;
   startDate: string;
   at: number;
   status?:string,
   ac: number;
   children_recursive: [];
   total?: number;
   totalPages?: number;
   fisic: boolean;
   electronic: boolean;
   process_id: number;
   user_id: number;
   active?: boolean;
   accounting_fiscal_value:boolean,
}
