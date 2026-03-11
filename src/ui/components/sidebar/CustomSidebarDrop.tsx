// components/sidebar/SidebarDrop.tsx
import { ChevronRight } from "lucide-react";
import { useState, useRef, type ReactNode } from "react";

interface SidebarDropProps {
   icon?: ReactNode;
   id?: string | number;
   label: string;
   children: ReactNode;
}

export const SidebarDrop = ({ icon, label, children, id }: SidebarDropProps) => {
   const [open, setOpen] = useState(false);
   const contentRef = useRef<HTMLDivElement>(null);

   return (
      <div style={{ marginBottom: "2px" }}>
         <button
            id={id?.toString()}
            onClick={() => setOpen(!open)}
            style={{
               width: "100%",
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               padding: "10px 12px",
               background: open ? "rgba(101,29,50,0.5)" : "transparent",
               border: "none",
               borderRadius: "10px",
               color: "rgba(255,255,255,0.9)",
               cursor: "pointer",
               transition: "all 0.2s ease",
               fontSize: "13.5px",
               fontWeight: "500",
               fontFamily: "inherit"
            }}
            onMouseEnter={(e) => {
               if (!open) e.currentTarget.style.background = "rgba(155,34,66,0.3)";
            }}
            onMouseLeave={(e) => {
               if (!open) e.currentTarget.style.background = "transparent";
            }}
         >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
               <span style={{ opacity: 0.8, display: "flex" }}>{icon}</span>
               <span>{label}</span>
            </div>
            <ChevronRight
               style={{
                  transform: open ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease"
               }}
            />
         </button>

         <div
            ref={contentRef}
            style={{
               maxHeight: open ? "500px" : "0",
               overflow: "hidden",
               transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
               opacity: open ? 1 : 0,
               visibility: open ? "visible" : "hidden"
            }}
         >
            <div
               style={{
                  marginLeft: "16px",
                  paddingLeft: "12px",
                  borderLeft: "1px solid rgba(155,34,66,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  paddingTop: "4px",
                  paddingBottom: "8px"
               }}
            >
               {children}
            </div>
         </div>
      </div>
   );
};
