   import * as Yup from "yup";

   const usersImageValidationSchema = Yup.object({
      signature: Yup.string().trim().required("La firma es requerida"),
     
   });
export default usersImageValidationSchema;