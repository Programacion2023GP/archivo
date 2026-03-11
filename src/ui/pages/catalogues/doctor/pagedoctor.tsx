import { useEffect } from "react";
import { CustomButton } from "../../../components/button/custombuttom";
import CompositePage from "../../../components/compositecustoms/compositePage";
import CustomTable from "../../../components/table/customtable";
import FormikForm from "../../../formik/Formik";
import { FormikColorPicker, FormikInput } from "../../../formik/FormikInputs/FormikInput";
import { CiEdit } from "react-icons/ci";
import { VscDiffAdded } from "react-icons/vsc";
import { FaPlus, FaTrash } from "react-icons/fa";
import { LuRefreshCcw } from "react-icons/lu";
import { showConfirmationAlert, showToast } from "../../../../sweetalert/Sweetalert";
import * as Yup from "yup";
import { PermissionRoute } from "../../../../App";
import { useDoctorStore } from "../../../../store/doctor/doctor.store";
import { DoctorApi } from "../../../../infrastructure/doctor/doctor.infra";
import { Doctor } from "../../../../domain/models/doctor/dependence";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import CustomDataDisplay from "../../../components/movil/view/customviewmovil";
import { doctorMovilView } from "./infomovildoctor";
import { FloatingActionButton } from "../../../components/movil/button/custombuttommovil";
type Producto = {
   id: string;
   nombre: string;
   precio: number;
   children?: Producto[]; // <-- campo que contiene los hijos
};
const PageDoctor = () => {
const data: Producto[] = [
   {
      id: "1",
      nombre: "Vehículos",
      precio: 0,
      children: [
         {
            id: "1-1",
            nombre: "Chevrolet",
            precio: 0,
            children: [
               { id: "1-1-1", nombre: "AMIX", precio: 20000 },
               { id: "1-1-2", nombre: "Tracker", precio: 25000 },
               { id: "1-1-3", nombre: "Onix", precio: 18000 }
            ]
         },
         {
            id: "1-2",
            nombre: "Ford",
            precio: 0,
            children: [
               { id: "1-2-1", nombre: "Fiesta", precio: 22000 },
               { id: "1-2-2", nombre: "Focus", precio: 26000 }
            ]
         },
         {
            id: "1-3",
            nombre: "Nissan",
            precio: 0,
            children: [
               { id: "1-3-1", nombre: "Versa", precio: 21000 },
               { id: "1-3-2", nombre: "Sentra", precio: 27000 }
            ]
         }
      ]
   },

   {
      id: "2",
      nombre: "Alimentos",
      precio: 0,
      children: [
         {
            id: "2-1",
            nombre: "Lácteos",
            precio: 0,
            children: [
               { id: "2-1-1", nombre: "Leche", precio: 2 },
               { id: "2-1-2", nombre: "Queso", precio: 4 },
               { id: "2-1-3", nombre: "Yogurt", precio: 3 }
            ]
         },
         {
            id: "2-2",
            nombre: "Carnes",
            precio: 0,
            children: [
               { id: "2-2-1", nombre: "Pollo", precio: 6 },
               { id: "2-2-2", nombre: "Res", precio: 10 }
            ]
         },
         {
            id: "2-3",
            nombre: "Frutas",
            precio: 0,
            children: [
               { id: "2-3-1", nombre: "Manzana", precio: 1 },
               { id: "2-3-2", nombre: "Plátano", precio: 1 },
               { id: "2-3-3", nombre: "Naranja", precio: 1 }
            ]
         }
      ]
   },

   {
      id: "3",
      nombre: "Electrónica",
      precio: 0,
      children: [
         {
            id: "3-1",
            nombre: "Computadoras",
            precio: 0,
            children: [
               { id: "3-1-1", nombre: "Laptop", precio: 800 },
               { id: "3-1-2", nombre: "PC Escritorio", precio: 1200 }
            ]
         },
         {
            id: "3-2",
            nombre: "Celulares",
            precio: 0,
            children: [
               { id: "3-2-1", nombre: "Samsung", precio: 700 },
               { id: "3-2-2", nombre: "iPhone", precio: 1200 }
            ]
         }
      ]
   },

   {
      id: "4",
      nombre: "Ropa",
      precio: 0,
      children: [
         {
            id: "4-1",
            nombre: "Hombre",
            precio: 0,
            children: [
               { id: "4-1-1", nombre: "Playera", precio: 15 },
               { id: "4-1-2", nombre: "Pantalón", precio: 25 }
            ]
         },
         {
            id: "4-2",
            nombre: "Mujer",
            precio: 0,
            children: [
               { id: "4-2-1", nombre: "Blusa", precio: 18 },
               { id: "4-2-2", nombre: "Vestido", precio: 40 }
            ]
         }
      ]
   },

   {
      id: "5",
      nombre: "Hogar",
      precio: 0,
      children: [
         {
            id: "5-1",
            nombre: "Muebles",
            precio: 0,
            children: [
               { id: "5-1-1", nombre: "Sofá", precio: 500 },
               { id: "5-1-2", nombre: "Mesa", precio: 200 }
            ]
         },
         {
            id: "5-2",
            nombre: "Electrodomésticos",
            precio: 0,
            children: [
               { id: "5-2-1", nombre: "Refrigerador", precio: 900 },
               { id: "5-2-2", nombre: "Microondas", precio: 150 }
            ]
         }
      ]
   }
];

   return (
      <CustomTable
         data={data}
         columns={[
            { field: "nombre", headerName: "Producto" },
            { field: "precio", headerName: "Precio" }
         ]}
         childrenField="children"
         rowIdField="id"
         paginate={[10, 20, 30]}
         actions={(row) => <CustomButton variant="outline">{row.id}</CustomButton>}
      />
   );
};

export default PageDoctor;
