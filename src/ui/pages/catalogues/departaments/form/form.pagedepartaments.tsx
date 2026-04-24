import { Departament } from "../../../../../domain/models/departament/departament";
import FormikForm from "../../../../formik/Formik";
import { FormikInput } from "../../../../formik/FormikInputs/FormikInput";
import useDepartamentsData from "../../../../hooks/useDepartamentsData";
import { useValidators } from "../../../../validations/validators";

const FormPageDepartaments = () => {
   const departaments = useDepartamentsData();
   const { departamentsValidator } = useValidators();
   return (
      <>
         <FormikForm
            buttonLoading={departaments.loading}
            validationSchema={departamentsValidator}
            buttonMessage={departaments.initialValues.id > 0 ? "Actualizar" : "Registrar"}
            initialValues={departaments.initialValues}
            children={() => (
               <>
                  <FormikInput name="classification_code" label="Codigo de clasificación" responsive={departaments.responsive} />

                  <FormikInput name="name" label="Nombre" responsive={departaments.responsive} />
                  <FormikInput name="abbreviation" label="Abreviatura" responsive={departaments.responsive} />
               </>
            )}
            onSubmit={(values) => {
               departaments.postItem(values as Departament);
            }}
         />
      </>
   );
};
export default FormPageDepartaments;
