   import * as Yup from "yup";
   
   const departamentsValidationSchema = Yup.object({
      name: Yup.string(),
      abbreviation: Yup.string(),
      classification_code: Yup.string()
   });
   export default departamentsValidationSchema;