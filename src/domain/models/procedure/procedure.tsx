export type Procedure = {
   id: number;

   // tree
   name: string;
   description: string;
   departament_id: number;
   proccess_id?: number;
   status?: number | string;

   process?: string;
   at: number;
   ac: number;
   departament?: string;
   serie?: string;

   // children_recursive: any[];

   total?: number;
   active?: boolean;

   // 🆕 procedure fields
   boxes?: number;
   process_id?: number;
   user_id?: number;
   user_created?: string;

   startDate?: string | Date;
   endDate?: string | Date;

   electronic?: boolean;
   fisic?: boolean;

   totalPages?: number;
   archiveCode?: string;
   fileNumber?: string;
   observation?: string;
   reviewed_user?:string,
   administrative_value?: boolean;
   accounting_fiscal_value?: boolean;
   legal_value?: boolean;

   retention_period_current?: boolean;
   retention_period_archive?: boolean;

   location_building?: boolean;
   location_furniture?: boolean;
   location_position?: boolean;

   errorFieldsKey?: string;
   errorDescriptionField?: string;
};
