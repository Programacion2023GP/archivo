import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Departament } from "../../domain/models/departament/departament";
import { Procedure } from "../../domain/models/procedure/procedure";

const useProcedureData = () => {
   const initialState = useMemo<Procedure>(
      () => ({
         id: 0,
         archiveCode: "",
         boxes: 0,
         description: "",
         endDate: "",
         fileNumber: "",
         observation: "",
         startDate: "",
         totalPages: 0,
         digital: false,
         electronic: false,
         departament_id: 0,
         process_id: 0,
         user_id: 0,
         batery: false,
         level: false,
         shelf: false
      }),
      []
   );

   return useGenericData<Procedure>({
      initialState,
      prefix: "procedure",
      autoFetch: true
   });
};

export default useProcedureData;
