export const MODULE_ORDER = [
   { permission: "catalogo_departamentos_ver", route: "/#/catalogos/departamentos" },
   { permission: "usuarios_ver", route: "/#/usuarios" }
];
const MODULE_ORDERREDIRECT = [
   { permission: "catalogo_departamentos_ver", route: "/catalogos/departamentos" },
   { permission: "usuarios_ver", route: "/usuarios" }
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
