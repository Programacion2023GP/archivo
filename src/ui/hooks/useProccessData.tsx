import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Proccess } from "../../domain/models/proccess/proccess.domain";


const useProccessData = () => {
   const initialState = useMemo<Proccess>(
      () => ({
       id:0,
       classification_code:"",
       description:"",
       name:"",
       active:true,
       departament_id:null,
       ac:null,
       at:null,
       children_recursive:[]

      }),
      []
   );

   return useGenericData<Proccess>({
      initialState,
      prefix: "proccess",
      autoFetch: false
   });
};

export default useProccessData;
