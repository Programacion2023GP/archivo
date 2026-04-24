import { Users } from "../../../../domain/models/users/users.domain";
import { RESPONSIVE } from "../../../../utils/compressfiles";
import FTransferList from "../../../components/transferlist/TransferList";
import FormikForm from "../../../formik/Formik";
import { FormikAutocomplete, FormikInput, HandleModifiedFn } from "../../../formik/FormikInputs/FormikInput";
import useDepartamentsData from "../../../hooks/useDepartamentsData";
import usePermissionsData from "../../../hooks/usePermissionsData";
import useUsersData from "../../../hooks/useUsersData";
type FormPageUsersProps = {
   validationSchema: any;
   getEmployed?: HandleModifiedFn; // ✅ el ? lo hace opcional, sin valor default
};
const FormPageUsers = ({validationSchema,getEmployed}: FormPageUsersProps) => {
    const users = useUsersData();
    const permissions = usePermissionsData();
    const departaments = useDepartamentsData();

   return (
      <div className="pt-4">
         <FormikForm
            validationSchema={validationSchema}
            buttonMessage={users.initialValues.id > 0 ? "Actualizar" : "Registrar"}
            initialValues={users.initialValues}
            children={(values, setFieldValue, setTouched, errors, touched) => (
               <>
                  <FormikInput name="payroll" label="Nómina" handleModified={getEmployed} responsive={RESPONSIVE} />{" "}
                  <FormikAutocomplete
                     label="Departamento"
                     name="departament_id"
                     options={departaments.items}
                     loading={departaments.loading}
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
                  <FormikInput name="firstName" label="Nombre" responsive={RESPONSIVE} />
                  <FormikInput name="paternalSurname" label="Apellido Paterno" responsive={RESPONSIVE} />
                  <FormikInput name="maternalSurname" label="Apellido Materno" responsive={RESPONSIVE} />
                  <FTransferList name="permissions" label="Asignar Permissos" departamentos={permissions.items} idKey="id" labelKey="name" />
               </>
            )}
            onSubmit={(values) => {
               users.postItem(values as Users);
            }}
         />
      </div>
   );
};

export default FormPageUsers;