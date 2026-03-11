import { useMemo } from "react";
import { useGenericData } from "../../hooks/usegenericdata";
import { Users } from "../../domain/models/users/users.domain";

const useUsersData = () => {
   const initialState = useMemo<Users>(
      () => ({
         id: 0,
         role: "",
         firstName: "",
         paternalSurname: "",
         maternalSurname: "",
         fullName: "",
         password: "",
         dependence_id: 0,
         active: false,
         payroll: 0,
         permissions: []
      }),
      []
   );

   return useGenericData<Users>({
      initialState,
      prefix: "users",
      autoFetch: true
   });
};

export default useUsersData;