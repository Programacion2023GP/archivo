import { useMemo } from "react";
import { GenericDataReturn, useGenericData } from "../../hooks/usegenericdata";
import { ProceduresCreatedAt } from "../../domain/models/procedurecreatedat/procedure_created_at";
import { Procedure } from "../../domain/models/procedure/procedure";

export interface ExtensionProcedureCreatedAt{
   signatureByUser :(name:string)=>void,
}
export interface ProcedureCreatedAtExtraState {
   modeTable: "create" | "edit" | "view" | "delete" | "editdelete" | "fixerrors";
   editableRows: Procedure[];
   openExcel: boolean;
   signature: string;
   userSignature:boolean,
   showModal: boolean;
   deptoDetails: {
      open: boolean;
      name: string;
   };
}

export type UsersDataReturn = GenericDataReturn<ProceduresCreatedAt, ExtensionProcedureCreatedAt, {}, ProcedureCreatedAtExtraState>;
const useProcedureCreatedAtData = () : UsersDataReturn => {
   const initialState = useMemo<ProceduresCreatedAt>(
      () => ({
        id:0,
         total_procedures: 0,
         user_id: 0,
         department_name: "",
         full_group: "",
         grouped_date: "",
         order_date: "",
         user_fullname: "",
         user_lastname: "",
         user_name: "",
         weekday: ""
      }),
      []
   );

   return useGenericData<ProceduresCreatedAt, ExtensionProcedureCreatedAt, {}, ProcedureCreatedAtExtraState>({
      initialState,
      prefix: "procedure",
      autoFetch: true,
      debug: true,
      extraState: {
         userSignature:null,
         modeTable: "create",
         editableRows: [],
         openExcel: false,
         signature: null,
         showModal: false,
         deptoDetails: {
            open: false,
            name: null
         }
      },
      extension: (set, get, prefix) => ({
         signatureByUser:(name) =>{
            set({ signature :name,showModal:true});
         },
      })
   });
};

export default useProcedureCreatedAtData;
