import type { FormikProps } from "formik";
import { ReactNode } from "react";

export type FormikType = {
   buttonLoading?:boolean;
   validationSchema?: any;
   initialValues: Record<string, any>;
   children: (
      values: Record<string, any>,
      setValue: (name: string, value: any) => void,
      setTouched: (touched: Record<string, boolean>) => void, // Aquí va la corrección
      errors: Record<string, any>,
      touched: Record<string, any>
   ) => React.ReactNode;
   handleActions?: (values: Record<string, any>, setFieldValue: (name: string, value: any, shouldValidate?: boolean) => void) => void;
   buttonMessage?: string;
   onSubmit: (values: Record<string, any>) => void;
   ref?: React.Ref<FormikProps<Record<string, any>>>; // Correcta definición del tipo para refs
   id?: string;
   handleButtonsSubmit?:ReactNode,
};
