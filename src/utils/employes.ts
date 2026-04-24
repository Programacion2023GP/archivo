import { showToast } from "../sweetalert/Sweetalert";
import { HandleModifiedFn } from "../ui/formik/FormikInputs/FormikInput";

const getEmployed: HandleModifiedFn = async (values, setFieldValue) => {
   if (values?.payroll?.length >= 4) {
      try {
         const res = await fetch(`https://apideclaracionesgp.gomezpalacio.gob.mx:4434/api/compaq/show/${values.payroll}`);

         if (!res.ok) {
            showToast("Falla de la petición", "info");
            return;
         }

         const employed = await res.json();

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
      } catch (error) {
         showToast("Error inesperado", "error");
      }
   } else {
      setFieldValue("firstName", "");
      setFieldValue("paternalSurname", "");
      setFieldValue("maternalSurname", "");
   }
};

export default getEmployed;
