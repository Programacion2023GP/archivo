import { AiOutlinePlusSquare } from "react-icons/ai";
import CustomButton from "../../../../components/button/custombuttom";
import { showConfirmationAlert, showToast } from "../../../../../sweetalert/Sweetalert";
import { Departament } from "../../../../../domain/models/departament/departament";
import { TfiTrash } from "react-icons/tfi";
import CustomTable from "../../../../components/table/customtable";
import { VscDiffAdded } from "react-icons/vsc";
import { IoReload } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import { GenericDataReturn } from "../../../../../hooks/usegenericdata";
import Tooltip from "../../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../../App";
import { IoIosDocument } from "react-icons/io";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Dispatch, SetStateAction } from "react";
import { CiEdit } from "react-icons/ci";

type TablePageUsersProps = {
   departaments: GenericDataReturn<Departament>;
   setOpen: Dispatch<SetStateAction<void>>;
};
const TablePageDepartaments = ({ departaments,setOpen }: TablePageUsersProps) => {
  
   return (
      <CustomTable
         headerActions={() => (
            <>
               <PermissionRoute requiredPermission={"catalogo_departamentos_crear"}>
                  <Tooltip content="Agregar Dirrecion">
                     <CustomButton
                        size="lg"
                        variant="solid"
                        onClick={() => {
                           departaments.handleChangeItem({
                              classification_code:"",
                              departament_id: null,
                              id: 0,
                              active: true,
                              children_recursive: [],
                              name: "",
                              abbreviation: ""
                           });
                           departaments.setOpen();
                        }}
                     >
                        {" "}
                        <VscDiffAdded />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
               <PermissionRoute requiredPermission={"catalogo_departamentos_ver"}>
                  <Tooltip content="Recargar">
                     <CustomButton
                        size="lg"
                        variant="solid"
                        color="green"
                        onClick={() => {
                           departaments.fetchData();
                        }}
                     >
                        {" "}
                        <IoReload />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
            </>
         )}
         loading={departaments.loading}
         data={departaments.items}
         columns={[
            { field: "classification_code", headerName: "Codigo" },

            { field: "name", headerName: "Nombre" },
            { field: "abbreviation", headerName: "Abreviatura" },

            { field: "responsible", headerName: "Director" },
            {
               field: "authorized",
               headerName: "Autoriza",
               filterType: "select", // 👈 as const
               filterOptions: [
                  // Necesitas agregar esta propiedad
                  { value: 1, label: "Si" },
                  { value: 0, label: "No" }
               ],
               renderField: (v) => {
                  const isAuthorized = Boolean(v as boolean);
                  return (
                     <div className="flex justify-center">
                        <span
                           className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
            ${isAuthorized ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
          `}
                        >
                           {isAuthorized ? (
                              <>
                                 <FaCheck className="text-green-600" size={12} />
                                 Sí
                              </>
                           ) : (
                              <>
                                 <HiX className="text-red-600" size={14} />
                                 No
                              </>
                           )}
                        </span>
                     </div>
                  );
               }
            }
         ]}
         conditionExcel={"catalogo_departamentos_exportar"}
         childrenField="children_recursive"
         rowIdField="id"
         paginate={[10, 20, 30]}
         actions={(row) => (
            <>
               <Tooltip content={`Tramites de ${row.name}`}>
                  <CustomButton
                     onClick={() => {
                        
                        departaments.handleChangeItem({
                           ...row
                        });
                        
                        setOpen();
                     }}
                     color="purple"
                     variant="solid"
                     icon={<IoIosDocument />}
                  />
               </Tooltip>

               <PermissionRoute requiredPermission={"catalogo_departamentos_crear"}>
                  <Tooltip content={`Agregar subdirección a ${row.name}`}>
                     <CustomButton
                        onClick={() => {
                           departaments.setOpen();
                           const code =(level:number)=>{
                              let text = ''
                              if (level==0) {
                                 text =`SE`
                              }
                              if (level==1) {
                                 text = `SS`;
                                 
                              }
                              return text
                           }
                           departaments.handleChangeItem({
                              classification_code: `${code(row.level)}${row.children_recursive.length + 1}`,
                              departament_id: row.id,
                              id: 0,
                              active: true,
                              children_recursive: [],
                              name: "",
                              abbreviation: ""
                           });
                        }}
                        color="cyan"
                        variant="solid"
                        icon={<AiOutlinePlusSquare />}
                     />
                  </Tooltip>
               </PermissionRoute>
               {row.responsible && (
                  <PermissionRoute requiredPermission={"catalogo_departamentos_actualizar"}>
                     <Tooltip content={`${!row.authorized ? "Conceder Autorización a " : "Quitar Autorización a "} ${row.responsible}`}>
                        <CustomButton
                           onClick={() => {
                              departaments.request({
                                 method: "POST",
                                 url: "departaments/authorized",
                                 getData:true,
                                 data: {
                                    ...row,
                                    authorized: !row.authorized
                                 }
                              });
                           }}
                           color={row.authorized ? "ruby" : "green"}
                           variant="solid"
                           icon={row.authorized ? <HiX className="text-red-600" size={14} /> : <FaCheck className="text-white" size={12} />}
                        />
                     </Tooltip>
                  </PermissionRoute>
               )}
               <PermissionRoute requiredPermission={"catalogo_departamentos_actualizar"}>
                  <Tooltip content={`Editar a ${row.name}`}>
                     <CustomButton onClick={() => {
                          departaments.setOpen();
                          departaments.handleChangeItem(row);
                     }} color={"yellow"} variant="solid" icon={<CiEdit />} />
                  </Tooltip>
               </PermissionRoute>
               <PermissionRoute requiredPermission={"catalogo_departamentos_eliminar"}>
                  <Tooltip content={`Dar de baja ${row.name}`}>
                     <CustomButton
                        onClick={() => {
                           showConfirmationAlert(`Eliminar`, { text: ` Se eliminará la direccion con sus subdirecciones ${row.name} ` }).then((isConfirmed) => {
                              if (isConfirmed) {
                                 departaments.removeItemData(row as Departament);
                              } else {
                                 showToast("La acción fue cancelada.", "error");
                              }
                           });
                        }}
                        color="red"
                        variant="solid"
                        icon={<TfiTrash />}
                     />
                  </Tooltip>
               </PermissionRoute>
               {/* <PermissionRoute requiredPermission={"catalogo_departamentos_eliminar"}> */}

               {/* </PermissionRoute> */}
            </>
         )}
      />
   );
};

export default TablePageDepartaments;
