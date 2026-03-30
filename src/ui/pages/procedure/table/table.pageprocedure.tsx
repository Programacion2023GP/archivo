import { GenericDataReturn } from "../../../../hooks/usegenericdata";

import { Procedure } from "../../../../domain/models/procedure/procedure";
import CustomButton from "../../../components/button/custombuttom";
import { showConfirmationAlert, showToast } from "../../../../sweetalert/Sweetalert";
import { FaBug, FaCheck, FaEdit, FaEye, FaToggleOff, FaToggleOn } from "react-icons/fa";
import Tooltip from "../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../App";
import { AiOutlinePlusSquare, AiOutlineWarning } from "react-icons/ai";
import { IoReload } from "react-icons/io5";
import { VscDiffAdded } from "react-icons/vsc";
import CustomTable, { Column, CustomTableHandle } from "../../../components/table/customtable";
import { HiX } from "react-icons/hi";
import { DateFormat, formatDatetime } from "../../../../utils/formats";
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from "react";
import { TbSelect } from "react-icons/tb";
import { FormTableHandle } from "../../../formik/FormikInputs/formiktable";
import { IoMdCheckmark } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import CustomBadge from "../../../components/badge/custombadge";
import { AutorizationChain, ProceduresCreatedAt } from "../../../../domain/models/procedurecreatedat/procedure_created_at";
import CustomModal from "../../../components/modal/modal";
import { LuRefreshCcw } from "react-icons/lu";
import { RiFileExcel2Fill } from "react-icons/ri";
import { accessCreateProcedure } from "../utils/utils.pageprocedure";
import { MdSend } from "react-icons/md";
import { BsCheck2Circle } from "react-icons/bs";
import CustomTreeView from "../../../components/treeview/treeview";
import { ListAutorized } from "../../../../domain/models/listautorized/listautorized";

