   import * as Yup from "yup";
   
   const departamentsValidationSchema = Yup.object({
      name: Yup.string().required("nombre es requerido"),
      abbreviation: Yup.string().required("Abreviatura es requerida"),
      classification_code: Yup.string().required("codigo de clasificación es requerido")
   });
   export default departamentsValidationSchema;