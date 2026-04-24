import { useEffect, useRef } from "react";
import { RESPONSIVE } from "../../../../../utils/compressfiles";
import FormikForm from "../../../../formik/Formik";
import { FormikInput, FormikTextArea } from "../../../../formik/FormikInputs/FormikInput";
import { FormikProps, FormikValues } from "formik";
import useProccessData from "../../../../hooks/useProccessData";
import { useValidators } from "../../../../validations/validators";
import useDepartamentsData from "../../../../hooks/useDepartamentsData";

const FormPageProccess = () => {
      const proccess = useProccessData();
      const { proccessValidator } = useValidators();
      const departaments = useDepartamentsData();
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