import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageUsers from "./table/table.pageusers";
import FormPageUsers from "./form/form.pageusers";
import { useValidators } from "../../validations/validators";
import getEmployed from "../../../utils/employes";
import useUsersData from "../../hooks/useUsersData";
import usePermissionsData from "../../hooks/usePermissionsData";
import CustomModal from "../../components/modal/modal";
import FormImagePageUsers from "./form/form.image.pageusers";
import { FaUserTie } from "react-icons/fa6";

const PageUsersPanel = () => {
   const users = useUsersData();
   const permissions = usePermissionsData();
   const { usersValidator } = useValidators();
   const totalUsers = users?.['users']?.length || 0;

   return (
      <>
         {users.changepassword}

         {/* Banner de contexto */}
         <div className="flex items-center justify-between mb-4 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-3">
               <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
                  <FaUserTie className="text-emerald-600" size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-gray-800">Usuarios</h2>
                  <p className="text-xs text-gray-500">
                     {totalUsers} {totalUsers === 1 ? "usuario registrado" : "usuarios registrados"}
                  </p>
               </div>
            </div>
         </div>

         <CompositePage
            formDirection="modal"
            onClose={users.setOpen}
            isOpen={users.open}
            modalTitle="Gestionar Usuario"
            form={() => (
               <FormPageUsers
                  getEmployed={getEmployed}
                  validationSchema={usersValidator}
               />
            )}
            table={() => <TablePageUsers />}
         />
         <CustomModal title="📷 Subir Firma Digital" isOpen={permissions.open} onClose={permissions.setOpen}>
            <FormImagePageUsers />
         </CustomModal>
      </>
   );
};
export default PageUsersPanel;
