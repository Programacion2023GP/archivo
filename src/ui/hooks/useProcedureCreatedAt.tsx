import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { ProceduresCreatedAt } from "../../domain/models/procedurecreatedat/procedure_created_at";

const useProcedureCreatedAtData = () => {
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

   return useGenericData<ProceduresCreatedAt>({
      initialState,
      prefix: "procedure",
      autoFetch: true
   });
};

export default useProcedureCreatedAtData;
