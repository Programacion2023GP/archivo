// components/sidebar/Sidebar.tsx
import { Settings } from "lucide-react";
import { type ReactNode } from "react";

interface SidebarProps {
   children: ReactNode;
   name?: string;
   borderR?: boolean;
}

export const Sidebar = ({ name, children }: SidebarProps) => {
   return (
      <aside
         style={{
            width: "260px",
            minWidth: "260px",
            height: "100vh",
            background: "linear-gradient(180deg, #130D0E 0%, #1a0d12 40%, #0f0608 100%)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            borderRight: "1px solid rgba(155,34,66,0.2)"
         }}
      >
         {/* Ambient glow top */}
         <div
            style={{
               position: "absolute",
               top: 0,
               left: "50%",
               transform: "translateX(-50%)",
               width: "200px",
               height: "200px",
               background: "radial-gradient(circle, rgba(155,34,66,0.2) 0%, transparent 70%)",
               pointerEvents: "none",
               zIndex: 0
            }}
         />

         {/* Logo area */}
         <div
            style={{
               padding: "24px 20px 20px",
               borderBottom: "1px solid rgba(155,34,66,0.15)",
               position: "relative",
               zIndex: 1
            }}
         >
        
         </div>

         {/* Search bar */}
        

         {/* Navigation - Aquí se renderizan los items */}
         <nav
            style={{
               flex: 1,
               overflowY: "auto",
               padding: "8px 12px",
               position: "relative",
               zIndex: 1
            }}
         >
            <p
               style={{
                  color: "rgba(184,182,175,0.35)",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  paddingLeft: "12px"
               }}
            >
               NAVEGACIÓN
            </p>

            {/* Renderizar los children aquí */}
            {children}
         </nav>

         {/* Bottom section */}
         <div
            style={{
               padding: "12px",
               borderTop: "1px solid rgba(155,34,66,0.15)",
               position: "relative",
               zIndex: 1
            }}
         >
            <div
               style={{
                  background: "rgba(155,34,66,0.1)",
                  border: "1px solid rgba(155,34,66,0.2)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
               }}
            >
             
             
            </div>
         </div>
      </aside>
   );
};
