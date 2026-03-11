// components/sidebar/SidebarItem.tsx
import { useState, type ReactNode } from "react";

interface SidebarItemProps {
   icon?: ReactNode;
   label: string;
   active?: boolean;
   route?: string;
   id?: string | number;
   onClick?: () => void;
}

export const SidebarItem = ({ icon, label, active, onClick, id }: SidebarItemProps) => {
   const [hovered, setHovered] = useState(false);

   return (
      <button
         id={id?.toString()}
         onClick={onClick}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            background: active ? "linear-gradient(135deg, #9B2242 0%, #651D32 100%)" : hovered ? "rgba(155,34,66,0.25)" : "transparent",
            border: "none",
            borderRadius: "10px",
            color: "white",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "13.5px",
            fontWeight: active ? "600" : "400",
            fontFamily: "inherit",
            textAlign: "left",
            boxShadow: active ? "0 4px 15px rgba(155,34,66,0.35)" : "none",
            position: "relative",
            overflow: "hidden"
         }}
      >
         {active && (
            <span
               style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "65%",
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: "0 3px 3px 0"
               }}
            />
         )}
         {icon && (
            <span
               style={{
                  display: "flex",
                  opacity: active ? 1 : 0.7,
                  transition: "opacity 0.2s"
               }}
            >
               {icon}
            </span>
         )}
         <span>{label}</span>
      </button>
   );
};