type TablePageProceudreProps = {
   listAutorized: GenericDataReturn<ListAutorized>;
   procedureData: GenericDataReturn<Procedure>;
   procedureCreatedAt: GenericDataReturn<ProceduresCreatedAt>;
   setEditableRows: Dispatch<SetStateAction<Procedure[]>>;
   editableRows: Procedure[];
   setOpenExcel: Dispatch<SetStateAction<boolean>>;
   deptoDetails: { open: boolean; name: string };
   setDeptoDetails: Dispatch<SetStateAction<{ open: boolean; name: string }>>;
   tableRef: RefObject<CustomTableHandle<Procedure>>;
   setModeTable: Dispatch<SetStateAction<"create" | "edit" | "view" | "delete" | "editdelete">>;
};
const TablePageProcedureDetails = ({
   editableRows,
   procedureCreatedAt,
   procedureData,
   setEditableRows,
   setModeTable,
   tableRef
}: Omit<TablePageProceudreProps, "setOpenExcel" | "setDeptoDetails" | "listAutorized" | "deptoDetails">) => {
   const [openCheckbox, setOpenCheckbox] = useState<boolean>();
   const selectedItems = (newRows: Procedure[]) => {
      setEditableRows((prev) => {
         const prevRows = Array.isArray(prev) ? prev : [];
         const prevMap = new Map(prevRows.map((row) => [row.id, row]));
         const newMap = new Map(newRows.map((row) => [row.id, row]));

         // Combinar: los que están en newMap reemplazan, los que no están se eliminan
         const result = Array.from(newMap.values());

         // Si quieres mantener algunos previos que no están en newRows,
         // tendrías que definir una lógica diferente

         return result;
      });
   };
   const handleError = () => {
      if (editableRows.length === 0) {
         showToast("Selecciona almenos 1 registro para continuar", "info");
         return true; // hay error
      }
      return false; // todo bien
   };
   const handleEdit = () => {
      if (handleError()) return;
      if (procedureData.constants.status == "rechazado") {
         setModeTable("editdelete");
      } else {
         setModeTable("edit");
      }
      procedureData.setOpen();
   };

   const handleDelete = () => {
      if (handleError()) return;

      setModeTable("delete");
      procedureData.setOpen();
   };
   const isAdmin = localStorage.getItem("role")?.toUpperCase() === "ADMINISTRADOR";
   const currentStatus = procedureData?.items?.[0]?.status?.toString();
   const isValidStatus = !["enviado", "autorizado", "finalizado"].includes(currentStatus);
   const showButtons = isAdmin || isValidStatus;
   useEffect(() => {
      tableRef.current.selectAllRows();
   }, []);
   return (
      <>
         <CustomTable
            ref={tableRef}
            headerActions={() => (
               <>
                  {/* {!openCheckbox && (
                     <PermissionRoute requiredPermission={"tramite_crear"}>
                        <Tooltip content="Agregar Tramite">
                           <CustomButton
                              size="lg"
                              variant="solid"
                              onClick={() => {
                                 setEditableRows([]); // ← limpiar filas al crear nuevo
                                 setModeTable("create");
                                 procedureData.setOpen();
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
                     </PermissionRoute>
                  )} */}

                  <>
                     {(() => {
                        return (
                           showButtons && (
                              <>
                                 <PermissionRoute requiredPermission={"tramite_actualizar"}>
                                    <Tooltip content="Editar">
                                       <CustomButton
                                          size="lg"
                                          color="yellow"
                                          variant="solid"
                                          onClick={() => {
                                             procedureData.setConstant("status", "rechazado");

                                             handleEdit();
                                          }}
                                       >
                                          <FaEdit />
                                       </CustomButton>
                                    </Tooltip>
                                 </PermissionRoute>
                                 <PermissionRoute requiredPermission={"tramite_actualizar"}>
                                    {currentStatus == "captura" && (
                                       <Tooltip content="Enviar Todos">
                                          <CustomButton
                                             size="lg"
                                             color="green"
                                             variant="solid"
                                             onClick={() => {
                                                procedureData
                                                   .request({
                                                      method: "POST",
                                                      url: `procedure/changestatus`,
                                                      data: {
                                                         status: 2,
                                                         startDate: String(procedureData.constants.startDate),
                                                         departament_id: procedureData.constants.departament_id
                                                      },
                                                      getData: false
                                                   })
                                                   .finally(() => {
                                                      const today = new Date().toISOString().split("T")[0];
                                                      procedureData.request({
                                                         method: "GET",
                                                         url: `procedure/detailsprocedure/${procedureData.constants.startDate ?? today}/${procedureData.constants.departament_id}`
                                                      });
                                                   });
                                             }}
                                          >
                                             <MdSend />
                                          </CustomButton>
                                       </Tooltip>
                                    )}
                                 </PermissionRoute>
                                 <PermissionRoute requiredPermission={"tramite_eliminar"}>
                                    <Tooltip content="Revision">
                                       <CustomButton size="lg" color="pink" variant="solid" onClick={handleDelete}>
                                          <BsCheck2Circle />
                                       </CustomButton>
                                    </Tooltip>
                                 </PermissionRoute>
                              </>
                           )
                        );
                     })()}
                  </>
               </>
            )}
            loading={procedureData.loading}
            data={procedureData.items}
            onRowSelect={selectedItems}
            enableSavedFilters
            storageKey="procedure_table"
            columns={[
               { field: "boxes", headerName: "Cajas" },

               // { field: "departament_id", headerName: "Departamento" },
               // { field: "user_id", headerName: "Usuario" },
               { field: "retention_period_current", headerName: "At" },

               { field: "retention_period_archive", headerName: "Ac" },

               { field: "totalPages", headerName: "Fojas", visibility: "expanded" },

               {
                  field: "fisic",
                  headerName: "Fisico",
                  visibility: "expanded",
                  renderField: (v) => (
                     <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
                        {v ? <IoMdCheckmark /> : <IoMdClose />}
                     </CustomBadge>
                  )
               },
               {
                  field: "electronic",
                  headerName: "Electrónico",
                  visibility: "expanded",
                  renderField: (v) => (
                     <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
                        {v ? <IoMdCheckmark /> : <IoMdClose />}
                     </CustomBadge>
                  )
               },
               {
                  field: "administrative_value",
                  headerName: "Administrativo",
                  visibility: "expanded",
                  renderField: (v) => (
                     <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
                        {v ? <IoMdCheckmark /> : <IoMdClose />}
                     </CustomBadge>
                  )
               },
               {
                  field: "accounting_fiscal_value",
                  headerName: "Contable Fiscal",
                  visibility: "expanded",
                  renderField: (v) => (
                     <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
                        {v ? <IoMdCheckmark /> : <IoMdClose />}
                     </CustomBadge>
                  )
               },
               {
                  field: "legal_value",
                  headerName: "Juridico",
                  visibility: "expanded",
                  renderField: (v) => (
                     <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
                        {v ? <IoMdCheckmark /> : <IoMdClose />}
                     </CustomBadge>
                  )
               },

               {
                  filterType: "date",
                  field: "startDate",
                  headerName: "Fecha inicio",

                  renderField: (v) => <>{formatDatetime(` ${v}`, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}</>,
                  getFilterValue: (v) => formatDatetime(` ${v}`, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)
               },
               {
                  filterType: "date",

                  field: "endDate",
                  headerName: "Fecha fin",
                  renderField: (v) => <>{formatDatetime(` ${v}`, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}</>,
                  getFilterValue: (v) => formatDatetime(` ${v}`, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)
               },

               { field: "description", headerName: "Descripción" },
               { field: "observation", headerName: "Observación", visibility: "expanded" }
            ]}
            conditionExcel={"tramite_exportar"}
            paginate={[10, 20, 30]}
            actions={(row) => <></>}
         />
      </>
   );
};
const findAsignatureUser = (authorization_chain:AutorizationChain[]):number|null => {
   const item = authorization_chain.find((it) => it.user_id && !it.signedBy);
   return item.user_id
};
const TablePageProceudre = ({ procedureData,deptoDetails,setDeptoDetails, setEditableRows, editableRows, tableRef, setModeTable, procedureCreatedAt, setOpenExcel,listAutorized }: TablePageProceudreProps) => {
   return (
      <>
         <CustomModal
            isOpen={deptoDetails.open}
            onClose={() => {
               setDeptoDetails((p) => ({
                  ...p,
                  open: !deptoDetails.open
               }));
            }}
            title={deptoDetails.name}
         >
            <TablePageProcedureDetails
               editableRows={editableRows}
               procedureCreatedAt={procedureCreatedAt}
               procedureData={procedureData}
               setEditableRows={setEditableRows}
               setModeTable={setModeTable}
               tableRef={tableRef}
            />
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
                                 setEditableRows([]); // ← limpiar filas al crear nuevo
                                 setModeTable("create");
                                 procedureData.setOpen();
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
                  renderField: (v: any, row) => (
                     <CustomTreeView
                        data={v}
                        nameField="name"
                        groupField="group"
                        levelField="level"
                        directorField="director_name"
                        showGroup
                        showLevel
                        showDirector
                        currentStatus={row.status} // ← el status global de la fila
                     />
                  )
               },
               { field: "department_name", headerName: "Departamento" },
               { field: "user_fullname", headerName: "Capturado por" }
            ]}
            actions={(row) => (
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
                                    procedureData.setConstant("startDate", row.order_date);
                                    procedureData.setConstant("departament_id", row.departament_id);
                                    procedureCreatedAt.setConstant("user_id", findAsignatureUser(row.authorization_chain));

                                    if (row.status == "rechazado") {
                                       procedureData.setConstant("status", "rechazado");
                                    }
                                    const date = String(row.full_group).split(".");
                                    setDeptoDetails({
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
                                     listAutorized.request({
                                        method: "POST",
                                        url: "signature/listautorized",
                                        data: {
                                           procedure_id: row.id
                                        },
                                        getData: true
                                     }).finally(()=>{

                                        setOpenExcel(true);
                                     });
                                 });
                           }}
                        >
                           <RiFileExcel2Fill />
                        </CustomButton>
                     </Tooltip>
                  </PermissionRoute>
               </>
            )}
         />
      </>
   );
};
export default TablePageProceudre;
