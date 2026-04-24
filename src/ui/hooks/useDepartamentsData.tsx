import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Departament } from "../../domain/models/departament/departament";
import { INRESPONSIVE, RESPONSIVE } from "../../utils/compressfiles";
export interface DepartamentsExtraState {
   responsive: INRESPONSIVE;
   openProcedure:boolean
}
interface Methods {
   setProcedureOpen :()=>void,
}
const useDepartamentsData = () => {
   const initialState = useMemo<Departament>(
      () => ({
         id: 0,
         active: true,
         children_recursive: [],
         name: "",
         abbreviation:"",
         departament_id: null,
         classification_code:""
      }),
      []
   );

   return useGenericData<Departament, Methods, {}, DepartamentsExtraState>({
      initialState,
      extraState: {
         responsive: RESPONSIVE,
         openProcedure: false
      },
      debug:true,
      extension: (set, get, persist) => ({
         setProcedureOpen() {
            set({openProcedure:!get().openProcedure})
         },
      }),
      prefix: "departaments",
      autoFetch: true
   });
};

export default useDepartamentsData;
