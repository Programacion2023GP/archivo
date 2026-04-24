import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Procedure } from "../../domain/models/procedure/procedure";

const useProcedureData = () => {
   const initialState = useMemo<Procedure>(
      () => ({
         id: 0,
         boxes: 0,
         description: "",
         endDate: "",
         observation: "",
         startDate: "",
         totalPages: 0,
         digital: false,
         electronic: false,
         departament_id: 0,
         process_id: 0,
         user_id: 0,
         year:0,
         ac:0,
         at:0,
         name:"",
         accounting_fiscal_value:false,
errorDescriptionField:"",
errorFieldsKey:"",

      }),
      []
   );

   return useGenericData<Procedure>({
      initialState,
   
      prefix: "procedure",
      autoFetch: false
   });
};

export default useProcedureData;
