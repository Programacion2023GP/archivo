import CustomButton from "../../../components/button/custombuttom";
import { FaEdit, FaEye } from "react-icons/fa";
import Tooltip from "../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../App";
import { VscDiffAdded } from "react-icons/vsc";
import CustomTable from "../../../components/table/customtable";
import { DateFormat, formatDatetime } from "../../../../utils/formats";
import { IoIosWarning, IoMdCheckmark } from "react-icons/io";
import CustomBadge from "../../../components/badge/custombadge";
import { AutorizationChain } from "../../../../domain/models/procedurecreatedat/procedure_created_at";
import CustomModal from "../../../components/modal/modal";
import { LuRefreshCcw } from "react-icons/lu";
import { RiFileExcel2Fill } from "react-icons/ri";
import { accessCreateProcedure } from "../utils/utils.pageprocedure";
import CustomTreeView from "../../../components/treeview/treeview";
import useProcedureCreatedAtData from "../../../hooks/useProcedureCreatedAt";
import useProccessData from "../../../hooks/useProccessData";
import useListAutorized from "../../../hooks/useListAutorized";
import { ListAutorized } from "../../../../domain/models/listautorized/listautorized";
import TablePageProcedureDetails from "./details/details.table.pageprocedure";
import useProcedureData from "../../../hooks/useProcedureData";

