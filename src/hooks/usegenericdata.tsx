import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGenericStore } from "../store/generic/generic.store";
import { GenericApi } from "../infrastructure/generic/infra.generic";

interface GenericDataConfig<T extends { id?: number }> {
   initialState: T;
   prefix: string;
   autoFetch?: boolean;
}

export const useGenericData = <T extends { id?: number }>({ initialState, prefix, autoFetch = true }: GenericDataConfig<T>) => {
   // IMPORTANTE: Usar useRef para mantener el initialState estable
   const initialStateRef = useRef(initialState);

   // Solo crear el store una vez
   const useStore = useMemo(() => useGenericStore<T>(initialStateRef.current), []);
   const store = useStore();

   const { fetchData, items, loading, setPrefix, request, open, setOpen, postItem, removeItemData, handleChangeItem, initialValues } = store;

   // Mantener la API estable
   const apiRef = useRef(new GenericApi<T>());

   const fetchDataWithPrefix = useCallback(async () => {
      return await fetchData(apiRef.current);
   }, [prefix, setPrefix, fetchData]);

   useEffect(() => {
      setPrefix(prefix);

      if (autoFetch) {
         fetchDataWithPrefix();
      }
   }, [fetchDataWithPrefix, autoFetch]); // Solo depende de fetchDataWithPrefix y autoFetch

   // Wrappers estables con useCallback
   const postItemWithPrefix = useCallback(
      async (item: T, formData?: boolean, fetchAfter?: boolean) => {
         await postItem(item, apiRef.current, formData, fetchAfter);
      },
      [postItem]
   );

   const removeItemWithPrefix = useCallback(
      async (item: T) => {
         await removeItemData(item, apiRef.current);
      },
      [removeItemData]
   );

   const requestWithPrefix = useCallback(
      async (
         options: {
            data?: Partial<T>;
            url: string;
            method: "POST" | "PUT" | "GET" | "DELETE";
            formData?: boolean;
         },
         callback?: {
            then?: () => void;
            error?: () => void;
         }
      ) => {
         return await request(options, apiRef.current, callback);
      },
      [request]
   );

   return {
      items,
      loading,
      open,
      initialValues,
      setOpen,
      handleChangeItem,
      fetchData: fetchDataWithPrefix,
      refresh: fetchDataWithPrefix,
      postItem: postItemWithPrefix,
      removeItemData: removeItemWithPrefix,
      request: requestWithPrefix,
      setPrefix,
      prefix
   };
};
export type GenericDataReturn<T extends { id?: number }> = {
   items: T[];
   loading: boolean;
   open: boolean;
   initialValues: T;
   setOpen: () => void;
   handleChangeItem: (item: T) => void;
   fetchData: () => Promise<T[]>;
   refresh: () => Promise<T[]>;
   postItem: (item: T|T[], formData?: boolean, fetchAfter?: boolean) => Promise<void>;
   removeItemData: (item: T) => Promise<void>;
   request: (
      options: {
         data?: Partial<T>;
         url: string;
         method: "POST" | "PUT" | "GET" | "DELETE";
         formData?: boolean;
         getData?:boolean
      },
      callback?: {
         then?: () => void;
         error?: () => void;
      }
   ) => Promise<any>;
   setPrefix: (prefix: string) => void;
};