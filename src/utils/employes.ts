import { showToast } from "../sweetalert/Sweetalert";

 const getEmployed = async (values: Record<string, any>, setFieldValue: (name: string, value: any) => void) => {
//    if (users.initialValues.id > 0) return;

   if (values?.payroll?.length >= 4) {
      try {
         const res = await fetch(`https://apideclaracionesgp.gomezpalacio.gob.mx:4434/api/compaq/show/${values.payroll}`);

         if (!res.ok) {
            showToast("falla de la petición", "info");
         }

         const employed = await res.json();

         // Verificamos si hay resultados
         if (employed?.data?.result?.length > 0) {
            const emp = employed.data.result[0];

            setFieldValue("firstName", emp.nombreE || "");
            setFieldValue("paternalSurname", emp.apellidoP || "");
            setFieldValue("maternalSurname", emp.apellidoM || "");
         } else {
            showToast("El empleado no existe", "error");

            setFieldValue("firstName", "");
            setFieldValue("paternalSurname", "");
            setFieldValue("maternalSurname", "");
         }
      } catch (error) {}
   } else {
      setFieldValue("firstName", "");
      setFieldValue("paternalSurname", "");
      setFieldValue("maternalSurname", "");
   }
};
export default getEmployed;