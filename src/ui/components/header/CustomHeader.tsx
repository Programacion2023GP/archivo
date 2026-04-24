// components/header/Header.tsx
import { useState, useEffect, useRef } from "react";
import { useUsersState } from "../../../store/storeusers/users.store";
import { ApiUsers } from "../../../infrastructure/infrastructureusers/inftrastructureusers";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";

interface HeaderProps {
   userName?: string;
   setOpenSidebar: () => void;
   isSidebarOpen:boolean
}

export const Header = ({ userName = "Luis Martínez", setOpenSidebar, isSidebarOpen }: HeaderProps) => {
   const [dropdownOpen, setDropdownOpen] = useState(false);
   const [notifOpen, setNotifOpen] = useState(false);
   const [scrolled, setScrolled] = useState(false);
   const dropdownRef = useRef(null);
   const notifRef = useRef(null);
   const {logout} = useUsersState()
   const api = new ApiUsers()
   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);

   useEffect(() => {
      const handleClick = (e) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
         if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, []);

   const initials = userName
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

   return (
      <header
         style={{
            height: "64px",
            background: scrolled ? "rgba(19,13,14,0.96)" : "linear-gradient(135deg, #130D0E 0%, #1f0b12 50%, #130D0E 100%)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(155,34,66,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px 0 16px",
            position: "sticky",
            top: 0,
            zIndex: 50,
            transition: "all 0.3s ease",
            boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.4)" : "none"
         }}
      >
         {/* Left */}
         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Hamburger */}
            <button
               onClick={setOpenSidebar}
               style={{
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSidebarOpen ? "rgba(155,34,66,0.3)" : "transparent",
                  border: "1px solid rgba(155,34,66,0.3)",
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
               }}
               onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(155,34,66,0.25)")}
               onMouseLeave={(e) => (e.currentTarget.style.background = isSidebarOpen ? "rgba(155,34,66,0.3)" : "transparent")}
            >
               {isSidebarOpen ? <X /> : <Menu />}
            </button>

            {/* Breadcrumb / Page title */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
               <div
                  style={{
                     width: "1px",
                     height: "20px",
                     background: "rgba(155,34,66,0.4)",
                     marginRight: "4px"
                  }}
               />
               <div>
                
               </div>
            </div>
         </div>

         {/* Right */}
         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Notifications */}
           
            {/* Divider */}
            <div style={{ width: "1px", height: "24px", background: "rgba(155,34,66,0.25)", margin: "0 4px" }} />

            {/* Profile */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
               <button
                  onClick={() => {
                     setDropdownOpen(!dropdownOpen);
                     setNotifOpen(false);
                  }}
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: "10px",
                     padding: "6px 12px 6px 6px",
                     background: dropdownOpen ? "rgba(155,34,66,0.2)" : "transparent",
                     border: "1px solid rgba(155,34,66,0.2)",
                     borderRadius: "10px",
                     cursor: "pointer",
                     transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(155,34,66,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = dropdownOpen ? "rgba(155,34,66,0.2)" : "transparent")}
               >
                  {/* Avatar */}
                  <div
                     style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #9B2242 0%, #651D32 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "white",
                        letterSpacing: "0.5px",
                        boxShadow: "0 2px 8px rgba(155,34,66,0.4)"
                     }}
                  >
                     {initials}
                  </div>
                  <div style={{ textAlign: "left" }}>
                     <p style={{ margin: 0, color: "white", fontSize: "12.5px", fontWeight: "600", lineHeight: 1.2 }}>{userName.split(" ")[0]}</p>
                     <p style={{ margin: 0, color: "rgba(184,182,175,0.45)", fontSize: "10.5px", lineHeight: 1.2 }}>{userName}</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.35)", display: "flex", marginLeft: "2px" }}>
                     <ChevronDown />
                  </span>
               </button>

               {/* Profile Dropdown */}
               {dropdownOpen && (
                  <div
                     style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        right: 0,
                        width: "220px",
                        background: "#1a0d12",
                        border: "1px solid rgba(155,34,66,0.25)",
                        borderRadius: "14px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                        overflow: "hidden",
                        zIndex: 100,
                        animation: "dropIn 0.2s ease"
                     }}
                  >
                     {/* Profile info */}
                     <div style={{ padding: "16px", borderBottom: "1px solid rgba(155,34,66,0.12)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                           <div
                              style={{
                                 width: "44px",
                                 height: "44px",
                                 borderRadius: "12px",
                                 background: "linear-gradient(135deg, #9B2242 0%, #651D32 100%)",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 fontSize: "16px",
                                 fontWeight: "700",
                                 color: "white",
                                 boxShadow: "0 4px 12px rgba(155,34,66,0.4)"
                              }}
                           >
                              {initials}
                           </div>
                           <div>
                              <p style={{ margin: 0, color: "white", fontSize: "13px", fontWeight: "600" }}>{userName}</p>
                              <div
                                 style={{
                                    marginTop: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    background: "rgba(155,34,66,0.25)",
                                    padding: "2px 8px",
                                    borderRadius: "20px"
                                 }}
                              >
                                 <span style={{ color: "#ff8fa3", fontSize: "10.5px", fontWeight: "600" }}>{userName}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Menu items */}
                     <div style={{ padding: "8px" }}>
                     
                        <div style={{ margin: "6px 0", height: "1px", background: "rgba(155,34,66,0.12)" }} />

                        {/* Logout */}
                        <button
                        onClick={()=>{
                           logout(api);
                        }}
                           style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              borderRadius: "8px",
                              color: "#ff7a9a",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                              textAlign: "left"
                           }}
                           onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(155,34,66,0.2)")}
                           onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                           <LogOut />
                           <span>Cerrar sesión</span>
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </header>
   );
};

