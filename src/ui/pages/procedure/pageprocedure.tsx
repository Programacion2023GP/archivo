import CompositePage from "../../components/compositecustoms/compositePage";
import TablePageProceudre from "./table/table.pageprocedure";
import FormPageProcedure from "./form/form.pageprocedure";
import useProcedureCreatedAtData from "../../hooks/useProcedureCreatedAt";
import ExcelPageProcedure from "./excel/excel.pageprocedure";
import SignatureSVG from "../../components/signatureanimate/signatureanimate";
import useProccessData from "../../hooks/useProccessData";

const PageProcedure = () => {
   const procedureData = useProccessData();

   const procedureCreatedAt = useProcedureCreatedAtData();

   return (
      <>
         {procedureCreatedAt.showModal && procedureCreatedAt.signature && (
            <SignatureSVG
               fontFamily="allura" // ← usa el key del objeto
               text={procedureCreatedAt.signature}
               speed={150}
               fontSize="text-5xl"
               color="text-indigo-700"
               onComplete={() => {
                  procedureCreatedAt.setExtra("showModal", false);
               }}
            />
         )}
         <CompositePage
            modalTitle=""
            formDirection="modal"
            onClose={procedureData.setOpen}
            isOpen={procedureData.open}
            // modalTitle="Tramites"
            form={() => <FormPageProcedure />}
            table={() => <TablePageProceudre />}
         />

         <ExcelPageProcedure />
      </>
   );
};
export default PageProcedure;
