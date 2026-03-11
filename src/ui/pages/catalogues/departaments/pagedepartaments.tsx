import CompositePage from "../../../components/compositecustoms/compositePage";
import { useValidators } from "../../../validations/validators";
import TablePageDepartaments from "./table/table.pagedepartaments";
import FormPageDepartaments from "./form/form.pagedepartaments";
import CustomModal from "../../../components/modal/modal";
import { useCallback, useState } from "react";
import PageProccess from "../process/pageproccess";
import useDepartamentsData from "../../../hooks/useDepartamentsData";
const PageDepartaments = () => {
   const  departaments = useDepartamentsData()
   const { departamentsValidator } = useValidators();
   const [open, setOpen] = useState<boolean>(false);
   const toggleOpen = useCallback(() => {
      setOpen((prev) => !prev);
   }, []);
   return (
      <>
         <CompositePage
            formDirection="modal"
            onClose={departaments.setOpen}
            isOpen={departaments.open}
            modalTitle="Dirrecciones"
            table={() => <TablePageDepartaments departaments={departaments} setOpen={toggleOpen} />}
            form={() => <FormPageDepartaments departaments={departaments} departamentsValidator={departamentsValidator} />}
         />
         <CustomModal
            title={`Tramites de ${departaments.initialValues.name}`}
            isOpen={open}
            onClose={toggleOpen}
            children={<PageProccess departaments={departaments} />}
         />
      </>
   );
};

export default PageDepartaments;
