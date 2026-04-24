import { ProceduresCreatedAt } from "../../../../domain/models/procedurecreatedat/procedure_created_at";
import { Proccess } from "../../../../domain/models/proccess/proccess.domain";
import { showToast } from "../../../../sweetalert/Sweetalert";
const findById = (items: any[], id: number | string): Proccess => {
   for (const item of items) {
      // Si el item actual tiene el id buscado
      if (item.id === id) {
         return item;
      }

      // Si tiene children_recursive, buscar recursivamente
      if (item.children_recursive && item.children_recursive.length > 0) {
         const found = findById(item.children_recursive, id);
         if (found) return found;
      }
   }
   return null;
};
export const accessCreateProcedure = (items: ProceduresCreatedAt[], procedure?: Proccess[], value?: number): boolean => {
   const isAdmin = localStorage.getItem("role") === "administrador";
   // console.log("aas", availableIds);
   if (isAdmin && procedure && procedure.length > 0) {

      if (value) {

         const foundObject = findById(procedure, value);

         // Aquí puedes usar foundObject para lo que necesites
         if (foundObject) {
            console.log("cargando datos", foundObject);
            const today = new Date().toISOString().split("T")[0];

            const hasDuplicate = items.some((it) => it.departament_id == foundObject.departament_id && it.order_date && it.order_date.split(" ")[0] == today);
            console.log(items.filter((it) => it.departament_id == foundObject.departament_id && it.order_date && it.order_date.split(" ")[0] == today));
            if (hasDuplicate) {

         showToast("No se puede generar. Ya existe un registro para hoy", "info");
               return false;
            } else {
               return true;
            }
         } else {
            return true;
         }
      }
      return true;
   }
   if (isAdmin) {
      return true;
   }

   const departament_id = String(localStorage.getItem("departament_id"));

   const todayStr = new Date().toISOString().split("T")[0];
   return !items.some((item) => {
      const itemDate = item.order_date.split(" ")[0];
      return itemDate === todayStr && String(item.departament_id) === departament_id;
   });
};
