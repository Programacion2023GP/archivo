import { Sidebar } from "./ui/components/sidebar/CustomSidebar";
import { SidebarItem } from "./ui/components/sidebar/CustomSidebarItem";
import { Header } from "./ui/components/header/CustomHeader";
import { useCallback, useEffect, useMemo, useState, lazy, Suspense, useRef } from "react";
import { FaUserTie } from "react-icons/fa6";
import PageLogin from "./ui/pages/login/PageLogin";
import "./App.css";
import { FaChartLine, FaCode, FaFileInvoiceDollar, FaUserAlt } from "react-icons/fa";
import { SidebarDrop } from "./ui/components/sidebar/CustomSidebarDrop";
import { FaBuildingColumns } from "react-icons/fa6";
import { Routes, Navigate, Outlet, Route, useLocation, useNavigate } from "react-router-dom";
import { usePermissionsStore } from "./store/menu/menu.store";
import { FaUserDoctor } from "react-icons/fa6";
import { FaStopCircle } from "react-icons/fa";
import Spinner from "./ui/components/loading/loading";
import { redirectRoute } from "./utils/redirect";
import { RiFileList3Line } from "react-icons/ri";

// Lazy imports para todas las páginas
const PageUsersPanel = lazy(() => import("./ui/pages/pageusers/pageuserspanel"));
const PageLogs = lazy(() => import("./ui/pages/pagelogs/PageLogs"));
const PageDepartaments = lazy(() => import("./ui/pages/catalogues/departaments/pagedepartaments"));
const PageSender = lazy(() => import("./ui/pages/catalogues/sender/senderpage"));
const PageProcedure = lazy(() => import("./ui/pages/procedure/pageprocedure"));

const PoliceSearch404 = lazy(() => import("./ui/pages/nofound/PageNoFound"));
// Definición de tipos
interface BaseSidebarItem {
   id: string | number;
   prefix: string;
   label: string;
   icon?: React.ReactNode;
}

interface SidebarItemWithRoute extends BaseSidebarItem {
   route: string;
   children?: never;
}

interface SidebarItemWithChildren extends BaseSidebarItem {
   children: SidebarItem[];
   route?: never;
}

type SidebarItem = SidebarItemWithRoute | SidebarItemWithChildren;

