import { useEffect, useState } from "react";
import { TfiHelpAlt } from "react-icons/tfi";
import { IoMdClose } from "react-icons/io";
import { createPortal } from "react-dom";

type Tutorial = {
   guide: Guide[];
};

export type Guide = {
   afterOpenTutorial?: () => void;
   afterActions?: () => void;
   question: string;
   referenceStart: string; // selector CSS
   response: string;
   action?: () => void;
   steps?: Omit<Guide, "question">[];
};

const CustomTutorial = ({ guide }: Tutorial) => {
   const [open, setOpen] = useState(false);
   const [startGuide, setStartGuide] = useState(false);
   const [currentStep, setCurrentStep] = useState(0);
   const [currentSubStep, setCurrentSubStep] = useState<number | null>(null);
   const [highlight, setHighlight] = useState<DOMRect | null>(null);

   // localizar elemento a resaltar
   useEffect(() => {
      if (startGuide) {
         const stepToShow = currentSubStep !== null ? guide[currentStep].steps?.[currentSubStep] : guide[currentStep];

         if (stepToShow) {
            stepToShow.afterActions?.();
            const el = document.querySelector(stepToShow.referenceStart) as HTMLElement | null;

            if (el) {
               setHighlight(el.getBoundingClientRect());
            }
         }
      }
   }, [startGuide, currentStep, currentSubStep, guide]);

   const nextStep = () => {
      const step = guide[currentStep];

      // Acción del paso actual
      if (currentSubStep !== null) {
         step.steps?.[currentSubStep]?.action?.();
      } else {
         step.action?.();
      }

      // Manejo de pasos internos
      if (step.steps && step.steps.length > 0) {
         if (currentSubStep === null) {
            setCurrentSubStep(0);
            return;
         }
         if (currentSubStep < step.steps.length - 1) {
            setCurrentSubStep((s) => s! + 1);
            return;
         } else {
            // Terminar subtutorial y pasar al siguiente guide
            setCurrentSubStep(null);
         }
      }

      // Avanzar en el tutorial principal
      if (currentStep < guide.length - 1) {
         setCurrentStep((s) => s + 1);
      } else {
         // Finalizar
         setStartGuide(false);
         setOpen(false);
         setCurrentStep(0);
         setCurrentSubStep(null);
      }
   };

   const stepToShow = currentSubStep !== null ? guide[currentStep].steps?.[currentSubStep] : guide[currentStep];

   return (
      <>
         {!startGuide ? (
            <div className="fixed bottom-6 right-6">
               {!open ? (
                  <button
                     onClick={() => setOpen(true)}
                     className="flex hover:cursor-pointer items-center justify-center w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 transition-colors duration-300"
                  >
                     <TfiHelpAlt className="text-2xl" />
                  </button>
               ) : (
                  <div className="w-72 p-4 bg-white rounded-2xl shadow-2xl border border-gray-200">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-cyan-600">Empezar tutorial</h3>
                        <button onClick={() => setOpen(false)} className=" text-gray-500 hover:cursor-pointer hover:text-red-500 transition-colors">
                           <IoMdClose size={22} />
                        </button>
                     </div>

                     <ul className="space-y-2">
                        {guide.map((q, i) => (
                           <li
                              onClick={() => {
                                 q.afterOpenTutorial?.();
                                 setStartGuide(true);
                                 setCurrentStep(i);
                                 setCurrentSubStep(null);
                              }}
                              key={i}
                              className="p-2 rounded-md hover:bg-cyan-50 hover:text-cyan-600 cursor-pointer text-sm transition-colors"
                           >
                              {q.question}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         ) : (
            createPortal(
               <>
                  {/* Overlay oscuro */}
                  <div className="fixed inset-0 bg-black/60 z-[9998]" />

                  {/* Resaltado */}
                  {highlight && (
                     <div
                        className="fixed border-4 border-cyan-400 rounded-lg z-[999] transition-all duration-300"
                        style={{
                           top: highlight.top - 6,
                           left: highlight.left - 6,
                           width: highlight.width + 12,
                           height: highlight.height + 12
                        }}
                     ></div>
                  )}

                  {/* Personaje + bocadillo */}
                  {highlight && stepToShow && (
                     <div
                        className="fixed flex flex-col items-center z-[10000]"
                        style={{
                           top: highlight.bottom + 20,
                           left: highlight.left
                        }}
                     >
                        <div className="flex items-start space-x-3">
                           {/* Avatar */}
                           <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg">
                              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Avatar" className="w-full h-full object-cover" />
                           </div>

                           {/* Bocadillo */}
                           <div className="mt-2 bg-white shadow-lg rounded-xl p-3 w-64 relative">
                              <p className="text-sm text-gray-700">{stepToShow.response}</p>
                              <div className="flex justify-end mt-2">
                                 <button onClick={nextStep} className="px-3 py-1 text-sm hover:cursor-pointer bg-cyan-500 text-white rounded hover:bg-cyan-600">
                                    {currentStep === guide.length - 1 && currentSubStep === (guide[currentStep].steps?.length ?? 1) - 1 ? "Finalizar" : "Siguiente"}
                                 </button>
                              </div>

                              {/* Triángulo del bocadillo */}
                              <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
                           </div>
                        </div>
                     </div>
                  )}
               </>,
               document.body
            )
         )}
      </>
   );
};

export default CustomTutorial;
