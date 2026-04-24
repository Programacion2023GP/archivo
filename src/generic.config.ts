export interface EndpointConfig {
   getAll: (prefix: string) => string;
   create: (prefix: string) => string;
   delete: (prefix: string) => string;
   request: (prefix: string) => string;
}

export interface ResponseMap {
   ok: (response: any) => boolean;
   data: (response: any) => any;
   message: (response: any) => string;
   total: (response: any) => number;
}

export interface GlobalMiddlewares {
   beforeRequest?: <T>(data: T) => T;
   afterResponse?: <T>(data: T) => T;
   onError?: (msg: string) => void;
   onSuccess?: (msg: string) => void;
}

export interface GenericConfig {
   baseUrl: string;
   usePrefix: boolean;
   endpoints: EndpointConfig;
   responseMap: ResponseMap;
   messages: {
      createSuccess: string;
      deleteSuccess: string;
      fetchError: string;
      networkError: string;
      unknownError: string;
   };
   middlewares: GlobalMiddlewares;
}

export const genericConfig: GenericConfig = {
   baseUrl: import.meta.env.VITE_API_URL,
   usePrefix: true,

   endpoints: {
      getAll: (prefix) => `${prefix}/index`,
      create: (prefix) => `${prefix}/createorUpdate`,
      delete: (prefix) => `${prefix}/delete`,
      request: (prefix) => prefix
   },

   // 🔥 Cambia aquí cómo se lee tu backend — nadie toca infra.generic.ts
   responseMap: {
      ok: (res) => res?.ok === true || res?.status === "success",
      data: (res) => res?.data ?? res?.result ?? res?.items ?? [],
      message: (res) => res?.message ?? res?.msg ?? "",
      total: (res) => res?.total ?? res?.count ?? 0
   },

   messages: {
      createSuccess: "Registro guardado correctamente",
      deleteSuccess: "Registro eliminado correctamente",
      fetchError: "Error al obtener los datos",
      networkError: "Error de conexión con el servidor",
      unknownError: "Error desconocido"
   },

   middlewares: {
      beforeRequest: (data) => data,
      afterResponse: (data) => data,
      onError: (msg) => console.error("[GenericStore]", msg),
      onSuccess: (msg) => console.log("[GenericStore]", msg)
   }
};
