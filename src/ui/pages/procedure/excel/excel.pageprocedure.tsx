import React,{ Dispatch, SetStateAction, useEffect, useState } from "react";
import { Procedure } from "../../../../domain/models/procedure/procedure";
import { GenericDataReturn } from "../../../../hooks/usegenericdata";
import { Cell, Empty, Row, Sheet, Spacer, Workbook } from "../../../components/excel/customexcel";
import CustomModal from "../../../components/modal/modal";
import { DateFormat, formatDatetime } from "../../../../utils/formats";
import { ListAutorized } from "../../../../domain/models/listautorized/listautorized";

type TablePageProceudreProps = {
   procedureData: GenericDataReturn<Procedure>;
   listAutorized: GenericDataReturn<ListAutorized>;
   open: boolean;
   setOpen: Dispatch<SetStateAction<boolean>>;
};

const ExcelPageProcedure = ({ procedureData, open, setOpen, listAutorized }: TablePageProceudreProps) => {
   const [items, setItems] = useState<ListAutorized[]>([]);
   useEffect(() => {
      const init = async () => {
         try {
            const response = await listAutorized.request({
               method: "POST",
               url: "signature/listautorized",
               data: { procedure_id: procedureData?.items[0]?.id },
               getData: false
            });
            setItems(response as ListAutorized[]);
         } catch (error) {
            console?.error("Error:", error);
         }
      };
      init();
   }, [open]);

   const FONDO = "R. AYUNTAMIENTO DE GOMEZ PALACIO, DGO";
   const SECCION = procedureData?.items[0]?.departament || "";
   const REVISO = procedureData?.items[0]?.reviewed_user || "";

   const SERIE = procedureData?.items[0]?.serie || "";
   const FECHA_ENTREGA = formatDatetime(new Date(), true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY);

   const R = "#C41E3A";
   const T = "thin";
   const COLS = [42, 48, 95, 75, 80, 44, 44, 44, 40, 50, 52, 52, 44, 60, 65, 46, 40, 40, 65];
   const N = COLS.length;

   const autorizadosRaw = Array.isArray(items) ? items : items;
   const autorizados = (autorizadosRaw || []).filter((item) => item.signedBy);
   const totalAutorizados = autorizados.length;

   // Obtener URLs de firmas (debes ajustar según tu modelo de datos)
const elaboroSignature = procedureData?.items[0]?.["signature_b64"] || "";
const revisoSignature = procedureData?.items[0]?.["reviewed_signature_b64"] || "";

   // Renderiza la sección de firmas completa
   const renderSignatureSection = () => {
      // Caso sin autorizados
      if (totalAutorizados === 0) {
         return (
            <>
               <Row height={20}>
                  <Cell span={6} bold fontSize={8} border={{ all: R }}>
                     ELABORÓ (20)
                  </Cell>
                  <Empty span={2} />
                  <Cell span={6} bold fontSize={8} border={{ all: R }}>
                     REVISÓ (21)
                  </Cell>
                  <Empty span={2} />
                  <Cell span={3} bold fontSize={8} border={{ all: R }}>
                     AUTORIZÓ (22)
                  </Cell>
               </Row>
               <Row height={40}>
                  <Cell span={6} image={elaboroSignature} border={{ left: R, right: R, top: R }} style={{ height: 40, minHeight: 40 }} />
                  <Empty span={2} />
                  <Cell span={6} image={revisoSignature} border={{ left: R, right: R, top: R }} />
                  <Empty span={2} />
                  <Cell span={3} border={{ left: R, right: R, top: R }} value="" />
               </Row>
               <Row height={46}>
                  <Cell span={6} border={{ left: R, right: R, bottom: R }} value={procedureData?.items[0]?.user_created || ""} />
                  <Empty span={2} />
                  <Cell span={6} border={{ left: R, right: R, bottom: R }} value={REVISO} />
                  <Empty span={2} />
                  <Cell span={3} border={{ left: R, right: R, bottom: R }} value="" />
               </Row>
               <Row height={26}>
                  <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                     NOMBRE Y FIRMA
                  </Cell>
                  <Empty span={2} />
                  <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                     {"NOMBRE Y FIRMA\nRESPONSABLE DE ARCHIVO DE TRÁMITE"}
                  </Cell>
                  <Empty span={2} />
                  <Cell span={3} fontSize={8} border={{ all: R }} wrap>
                     {"NOMBRE Y FIRMA\nTITULAR DE LA UNIDAD ADMINISTRATIVA"}
                  </Cell>
               </Row>
            </>
         );
      }

      // Con al menos un autorizado
      return (
         <>
            {/* Fila de títulos */}
            <Row height={20}>
               <Cell span={6} bold fontSize={8} border={{ all: R }}>
                  ELABORÓ (20)
               </Cell>
               <Empty span={2} />
               <Cell span={6} bold fontSize={8} border={{ all: R }}>
                  REVISÓ (21)
               </Cell>
               <Empty span={2} />
               <Cell span={3} bold fontSize={8} border={{ all: R }}>
                  AUTORIZÓ (22)
               </Cell>
            </Row>

            {/* Fila de imágenes */}
            <Row height={40}>
               <Cell span={6} image={elaboroSignature} border={{ left: R, right: R, top: R }} />
               <Empty span={2} />
               <Cell span={6} image={revisoSignature} border={{ left: R, right: R, top: R }} />
               <Empty span={2} />
               <Cell span={3} image={autorizados[0]?.["signature_b64"] || ""} border={{ left: R, right: R, top: R }} />
            </Row>

            {/* Fila de nombres */}
            <Row height={46}>
               <Cell span={6} border={{ left: R, right: R, bottom: R }} value={procedureData?.items[0]?.user_created || ""} />
               <Empty span={2} />
               <Cell span={6} border={{ left: R, right: R, bottom: R }} value={REVISO} />
               <Empty span={2} />
               <Cell span={3} border={{ left: R, right: R, bottom: R }} wrap value={autorizados[0]?.fullName || autorizados[0]?.name || ""} />
            </Row>

            {/* Fila de etiquetas */}
            <Row height={26}>
               <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                  NOMBRE Y FIRMA
               </Cell>
               <Empty span={2} />
               <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                  {"NOMBRE Y FIRMA\nRESPONSABLE DE ARCHIVO DE TRÁMITE"}
               </Cell>
               <Empty span={2} />
               <Cell span={3} fontSize={8} border={{ all: R }} wrap>
                  {"NOMBRE Y FIRMA\nTITULAR DE LA UNIDAD ADMINISTRATIVA"}
               </Cell>
            </Row>

            {/* Filas adicionales para autorizados restantes */}
            {autorizados.slice(1).map((autorizado, idx) => (
               <React.Fragment key={idx}>
                  <Row height={40}>
                     <Empty span={6} />
                     <Empty span={2} />
                     <Empty span={6} />
                     <Empty span={2} />
                     <Cell span={3} image={autorizado?.["signature_b64"] || ""} border={{ left: R, right: R, top: R }} />
                  </Row>
                  <Row height={46}>
                     <Empty span={6} />
                     <Empty span={2} />
                     <Empty span={6} />
                     <Empty span={2} />
                     <Cell span={3} border={{ left: R, right: R, bottom: R }} wrap value={autorizado.fullName || autorizado.name || ""} />
                  </Row>
                  <Row height={26}>
                     <Empty span={6} />
                     <Empty span={2} />
                     <Empty span={6} />
                     <Empty span={2} />
                     <Cell span={3} fontSize={8} border={{ all: R }} wrap>
                        {"NOMBRE Y FIRMA\nTITULAR DE LA UNIDAD ADMINISTRATIVA"}
                     </Cell>
                  </Row>
               </React.Fragment>
            ))}
         </>
      );
   };

   return (
      <CustomModal isOpen={open} onClose={() => setOpen(!open)} title={""}>
         <Workbook zoom={150} fileName="archivo_tramite?.xlsx" title="Inventario General de Archivo de Trámite" subtitle={FONDO}>
            <Sheet name="Archivo Trámite" colWidths={COLS} >
               {/* Encabezados (sin cambios) */}
               <Row height={26}>
                  <Cell span={N} bold fontSize={13} bg={R} color="#fff">
                     ARCHIVO DE TRÁMITE
                  </Cell>
               </Row>
               <Row height={22}>
                  <Cell span={N} bold fontSize={10} bg={R} color="#fff">
                     INVENTARIO GENERAL DE ARCHIVO DE TRÁMITE
                  </Cell>
               </Row>
               <Row height={18}>
                  <Cell span={N} align="left" border={T} fontSize={9}>
                     <b>FONDO:</b> {FONDO}
                  </Cell>
               </Row>
               <Row height={16}>
                  <Cell span={N} align="left" border={T} fontSize={9}>
                     <b>SECCIÓN:</b> {SECCION}
                  </Cell>
               </Row>
               <Row height={16}>
                  <Cell span={N} align="left" border={T} fontSize={9}>
                     <b>SERIE:</b> {SERIE}
                  </Cell>
               </Row>

               {/* Cabecera de tabla (sin cambios) */}
               <Row height={38}>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"NÚM.\nCONSECUTIVO\n(4)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"NÚM.\nEXP.\n(5)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} wrap>
                     {"CÓDIGO DE CLASIFICACIÓN\nCONSECUTIVO (6)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"TÍTULO DEL\nEXP. (7)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"DESCRIPCIÓN\n(8)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"FECHA\nINICIO\n(9)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"FECHA\nFINAL\n(10)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"NÚM.\nTOTAL\nFOJAS\n(11)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} span={2} wrap>
                     {"SOPORTE DOCUMENTAL\n(12)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} span={3} wrap>
                     {"VALORES DOCUMENTALES\n(13)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} span={2} wrap>
                     {"VIGENCIA DOCUMENTAL\n(14)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} span={3} wrap>
                     {"UBICACIÓN EN ARCHIVO\nDE TRÁMITE (15)"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} rowSpan={2} wrap>
                     {"OBSERVACIONES\n(16)"}
                  </Cell>
               </Row>
               <Row height={30}>
                  <Cell bold border={T} fontSize={6.5} wrap>
                     F/S/S/NÚM.EXP/AÑO
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     FÍSICO
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     ELECTRÓNICO
                  </Cell>
                  <Cell bold border={T} fontSize={7} wrap>
                     {"ADMINIS-\nTRATIVO"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} wrap>
                     {"CONTABLE\n/FISCAL"}
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     JURÍDICO
                  </Cell>
                  <Cell bold border={T} fontSize={7} wrap>
                     {"PLAZO DE\nCONSERVACIÓN\nTRÁMITE"}
                  </Cell>
                  <Cell bold border={T} fontSize={7} wrap>
                     {"PLAZO DE\nCONSERVACIÓN\nCONCENTRACIÓN"}
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     INMUEBLE
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     MUEBLE
                  </Cell>
                  <Cell bold border={T} fontSize={7}>
                     POSICIÓN
                  </Cell>
               </Row>

               {/* Datos de procedimientos (sin cambios) */}
               {procedureData.items.map((e, i) => (
                  <Row key={e?.id} height={24}>
                     <Cell border={T} fontSize={9} value={i + 1} />
                     <Cell border={T} fontSize={9} value={e?.fileNumber} />
                     <Cell border={T} fontSize={9} align="left" value={e?.archiveCode} />
                     <Cell border={T} fontSize={9} align="left" wrap value={e?.process} />
                     <Cell border={T} fontSize={9} align="left" wrap value={e?.description} />
                     <Cell border={T} fontSize={9} value={formatDatetime(e?.startDate, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY) as string} />
                     <Cell border={T} fontSize={9} value={formatDatetime(e?.endDate, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY) as string} />
                     <Cell border={T} fontSize={9} value={e?.totalPages} />
                     <Cell border={T} fontSize={9} value={e?.fisic ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.electronic ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.administrative_value ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.accounting_fiscal_value ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.legal_value ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.retention_period_current ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.retention_period_archive ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.location_building ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.location_furniture ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} value={e?.location_position ? "✓" : "X"} />
                     <Cell border={T} fontSize={9} align="left" wrap value={e?.observation} />
                  </Row>
               ))}

               <Spacer height={14} />

               {/* Sección de firmas */}
               {renderSignatureSection()}

               <Spacer height={10} />
               <Row height={20}>
                  <Empty span={14} />
                  <Cell span={6} bold fontSize={8} border={{ all: R }}>
                     {`FECHA DE ENTREGA: ${FECHA_ENTREGA}  (23)`}
                  </Cell>
               </Row>
               <Spacer height={6} />
            </Sheet>
         </Workbook>
      </CustomModal>
   );
};

export default ExcelPageProcedure;
