   import * as Yup from "yup";

   const usersValidationSchema = Yup.object({
      payroll: Yup.string()
         .trim() 
         .required("El Numero de nomina es requerido"),
      firstName: Yup.string()
         .trim() 
         .required("El Nombre es requerido")
         .test("not-empty", "El Nombre no puede estar vacío", (value) => !!value && value.trim() !== ""),

      paternalSurname: Yup.string()
         .trim()
         .required("El Apellido paterno es requerido")
         .test("not-empty", "El Apellido paterno no puede estar vacío", (value) => !!value && value.trim() !== ""),

      departament_id: Yup.number().min(1, "Selecciona un departamento").required("Selecciona un departamento"),
      role: Yup.string().required("El rol es requerido"),

      permissions: Yup.array().of(Yup.number()).min(1, "Debe asignar al menos un permiso").required("Debe asignar al menos un permiso")
   });
export default usersValidationSchema;