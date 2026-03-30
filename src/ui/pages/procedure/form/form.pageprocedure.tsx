// FormPageProcedure.tsx
import { useMemo, useEffect, Dispatch, SetStateAction, RefObject } from "react";
import useProccessData from "../../../hooks/useProccessData";
import FormTable, { ColumnDef, FormTableHandle } from "../../../formik/FormikInputs/formiktable";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { Procedure } from "../../../../domain/models/procedure/procedure";
import { CustomTableHandle } from "../../../components/table/customtable";
import { Departament } from "../../../../domain/models/departament/departament";
import { ProceduresCreatedAt } from "../../../../domain/models/procedurecreatedat/procedure_created_at";
import { accessCreateProcedure } from "../utils/utils.pageprocedure";

type TablePageProceudreProps = {
   procedureData: GenericDataReturn<Procedure>;
   departamentsData: GenericDataReturn<Departament>;
   editableRows: Procedure[];
   signatureByUser: Dispatch<SetStateAction<string>>;
   setEditableRows: Dispatch<SetStateAction<Procedure[]>>;
   tableRef: RefObject<CustomTableHandle<Procedure>>;
   modeTable: "create" | "edit" | "view" | "delete" | "editdelete";
   setModeTable: Dispatch<SetStateAction<"create" | "edit" | "view" | "delete" | "editdelete">>;
   procedureCreatedAt: GenericDataReturn<ProceduresCreatedAt>;
   setDeptoDetails: Dispatch<SetStateAction<{ open: boolean; name: string }>>;
};

const FormPageProcedure = ({
   procedureData,
   editableRows,
   setEditableRows,
   tableRef,
   departamentsData,
   procedureCreatedAt,
   modeTable,
   setModeTable,
   signatureByUser,
   setDeptoDetails
}: TablePageProceudreProps) => {
   const { items, request } = useProccessData();

   useEffect(() => {
      request({ method: "GET", url: `proccess/processbyuser` });
   }, []);

   const COLS = useMemo<ColumnDef[]>(
      () => [
         { field: "boxes", headerName: "Cajas", width: 90, required: true },
         {
            field: "process_id",
            headerName: "Título expediente",
            width: 220,
            type: "autocomplete",
            options: items,
            idKey: "id",
            labelKey: "name",
            selectableKey: "selectable",
            required: true,
            onChange(value, ctx) {
               // ctx.setField('');
               if (!accessCreateProcedure(procedureCreatedAt.items, items, value)) {
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
      console.log("empezamos aqui", procedureData.open, procedureData.constants.startDate);

      if (rows.length == 0) {
         return;
      }

      const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

      if (modeTable == "delete") {
         // Modo delete: actualizar status_id a 5 para todas las filas
         const updatedRows = rows.map((row) => ({
            ...(row as Procedure),
            statu_id: 5
         }));
         procedureData.postItem(updatedRows as Procedure[], false, false).finally(() => {
            procedureCreatedAt.fetchData();
            const startDate = procedureData.constants.startDate || today;
            const departamentId = procedureData.constants.departament_id || 0;
            procedureData.request({
               method: "GET",
               url: `procedure/detailsprocedure/${startDate}/${departamentId}`
            });
         });
      } else {
         // Modo create u otros: comportamiento normal
         procedureData.postItem(rows as Procedure[], false, false).finally(() => {
            procedureCreatedAt.fetchData();
            const startDate = procedureData.constants.startDate || today;
            const departamentId = procedureData.constants.departament_id || 0;
            procedureData.request({
               method: "GET",
               url: `procedure/detailsprocedure/${startDate}/${departamentId}`
            });
         });
      }

      setEditableRows([]);
      setModeTable("create"); // ← resetear modo al cerrar
      tableRef.current?.clearSelection();
   };

type SignatureAction = {
   color: string;
   label: string;
   onClick: () => void;
} | null;

const signaturePermissionUser = (): SignatureAction => {
   const authId = localStorage.getItem("auth_id");
   const userName = localStorage.getItem("name");

   if (Number(procedureCreatedAt.constants.user_id) === Number(authId)) {
      return {
         color: "#030500",
         label: "Firmar",
         onClick: () => {
            procedureCreatedAt.request({
               method: "POST",
               url: "signature/byuser",
               // getData: false,
               getData:true,
               data: {
                  user_id: procedureCreatedAt.constants.user_id
               }
            }).then(()=>{
               procedureData.setOpen()
              setDeptoDetails(prev=>({
               ...prev,
               open:false,
              }))
               console.log("aqui")
               signatureByUser(userName ?? "");
            });
         }
      };
   }

   return null;
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
            toolbarActions={
               modeTable == "delete"
                  ? [
                       {
                          label: "Marcar como revisado",
                          color: "#059669",
                          icon: <svg>...</svg>,
                          onClick: (rows) => {
                             procedureData
                                .request({
                                   method: "POST",
                                   url: `procedure/changestatus`,
                                   data: {
                                      status: 3,
                                      startDate: String(procedureData.constants.startDate),
                                      departament_id: procedureData.constants.departament_id
                                   },
                                   getData: false
                                })
                                .finally(() => {
                                   procedureData.setOpen();
                                   const today = new Date().toISOString().split("T")[0];
                                   procedureCreatedAt.fetchData();
                                   procedureData.request({
                                      method: "GET",
                                      url: `procedure/detailsprocedure/${procedureData.constants.startDate ?? today}/${procedureData.constants.departament_id}`
                                   });
                                });
                          }
                       },
                       signaturePermissionUser()
                    ].filter(Boolean)
                  : []
            }
            mode={modeTable}
            initialRows={editableRows}
            initialSize={30}
            chunkSize={2}
            onSubmit={handleSubmit}
            // onErrorChange={handleErrorChange}
            showRowNum={true}
         />
      </div>
   );
};

export default FormPageProcedure;
