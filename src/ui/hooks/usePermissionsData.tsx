import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Permissions } from "../../domain/models/users/users.domain";

const usePermissionsData = () => {
   const initialState = useMemo<Permissions>(
      () => ({
         id: 0,
         name: "",
         active: false
      }),
      []
   );

   return useGenericData<Permissions>({
      initialState,
      prefix: "permissions",
      autoFetch: true
   });
};

export default usePermissionsData;
