import { useCallback, useEffect, useRef } from "react";
import { GenericApi } from "../infrastructure/generic/infra.generic";
import { useStore } from "zustand";
import { createGenericStore, StoreExtension, StoreLifecycleHooks } from "../store/generic/generic.store";

export interface GenericDataConfig<T extends { id?: number }, E = {}, P extends Record<string, any> = {}, S extends Record<string, any> = {}> {
   initialState: T;
   prefix: string;
   autoFetch?: boolean;
   hooks?: StoreLifecycleHooks<T>;
   extension?: StoreExtension<T, E, P, S>;
   persistKey?: string;
   extraState?: S;
   debug?: boolean;
}

export type GenericDataReturn<T extends { id?: number }, E = {}, P extends Record<string, any> = {}, S extends Record<string, any> = {}> = {
   items: T[];
   prefix: string;
   loading: boolean;
   open: boolean;
   isDirty: boolean;
   selectedItem: T | null;
   initialValues: T;
   meta: { page: number; total: number; limit: number };
   setOpen: (open?:boolean) => void;
   setSelectedItem: (item: T | null) => void;
   handleChangeItem: (item: T) => void;
   setPrefix: (prefix: string) => void;
   reset: () => void;
   setField: <K extends keyof T>(key: K, value: T[K]) => void;
   setExtra: <K extends keyof S>(key: K, value: S[K]) => void;
   setItems: (items: T[] | ((prev: T[]) => T[])) => void;
   setDebug: (enabled: boolean) => void;
   debug: boolean;

   fetchData: () => Promise<T[]>;
   refresh: () => Promise<T[]>;
   postItem: (item: T | T[], formData?: boolean, fetchAfter?: boolean) => Promise<void>;
   removeItemData: (item: T) => Promise<void>;
   request: (
      options: {
         data?: Partial<T>;
         url: string;
         method: "POST" | "PUT" | "GET" | "DELETE";
         formData?: boolean;
         getData?: boolean;
         signal?: AbortSignal;
      },
      callback?: { then?: () => void; error?: () => void }
   ) => Promise<T | T[] | undefined>;

   persist: P;
} & E &
   S;

// ─── Clave de caché robusta ───────────────────────────────────────────────
const buildCacheKey = <S extends Record<string, any>>(prefix: string, persistKey?: string, extraState?: S): string => {
   const extraKeys = extraState ? Object.keys(extraState).sort().join(",") : "";
   return [prefix, persistKey ?? "", extraKeys].filter(Boolean).join(":");
};

export const useGenericData = <T extends { id?: number }, E = {}, P extends Record<string, any> = {}, S extends Record<string, any> = {}>(
   config: GenericDataConfig<T, E, P, S>
): GenericDataReturn<T, E, P, S> => {
   const { initialState, prefix, autoFetch = true, hooks, extension, persistKey, extraState, debug = false } = config;

   // ─── Mantener hooks actualizado sin recrear el store ─────────────────
   const hooksRef = useRef(hooks);
   useEffect(() => {
      hooksRef.current = hooks;
   }, [hooks]);

   // ─── Crear o recuperar store del caché ───────────────────────────────
   const storeRef = useRef<ReturnType<typeof createGenericStore<T, E, P, S>> | null>(null);
   if (!storeRef.current) {
      const cacheKey = buildCacheKey(prefix, persistKey, extraState);
      const cached = (globalThis as any).__genericStoreCache?.get(cacheKey);
      if (cached) {
         storeRef.current = cached;
      } else {
         const newStore = createGenericStore<T, E, P, S>(initialState, extension, persistKey, extraState, debug);
         if (!(globalThis as any).__genericStoreCache) {
            (globalThis as any).__genericStoreCache = new Map();
         }
         (globalThis as any).__genericStoreCache.set(cacheKey, newStore);
         storeRef.current = newStore;
      }
   }

   const useStoreInstance = storeRef.current!;

   const store = useStore(useStoreInstance);
   const {
      items,
      loading,
      open,
      initialValues,
      fetchData,
      postItem,
      removeItemData,
      handleChangeItem,
      setPrefix,
      setRepo,
      request,
      setOpen,
      setSelectedItem,
      selectedItem,
      isDirty,
      meta,
      reset,
      _persist,
      ensureData,
      setField,
      setExtra,
      setItems,
      setDebug: setDebugStore,
      _debugEnabled
   } = store as any;

   const apiRef = useRef(new GenericApi<T>());

   // ─── Wrappers estables ────────────────────────────────────────────────
   const fetchDataWrapped = useCallback(async () => {
      return await fetchData(hooksRef.current);
   }, [fetchData]);

   const postItemWrapped = useCallback(
      async (item: T | T[], formData?: boolean, fetchAfter?: boolean) => {

         await postItem(item, formData, fetchAfter, hooksRef.current);
      },
      [postItem]
   );

   const removeItemWrapped = useCallback(
      async (item: T) => {

         await removeItemData(item, hooksRef.current);
      },
      [removeItemData]
   );
const requestWrapped = useCallback(
   async (options: any, callback: any) => {
      console.log("📦 En requestWrapped - getData recibido:", options.getData);
      console.log("📦 En requestWrapped - options completas:", options);
      const result = await request(options, callback);
      console.log("📦 En requestWrapped - después de llamar a request");
      return result;
   },
   [request]
);

   // ─── Inicialización: solo depende de prefix y autoFetch ──────────────
   // Se usan refs para acceder a los valores actuales del store sin
   // incluirlos como dependencias, evitando re-ejecuciones por cambios
   // internos del store (como _repo pasando de null a tener valor).
   useEffect(() => {
      let isMounted = true;

      const init = async () => {
         if (!isMounted) return;

         setPrefix(prefix);

         // Leer _repo directamente del store en lugar de usar el valor
         // del render — así no necesitamos _repo como dependencia
         if (!useStoreInstance.getState()._repo) {
            setRepo(apiRef.current);
         }

         if (autoFetch) {
            try {
               // Leer ensureData directo del store para no depender
               // de la referencia que cambia en cada render
               await useStoreInstance.getState().ensureData(hooksRef.current);
            } catch (error) {
               if (isMounted) {
                  console.error("Error en autoFetch:", error);
               }
            }
         }
      };

      init();

      return () => {
         isMounted = false;
      };

      // ✅ Solo prefix y autoFetch como dependencias — estables por diseño.
      // _repo, ensureData y setRepo se leen via ref/getState() para evitar
      // el ciclo: setRepo cambia _repo → _repo en deps → re-ejecuta effect
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [prefix, autoFetch]);

   return {
      ...(store as any),
      items,
      prefix,
      loading,
      open,
      isDirty,
      selectedItem,
      initialValues,
      meta,
      setOpen,
      setSelectedItem,
      handleChangeItem,
      setField,
      setExtra,
      setItems,
      setDebug: setDebugStore,
      debug: _debugEnabled,
      reset,
      setPrefix,
      fetchData: fetchDataWrapped,
      refresh: fetchDataWrapped,
      postItem: postItemWrapped,
      removeItemData: removeItemWrapped,
      request: requestWrapped,
      persist: _persist || {},
   } as GenericDataReturn<T, E, P, S>;
};
