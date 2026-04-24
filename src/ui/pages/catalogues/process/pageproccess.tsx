import { memo, useEffect } from "react";
import CompositePage from "../../../components/compositecustoms/compositePage";
import FormPageProccess from "./form/form.pageprocess";
import TablePageProccess from "./table/table.pageproccess";
import useProccessData from "../../../hooks/useProccessData";
import useDepartamentsData from "../../../hooks/useDepartamentsData";


const PageProccess = () => {
   const proccess = useProccessData();
   const departaments = useDepartamentsData();


   // Actualizar el formulario cuando se abre el modal
   useEffect(() => {
      if (proccess.open) {
         proccess.handleChangeItem({
            classification_code: "",
            departament_id: departaments.initialValues.id,
            description: "",
            name: "",
            active: true,
            id: 0,
            ac: null,
            at: null,
            children_recursive: [],
            boxes: 0,
            endDate: "",
            observation: "",
            startDate: "",
            fisic: false,
            electronic: false,
            process_id: 0,
            user_id: 0,
            accounting_fiscal_value: false
         });
      }
   }, [proccess.open, departaments.initialValues.id]); // Se ejecuta cada vez que se abre el modal

   return (
      <CompositePage
         formDirection="modal"
         onClose={proccess.setOpen}
         isOpen={proccess.open}
         modalTitle={`Tramites`}
         table={() => <TablePageProccess  id={proccess.extractNumbers(departaments.initialValues.classification_code)} />}
         form={() => <FormPageProccess  />}
      />
   );
};

export default memo(PageProccess);
