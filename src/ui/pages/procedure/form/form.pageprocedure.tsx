// FormPageProcedure.tsx
import { useMemo, useEffect, Dispatch, SetStateAction, RefObject } from "react";
import useProccessData from "../../../hooks/useProccessData";
import FormTable, { ColumnDef, FormTableHandle } from "../../../formik/FormikInputs/formiktable";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { Procedure } from "../../../../domain/models/procedure/procedure";
import { CustomTableHandle } from "../../../components/table/customtable";
import { Departament } from "../../../../domain/models/departament/departament";

type TablePageProceudreProps = {
   procedureData: GenericDataReturn<Procedure>;
   departamentsData: GenericDataReturn<Departament>;
   editableRows: Procedure[];
   setEditableRows: Dispatch<SetStateAction<Procedure[]>>;
   tableRef: RefObject<CustomTableHandle<Procedure>>;
   modeTable: "create" | "edit" | "view" | "delete" | "editdelete";
   setModeTable: Dispatch<SetStateAction<"create" | "edit" | "view" | "delete" | "editdelete">>;
};

const FormPageProcedure = ({ 
   procedureData, 
   editableRows, 
   setEditableRows, 
   tableRef, 
   departamentsData, 
   modeTable,
   setModeTable
}: TablePageProceudreProps) => {
   const { items, request } = useProccessData();

   useEffect(() => {
      request({ method: "GET", url: `proccess/processbyuser` });
   }, []);

   const COLS = useMemo<ColumnDef[]>(
      () => [
         { field: "boxes", headerName: "Cajas", width: 90 },
         {
            field: "process_id",
            headerName: "Título expediente",
            width: 220,
            type: "autocomplete",
            options: items,
            idKey: "id",
            labelKey: "name",
            selectableKey: "selectable"
         },
         { field: "year", headerName: "Año", type: "number", width: 100, min: 1900, max: 2100, step: 1 },
         { field: "startDate", headerName: "Fecha inicio", width: 140, type: "date" },
         { field: "endDate", headerName: "Fecha final", width: 140, type: "date" },
         { field: "description", headerName: "Descripción", width: 200 },
         { field: "totalPages", headerName: "Total fojas", width: 110, type: "number", min: 0 },
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
         { field: "retention_period_current", headerName: "at", type: "number", width: 100, min: 0,  step: 1 },
         { field: "retention_period_archive", headerName: "ac", type: "number", width: 100, min: 0, step: 1 },

        
         {
            field: "ubicat",
            headerName: "Ubicación en archivo de tramite",
            width: 260,
            type: "checkboxgroup",
            
            items: [
               { value: true, label: "Inmueble", field: "location_building" },
               { value: true, label: "Mueble", field: "location_furniture" },
               { value: true, label: "Posición", field: "location_position" }
            ]
         },
         { field: "observation", headerName: "Observaciones", type: "text", width: 200 }
      ],
      [items]
   );

   const handleSubmit = (rows: Record<string, any>[]) => {
      console.log("Rows to save:", rows);

      if (modeTable === "delete") {
         // En modo delete, enviar solo las filas con errores

         procedureData.postItem(rows as Procedure[]);
      } else {
         procedureData.postItem(rows as Procedure[]);
      }

      setEditableRows([]);
      setModeTable("create"); // ← resetear modo al cerrar

      tableRef.current?.clearSelection();
   };

   const handleErrorChange = (errors: { rowIndex: number; fields: string[]; description?: string }[]) => {
      
      // Aquí puedes actualizar algún estado si necesitas
      // Por ejemplo, para mostrar un contador de errores
   };

   
   return (
      <div style={{ height: "calc(100vh - 80px)" }}>
         <FormTable
            columns={COLS}
            errorFieldsKey="errorFieldsKey" // row.errorFields = "boxes,year"
            errorDescriptionField="errorDescriptionField" // editable, primera columna
            errorDescriptionPlaceholder="Motivo del rechazo..."
            errorDescriptions={{
               boxes: "Número de cajas incorrecto",
               year: "Año fuera de rango"
               // ...
            }}
            selectionActions={[
               {
                  label: modeTable === "delete" ? "Rechazar selección" : "Guardar selección",
                  color: modeTable === "delete" ? "#dc2626" : "#4f46e5",
                  onClick: (indices, rows) => {
                     // console.log("Filas seleccionadas:", rows);
                     // if (modeTable === "delete") {
                     //    // En modo delete, marcar todas las celdas de las filas seleccionadas
                     //    console.log("Filas a rechazar:", rows);
                     //    // Aquí podrías enviarlas directamente o mostrar confirmación
                     // }
                     // tableRef.current?.clearSelection();
                  }
               }
            ]}
            mode={modeTable}
            initialRows={editableRows}
            initialSize={30}
            chunkSize={2}
            onSubmit={handleSubmit}
            onErrorChange={handleErrorChange}
            showRowNum={true}
         />
      </div>
   );
};

export default FormPageProcedure;