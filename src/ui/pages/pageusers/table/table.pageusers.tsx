import { VscDiffAdded } from "react-icons/vsc";
import CustomButton from "../../../components/button/custombuttom";
import CustomTable from "../../../components/table/customtable";
import Tooltip from "../../../components/toltip/Toltip";
import { LuImagePlus, LuRefreshCcw } from "react-icons/lu";
import { showConfirmationAlert, showToast } from "../../../../sweetalert/Sweetalert";
import { FaSync, FaTrash } from "react-icons/fa";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { Permissions, Users } from "../../../../domain/models/users/users.domain";
import { CiEdit } from "react-icons/ci";
import { PermissionRoute } from "../../../../App";
import PhotoZoom from "../../../components/images/images";

type TablePageUsersProps = {
   usersData: GenericDataReturn<Users>;
   permissionsData: GenericDataReturn<Permissions>;
};

const TablePageUsers = ({ usersData,permissionsData }: TablePageUsersProps) => {
   console.log(usersData.items);
   return (
      <CustomTable
         headerActions={() => (
            <>
               <PermissionRoute requiredPermission={"usuarios_crear"}>
                  <Tooltip content="Agregar usuario">
                     <CustomButton
                        onClick={() => {
                           usersData.setOpen();
                        }}
                     >
                        <VscDiffAdded />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
               <PermissionRoute requiredPermission={"usuarios_ver"}>
                  <Tooltip content="Refrescar ">
                     <CustomButton
                        color="purple"
                        onClick={() => {
                           usersData.fetchData();
                        }}
                     >
                        {" "}
                        <LuRefreshCcw />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
            </>
         )}
         data={usersData.items}
         conditionExcel={"usuarios_ver"}
         paginate={[10, 25, 50]}
         loading={usersData.loading}
         columns={[
            {
               field: "payroll",
               headerName: "Nomina"
            },
            {
               field: "fullName",
               headerName: "Nombre Completo"
            },
            {
               field: "signature",
               headerName: "Firma",
               renderField: (v,row) => <PhotoZoom alt={row.fullName as string} src={v as string}/>
            },
            {
               field: "departament",
               headerName: "Departamento"
            },
            {
               field: "role",
               headerName: "Usuario"
            }
         ]}
         actions={(row) => (
            <>
               {row.active ? (
                  <>
                     <PermissionRoute requiredPermission={"usuarios_actualizar"}>
                        <Tooltip content="Editar usuario">
                           <CustomButton
                              size="sm"
                              color="yellow"
                              onClick={() => {
                                 usersData.setOpen();
                                 usersData.handleChangeItem(row);
                              }}
                           >
                              <CiEdit />
                           </CustomButton>
                        </Tooltip>
                     </PermissionRoute>
                     <>
                        <PermissionRoute requiredPermission={"usuarios_eliminar"}>
                           <Tooltip content="Dar de baja usuario">
                              <CustomButton
                                 size="sm"
                                 color="ruby"
                                 onClick={() => {
                                    showConfirmationAlert(`Eliminar`, {
                                       text: "Se desactiva el usuario"
                                    }).then((isConfirmed) => {
                                       if (isConfirmed) usersData.removeItemData(row);
                                       else showToast("La acción fue cancelada.", "error");
                                    });
                                 }}
                              >
                                 <FaTrash />
                              </CustomButton>
                           </Tooltip>
                        </PermissionRoute>
                        <PermissionRoute requiredPermission={"usuarios_subirfirmas"}>
                           <Tooltip content="subir firma">
                              <CustomButton
                                 size="sm"
                                 color="lime"
                                 onClick={() => {
                                    usersData.setConstant("id", row.id);
                                    permissionsData.setOpen();
                                 }}
                              >
                                 <LuImagePlus />
                              </CustomButton>
                           </Tooltip>
                        </PermissionRoute>
                     </>
                  </>
               ) : (
                  <Tooltip content="Reactivar usuario">
                     <CustomButton
                        size="sm"
                        color="green"
                        onClick={() => {
                           showConfirmationAlert(`Reactivar`, {
                              text: "Se reactivará el usuario"
                           }).then((isConfirmed) => {
                              if (isConfirmed) usersData.removeItemData(row);
                              else showToast("La acción fue cancelada.", "error");
                           });
                        }}
                     >
                        <FaSync />
                     </CustomButton>
                  </Tooltip>
               )}
            </>
         )}
      />
   );
};
export default TablePageUsers;
