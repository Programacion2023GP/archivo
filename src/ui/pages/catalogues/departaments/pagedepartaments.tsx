import CompositePage from "../../../components/compositecustoms/compositePage";
import TablePageDepartaments from "./table/table.pagedepartaments";
import FormPageDepartaments from "./form/form.pagedepartaments";
import CustomModal from "../../../components/modal/modal";
import PageProccess from "../process/pageproccess";
import useDepartamentsData from "../../../hooks/useDepartamentsData";
import { FaBuildingColumns } from "react-icons/fa6";

const PageDepartaments = () => {
   const departaments = useDepartamentsData();
   const totalDepts = departaments.items.length;

   return (
      <>
         {/* Banner de contexto */}
         <div className="flex items-center justify-between mb-4 px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl">
            <div className="flex items-center gap-3">
               <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100">
                  <FaBuildingColumns className="text-violet-600" size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-gray-800">Direcciones</h2>
                  <p className="text-xs text-gray-500">
                     {totalDepts} {totalDepts === 1 ? "dirección registrada" : "direcciones registradas"}
                  </p>
               </div>
            </div>
         </div>

         <CompositePage
            formDirection="modal"
            onClose={departaments.setOpen}
            isOpen={departaments.open}
            modalTitle="Direcciones"
            table={() => <TablePageDepartaments />}
            form={() => <FormPageDepartaments />}
         />
         <CustomModal
            title={`📋 Trámites de ${departaments.initialValues.name || "..."}`}
            subtitle={departaments.initialValues.abbreviation ? `${departaments.initialValues.abbreviation} • ${departaments.initialValues.classification_code}` : undefined}
            isOpen={departaments.openProcedure}
            onClose={departaments.setProcedureOpen}
            children={<PageProccess />}
         />
      </>
   );
};

export default PageDepartaments;
