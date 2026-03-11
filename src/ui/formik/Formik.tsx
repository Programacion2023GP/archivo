import { Formik, Form, type FormikProps } from "formik";
import { forwardRef, useState } from "react";
import { RowComponent } from "../components/responsive/Responsive";
import type { FormikType } from "./types/FormikType";
import { useWindowSize } from "../../hooks/windossize";
import { CustomButton } from "../components/button/custombuttom";

// FormikForm ahora es un componente de tipo React.FC que usa forwardRef
const FormikForm = forwardRef<FormikProps<Record<string, any>>, FormikType>(
   ({ onSubmit, initialValues, validationSchema, children, buttonMessage, handleActions, id, handleButtonsSubmit,buttonLoading }, ref) => {
      const { width } = useWindowSize();
      const [isLoading, setIsLoading] = useState(false);

      // Determinar si es dispositivo móvil o tablet
      const isMobile = width < 1048; // Tablet: 768px o menos
      const isSmallMobile = width < 768; // Móvil pequeño: 480px o menos

      return (
         <Formik
            innerRef={ref} // Pasamos el ref al Formik usando innerRef
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
               setStatus(1);
               setSubmitting(true);
               setIsLoading(true);
               
               try {
                  await onSubmit(values as Record<string, any>);
               } catch (error) {
                  console.error("Error en submit:", error);
               } finally {
                  setSubmitting(false);
                  setIsLoading(false);
               }
            }}
         >
            {({ isSubmitting, values, setFieldValue, setTouched, errors, touched, submitForm }) => {
               // Si quieres usar el isSubmitting de Formik directamente
               const submitting = isLoading || isSubmitting;

               return (
                  <Form encType="multipart/form-data" className="space-y-4">
                     <RowComponent>{children(values, setFieldValue, setTouched, errors, touched)}</RowComponent>

                     {/* Botón responsivo */}
                     <div
                        className={`
                           flex ${isMobile ? "justify-center sticky bottom-4" : "justify-end"}
                        `}
                     >
                        {buttonMessage && (
                           <CustomButton type="submit" loading={buttonLoading} variant="solid" >
                              {buttonMessage}
                           </CustomButton>
                        )}
                        {handleButtonsSubmit}
                     </div>

                     {isMobile && <div className="h-6"></div>}
                  </Form>
               );
            }}
         </Formik>
      );
   }
);

// Exportamos el componente FormikForm
export default FormikForm;