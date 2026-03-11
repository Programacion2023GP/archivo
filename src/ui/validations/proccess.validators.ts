   import * as Yup from "yup";
   
   const proccessValidationSchema = Yup.object({
      name: Yup.string().required("nombre es requerido"),
      classification_code: Yup.string().required("Codigo de clasificación requerido"),
      ac: Yup.number().required("at es requerido"),
      at: Yup.number().required("ac es requerido"),
   });
   export default proccessValidationSchema;
