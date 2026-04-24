import { AiOutlinePlusSquare } from "react-icons/ai";
import CustomButton from "../../../../components/button/custombuttom";
import { Departament } from "../../../../../domain/models/departament/departament";
import CustomTable from "../../../../components/table/customtable";
import { VscDiffAdded } from "react-icons/vsc";
import { IoReload } from "react-icons/io5";
import { FaCheck, FaToggleOff, FaToggleOn } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import Tooltip from "../../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../../App";
import { Proccess } from "../../../../../domain/models/proccess/proccess.domain";
import useProccessData from "../../../../hooks/useProccessData";

type TablePageProccessProps = {
   id: Departament["classification_code"];
};
const TablePageProccess = ({ id }: TablePageProccessProps) => {
      const proccess = useProccessData();

   function getNextTreeCode(parentNode?: Proccess | null) {
      // Si no hay padre (nodo raíz)
if (!parentNode) {
   const numbers = proccess.items
      .map((item) => {
         const code = item.classification_code;
         if (!code) return 0;

         const last = code.split(".").pop(); // toma el último número
         return parseInt(last || "0", 10);
      })
      .filter((n) => !isNaN(n));

   const max = numbers.length ? Math.max(...numbers) : 0;

   return `${id}.${max + 1}`;
}

      // Si hay padre, generar código hijo
      if (parentNode.classification_code) {
         const children = (parentNode.children_recursive || []) as Proccess[];

         if (!children.length) {
            return `${parentNode.classification_code}.1`;
         }

         const numbers = children
            .map((child: Proccess) => {
               if (!child.classification_code) return null;
               const parts = child.classification_code.split(".");
               return parseInt(parts[parts.length - 1], 10);
            })
            .filter((n): n is number => !isNaN(n as number));

         const max = numbers.length ? Math.max(...numbers) : 0;
         return `${parentNode.classification_code}.${max + 1}`;
      }

      return "1";
   }

   return (
      <CustomTable
         childrenField="children_recursive"
         rowIdField="id"
         headerActions={() => (
            <>
               <PermissionRoute requiredPermission={"catalogo_tramite_crear"}>
                  <Tooltip content="Agregar Tramite">
                     <CustomButton
                        size="lg"
                        variant="solid"
                        onClick={() => {
                           proccess.setOpen();
                           proccess.handleChangeItem({
                              id: 0,
                              classification_code: getNextTreeCode(null), // null para nuevo trámite raíz
                              name: "",
                              description: "",

                              departament_id: null,
                              ac: null,
                              at: null,
                              children_recursive: [],
                              boxes: 0,
                              endDate: "",
                              observation: "",
                              startDate: "",
                              fisic: false,
                              electronic: false,
                              process_id: 0,
                              user_id: 0,
                              accounting_fiscal_value: false
                           });
                        }}
                     >
                        <VscDiffAdded />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
               <PermissionRoute requiredPermission={"catalogo_tramite_ver"}>
                  <Tooltip content="Recargar">
                     <CustomButton
                        size="lg"
                        variant="solid"
                        color="green"
                        onClick={() => {
                           proccess.fetchById();
                        }}
                     >
                        {" "}
                        <IoReload />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
            </>
         )}
         loading={proccess.loading}
         data={proccess.items}
         columns={[
            { field: "classification_code", headerName: "Codigo de clasificación" },
            { field: "name", headerName: "Nombre" },
            { field: "at", headerName: "at" },
            { field: "ac", headerName: "ac" },
            { field: "total", headerName: "años" },

            { field: "description", headerName: "Descripción" },
            {
               field: "active",
               headerName: "Activo",
               filterType: "select", // 👈 as const
               filterOptions: [
                  // Necesitas agregar esta propiedad
                  { value: 1, label: "Si" },
                  { value: 0, label: "No" }
               ],
               renderField: (v) => {
                  return (
                     <div className="flex justify-center">
                        <span
                           className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
            ${v ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
          `}
                        >
                           {v ? (
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
         conditionExcel={"catalogo_tramite_exportar"}
         paginate={[10, 20, 30]}
         actions={(row) => (
            <>
               <PermissionRoute requiredPermission={"catalogo_tramite_crear"}>
                  <Tooltip content={`Agregar subtramite a ${row.name}`}>
                     <CustomButton
                        onClick={() => {
                           proccess.setOpen();
                           proccess.handleChangeItem({
                              id: 0,
                              proccess_id: row.id,
                              classification_code: getNextTreeCode(row), // Aquí pasamos el row como padre
                              name: "",
                              description: "",
                              departament_id: row.departament_id,
                              ac: null,
                              at: null,
                              children_recursive: [],
                              boxes: 0,
                              endDate: "",
                              observation: "",
                              startDate: "",
                              fisic: false,
                              electronic: false,
                              process_id: 0,
                              user_id: 0,
                              accounting_fiscal_value: false
                           });
                        }}
                        color="cyan"
                        variant="solid"
                        icon={<AiOutlinePlusSquare />}
                     />
                  </Tooltip>
               </PermissionRoute>
               <PermissionRoute requiredPermission={"catalogo_tramite_eliminar"}>
                  <Tooltip content={`${row.active?'Desactivar':'Activar'} a ${row.name}`}>
                     <CustomButton
                        onClick={() => {
                          proccess.deleteProcess(row)
                        }}
                        color={row.active ? "green" : "slate"}
                        variant="solid"
                        icon={row.active ? <FaToggleOn /> : <FaToggleOff />}
                     />
                  </Tooltip>
               </PermissionRoute>
               {/* <PermissionRoute requiredPermission={"catalogo_tramite_eliminar"}> */}

               {/* </PermissionRoute> */}
            </>
         )}
      />
   );
};

export default TablePageProccess;
