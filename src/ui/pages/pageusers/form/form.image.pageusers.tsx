import { useEffect } from "react";
import { Permissions, Users } from "../../../../domain/models/users/users.domain";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import FormikForm from "../../../formik/Formik";
import FormikFileInput from "../../../formik/FormikInputs/forminputimage";
import { useValidators } from "../../../validations/validators";

interface imageInput {
   usersData: GenericDataReturn<Users>;
    permissionsData: GenericDataReturn<Permissions>;
   
}

const FormImagePageUsers = ({ usersData, permissionsData }: imageInput) => {
   const { usersImageValidator } = useValidators();
   const Submit = (values) => {
      usersData
         .request({
            method: "POST",
            url: `users/signature`,
            data: {
               signature: values?.signature,
               id: usersData.constants.id
            },
            formData: true,
            getData:true
         })
         .finally(() => {
            permissionsData.setOpen()
         });
   };
   return (
      <FormikForm
         onSubmit={Submit}
         validationSchema={usersImageValidator}
         buttonMessage={"Registrar"}
         initialValues={usersData.initialValues}
         children={(values, setFieldValue, setTouched, errors, touched) => (
            <>
               <FormikFileInput
                  name="signature"
                  label="Firma"
                  preset="images"
                  multiple={false} // ← Cambiado a false porque maxFiles={1}
                  maxFiles={1}
                  hint="imagen de hasta 2 MB"
               />
            </>
         )}
      />
   );
};

export default FormImagePageUsers;
