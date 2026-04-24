import { useMemo } from "react";
import { Users } from "../../domain/models/users/users.domain";
import { GenericDataReturn, useGenericData } from "../../hooks/usegenericdata";

// ─── Estado persistente ──────────────────────────────────────────────────
export interface UsersPersistState {
   lastActivatedUserId: number | null;
   favoriteUserIds: number[];
   filterText: string;
}

// ─── Estado extra (no persistente) ───────────────────────────────────────
export interface UsersExtraState {
   changepassword: string;
   user_id: number;
}

// ─── Extensión con métodos ───────────────────────────────────────────────
export interface UsersMethods {
firmedForzed:(id:number,value:number)=>void
}

export type UsersDataReturn = GenericDataReturn<Users, UsersMethods, UsersPersistState, UsersExtraState>;

const useUsersData = (): UsersDataReturn => {
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
         permissions: [],
         signature: null
      }),
      []
   );

   return useGenericData<Users, UsersMethods, UsersPersistState, UsersExtraState>({
      initialState,
      prefix: "users",
      autoFetch: true,
      persistKey: "users-persist",
      extraState: { changepassword: null, user_id: null }, 
      extension:(set,get,persist)=>({
         firmedForzed(id, value) {
               get().request({
                  method: "POST",
                  url: `users/signature_position`,
                  data: {
                     id,
                     signature_position:value,
                  },
                  getData: true
               });
         },
      }),
      hooks: {
       
         onError: (msg) => console.error("[Users]", msg)
      }
   });
};

export default useUsersData;
