import { useMemo } from "react";
import { GenericDataReturn, useGenericData } from "../../hooks/usegenericdata";
import { Proccess } from "../../domain/models/proccess/proccess.domain";
import { showConfirmationAlert, showToast } from "../../sweetalert/Sweetalert";
import { AutorizationChain } from "../../domain/models/procedurecreatedat/procedure_created_at";


export interface ProccessExtension {
   extractNumbers: (classification_code: string) => string;
   fetchById:(id?:number)=>void,
   deleteProcess:(process:Proccess)=>void
}
interface ExtraState {
   selectDepartament: number;
   orderDate: string;
   departament_id: number;
   authorizationChain: Array<AutorizationChain>;
   status: string;
   user_id:number,
   spinner:boolean,
}

export type UsersDataReturn = GenericDataReturn<Proccess, ProccessExtension,{},ExtraState>;

const useProccessData = ():UsersDataReturn => {
   const initialState = useMemo<Proccess>(
      () => ({
         id: 0,
         classification_code: "",
         description: "",
         name: "",
         active: true,
         departament_id: null,
         ac: null,
         at: null,
         children_recursive: [],
         boxes: 0,
         observation: null,
         endDate: "",
         startDate:"",
         accounting_fiscal_value:false,
         electronic:false,
         fisic:false,
         process_id:null,
         proccess_id:null,
         total:null,
         totalPages:null,
         user_id:null,
      }),
      []
   );

   return useGenericData<Proccess, ProccessExtension, {}, ExtraState>({
      initialState,
      prefix: "proccess",
      autoFetch: false,
      extraState: {
         spinner:null,
         user_id:null,
         selectDepartament: null,
         authorizationChain:[],
         departament_id:null,
         orderDate:null,
         status:null,
      },
      debug: true,
      extension: (set, get, persist) => ({
         extractNumbers: (classification_code: string) => {
            return classification_code.replace(/\D/g, "");
         },
         fetchById: async (id?: number) => {
            if (id) {
               set({ selectDepartament: id });
            }
            await get().request({
               method: "GET",
               url: `${get().prefix}/index/${get().selectDepartament}`,
               getData: true
            });
         },
         deleteProcess: (process: Proccess) => {
            showConfirmationAlert(`${process.active ? "Eliminar" : "Activar"}`, {
               text: `Se ${process.active ? "desactivara" : "activara"} el tramite con sus subtramites ${process.name} `
            }).then((isConfirmed) => {
               if (isConfirmed) {
                  get()
                     .request({
                        method: "DELETE",
                        url: `${get().prefix}/delete`,
                        data: process,
                        getData: false
                     })
                     .then(() => {
                        get().request({
                           method: "GET",
                           url: `${get().prefix}/index/${get().selectDepartament}`,
                           //   data: { process },
                           getData: true
                        });
                     });
                  //  proccess.removeItemData(process as Proccess);
               } else {
                  showToast("La acción fue cancelada.", "error");
               }
            });
         }
      })
   });
};

export default useProccessData;