// Componente Layout para las rutas autenticadas
const MainLayout = () => {
   const [open, setOpen] = useState(false);
   const [showInstallPrompt, setShowInstallPrompt] = useState(false);
   const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
   const location = useLocation();
   const navigate = useNavigate();

   const loadPermissions = usePermissionsStore((state) => state.loadPermissions);

   // 🔥 Cargar permisos al montar
   useEffect(() => {
      loadPermissions();
   }, [location]);

   // Escuchar evento de instalación PWA
   useEffect(() => {
      const handler = (e: any) => {
         e.preventDefault();
         setDeferredPrompt(e);
         setShowInstallPrompt(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
   }, []);

   const toggleSidebar = useCallback(() => setOpen((prev) => !prev), []);

   const handleInstallClick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
   };

   // Función para manejar navegación
   const handleNavigation = useCallback(
      (route: string) => {
         navigate(route);
         setOpen(false); // Cerrar sidebar en móvil después de navegar
      },
      [navigate]
   );
const createRouteItem = (id: number, prefix: string, route: string, icon: React.ReactNode, label: string): SidebarItemWithRoute => ({
   id,
   prefix,
   route,
   icon,
   label
});

const createChildrenItem = (id: number, prefix: string, label: string, icon: React.ReactNode, children: SidebarItem[]): SidebarItemWithChildren => ({
   id,
   prefix,
   label,
   icon,
   children
});

// Type guards
const hasChildren = (item: SidebarItem): item is SidebarItemWithChildren => {
   return "children" in item && Array.isArray(item.children);
};

const hasRoute = (item: SidebarItem): item is SidebarItemWithRoute => {
   return "route" in item && typeof item.route === "string";
};
   // 🧠 Sidebar config con IDs únicos
  const sidebarItems: SidebarItem[] = useMemo(
     () => [
        createRouteItem(1, "usuarios_", "/usuarios", <FaUserTie />, "Usuarios"),
        createRouteItem(2, "tramite_", "/tramite", <RiFileList3Line />, "Tramites"),
       // createRouteItem(2, "tramite_", "/tramite", <RiFileList3Line />, "Tramites"),

        createRouteItem(6, "vista_", "/logs", <FaCode />, "Logs"),

        createChildrenItem(7, "catalogo_", "Catálogos", <FaBuildingColumns />, [
           createRouteItem(71, "catalogo_departamentos_", "/catalogos/departamentos", <FaUserDoctor />, "Departamentos")
        ]),

        createChildrenItem(8, "reports_", "Reportes", <FaChartLine />, [])
     ],
     []
  );

   const mainRef = useRef<HTMLElement>(null);

   const handleMainClick = useCallback(
      (e: MouseEvent) => {
         if (open) {
            setOpen(false);
         }
      },
      [open]
   );

   useEffect(() => {
      const element = mainRef.current;
      if (!element) return;

      element.addEventListener("click", handleMainClick);
      return () => {
         element.removeEventListener("click", handleMainClick);
      };
   }, [handleMainClick]);

   // Función para verificar si una ruta está activa
   const isActiveRoute = useCallback(
      (route: string) => {
         return location.pathname === route || location.pathname.startsWith(route + "/");
      },
      [location.pathname]
   );

   // Función de renderizado con tipos
  const renderSidebarItems = useCallback(
     (items: SidebarItem[]): React.ReactNode => {
        return items.map((item) => {
           return (
              <>
                 <PermissionPrefixRoute requiredPrefix={item.prefix} key={item.id}>
                    {hasChildren(item) ? (
                       <SidebarDrop label={item.label} icon={item.icon} id={item.id}>
                          {renderSidebarItems(item.children)}
                       </SidebarDrop>
                    ) : hasRoute(item) ? (
                       <SidebarItem
                          route={item.route}
                          icon={item.icon}
                          label={item.label}
                          id={item.id}
                          active={isActiveRoute(item.route)}
                          onClick={() => handleNavigation(item.route)}
                       />
                    ) : null}
                 </PermissionPrefixRoute>
              </>
           );
        });
     },
     [isActiveRoute, handleNavigation]
  );
   return (
      <div className="flex h-screen w-full overflow-hidden bg-[#f8f9fa]">
         {open && (
            <div className="flex-shrink-0 w-64 shadow-md">
               <Sidebar name="Sistema" borderR>
                  {renderSidebarItems(sidebarItems)}
               </Sidebar>
            </div>
         )}

         <div className="flex flex-col flex-1 min-w-0">
            <Header setOpenSidebar={toggleSidebar} isSidebarOpen={open} userName={localStorage.getItem("name") || ""} />

            <main ref={mainRef} className="flex-1 p-6 overflow-auto bg-white">
               <Suspense fallback={<Spinner />}>
                  <Outlet />
               </Suspense>
            </main>

            {showInstallPrompt && <InstallPrompt onInstall={handleInstallClick} onClose={() => setShowInstallPrompt(false)} />}
         </div>
      </div>
   );
};

// 💡 Componente separado para el prompt de instalación
const InstallPrompt = ({ onInstall, onClose }: { onInstall: () => void; onClose: () => void }) => (
   <div className="fixed z-50 p-4 text-white bg-blue-600 rounded-lg shadow-lg bottom-4 right-4">
      <div className="flex items-center gap-3">
         <span>📱 Instalar App</span>
         <button onClick={onInstall} className="px-3 py-1 font-semibold text-blue-600 transition-colors bg-white rounded-md hover:bg-blue-100">
            Instalar
         </button>
         <button onClick={onClose} className="text-white hover:text-gray-200">
            ×
         </button>
      </div>
   </div>
);

// Componentes de permisos
interface PermissionRouteProps {
   children: React.ReactNode;
   requiredPermission: string | string[];
}

export const PermissionRoute = ({ children, requiredPermission }: PermissionRouteProps) => {
   const hasPermission = usePermissionsStore((state) => state.hasPermission);

   const allowed = Array.isArray(requiredPermission) ? requiredPermission.some((p) => hasPermission(p)) : hasPermission(requiredPermission);

   return allowed ? <>{children}</> : null;
};

interface PermissionPrefixRouteProps {
   children: React.ReactNode;
   requiredPrefix: string | string[];
}

export const PermissionPrefixRoute = ({ children, requiredPrefix }: PermissionPrefixRouteProps) => {
   const hasPermissionPrefix = usePermissionsStore((state) => state.hasPermissionPrefix);

   const hasPermission = Array.isArray(requiredPrefix) ? requiredPrefix.some((prefix) => hasPermissionPrefix(prefix)) : hasPermissionPrefix(requiredPrefix);

   return hasPermission ? <>{children}</> : null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
   const token = localStorage.getItem("token");
   const location = useLocation();

   if (!token) {
      return <Navigate to="/login" state={{ from: location }} replace />;
   }

   return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
   const token = localStorage.getItem("token");
   if (token) {
      return <Navigate to="/usuarios" replace />;
   }

   return <>{children}</>;
};

function App() {
   return (
      <Routes>
         <Route
            path="/login"
            element={
               <PublicRoute>
                  <Suspense fallback={<Spinner />}>
                     <PageLogin />
                  </Suspense>
               </PublicRoute>
            }
         />

         <Route
            path="/"
            element={
               <ProtectedRoute>
                  <MainLayout />
               </ProtectedRoute>
            }
         >
            <Route
               path="usuarios"
               element={
                  <Suspense fallback={<Spinner />}>
                     <PageUsersPanel />
                  </Suspense>
               }
            />{" "}
            <Route
               path="tramite"
               element={
                  <Suspense fallback={<Spinner />}>
                     <PageProcedure />
                  </Suspense>
               }
            />
            <Route
               path="logs"
               element={
                  <Suspense fallback={<Spinner />}>
                     <PageLogs />
                  </Suspense>
               }
            />
            <Route path="catalogos">
               <Route
                  path="departamentos"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageDepartaments />
                     </Suspense>
                  }
               />

               <Route
                  path="remitente"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageSender />
                     </Suspense>
                  }
               />
            </Route>
            {/* <Route path="reportes">
               <Route
                  path="dashboard"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageReports />
                     </Suspense>
                  }
               />
               <Route
                  path="mapa"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageReportMap />
                     </Suspense>
                  }
               />
               <Route
                  path="calendario"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageCalendary />
                     </Suspense>
                  }
               />
               <Route
                  path="general"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PagePenalities section="general" />
                     </Suspense>
                  }
               />
               <Route
                  path="reicidencias"
                  element={
                     <Suspense fallback={<Spinner />}>
                        <PageReicendences />
                     </Suspense>
                  }
               />
            </Route> */}
            <Route
               index
               element={
                  <Suspense fallback={<Spinner />}>
                     {" "}
                     <Navigate to={redirectRoute(JSON.parse(localStorage.getItem("permisos") ?? "[]"))} replace />
                  </Suspense>
               }
            />
         </Route>

         <Route
            path="*"
            element={
               <Suspense fallback={<Spinner />}>
                  <PoliceSearch404 />
               </Suspense>
            }
         />
      </Routes>
   );
}

export default App;
