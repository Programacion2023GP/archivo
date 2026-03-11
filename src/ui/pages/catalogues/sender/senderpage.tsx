import { useEffect, useMemo } from "react";
import { CustomButton } from "../../../components/button/custombuttom";
import CompositePage from "../../../components/compositecustoms/compositePage";
import CustomTable from "../../../components/table/customtable";
import FormikForm from "../../../formik/Formik";
import {  FormikInput } from "../../../formik/FormikInputs/FormikInput";
import { CiEdit } from "react-icons/ci";
import { VscDiffAdded } from "react-icons/vsc";
import { FaPlus, FaTrash } from "react-icons/fa";
import { LuRefreshCcw } from "react-icons/lu";
import { showConfirmationAlert, showToast } from "../../../../sweetalert/Sweetalert";
import * as Yup from "yup";
import { PermissionRoute } from "../../../../App";
import { Doctor } from "../../../../domain/models/doctor/dependence";
import { useGenericStore } from "../../../../store/generic/generic.store";
import { GenericApi } from "../../../../infrastructure/generic/infra.generic";
import { Senders } from "../../../../domain/models/senders/senders.model";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import CustomDataDisplay from "../../../components/movil/view/customviewmovil";
import { senderMovilView } from "./infomovilsender";
import { FloatingActionButton } from "../../../components/movil/button/custombuttommovil";

const PageSender = () => {
      const useSenders = useMemo(
          () =>
             useGenericStore<Senders>({
                id: 0,
                name:"",
                active:true
             }),
          []
       );
   const { fetchData, items, loading, setPrefix, request,open,setOpen,initialValues,postItem,removeItemData,handleChangeItem } = useSenders();

   const SendersApi = new GenericApi<Senders>();
   useEffect(() => {
      setPrefix("sender");
      fetchData(SendersApi);
   }, []);
   const validationSchema = Yup.object({
      name: Yup.string().required("remitente es requerido"),
   });
   const responsive = {
      "2xl": 12,
      xl: 12,
      lg: 12,
      md: 12,
      sm: 12
   };
 
 
   return (
      <CompositePage
         formDirection="modal"
         onClose={setOpen}
         isOpen={open}
         modalTitle="Remitente"
         // tableDirection="izq"
         form={() => (
            <div className="pt-4">
               {/* <Typography variant="h2" className="mb-2" size="lg" >Dependencia</Typography> */}
               <FormikForm
                  validationSchema={validationSchema}
                  buttonMessage={initialValues.id > 0 ? "Actualizar" : "Registrar"}
                  initialValues={initialValues}
                  children={() => (
                     <>
                        <FormikInput name="name" label="Nombre" responsive={responsive} />
                     </>
                  )}
                  onSubmit={(values) => {
                     postItem(values as Senders, SendersApi);
                  }}
               />
            </div>
         )}
         table={() => (
            <>
            <div className="absolute z-20 right-2 bottom-2">
                              <FloatingActionButton
                                 onClick={() => {
                                    setOpen();
                                 }}
                                 icon={<FaPlus />}
                                 color="primary"
                                 size="normal"
                              />
                           </div>
               <CustomTable
                  headerActions={() => (
                     <>
                        <PermissionRoute requiredPermission={"catalogo_remitente_crear"}>
                           <CustomButton onClick={setOpen}>
                              {" "}
                              <VscDiffAdded />
                           </CustomButton>
                        </PermissionRoute>

                        <CustomButton
                           color="purple"
                           onClick={() => {
                              fetchData(SendersApi);
                           }}
                        >
                           {" "}
                           <LuRefreshCcw />
                        </CustomButton>
                     </>
                  )}
                  data={items}
                  paginate={[10, 25, 50]}
                  conditionExcel={"catalogo_remitente_exportar"}
                  loading={loading}
                  columns={[
                     {
                        field: "name",
                        headerName: "nombre"
                     }
                  ]}
                  actions={(row) => (
                     <>
                        <PermissionRoute requiredPermission={"catalogo_remitente_actualizar"}>
                           <CustomButton
                              size="sm"
                              color="yellow"
                              onClick={() => {
                                 setOpen();
                                 handleChangeItem(row);
                              }}
                           >
                              {" "}
                              <CiEdit />
                           </CustomButton>
                        </PermissionRoute>
                        <PermissionRoute requiredPermission={"catalogo_remitente_eliminar"}>
                           <CustomButton
                              size="sm"
                              color="red"
                              onClick={() => {
                                 showConfirmationAlert(`Eliminar `, { text: "Se eliminara el remitente" }).then((isConfirmed) => {
                                    if (isConfirmed) {
                                       removeItemData(row, SendersApi);
                                    } else {
                                       showToast("La acción fue cancelada.", "error");
                                    }
                                 });
                              }}
                           >
                              {" "}
                              <FaTrash />
                           </CustomButton>
                        </PermissionRoute>
                     </>
                  )}
                  mobileConfig={{
                     listTile: {
                        leading: (user) => (
                           <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-red-500 rounded-full">{user.name?.charAt(0) || "P"}</div>
                        ),
                        title: (user) => <span className="font-semibold">{user.name || "Sin nombre"}</span>
                        // subtitle: (penalty) => <span className="text-gray-600">{penalty.description || "Sin descripción"}</span>
                     },

                     swipeActions: {
                        left: [
                           {
                              icon: <FiTrash2 size={18} />,
                              color: "bg-red-500",
                              action: (row) => {
                                 showConfirmationAlert(`Eliminar`, { text: "Se eliminará el remitente" }).then((isConfirmed) => {
                                    if (isConfirmed) {
                                       removeItemData(row, SendersApi);
                                    } else {
                                       showToast("La acción fue cancelada.", "error");
                                    }
                                 });
                              },
                              hasPermission: "catalogo_remitente_eliminar"
                           }
                        ],
                        right: [
                           {
                              icon: <FiEdit size={18} />,
                              color: "bg-blue-500",
                              action: (row) => {
                                  setOpen();
                                 handleChangeItem(row);
                              },
                              hasPermission: "catalogo_remitente_actualizar"
                           }
                        ]
                     },
                     bottomSheet: {
                        height: 100,
                        showCloseButton: true,
                        builder: (row, onClose) => <CustomDataDisplay data={row} config={senderMovilView} />
                     }
                  }}
               />
            </>
         )}
      />
   );
};

export default PageSender;
