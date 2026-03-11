import { memo, useEffect } from "react";
import { Departament } from "../../../../domain/models/departament/departament";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import CompositePage from "../../../components/compositecustoms/compositePage";
import CustomModal from "../../../components/modal/modal";
import { useEntities } from "../../../hooks/useEntities";
import { useValidators } from "../../../validations/validators";
import FormPageProccess from "./form/form.pageprocess";
import TablePageProccess from "./table/table.pageproccess";
import useProccessData from "../../../hooks/useProccessData";

type PageProccessProps = {
   departaments: GenericDataReturn<Departament>;
};

const PageProccess = ({ departaments }: PageProccessProps) => {
   const proccess = useProccessData();
   const { proccessValidator } = useValidators();

   useEffect(() => {
      proccess.request({
         method: "GET",
         url: `proccess/index/${departaments.initialValues.id}`
      });
   }, [departaments.initialValues.id]); // Dependencia cuando cambia el departamento
function extractNumbers(classification_code:Departament['classification_code']) {
   return classification_code.replace(/\D/g, "");
}
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
            children_recursive: []
         });
      }
   }, [proccess.open, departaments.initialValues.id]); // Se ejecuta cada vez que se abre el modal

   return (
      <CompositePage
         formDirection="modal"
         onClose={proccess.setOpen}
         isOpen={proccess.open}
         modalTitle={`Tramites`}
         table={() => <TablePageProccess proccess={proccess} id={extractNumbers(departaments.initialValues.classification_code)} />}
         form={() => <FormPageProccess departaments={departaments} proccess={proccess} proccessValidator={proccessValidator} />}
      />
   );
};

export default memo(PageProccess);
