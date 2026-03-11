import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Departament } from "../../domain/models/departament/departament";

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

   return useGenericData<Departament>({
      initialState,
      prefix: "departaments",
      autoFetch: true
   });
};

export default useDepartamentsData;
