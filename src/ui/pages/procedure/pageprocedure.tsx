import CompositePage from "../../components/compositecustoms/compositePage";

import { useValidators } from "../../validations/validators";
import getEmployed from "../../../utils/employes";
import useUsersData from "../../hooks/useUsersData";
import usePermissionsData from "../../hooks/usePermissionsData";
import useDepartamentsData from "../../hooks/useDepartamentsData";
import TablePageProceudre from "./table/table.pageprocedure";
import FormPageProcedure from "./form/form.pageprocedure";
import useProccessData from "../../hooks/useProccessData";
import useProcedureData from "../../hooks/useProcedureData";
import { useRef, useState } from "react";
import { Procedure } from "../../../domain/models/procedure/procedure";
import { FormTableHandle } from "../../formik/FormikInputs/formiktable";

const PageProcedure = () => {
   const procedure = useProcedureData();
   const [editableRows, setEditableRows] = useState<Procedure[]>([]);
   const tableRef = useRef<FormTableHandle>(null);
   return (
      <>
         <CompositePage
            formDirection="modal"
            onClose={procedure.setOpen}
            isOpen={procedure.open}
            modalTitle="Tramites"
            form={() => <FormPageProcedure tableRef={tableRef} setEditableRows={setEditableRows} procedureData={procedure} editableRows={editableRows} />}
            table={() => <TablePageProceudre tableRef={tableRef} procedureData={procedure} setEditableRows={setEditableRows} editableRows={editableRows} />}
         />
      </>
   );
};
export default PageProcedure;
