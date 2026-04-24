import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageUsers from "./table/table.pageusers";
import FormPageUsers from "./form/form.pageusers";
import { useValidators } from "../../validations/validators";
import getEmployed from "../../../utils/employes";
import useUsersData from "../../hooks/useUsersData";
import usePermissionsData from "../../hooks/usePermissionsData";
import CustomModal from "../../components/modal/modal";
import FormImagePageUsers from "./form/form.image.pageusers";

const PageUsersPanel = () => {
   const users = useUsersData();
   
   const permissions = usePermissionsData();
   const { usersValidator } = useValidators();
   // console.log(users.pe);
   return (
      <>
         {users.changepassword}
       
         <CompositePage
            formDirection="modal"
            onClose={users.setOpen}
            isOpen={users.open}
            modalTitle="Usuarios"
            form={() => (
               <FormPageUsers
                  // departamentsData={departaments}
                  // permissionsData={permissions}
                  // usersData={users}
                  getEmployed={getEmployed}
                  validationSchema={usersValidator}
               />
            )}
            table={() => <TablePageUsers />}

            // solo se usa permisos para abrir y cerrar firmas para reducir codigo
         />
         <CustomModal title="subir firma" isOpen={permissions.open} onClose={permissions.setOpen}>
            <FormImagePageUsers />
         </CustomModal>
      </>
   );
};
export default PageUsersPanel;
