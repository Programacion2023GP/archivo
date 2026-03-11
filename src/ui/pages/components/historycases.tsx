import { useEffect, useState } from "react";
import { AlcoholCase } from "../../../domain/models/casesalcohol/casealcohol.model";
import { GetAxios } from "../../../axios/Axios";
import CustomModal from "../../components/modal/modal";
import CustomTable from "../../components/table/customtable";
import PhotoZoom from "../../components/images/images";
import { DateFormat, formatDatetime } from "../../../utils/formats";

const CustomHistoryCase = ({ id, open, setOpen }: { id: AlcoholCase["id"]; open: boolean; setOpen: () => void }) => {
   const [history, setHistory] = useState({
      data: [],
      loading: false
   });
   const init = async () => {
      setHistory((prev) => ({
         ...prev,
         loading: true
      }));

      try {
      

       if (id== null) {
          return;
       }
         const res = await GetAxios(`penalties/historial/${id}`);

         setHistory((prev) => ({
            ...prev,
            data: res?.data
         }));
      } catch (error) {
         console.error(error);
      } finally {
         setHistory((prev) => ({
            ...prev,
            loading: false
         }));
      }
   };

   useEffect(() => {
      init()
   }, [id]);
   useEffect(()=>{
   },[history])
   return (
      <CustomModal  title={`Historial del detenido`} isOpen={open} onClose={() => setOpen()}>
         <CustomTable
            conditionExcel={"multas_exportar"}
            loading={history.loading}
            data={history.data as any}
            paginate={[5, 10, 25, 50]}
            columns={[
               { field: "id", headerName: "Folio", visibility: "always" },
               { field: "name", headerName: "Nombre del detenido", visibility: "always" },
               { field: "detainee_released_to", headerName: "Persona que acudio", visibility: "always" },
               {
                  field: "image_penaltie",
                  visibility: "expanded",
                  headerName: "Foto Multa",
                  renderField: (value) => <PhotoZoom src={value} alt={value} />
               },
               {
                  field: "images_evidences",
                  headerName: "Foto evidencia del ciudadano",
                  visibility: "expanded",
                  renderField: (value) => <PhotoZoom src={value} alt={value} />
               },
               { field: "doctor", headerName: "Doctor", visibility: "expanded" },
               { field: "cedula", headerName: "Cedula del doctor", visibility: "expanded" },
               {
                  field: "time",
                  headerName: "Hora",
                  visibility: "always",
                  renderField: (v) => <>{formatDatetime(`2025-01-01 ${v}`, true, DateFormat.H_MM_SS_A)}</>,
                  getFilterValue: (v) => formatDatetime(`2025-01-01 ${v}`, true, DateFormat.H_MM_SS_A)
               },
               {
                  field: "date",
                  headerName: "Fecha",
                  visibility: "always",
                  renderField: (v) => <>{formatDatetime(v, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)}</>,
                  getFilterValue: (v) => formatDatetime(v, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY)
               },
               { field: "person_contraloria", headerName: "Contraloría", visibility: "expanded" },
               { field: "oficial_payroll", headerName: "Nómina Oficial", visibility: "expanded" },
               { field: "person_oficial", headerName: "Oficial", visibility: "expanded" },
               { field: "vehicle_service_type", headerName: "Tipo de Servicio Vehicular", visibility: "expanded" },
               { field: "alcohol_concentration", headerName: "Concentración Alcohol", visibility: "expanded" },
               { field: "group", headerName: "Grupo", visibility: "expanded" },
               { field: "municipal_police", headerName: "Policía Municipal", visibility: "expanded" },
               { field: "civil_protection", headerName: "Protección Civil", visibility: "expanded" },
               { field: "command_vehicle", headerName: "Vehículo Comando", visibility: "expanded" },
               { field: "command_troops", headerName: "Tropa Comando", visibility: "expanded" },
               { field: "command_details", headerName: "Detalles Comando", visibility: "expanded" },
               { field: "filter_supervisor", headerName: "Supervisor Filtro", visibility: "expanded" },
               { field: "cp", headerName: "Código Postal", visibility: "always" },
               { field: "city", headerName: "Ciudad", visibility: "always" },
               { field: "age", headerName: "Edad", visibility: "expanded" },
               { field: "amountAlcohol", headerName: "Cantidad Alcohol", visibility: "expanded" },
               { field: "number_of_passengers", headerName: "Número de Pasajeros", visibility: "expanded" },
               { field: "plate_number", headerName: "Número de Placa", visibility: "expanded" },
               { field: "detainee_phone_number", headerName: "Teléfono del Detenido", visibility: "expanded" },
               { field: "curp", headerName: "CURP", visibility: "expanded" },
               { field: "observations", headerName: "Observaciones", visibility: "expanded" },
               { field: "created_by_name", headerName: "Creado Por", visibility: "expanded" },
               {
                  field: "active",
                  headerName: "Activo",
                  renderField: (v) => (
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {v ? "Activo" : "Desactivado"}
                     </span>
                  )
               }
            ]}
            // columns={tableColumns}
         />
      </CustomModal>
   );
};
export default CustomHistoryCase;