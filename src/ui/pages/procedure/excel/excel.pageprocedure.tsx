import { Dispatch, SetStateAction } from "react";
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
   const FONDO = "R. AYUNTAMIENTO DE GOMEZ PALACIO, DGO";
   const SECCION = procedureData?.items[0]?.departament || "";
   const SERIE = procedureData?.items[0]?.serie || "";
   const LEYENDA = "EL PRESENTE INVENTARIO CONSTA DE 1 HOJA Y AMPARA LA CANTIDAD DE 3 EXPEDIENTES DE LOS AÑOS EXTREMOS 2024-2025";
   const FECHA_ENTREGA = "PENDIENTE";

   const R = "#C41E3A";
   const T = "thin";
   const COLS = [42, 48, 95, 75, 80, 44, 44, 44, 40, 50, 52, 52, 44, 60, 65, 46, 40, 40, 65];
   const N = COLS.length;

   // Filtrar usuarios que firmaron (signedBy = true)
   // Usamos fullName en lugar de name
   const autorizados = listAutorized?.items?.filter((item) => item.signedBy === true) || [];

   return (
      <CustomModal
         isOpen={open}
         onClose={() => {
            setOpen(!open);
         }}
         title={""}
      >
         <Workbook zoom={150} fileName="archivo_tramite.xlsx" title="Inventario General de Archivo de Trámite" subtitle={FONDO}>
            <Sheet name="Archivo Trámite" colWidths={COLS} freeze={7}>
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
                     <b>FONDO:</b>
                     {"  " + FONDO}
                  </Cell>
               </Row>
               <Row height={16}>
                  <Cell span={N} align="left" border={T} fontSize={9}>
                     <b>SECCIÓN:</b>
                     {"  " + SECCION}
                  </Cell>
               </Row>
               <Row height={16}>
                  <Cell span={N} align="left" border={T} fontSize={9}>
                     <b>SERIE:</b>
                     {"  " + SERIE}
                  </Cell>
               </Row>
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
               {procedureData.items.map((e, i) => (
                  <Row key={e.id} height={24}>
                     <Cell border={T} fontSize={9}>
                        {i + 1}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.fileNumber}
                     </Cell>
                     <Cell border={T} fontSize={9} align="left">
                        {e.archiveCode}
                     </Cell>
                     <Cell border={T} fontSize={9} align="left" wrap>
                        {e.process}
                     </Cell>
                     <Cell border={T} fontSize={9} align="left" wrap>
                        {e.description}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {formatDatetime(e.startDate, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY) as string}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {formatDatetime(e.endDate, true, DateFormat.DDDD_DD_DE_MMMM_DE_YYYY) as string}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.totalPages}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.fisic ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.electronic ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.administrative_value ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.accounting_fiscal_value ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.legal_value ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.retention_period_current ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.retention_period_archive ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.location_building ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.location_furniture ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9}>
                        {e.location_position ? "✓" : "X"}
                     </Cell>
                     <Cell border={T} fontSize={9} align="left" wrap>
                        {e.observation}
                     </Cell>
                  </Row>
               ))}

               <Spacer height={14} />

               {/* Fila de títulos: ELABORÓ, REVISÓ, AUTORIZÓ (dinámico) */}
               <Row height={20}>
                  <Cell span={6} bold fontSize={8} border={{ all: R }}>
                     ELABORÓ (20)
                  </Cell>
                  <Empty span={2} />
                  <Cell span={6} bold fontSize={8} border={{ all: R }}>
                     REVISÓ (21)
                  </Cell>
                  <Empty span={2} />

                  {/* Títulos dinámicos para cada autorizado */}
                  {autorizados.map((autorizado, index) => (
                     <Cell key={`title-${autorizado.id}`} span={4} bold fontSize={8} border={{ all: R }}>
                        AUTORIZÓ {autorizados.length > 1 ? `(${index + 1})` : "(22)"}
                     </Cell>
                  ))}

                  {/* Si no hay autorizados, mostrar celda por defecto */}
                  {autorizados.length === 0 && (
                     <Cell span={4} bold fontSize={8} border={{ all: R }}>
                        AUTORIZÓ (22)
                     </Cell>
                  )}
               </Row>

               {/* Fila de nombres - CORREGIDO: usar fullName en lugar de name */}
               <Row height={46}>
                  <Cell span={6} border={{ left: R, right: R }}>
                     {procedureData?.items[0]?.user_created || ""}
                  </Cell>
                  <Empty span={2} />
                  <Cell span={6} border={{ left: R, right: R }}>
                     {""}
                  </Cell>
                  <Empty span={2} />

                  {/* Nombres de cada autorizado - USAR fullName */}
                  {autorizados.map((autorizado) => (
                     <Cell key={`name-${autorizado.id}`} span={4} border={{ left: R, right: R }}>
                        {autorizado.fullName || autorizado.name || ""}
                     </Cell>
                  ))}

                  {/* Si no hay autorizados, mostrar celda vacía */}
                  {autorizados.length === 0 && (
                     <Cell span={4} border={{ left: R, right: R }}>
                        {""}
                     </Cell>
                  )}
               </Row>

               {/* Fila de etiquetas: NOMBRE Y FIRMA */}
               <Row height={26}>
                  <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                     NOMBRE Y FIRMA
                  </Cell>
                  <Empty span={2} />
                  <Cell span={6} fontSize={8} border={{ all: R }} wrap>
                     {"NOMBRE Y FIRMA\nRESPONSABLE DE ARCHIVO DE TRÁMITE"}
                  </Cell>
                  <Empty span={2} />

                  {/* Etiquetas para cada autorizado */}
                  {autorizados.map((autorizado) => (
                     <Cell key={`label-${autorizado.id}`} span={4} fontSize={8} border={{ all: R }} wrap>
                        {"NOMBRE Y FIRMA\nTITULAR DE LA UNIDAD ADMINISTRATIVA"}
                     </Cell>
                  ))}

                  {/* Si no hay autorizados, mostrar celda por defecto */}
                  {autorizados.length === 0 && (
                     <Cell span={4} fontSize={8} border={{ all: R }} wrap>
                        {"NOMBRE Y FIRMA\nTITULAR DE LA UNIDAD ADMINISTRATIVA"}
                     </Cell>
                  )}
               </Row>

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