const TablePageProceudre = () => {
   const procedureCreatedAt = useProcedureCreatedAtData();
   const procedureData = useProcedureData();
   const proccess = useProccessData();

   const listAutorized = useListAutorized();
   const findAsignatureUser = (authorization_chain: AutorizationChain[]): number | null => {
      const item = authorization_chain.find((it) => it.user_id && !it.signedBy);
      const authId = localStorage.getItem("auth_id");

      if (!item) {
         procedureCreatedAt.setExtra("userSignature", false);

         return 0;
      }
        if (item.user_id == Number(authId)) {
         console.log("saludos cordiales");
           procedureCreatedAt.setExtra("userSignature", true);
        }
        else{
           procedureCreatedAt.setExtra("userSignature", false);

        }
      
      return item.user_id;
   };
   return (
      <>
         <CustomModal
            isOpen={procedureCreatedAt.deptoDetails.open}
            onClose={() => {
               procedureCreatedAt.setExtra("deptoDetails", {
                  ...procedureCreatedAt.deptoDetails,
                  open: !procedureCreatedAt.deptoDetails.open
               });
            }}
            title={procedureCreatedAt.deptoDetails.name}
         >
            <TablePageProcedureDetails />
         </CustomModal>
         <CustomTable
            headerActions={() => (
               <>
                  <PermissionRoute requiredPermission={"tramite_crear"}>
                     {accessCreateProcedure(procedureCreatedAt.items) && (
                        <Tooltip content="Agregar Tramite">
                           <CustomButton
                              size="lg"
                              variant="solid"
                              onClick={() => {
                                 procedureCreatedAt.setExtra("editableRows", []);
                                 procedureCreatedAt.setExtra("modeTable", "create");

                                 proccess.setOpen();
                                 procedureData.handleChangeItem({
                                    id: 0,
                                    boxes: 0,
                                    description: "",
                                    endDate: "",
                                    observation: "",
                                    startDate: "",
                                    totalPages: 0,
                                    fisic: false,
                                    electronic: false,
                                    departament_id: 0,
                                    process_id: 0,
                                    user_id: 0,
                                    ac: 0,
                                    at: 0,
                                    name: "",
                                    accounting_fiscal_value: false
                                 });
                              }}
                           >
                              <VscDiffAdded />
                           </CustomButton>
                        </Tooltip>
                     )}
                  </PermissionRoute>
                  <PermissionRoute requiredPermission={"tramite_ver"}>
                     <Tooltip content="Refrescar ">
                        <CustomButton
                           size="lg"
                           color="purple"
                           onClick={() => {
                              procedureCreatedAt.fetchData();
                           }}
                        >
                           {" "}
                           <LuRefreshCcw />
                        </CustomButton>
                     </Tooltip>
                  </PermissionRoute>
               </>
            )}
            data={procedureCreatedAt.items}
            loading={procedureData.loading || procedureCreatedAt.loading}
            paginate={[10, 25, 50, 100]}
            columns={[
               {
                  field: "full_group",
                  headerName: "Agrupados por",
                  renderField: (v: any, row) => {
                     const date = String(v).split(".");
                     const groupName = date[0];
                     const groupDate = date[1];
                     const count = row.total_procedures || 1; // Asumiendo que la cantidad viene en la tercera posición

                     return (
                        <>
                           {groupName} - {formatDatetime(groupDate, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}
                           <span style={{ marginLeft: "8px", color: "#666", fontSize: "0.85em" }}>
                              ({count} {count === 1 ? "trámite" : "trámites"})
                           </span>
                        </>
                     );
                  },
                  getFilterValue: (value: any) => {
                     const date = String(value).split(".");
                     return `${date[0]} - ${formatDatetime(date[1], true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}`;
                  }
               },

               {
                  field: "authorization_chain",
                  headerName: "Progreso",
                  renderField: (v: any, row) => {
                     if (row.error) {
                        return (
                           <CustomBadge variant="solid" icon={<IoIosWarning />} color="warning" size="lg">
                              Requiere corrección
                           </CustomBadge>
                        );
                     } else {
                        return (
                           <CustomTreeView
                              data={v}
                              nameField="name"
                              groupField="group"
                              // levelField=""
                              directorField="director_name"
                              showGroup
                              // showLevel
                              showDirector
                              currentStatus={row.status} // ← el status global de la fila
                           />
                        );
                     }
                  }
               },
               { field: "department_name", headerName: "Departamento" },
               { field: "user_fullname", headerName: "Capturado por" }
            ]}
            actions={(row) => {
               const stored = localStorage.getItem("permisos");
               const parsed = stored ? JSON.parse(stored) : [];
               // if (parsed.includes("revisar")) {
               //    console.log("aqui")
               //    return;
               // }
               return (
                  <>
                     <PermissionRoute requiredPermission={"tramite_ver"}>
                        <Tooltip content="Ver detalles">
                           <CustomButton
                              size="sm"
                              variant="soft"
                              color="green"
                              onClick={() => {
                                 procedureData
                                 .request({
                                    method: "GET",
                                    url: `procedure/detailsprocedure/${row.order_date}/${row.departament_id}`
                                 })
                                 .finally(() => {
                                    proccess.setExtra("orderDate", row.order_date);
                                    proccess.setExtra("departament_id", row.departament_id);
                                    if (!["captura", "enviado"].includes(String(row.status).toLowerCase())) {
                                       proccess.setExtra("user_id", findAsignatureUser(row.authorization_chain));
                                    }

                                       if (row.status == "rechazado") {
                                          proccess.setExtra("status", "rechazado");
                                       }
                                       const date = String(row.full_group).split(".");
                                       procedureCreatedAt.setExtra("deptoDetails", {
                                          name: `${date[0]} - ${formatDatetime(date[1], true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}`,
                                          open: true
                                       });
                                    });
                              }}
                           >
                              <FaEye />
                           </CustomButton>
                        </Tooltip>
                     </PermissionRoute>

                     <PermissionRoute requiredPermission={"tramite_ver"}>
                        <Tooltip content="Excel">
                           <CustomButton
                              size="sm"
                              variant="soft"
                              color="green"
                              onClick={() => {
                                 procedureData
                                    .request({
                                       method: "GET",
                                       url: `procedure/detailsprocedure/${row.order_date}/${row.departament_id}`
                                    })
                                    .finally(() => {
                                       console.log("table");
                                       const items = listAutorized
                                          .request({
                                             method: "POST",
                                             url: "signature/listautorized",
                                             data: {
                                                procedure_id: row.id
                                             },
                                             getData: false
                                          })
                                          .then((it) => {
                                             console.log("aqui es",it)
                                             listAutorized.setItems(it as ListAutorized[]);
                                             procedureCreatedAt.setExtra("openExcel", true);
                                          });
                                       console.log("data", items);
                                    });
                              }}
                           >
                              <RiFileExcel2Fill />
                           </CustomButton>
                        </Tooltip>
                     </PermissionRoute>
                  </>
               );
            }}
         />
      </>
   );
};
export default TablePageProceudre;
