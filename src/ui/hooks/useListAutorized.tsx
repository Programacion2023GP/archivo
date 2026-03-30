import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Departament } from "../../domain/models/departament/departament";
import { ListAutorized } from "../../domain/models/listautorized/listautorized";

const useListAutorized = () => {
   const initialState = useMemo<ListAutorized>(
      () => ({
         id: 0,
         name: "",
         group: "",
         signedBy: false,
         user_id: 0,
         procedure_id:0
      }),
      []
   );

   return useGenericData<ListAutorized>({
      initialState,
      prefix: "departaments",
      autoFetch: true
   });
};

export default useListAutorized;
