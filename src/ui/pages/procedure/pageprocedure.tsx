import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageProceudre from "./table/table.pageprocedure";
import FormPageProcedure from "./form/form.pageprocedure";
import useProcedureCreatedAtData from "../../hooks/useProcedureCreatedAt";
import ExcelPageProcedure from "./excel/excel.pageprocedure";
import SignatureSVG from "../../components/signatureanimate/signatureanimate";
import useProccessData from "../../hooks/useProccessData";
import { RiFileList3Line } from "react-icons/ri";

const PageProcedure = () => {
   const procedureData = useProccessData();
   const procedureCreatedAt = useProcedureCreatedAtData();

   const userName = localStorage.getItem("name") || "";
   const userRole = localStorage.getItem("role") || "";
   const totalItems = procedureCreatedAt.items.length;

   return (
      <>
         {procedureCreatedAt.showModal && procedureCreatedAt.signature && (
            <SignatureSVG
               fontFamily="allura"
               text={procedureCreatedAt.signature}
               speed={150}
               fontSize="text-5xl"
               color="text-indigo-700"
               onComplete={() => {
                  procedureCreatedAt.setExtra("showModal", false);
               }}
            />
         )}

         {/* Banner de contexto */}
         <div className="flex items-center justify-between mb-4 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
            <div className="flex items-center gap-3">
               <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100">
                  <RiFileList3Line className="text-indigo-600" size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-gray-800">Trámites</h2>
                  <p className="text-xs text-gray-500">
                     {userName} • <span className="capitalize">{userRole}</span> • {totalItems} {totalItems === 1 ? "registro" : "registros"}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                  {procedureCreatedAt.modeTable === "create" ? "Captura" : procedureCreatedAt.modeTable === "delete" ? "Revisión" : procedureCreatedAt.modeTable === "fixerrors" ? "Corrección" : "Edición"}
               </span>
            </div>
         </div>

         <CompositePage
            modalTitle="Seleccionar Trámite"
            formDirection="modal"
            onClose={procedureData.setOpen}
            isOpen={procedureData.open}
            form={() => <FormPageProcedure />}
            table={() => <TablePageProceudre />}
         />

         <ExcelPageProcedure />
      </>
   );
};
export default PageProcedure;
