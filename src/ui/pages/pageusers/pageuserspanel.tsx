import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageUsers from "./table/table.pageusers";
import FormPageUsers from "./form/form.pageusers";
import { useEntities } from "../../hooks/useEntities";
import { useValidators } from "../../validations/validators";
import getEmployed from "../../../utils/employes";
import useUsersData from "../../hooks/useUsersData";
import usePermissionsData from "../../hooks/usePermissionsData";
import useDepartamentsData from "../../hooks/useDepartamentsData";

const PageUsersPanel = () => {
   const users = useUsersData();
   const permissions = usePermissionsData();
   const departaments = useDepartamentsData();

   const { usersValidator } = useValidators();
   return (
      <>
         <CompositePage
            formDirection="modal"
            onClose={users.setOpen}
            isOpen={users.open}
            modalTitle="Usuarios"
            form={() => (
               <FormPageUsers
                  departamentsData={departaments}
                  getEmployed={getEmployed}
                  permissionsData={permissions}
                  usersData={users}
                  validationSchema={usersValidator}
               />
            )}
            table={() => <TablePageUsers usersData={users} />}
         />
      </>
   );
};
export default PageUsersPanel;
