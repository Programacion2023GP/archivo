export interface ProceduresCreatedAt {
   id?: number;
   departament_id?: number;
   status?: string;
   authorization_chain?: Array<AutorizationChain>;
   grouped_date?: string; // DD/MM/YYYY
   full_group?: string; // Department name - DD/MM/YYYY
   user_id: number;
   department_name?: string;
   user_name?: string;
   user_lastname?: string;
   user_fullname?: string;
   order_date?: string; // YYYY-MM-DD
   weekday?: string; // Monday, Tuesday, etc.
   total_procedures: number;
}


export interface AutorizationChain {
   level:number,
   group:string,
   name:string
}