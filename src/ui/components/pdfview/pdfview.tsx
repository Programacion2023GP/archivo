import React, { useState, useEffect, ReactElement, useCallback, useRef } from "react";
import { PDFViewer, PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import Spinner from "../loading/loading";

interface PdfPreviewProps {
   name: string;
   children: ReactElement;
}
export default function PdfPreview({ name, children }: PdfPreviewProps) {
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) {
      return <Spinner  />;
   }

   return (
      <div style={{ width: "100%", height: "100vh" }}>
         <BlobProvider document={children}>
            {({ blob, url, loading, error }) => {
               if (loading) {
                  return (
                     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                        <Spinner />
                     </div>
                  );
               }

               if (error) {
                  return <div>Error al generar el PDF</div>;
               }

               return (
                  <>
                     <div style={{ marginBottom: "1rem", padding: "0.5rem" }}>
                        <a
                           href={url || ""}
                           download={`${name || "sin-id"}.pdf`}
                           style={{
                              textDecoration: "none",
                              padding: "0.5rem 1rem",
                              backgroundColor: "#9B2242",
                              color: "white",
                              borderRadius: "4px",
                              display: "inline-block"
                           }}
                        >
                           📄 Descargar Acta de Infracción
                        </a>
                     </div>
                     <iframe src={url || ""} style={{ width: "100%", height: "90%", border: "none" }} title="Vista previa del PDF" />
                  </>
               );
            }}
         </BlobProvider>
      </div>
   );
}
