import { Departament } from "../../../../../domain/models/departament/departament";
import { GenericDataReturn } from "../../../../../hooks/usegenericdata";
import { RESPONSIVE } from "../../../../../utils/compressfiles";
import FormikForm from "../../../../formik/Formik";
import { FormikInput } from "../../../../formik/FormikInputs/FormikInput";
type TablePageUsersProps = {
   departaments: GenericDataReturn<Departament>;
   departamentsValidator: any;
};
const FormPageDepartaments = ({ departaments, departamentsValidator }: TablePageUsersProps) => {
   return (
      <>
         <FormikForm
            buttonLoading={departaments.loading}
            validationSchema={departamentsValidator}
            buttonMessage={departaments.initialValues.id > 0 ? "Actualizar" : "Registrar"}
            initialValues={departaments.initialValues}
            children={() => (
               <>
                  <FormikInput name="classification_code" label="Codigo de clasificación" responsive={RESPONSIVE} />

                  <FormikInput name="name" label="Nombre" responsive={RESPONSIVE} />
                  <FormikInput name="abbreviation" label="Abreviatura" responsive={RESPONSIVE} />
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