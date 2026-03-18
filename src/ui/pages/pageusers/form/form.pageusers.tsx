import { Departament } from "../../../../domain/models/departament/departament";
import { Permissions, Users } from "../../../../domain/models/users/users.domain";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { RESPONSIVE } from "../../../../utils/compressfiles";
import FTransferList from "../../../components/transferlist/TransferList";
import FormikForm from "../../../formik/Formik";
import { FormikAutocomplete, FormikInput } from "../../../formik/FormikInputs/FormikInput";
type FormPageUsersProps = {
   usersData: GenericDataReturn<Users>;
   permissionsData: GenericDataReturn<Permissions>;
   departamentsData: GenericDataReturn<Departament>;
   validationSchema: any;
   getEmployed: (values: Record<string, any>, setFieldValue: (name: string, value: any) => void) => void;
};
const FormPageUsers = ({ usersData,permissionsData,validationSchema,getEmployed,departamentsData}: FormPageUsersProps) => {
   return (
      <div className="pt-4">
         <FormikForm
            validationSchema={validationSchema}
            buttonMessage={usersData.initialValues.id > 0 ? "Actualizar" : "Registrar"}
            initialValues={usersData.initialValues}
            children={(values, setFieldValue, setTouched, errors, touched) => (
               <>
                  <FormikInput name="payroll" label="Nomina" handleModified={getEmployed} responsive={RESPONSIVE} />
                  <FormikAutocomplete
                     label="Departamento"
                     name="departament_id"
                     options={departamentsData.items}
                     loading={departamentsData.loading}
                     responsive={RESPONSIVE}
                     idKey="id"
                     labelKey="name"
                  />
                  <FormikAutocomplete
                     label="Rol"
                     name="role"
                     options={[
                        {
                           id: "Administrativo",
                           name: "Administrativo"
                        },
                        {
                           id: "Director",
                           name: "Director"
                        },
                        {
                           id: "Enlance",
                           name: "Enlance"
                        },
                        {
                           id: "Usuario",
                           name: "Usuario"
                        }
                     ]}
                     responsive={RESPONSIVE}
                     idKey="id"
                     labelKey="name"
                  />
                  <FormikInput name="firstName" label="Nombre"  responsive={RESPONSIVE} />
                  <FormikInput name="paternalSurname" label="Apellido Paterno"  responsive={RESPONSIVE} />
                  <FormikInput name="maternalSurname" label="Apellido Materno"  responsive={RESPONSIVE} />
                  <FTransferList name="permissions" label="Asignar Permissos" departamentos={permissionsData.items} idKey="id" labelKey="name" />
               </>
            )}
            onSubmit={(values) => {
               usersData.postItem(values as Users);
            }}
         />
      </div>
   );
};

export default FormPageUsers;