import useDepartamentsData from "./useDepartamentsData";
import usePermissionsData from "./usePermissionsData";
import useProccessData from "./useProccessData";
import useUsersData from "./useUsersData";

export const useEntities = () => {
   const users = useUsersData();
   const permissions = usePermissionsData();
   const departaments = useDepartamentsData();
   const proccess = useProccessData();

   return { users, permissions, departaments,proccess };
};
