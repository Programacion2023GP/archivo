export const MODULE_ORDER = [
   { permission: "tramite_ver", route: "/#/tramite" },
   { permission: "usuarios_ver", route: "/#/usuarios" },
   { permission: "catalogo_departamentos_ver", route: "/#/catalogos/departamentos" },
];
const MODULE_ORDERREDIRECT = [
   { permission: "tramite_ver", route: "/tramite" },
   { permission: "usuarios_ver", route: "/usuarios" },
   { permission: "catalogo_departamentos_ver", route: "/catalogos/departamentos" },
];
type RedirectData = {
   permisos: string[];
};

export const redirectRoute = (permisos: unknown): string => {
   if (!Array.isArray(permisos)) {
      return "/";
   }

   for (const module of MODULE_ORDERREDIRECT) {
      if (permisos.includes(module.permission)) {
         return module.route;
      }
   }

   return "/";
};
