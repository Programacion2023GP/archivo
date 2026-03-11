import { GenericDataReturn } from "../../../../hooks/usegenericdata";

import { Procedure } from "../../../../domain/models/procedure/procedure";
import CustomButton from "../../../components/button/custombuttom";
import { showConfirmationAlert, showToast } from "../../../../sweetalert/Sweetalert";
import { FaBug, FaCheck, FaEdit, FaToggleOff, FaToggleOn } from "react-icons/fa";
import Tooltip from "../../../components/toltip/Toltip";
import { PermissionRoute } from "../../../../App";
import { AiOutlinePlusSquare, AiOutlineWarning } from "react-icons/ai";
import { IoReload } from "react-icons/io5";
import { VscDiffAdded } from "react-icons/vsc";
import CustomTable from "../../../components/table/customtable";
import { HiX } from "react-icons/hi";
import { DateFormat, formatDatetime } from "../../../../utils/formats";
import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { TbSelect } from "react-icons/tb";
import { FormTableHandle } from "../../../formik/FormikInputs/formiktable";

type TablePageProceudreProps = {
   procedureData: GenericDataReturn<Procedure>;
   setEditableRows: Dispatch<SetStateAction<Procedure[]>>;
   editableRows: Procedure[];
   tableRef: RefObject<FormTableHandle>;
};

const TablePageProceudre = ({ procedureData, setEditableRows, editableRows,tableRef }: TablePageProceudreProps) => {
   const [openCheckbox,setOpenCheckbox]= useState<boolean>()
   const selectedItems = (newRows: Procedure[]) => {
      setEditableRows((prev) => {
         const prevRows = Array.isArray(prev) ? prev : [];

         // Crear un mapa con todos los elementos (previos y nuevos)
         const map = new Map<number, Procedure>();

         // Primero agregar los previos
         prevRows.forEach((row) => map.set(row.id, row));
         // Luego los nuevos (sobrescriben si hay mismo ID)
         newRows.forEach((row) => map.set(row.id, row));

         // Retornar SOLO los valores del mapa (sin duplicados)
         return Array.from(map.values());
      });
   };
   const handleEdit = () => {
      procedureData.setOpen();
   };
   const handleErrors = () => {};
   return (
      <CustomTable
         headerActions={() => (
            <>
               {Array.isArray(editableRows) && editableRows.length == 0 && (
                  <PermissionRoute requiredPermission={"tramite_crear"}>
                     <Tooltip content="Agregar Tramite">
                        <CustomButton
                           size="lg"
                           variant="solid"
                           onClick={() => {
                              procedureData.setOpen();
                              procedureData.handleChangeItem({
                                 id: 0,
                                 boxes: 0,
                                 fileNumber: "",
                                 archiveCode: "",
                                 process_id: 0,
                                 departament_id: 0,
                                 user_id: 0,
                                 description: "",
                                 digital: false,
                                 electronic: false,
                                 level: false,
                                 batery: false,
                                 shelf: false,
                                 startDate: "",
                                 endDate: "",
                                 totalPages: 0,
                                 observation: ""
                              });
                           }}
                        >
                           <VscDiffAdded />
                        </CustomButton>
                     </Tooltip>
                  </PermissionRoute>
               )}
               <PermissionRoute requiredPermission={"tramite_ver"}>
                  <Tooltip content="Seleccionar">
                     <CustomButton
                        size="lg"
                        color="cyan"
                        variant="solid"
                        onClick={() => {
                           setOpenCheckbox(!openCheckbox);
                        }}
                     >
                        <TbSelect />
                     </CustomButton>
                  </Tooltip>
               </PermissionRoute>
               {Array.isArray(editableRows) && editableRows.length == 0 && (
                  <PermissionRoute requiredPermission={"tramite_ver"}>
                     <Tooltip content="Recargar">
                        <CustomButton
                           size="lg"
                           variant="solid"
                           color="green"
                           onClick={() => {
                              procedureData.fetchData();
                           }}
                        >
                           {" "}
                           <IoReload />
                        </CustomButton>
                     </Tooltip>
                  </PermissionRoute>
               )}
               {Array.isArray(editableRows) && editableRows.length > 0 && (
                  <>
                     <PermissionRoute requiredPermission={"tramite_actualizar"}>
                        <Tooltip content="Actualizar">
                           <CustomButton size="lg" color="yellow" variant="solid" onClick={handleEdit}>
                              <FaEdit />
                           </CustomButton>
                        </Tooltip>
                     </PermissionRoute>
                     <PermissionRoute requiredPermission={"tramite_eliminar"}>
                        <Tooltip content="Generar errores">
                           <CustomButton size="lg" color="pink" variant="solid" onClick={() => {}}>
                              <AiOutlineWarning />
                           </CustomButton>
                        </Tooltip>
                     </PermissionRoute>
                  </>
               )}
            </>
         )}
         loading={procedureData.loading}
         data={procedureData.items}
         onRowSelect={selectedItems}
         enableSavedFilters
         enableRowSelection={openCheckbox}
         storageKey="procedure_table"
         columns={[
            { field: "boxes", headerName: "Cajas" },
            { field: "fileNumber", headerName: "Expediente" },
            { field: "archiveCode", headerName: "Código de archivo", groupable: true },
            { field: "process_id", headerName: "Proceso" },
            // { field: "departament_id", headerName: "Departamento" },
            // { field: "user_id", headerName: "Usuario" },

            { field: "digital", headerName: "Digital", visibility: "expanded" },
            { field: "electronic", headerName: "Electrónico", visibility: "expanded" },
            { field: "level", headerName: "Nivel", visibility: "expanded" },
            { field: "batery", headerName: "Batería", visibility: "expanded" },
            { field: "shelf", headerName: "Anaquel", visibility: "expanded" },

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
            { field: "totalPages", headerName: "Fojas" },

            { field: "description", headerName: "Descripción" },
            { field: "observation", headerName: "Observación", visibility: "expanded" }
         ]}
         conditionExcel={"tramite_exportar"}
         paginate={[10, 20, 30]}
         actions={(row) => (
            <>
               {/* <PermissionRoute requiredPermission={"tramite_eliminar"}> */}

               {/* </PermissionRoute> */}
            </>
         )}
      />
   );
};
export default TablePageProceudre;
