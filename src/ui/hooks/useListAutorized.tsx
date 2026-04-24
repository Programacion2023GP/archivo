import { useMemo } from "react";
import { GenericDataReturn, useGenericData } from "../../hooks/usegenericdata";
import { ListAutorized } from "../../domain/models/listautorized/listautorized";


// ─── Extensión con métodos ───────────────────────────────────────────────


export type ListAutorizedDataReturn = GenericDataReturn<ListAutorized, {}, {}, {}>;
const useListAutorized = (): ListAutorizedDataReturn => {
   const initialState = useMemo<ListAutorized>(
      () => ({
         id: 0,
         name: "",
         group: "",
         signedBy: false,
         user_id: 0,
         procedure_id: 0
      }),
      []
   );

   const result = useGenericData<ListAutorized, {}, {}, {}>({
      initialState,
      prefix: "signature",
      autoFetch: false
   });



   return result;
};

export default useListAutorized;
