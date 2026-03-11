export type Procedure = {
   id: number;
   boxes: number; // stock (cajas)
   fileNumber: string; // expediente
   archiveCode: string; // cod_arch
   process_id: number; // proccess_id titulo del tramite
   departament_id: number;
   user_id: number;
   description: string;
   digital: boolean;
   electronic: boolean;
   level: boolean;
   batery: boolean;
   shelf: boolean;
   active?: boolean;

   startDate: string | Date;
   endDate: string | Date;
   totalPages: number; // hojas / fojas
   observation: string; // observation
};
