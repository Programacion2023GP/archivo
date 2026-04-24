// FormPageProcedure.tsx
import { useMemo, useEffect } from "react";
import useProccessData from "../../../hooks/useProccessData";
import FormTable, { ColumnDef } from "../../../formik/FormikInputs/formiktable";
import { Procedure } from "../../../../domain/models/procedure/procedure";
import { accessCreateProcedure } from "../utils/utils.pageprocedure";
import useProcedureCreatedAtData from "../../../hooks/useProcedureCreatedAt";
import useProcedureData from "../../../hooks/useProcedureData";

const FormPageProcedure = () => {
   const proccess = useProccessData();
   const procedureCreatedAt = useProcedureCreatedAtData();
   const procedure = useProcedureData();

   useEffect(() => {
      proccess.request({ method: "GET", url: `proccess/processbyuser` });
   }, []);

   const COLS = useMemo<ColumnDef[]>(
      () => [
         { field: "boxes", headerName: "Cajas", width: 90, required: true },
         {
            field: "process_id",
            headerName: "Título expediente",
            width: 220,
            type: "autocomplete",
            options: proccess.items,
            idKey: "id",
            labelKey: "name",
            selectableKey: "selectable",
            required: true,
            onChange(value, ctx) {
               // ctx.setField('');
               if (!accessCreateProcedure(procedureCreatedAt.items, proccess.items, value)) {
                  ctx.setField("process_id", null);
               }
            }
         },
         { field: "year", headerName: "Año", type: "number", width: 100, min: 1900, max: 2100, step: 1, required: true },
         { field: "startDate", headerName: "Fecha inicio", width: 140, type: "date", required: true },
         { field: "endDate", headerName: "Fecha final", width: 140, type: "date", required: true },
         { field: "description", headerName: "Descripción", width: 200, required: true },
         { field: "totalPages", headerName: "Total fojas", width: 110, type: "number", min: 0, required: true },
         {
            field: "support",
            headerName: "Soporte documental",
            width: 260,
            type: "checkboxgroup",
            items: [
               { value: true, label: "Electronico", field: "electronic" },
               { value: true, label: "Físico", field: "fisic" }
            ]
         },

         {
            field: "vadoc",
            headerName: "Valores Documentales",
            width: 260,
            type: "checkboxgroup",
            items: [
               { value: true, label: "Administrativo", field: "administrative_value" },
               { value: true, label: "Contable Fiscal", field: "accounting_fiscal_value" },
               { value: true, label: "Juridico", field: "legal_value" }
            ]
         },
         { field: "retention_period_current", headerName: "at", type: "number", width: 100, min: 0, step: 1, required: true },
         { field: "retention_period_archive", headerName: "ac", type: "number", width: 100, min: 0, step: 1, required: true },

         { field: "location_building", headerName: "Inmueble", type: "number", width: 100, min: 0,  step: 1, required: true },
         { field: "location_furniture", headerName: "Mueble", type: "number", width: 100, min: 0,  step: 1, required: true },
         { field: "location_position", headerName: "Posición", type: "number", width: 100, min: 0,  step: 1, required: true },

         // {
         //    field: "ubicat",
         //    headerName: "Ubicación en archivo de tramite",
         //    width: 260,
         //    type: "number",

         //    items: [
         //       { value: 0, label: "Inmueble", field: "location_building" },
         //       { value: 0, label: "Mueble", field: "location_furniture" },
         //       { value: 0, label: "Posición", field: "location_position" }
         //    ]
         // },
         { field: "observation", headerName: "Observaciones", type: "text", width: 200 }
      ],
      [proccess.items]
   );

   const handleSubmit = (rows: Record<string, any>[]) => {
      if (rows.length == 0) {
         return;
      }

      const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
      if (procedureCreatedAt.modeTable == "delete") {
         // Modo delete: actualizar status_id a 5 para todas las filas
         const updatedRows = rows.map((row) => ({
            ...(row as Procedure),
            errorDescriptionField: null,
            error: row.errorFieldsKey ? true : false
         }));
         procedure.postItem(updatedRows as Procedure[], false, false).finally(() => {
            procedureCreatedAt.fetchData();
            const startDate = proccess.orderDate || today;
            const departamentId = proccess.departament_id || 0;
            procedure.request({
               method: "GET",
               url: `procedure/detailsprocedure/${startDate}/${departamentId}`
            });
         });
      } else {
         const updatedRows = rows.map((row) => ({
            ...(row as Procedure),
            error: procedureCreatedAt.modeTable == "fixerrors" ? false : row.error,
            errorFieldsKey: procedureCreatedAt.modeTable == "fixerrors" ? null : row.errorFieldsKey
         }));
         // Modo create u otros: comportamiento normal
         procedure.postItem(updatedRows as Procedure[], false, false).finally(() => {
            procedureCreatedAt.fetchData();
            const startDate = proccess.orderDate || today;
            const departamentId = proccess.departament_id || 0;
            procedure.request({
               method: "GET",
               url: `procedure/detailsprocedure/${startDate}/${departamentId}`
            });
         });
      }
      procedureCreatedAt.setExtra("editableRows", []);
      procedureCreatedAt.setExtra("modeTable", "create");
      proccess.setOpen(false)
   };

   type SignatureAction = {
      color: string;
      label: string;
      onClick: () => void;
   } | null;

   const rewiev = (): SignatureAction => {
     
  if (procedureCreatedAt.editableRows.length > 0 && procedureCreatedAt.editableRows[0].statu_id >= 3) {
     return null;
   
  }

      const stored = localStorage.getItem("permisos");
      const parsed = stored ? JSON.parse(stored) : [];
      console.log("permisos",parsed);
      if (parsed.includes("revisar")) {
         return {
            label: "Marcar como revisado",
            color: "#059669",
            // icon: <svg>...</svg>,
            onClick: () => {
               procedure
                  .request({
                     method: "POST",
                     url: `procedure/changestatus`,
                     data: {
                        status: 3,
                        startDate: String(proccess.orderDate),
                        departament_id: proccess.departament_id
                     },
                     getData: false
                  })
                  .finally(() => {
                     proccess.setOpen();
                     const today = new Date().toISOString().split("T")[0];
                     procedureCreatedAt.fetchData();
                     procedure.request({
                        method: "GET",
                        url: `procedure/detailsprocedure/${proccess.orderDate ?? today}/${proccess.departament_id}`
                     });
                  });
            }
         };
      }
      return null;
   };


   const signaturePermissionUser = (): SignatureAction => {
      const authId = localStorage.getItem("auth_id");
      const userName = localStorage.getItem("name");

 
      if (Number(proccess.user_id) == Number(authId)) {
         return {
            color: "#030500",
            label: "Firmar",
            onClick: () => {
               procedureCreatedAt
                  .request({
                     method: "POST",
                     url: "signature/byuser",
                     // getData: false,
                     getData: true,
                     data: {
                        user_id: proccess.user_id
                     }
                  })
                  .then(() => {
                     procedureCreatedAt.setOpen();
                     procedureCreatedAt.setExtra("deptoDetails", {
                        ...procedureCreatedAt.deptoDetails,
                        open: false
                     });

                     procedureCreatedAt.signatureByUser(userName ?? "");
                  }).finally(()=>{
                     proccess.setOpen()
                  });
            }
         };
      }

      return null;
   };
   return (
      <div style={{ height: "calc(100vh - 80px)" }}>
         {/* {proccess.spinner <Loading>} */}
         <FormTable
            columns={COLS}
            errorFieldsKey="errorFieldsKey" // row.errorFields = "boxes,year"
            errorDescriptionField="errorDescriptionField" // editable, primera columna
            errorDescriptionPlaceholder="Motivo del rechazo..."
            errorDescriptions={{
               boxes: "Número de cajas incorrecto",
               year: "Año fuera de rango"
            }}
            toolbarActions={procedureCreatedAt.modeTable == "delete" ? [rewiev(), signaturePermissionUser()].filter(Boolean) : []}
            mode={procedureCreatedAt.modeTable}
            initialRows={procedureCreatedAt.editableRows}
            initialSize={30}
            chunkSize={2}

            onSubmit={handleSubmit}
            showRowNum={true}
         />
      </div>
   );
};

export default FormPageProcedure;
