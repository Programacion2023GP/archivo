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
import SignatureSVG from "../../components/signatureanimate/signatureanimate";
import CustomModal from "../../components/modal/modal";
import useListAutorized from "../../hooks/useListAutorized";

const PageProcedure = () => {
   const procedure = useProcedureData();
   const departaments = useDepartamentsData();
   const listAutorized = useListAutorized()
   const procedureCreatedAt = useProcedureCreatedAtData();
   const [modeTable, setModeTable] = useState<"create" | "edit" | "view" | "delete">("create");
   const [editableRows, setEditableRows] = useState<Procedure[]>([]);
   const tableRef = useRef<CustomTableHandle<Procedure>>(null);
   const [openExcel,setOpenExcel] = useState<boolean>(false)
    const [signature, setSignature] = useState(null);
    const [showModal, setShowModal] = useState(false);
       const [deptoDetails, setDeptoDetails] = useState<{ open: boolean; name: string }>({ name: "", open: false });

   const signatureByUser =(name:string)=>{
      setSignature(name)
      setShowModal(true)

   }
  
   return (
      <>
         {showModal && signature && (
            <SignatureSVG
               fontFamily="allura" // ← usa el key del objeto
               text={signature}
               speed={150}
               fontSize="text-5xl"
               color="text-indigo-700"
               onComplete={() => {
                  setShowModal(false);
               }}
            />
         )}
         <CompositePage
            modalTitle=""
            formDirection="modal"
            onClose={procedure.setOpen}
            isOpen={procedure.open}
            // modalTitle="Tramites"
            form={() => (
               <FormPageProcedure
                  signatureByUser={signatureByUser}
                  setModeTable={setModeTable}
                  modeTable={modeTable}
                  tableRef={tableRef}
                  departamentsData={departaments}
                  setEditableRows={setEditableRows}
                  procedureData={procedure}
                  procedureCreatedAt={procedureCreatedAt}
                  editableRows={editableRows}
                  setDeptoDetails={setDeptoDetails}
               />
            )}
            table={() => (
               <TablePageProceudre
                  listAutorized={listAutorized}
                  deptoDetails={deptoDetails}
                  setDeptoDetails={setDeptoDetails}
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
         <ExcelPageProcedure listAutorized={listAutorized} open={openExcel} setOpen={setOpenExcel} procedureData={procedure} />
      </>
   );
};
export default PageProcedure;
