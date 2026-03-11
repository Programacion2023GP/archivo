import Swal from "sweetalert2";

type ToastIcon = "success" | "error" | "warning" | "info" | "question";


export const showToast = (message: string, icon: ToastIcon = "success") => {
   const isMobileOrTablet = window.innerWidth < 1024;

   // 📌 WEB NORMAL → SweetAlert estándar (top-end) con z-index personalizado
   if (!isMobileOrTablet) {
      // Asegurar que los estilos para web existan
      if (!document.getElementById("web-toast-styles")) {
         const style = document.createElement("style");
         style.id = "web-toast-styles";
         style.innerHTML = `
            .swal2-container.web-toast-container {
               z-index: 9999999 !important;
            }
            .swal2-popup.web-toast-popup {
               z-index: 10000000 !important;
            }
         `;
         document.head.appendChild(style);
      }

      return Swal.fire({
         toast: true,
         position: "top-end",
         icon,
         title: message,
         showConfirmButton: false,
         timer: 3000,
         customClass: {
            container: "web-toast-container", // Clase personalizada para el container
            popup: "web-toast-popup" // Clase personalizada para el popup
         },
         showClass: {
            popup: "swal2-show",
            backdrop: "swal2-backdrop-show"
         },
         hideClass: {
            popup: "swal2-hide",
            backdrop: "swal2-backdrop-hide"
         }
      });
   }

   // 📌 MOVIL + TABLET → Estilo Flutter/Material Design (bottom)
   const materialIcons = {
      success: "✓",
      error: "✕",
      warning: "!",
      info: "i",
      question: "?"
   };

   const materialColors = {
      success: "#4CAF50",
      error: "#F44336",
      warning: "#FF9800",
      info: "#2196F3",
      question: "#9C27B0"
   };

   // Aplicar estilos Flutter (solo una vez)
   if (!document.getElementById("flutter-toast-styles")) {
      const style = document.createElement("style");
      style.id = "flutter-toast-styles";
      style.innerHTML = `
         .swal2-container.flutter-toast-container {
            z-index: 9999999 !important;
         }
         .flutter-toast-mobile {
            z-index: 10000000 !important;
            background: #323232 !important;
            color: white !important;
            border-radius: 4px !important;
            box-shadow: 
               0 3px 5px -1px rgba(0,0,0,0.2),
               0 6px 10px 0 rgba(0,0,0,0.14),
               0 1px 18px 0 rgba(0,0,0,0.12) !important;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif !important;
            padding: 0 !important;
            min-height: 48px !important;
            align-items: center !important;
            width: auto !important;
            max-width: 90vw !important;
            margin: 0 auto !important;
         }
         // ... resto de estilos Flutter
      `;
      document.head.appendChild(style);
   }

   // Crear contenido personalizado para el toast
   const toastContent = `
      <div class="flutter-toast-content">
         <div class="flutter-toast-icon" style="background: ${materialColors[icon]}">
            ${materialIcons[icon]}
         </div>
         <div class="flutter-toast-message">${message}</div>
      </div>
   `;

   // 📌 TOAST PARA MÓVIL
   return Swal.fire({
      toast: true,
      position: "bottom",
      html: toastContent,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: "transparent",
      width: "auto",
      customClass: {
         container: "flutter-toast-container", // Clase personalizada para móvil
         popup: "flutter-toast-mobile",
         timerProgressBar: "swal2-timer-progress-bar-flutter"
      },
      showClass: {
         popup: "swal2-noanimation",
         backdrop: "swal2-noanimation"
      },
      hideClass: {
         popup: "",
         backdrop: ""
      }
   });
};
// showConfirmationAlert mantiene la misma firma pero con diseño mejorado
export const showConfirmationAlert = (
   title: string,
   options: { text?: string; html?: string },
   position: "top-start" | "top-end" | "top" | "center-start" | "center" | "center-end" | "bottom-start" | "bottom-end" | "bottom" = "center"
): Promise<boolean> => {
   const isMobileOrTablet = window.innerWidth < 1024;

   // 📌 WEB NORMAL → SweetAlert por defecto
   if (!isMobileOrTablet) {
      return Swal.fire({
         title,
         text: options.text,
         html: options.html,
         icon: "warning",
         showCancelButton: true,
         confirmButtonText: "Aceptar",
         cancelButtonText: "Cancelar",
         reverseButtons: true,
         position
      }).then((r) => r.isConfirmed);
   }

   // 📌 MOVIL + TABLET → Estilo Flutter/Material Design
   if (!document.getElementById("flutter-confirmation-styles")) {
      const styles = `
         .flutter-dialog-container {
            backdrop-filter: blur(4px);
            background: rgba(0,0,0,0.4) !important;
         }
         .flutter-dialog-popup {
            border-radius: 16px !important;
            padding: 0 !important;
            box-shadow: 
               0 24px 38px 3px rgba(0,0,0,0.14),
               0 9px 46px 8px rgba(0,0,0,0.12),
               0 11px 15px -7px rgba(0,0,0,0.2) !important;
            border: none !important;
            max-width: 280px !important;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif !important;
            overflow: hidden !important;
         }
         .flutter-dialog-header { 
            padding: 24px 24px 8px !important;
            text-align: center !important;
         }
         .flutter-dialog-title { 
            font-size: 18px !important; 
            font-weight: 500 !important;
            color: #000000 !important;
            margin: 0 !important;
            line-height: 1.4 !important;
         }
         .flutter-dialog-content { 
            font-size: 14px !important; 
            padding: 8px 24px 20px !important;
            text-align: center !important;
            color: #5F6368 !important;
            line-height: 1.5 !important;
            margin: 0 !important;
         }
         .flutter-dialog-actions {
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-end !important;
            padding: 8px !important;
            border-top: 1px solid #E0E0E0 !important;
            margin-top: 0 !important;
         }
         .flutter-confirm-button { 
            background: transparent !important;
            color: #1976D2 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 8px 16px !important;
            margin: 0 4px !important;
            border-radius: 4px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            border: none !important;
            min-width: 64px !important;
            height: 36px !important;
         }
         .flutter-confirm-button:hover {
            background: rgba(25, 118, 210, 0.04) !important;
         }
         .flutter-cancel-button { 
            background: transparent !important;
            color: #5F6368 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 8px 16px !important;
            margin: 0 4px !important;
            border-radius: 4px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            border: none !important;
            min-width: 64px !important;
            height: 36px !important;
         }
         .flutter-cancel-button:hover {
            background: rgba(95, 99, 104, 0.04) !important;
         }
         .swal2-icon { 
            display: none !important; 
         }
         .swal2-actions {
            margin: 0 !important;
            padding: 0 !important;
         }
      `;
      const styleElement = document.createElement("style");
      styleElement.id = "flutter-confirmation-styles";
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
   }

   return Swal.fire({
      title,
      text: options.text,
      html: options.html,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      reverseButtons: false,
      allowOutsideClick: false,
      width: "auto",
      customClass: {
         container: "flutter-dialog-container",
         popup: "flutter-dialog-popup",
         title: "flutter-dialog-title",
         htmlContainer: "flutter-dialog-content",
         actions: "flutter-dialog-actions",
         confirmButton: "flutter-confirm-button",
         cancelButton: "flutter-cancel-button"
      },
      buttonsStyling: false,
      showClass: {
         popup: "swal2-noanimation",
         backdrop: "swal2-noanimation"
      },
      hideClass: {
         popup: "",
         backdrop: ""
      }
   }).then((r) => r.isConfirmed);
};

