import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageUsers from "./table/table.pageusers";
import FormPageUsers from "./form/form.pageusers";
import { useEntities } from "../../hooks/useEntities";
import { useValidators } from "../../validations/validators";
import getEmployed from "../../../utils/employes";
import useUsersData from "../../hooks/useUsersData";
import usePermissionsData from "../../hooks/usePermissionsData";
import useDepartamentsData from "../../hooks/useDepartamentsData";
import CustomModal from "../../components/modal/modal";
import FormImagePageUsers from "./form/form.image.pageusers";

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
            table={() => <TablePageUsers usersData={users} permissionsData={permissions} />}
            // solo se usa permisos para abrir y cerrar firmas para reducir codigo
         />
         <CustomModal title="subir firma" isOpen={permissions.open} onClose={permissions.setOpen}>
            <FormImagePageUsers usersData={users} permissionsData={permissions} />
         </CustomModal>
      </>
   );
};
export default PageUsersPanel;
