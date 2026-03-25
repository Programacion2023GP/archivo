import CompositePage from "../../components/compositecustoms/compositePage";
import useDepartamentsData from "../../hooks/useDepartamentsData";
import TablePageProceudre from "./table/table.pageprocedure";
import FormPageProcedure from "./form/form.pageprocedure";
import useProcedureData from "../../hooks/useProcedureData";
import { useRef, useState } from "react";
import { Procedure } from "../../../domain/models/procedure/procedure";
import { CustomTableHandle } from "../../components/table/customtable";
import useProcedureCreatedAtData from "../../hooks/useProcedureCreatedAt";
import ExcelPageProcedure from "./excel/excel.pageprocedure";

const PageProcedure = () => {
   const procedure = useProcedureData();
   const departaments = useDepartamentsData();
   const procedureCreatedAt = useProcedureCreatedAtData();
   const [modeTable, setModeTable] = useState<"create" | "edit" | "view" | "delete">("create");
   const [editableRows, setEditableRows] = useState<Procedure[]>([]);
   const tableRef = useRef<CustomTableHandle<Procedure>>(null);
   const [openExcel,setOpenExcel] = useState<boolean>(false)
   return (
      <>
         <CompositePage
         modalTitle=""
            formDirection="modal"
            onClose={procedure.setOpen}
            isOpen={procedure.open}
            // modalTitle="Tramites"
            form={() => (
               <FormPageProcedure

                  setModeTable={setModeTable}
                  modeTable={modeTable}
                  tableRef={tableRef}
                  departamentsData={departaments}
                  setEditableRows={setEditableRows}
                  procedureData={procedure}
                  procedureCreatedAt={procedureCreatedAt}
                  editableRows={editableRows}
               />
            )}
            table={() => (
               <TablePageProceudre 
               setOpenExcel={setOpenExcel}
                  setModeTable={setModeTable}
                  tableRef={tableRef}
                  procedureData={procedure}
                  procedureCreatedAt={procedureCreatedAt}
                  setEditableRows={setEditableRows}
                  editableRows={editableRows}
               />
            )}
         />
         <ExcelPageProcedure open={openExcel} setOpen={setOpenExcel} procedureData={procedure}/>
      </>
   );
};
export default PageProcedure;
