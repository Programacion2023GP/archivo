import CompositePage from "../../../components/compositecustoms/compositePage";
import TablePageDepartaments from "./table/table.pagedepartaments";
import FormPageDepartaments from "./form/form.pagedepartaments";
import CustomModal from "../../../components/modal/modal";
import PageProccess from "../process/pageproccess";
import useDepartamentsData from "../../../hooks/useDepartamentsData";
const PageDepartaments = () => {
   const  departaments = useDepartamentsData()   
   return (
      <>
         <CompositePage
            formDirection="modal"
            onClose={departaments.setOpen}
            isOpen={departaments.open}
            modalTitle="Dirrecciones"
            table={() => <TablePageDepartaments />}
            form={() => <FormPageDepartaments />}
         />
         <CustomModal
            title={`Tramites de ${departaments.initialValues.name}`}
            isOpen={departaments.openProcedure}
            onClose={departaments.setProcedureOpen}
            children={<PageProccess />}
         />
      </>
   );
};

export default PageDepartaments;
