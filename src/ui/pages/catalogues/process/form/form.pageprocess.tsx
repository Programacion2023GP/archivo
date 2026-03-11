import { useEffect, useRef } from "react";
import { Departament } from "../../../../../domain/models/departament/departament";
import { Proccess } from "../../../../../domain/models/proccess/proccess.domain";
import { GenericDataReturn } from "../../../../../hooks/usegenericdata";
import { RESPONSIVE } from "../../../../../utils/compressfiles";
import CustomModal from "../../../../components/modal/modal";
import FormikForm from "../../../../formik/Formik";
import { FormikInput, FormikTextArea } from "../../../../formik/FormikInputs/FormikInput";
import { FormikProps, FormikValues } from "formik";
type TablePageUsersProps = {
   departaments: GenericDataReturn<Departament>;
   proccess: GenericDataReturn<Proccess>;
   proccessValidator: any;
};
const FormPageProccess = ({ departaments, proccess, proccessValidator }: TablePageUsersProps) => {
   const formikRef = useRef<FormikProps<FormikValues>>(null);
   useEffect(()=>{
      if (formikRef.current) {
         formikRef.current.setFieldValue("departament_id", departaments.initialValues.id);
      }
   },[formikRef.current])
   return (
      <>
         <FormikForm
            ref={formikRef}
            buttonLoading={proccess.loading}
            validationSchema={proccessValidator}
            buttonMessage={proccess.initialValues.id > 0 ? "Actualizar" : "Registrar"}
            initialValues={proccess.initialValues}
            children={() => (
               <>
                  <FormikInput name="classification_code" label="Codigo de clasificación" responsive={RESPONSIVE} />
                  <FormikInput name="name" label="Nombre" responsive={RESPONSIVE} />
                  <FormikInput name="at" label="At" type="number" responsive={RESPONSIVE} />
                  <FormikInput name="ac" label="Ac" type="number" responsive={RESPONSIVE} />

                  <FormikTextArea name="description" label="Descripción" responsive={RESPONSIVE} />
               </>
            )}
            onSubmit={async (values) => {
               await proccess
                  .request({
                     method: "POST",
                     url: "proccess/createorUpdate",
                     data: values
                  })
                  .then(async () => {
                     proccess.setOpen();

                     await proccess.request({
                        method: "GET",
                        url: `proccess/index/${departaments.initialValues.id}`,
                        data: values
                     });
                  });
               // await departaments.fetchData();
            }}
         />
      </>
   );
};
export default FormPageProccess;