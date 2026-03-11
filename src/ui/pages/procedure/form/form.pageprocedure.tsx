// FormPageProcedure.tsx
import { useMemo, useEffect, Dispatch, SetStateAction, RefObject } from "react";
import useProccessData from "../../../hooks/useProccessData";
import FormTable, { ColumnDef, FormTableHandle } from "../../../formik/FormikInputs/formiktable";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { Procedure } from "../../../../domain/models/procedure/procedure";
type TablePageProceudreProps = {
   procedureData: GenericDataReturn<Procedure>;
   editableRows: Procedure[];
   setEditableRows: Dispatch<SetStateAction<Procedure[]>>;
      tableRef: RefObject<FormTableHandle>;
   
};
const FormPageProcedure = ({ procedureData, editableRows, setEditableRows,tableRef }: TablePageProceudreProps) => {
   const { items, request } = useProccessData();

   useEffect(() => {
      request({ method: "GET", url: `proccess/processbyuser` });
   }, []);

   const COLS = useMemo<ColumnDef[]>(
      () => [
         // { field: "id", headerName: "Nº Consecutivo", width: 140, },
         { field: "boxes", headerName: "Cajas", width: 90 },
         { field: "fileNumber", headerName: "Expediente", width: 130 },
         { field: "archiveCode", headerName: "Cód. Archivística", width: 160, uppercase: true },
         { field: "startDate", headerName: "Fecha inicio", width: 140, type: "date" },
         { field: "endDate", headerName: "Fecha final", width: 140, type: "date" },
         { field: "description", headerName: "Descripción", width: 200 },
         {
            field: "process_id",
            headerName: "Título expediente",
            width: 220,
            type: "autocomplete",
            options: items,
            idKey: "id",
            labelKey: "name"
         },
         { field: "totalPages", headerName: "Total fojas", width: 110, type: "number", min: 0 },

         {
            field: "support", // campo base (no se usa directamente)
            headerName: "Soporte documental",
            width: 260,
            type: "checkboxgroup",
            items: [
               { value: true, label: "Electronico", field: "electronic" },
               { value: true, label: "Digital", field: "digital" }
            ]
         },
         {
            field: "location", // campo base (no se usa directamente)
            headerName: "Ubicación en archivo de concentración",
            width: 260,
            type: "checkboxgroup",
            items: [
               { value: true, label: "Bateria", field: "batery" },
               { value: true, label: "Anaquel", field: "shelf" },
               { value: true, label: "Nivel", field: "level" }
            ]
         },
         { field: "stock", headerName: "Caja", width: 130 },

         { field: "observation", headerName: "Observaciones", type: "text", width: 200 }
      ],
      [items]
   ); // Solo depende de items (si cambia, se actualiza)

   const handleSubmit = (rows: Record<string, any>[]) => {
      // Filtrar filas que tengan folio y expediente (ejemplo)
      setEditableRows((prev) => []);
      tableRef?.current?.resetAllCheckboxes()
      procedureData.postItem(rows as Procedure[]);
      // Aquí llamas a tu API
   };

   return (
      <div style={{ height: "calc(100vh - 80px)" }}>
         <FormTable columns={COLS} initialRows={editableRows} initialSize={30} chunkSize={2} onSubmit={handleSubmit} />
      </div>
   );
};

export default FormPageProcedure;

// { field: "totalPages", headerName: "Total fojas", type: "number",
//   compute: (row) => (row.boxes ?? 0) * (row.pagesPerBox ?? 0)
// }
//  onChange: async (val, { setField, row }) => {
//     if (!val) return;
//     const data = await fetchProcess(val);          // tu petición HTTP
//     setField("description", data.title);
//     setField("totalPages",  data.total_pages);
//     setField("endDate",     data.end_date);
//   }
