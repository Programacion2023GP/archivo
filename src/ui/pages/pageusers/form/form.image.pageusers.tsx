import FormikForm from "../../../formik/Formik";
import FormikFileInput from "../../../formik/FormikInputs/forminputimage";
import { useValidators } from "../../../validations/validators";
import useUsersData from "../../../hooks/useUsersData";
import usePermissionsData from "../../../hooks/usePermissionsData";



const FormImagePageUsers = () => {
   const { usersImageValidator } = useValidators();
    const users = useUsersData();
    const permissions = usePermissionsData();
   const Submit = (values) => {
      users
         .request({
            method: "POST",
            url: `users/signature`,
            data: {
               signature: values?.signature,
               id: users.user_id
            },
            formData: true,
            getData:true
         })
         .finally(() => {
            permissions.setOpen();
         });
   };
   return (
      <FormikForm
         onSubmit={Submit}
         validationSchema={usersImageValidator}
         buttonMessage={"Registrar"}
         initialValues={users.initialValues}
         children={(values, setFieldValue, setTouched, errors, touched) => (
            <>
               <FormikFileInput
                  name="signature"
                  label="Firma"
                  preset="images"
                  multiple={false} // ← Cambiado a false porque maxFiles={1}
                  maxFiles={1}
                  compressImages
                  imageMaxWidth={1200}
                  imageQuality={0.7}
                  imageMaxSizeMB={1}
               />
            </>
         )}
      />
   );
};

export default FormImagePageUsers;
