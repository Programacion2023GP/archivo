import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { DateFormat, formatDatetime } from "../../../../../utils/formats";
import CustomBadge from "../../../../components/badge/custombadge";
import Tooltip from "../../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../../App";
import { BsCheck2Circle } from "react-icons/bs";
import CustomButton from "../../../../components/button/custombuttom";
import { MdSend } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import CustomTable from "../../../../components/table/customtable";
import useProcedureCreatedAtData from "../../../../hooks/useProcedureCreatedAt";
import useProcedureData from "../../../../hooks/useProcedureData";
import useProccessData from "../../../../hooks/useProccessData";

const TablePageProcedureDetails = () => {
   const procedureCreatedAt = useProcedureCreatedAtData();
   const procedureData = useProcedureData();
   const proccess = useProccessData();

   const handleEdit = () => {
      procedureCreatedAt.setExtra("editableRows", procedureData.items);

      procedureData.setOpen();
   };

   const handleDelete = () => {
      proccess.setOpen(true);
      procedureCreatedAt.setExtra("editableRows", procedureData.items);
      console.log("handle delete");
      procedureCreatedAt.setExtra("modeTable", "delete");
   };
   const isAdmin = localStorage.getItem("role")?.toUpperCase() === "ADMINISTRATIVO";
   const currentStatus = procedureData?.items?.[0]?.status?.toString();
   const isValidStatus = !["ENVIADO", "REVISADO", "FINALIZADO"].includes(String(currentStatus).toUpperCase());
   const showButtons = isAdmin || isValidStatus || procedureCreatedAt.userSignature;


   const signaturePermissionUser = (): boolean => {
      const authId = localStorage.getItem("auth_id");
      const userName = localStorage.getItem("name");

      // if (Number(procedureCreatedAt.constants.user_id) === Number(authId)) {
      //    return true;
      // }

      return false;
   };
   return (
      <>
         <CustomTable
            headerActions={(data) => (
               <>
                  <>
                     {(() => {
                        return (
                           showButtons && (
                              <>
                                 {/* {http://127.0.0.1:8000/api/procedure/detailsprocedure/2026-04-15%2013:10:25/2
} */}
                                 <PermissionRoute requiredPermission={["tramite_actualizar"]}>
                                    <Tooltip content="Editar">
                                       <CustomButton
                                          size="lg"
                                          color="yellow"
                                          variant="solid"
                                          onClick={() => {
                                             if (data.length == 0) {
                                                return;
                                             }
                                             const item = procedureCreatedAt?.items?.[0];
                                             procedureCreatedAt.setExtra("editableRows", procedureData.items);

                                             if (item.error) {
                                                procedureCreatedAt.setExtra("modeTable", "fixerrors");
                                             } else {
                                                procedureCreatedAt.setExtra("modeTable", "edit");
                                             }
                                             proccess.setOpen();
                                          }}
                                       >
                                          <FaEdit />
                                       </CustomButton>
                                    </Tooltip>
                                 </PermissionRoute>

                                 {signaturePermissionUser() && (
                                    <CustomButton
                                       size="lg"
                                       color="pink"
                                       variant="solid"
                                       onClick={() => {
                                          procedureCreatedAt.setExtra("modeTable", "view");
                                          procedureData.setOpen();
                                       }}
                                    >
                                       <BsCheck2Circle />{" "}
                                    </CustomButton>
                                 )}

                                 <PermissionRoute requiredPermission={"tramite_actualizar"}>
                                    {currentStatus == "captura" && (
                                       <Tooltip content="Enviar Todos">
                                          <CustomButton
                                             size="lg"
                                             color="green"
                                             variant="solid"
                                             onClick={() => {
                                                // procedureData
                                                //    .request({
                                                //       method: "POST",
                                                //       url: `procedure/changestatus`,
                                                //       data: {
                                                //          status: 2,
                                                //          startDate: String(procedureData.constants.startDate),
                                                //          departament_id: procedureData.constants.departament_id
                                                //       },
                                                //       getData: false
                                                //    })
                                                //    .finally(() => {
                                                //       const today = new Date().toISOString().split("T")[0];
                                                //       procedureData.request({
                                                //          method: "GET",
                                                //          url: `procedure/detailsprocedure/${procedureData.constants.startDate ?? today}/${procedureData.constants.departament_id}`
                                                //       });
                                                //    });
                                             }}
                                          >
                                             <MdSend />
                                          </CustomButton>
                                       </Tooltip>
                                    )}
                                 </PermissionRoute>
                                    <Tooltip content="Revision">
                                       <CustomButton size="lg" color="pink" variant="solid" onClick={handleDelete}>
                                          <BsCheck2Circle />
                                       </CustomButton>
                                    </Tooltip>
                              </>
                           )
                        );
                     })()}
                  </>
               </>
            )}
            loading={procedureData.loading}
            data={procedureData.items}
            enableSavedFilters
            storageKey="procedure_table"
            columns={[
               { field: "boxes", headerName: "Cajas" },
               // { field: "error", headerName: "Cajas" },

               // { field: "retention_period_current", headerName: "At" },

               // { field: "retention_period_archive", headerName: "Ac" },

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
               // {
               //    field: "administrative_value",
               //    headerName: "Administrativo",
               //    visibility: "expanded",
               //    renderField: (v) => (
               //       <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
               //          {v ? <IoMdCheckmark /> : <IoMdClose />}
               //       </CustomBadge>
               //    )
               // },
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
               // {
               //    field: "legal_value",
               //    headerName: "Juridico",
               //    visibility: "expanded",
               //    renderField: (v) => (
               //       <CustomBadge size="lg" color={v ? "success" : "danger"} variant="subtle">
               //          {v ? <IoMdCheckmark /> : <IoMdClose />}
               //       </CustomBadge>
               //    )
               // },

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
export default TablePageProcedureDetails;