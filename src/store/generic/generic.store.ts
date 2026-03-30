import { create } from "zustand";

import { showToast } from "../../sweetalert/Sweetalert";
import { GenericRepository } from "../../domain/repositories/generic/generic.repositories";

interface GenericStore<T extends object> {
   initialValues: T;
   items: T[];
   loading: boolean;
   error: string | null;
   prefix: string;
   setPrefix: (prefix: string) => void;
   open: boolean;
   setOpen: () => void;
   fetchDynamic?: (repo: GenericRepository<any>, prefix: string) => Promise<any>;
   constants: T;
   setConstant: <T extends Record<string, any>>(key: keyof T, value: T[keyof T]) => void;
   fetchData: (repo: GenericRepository<T>) => Promise<T[]>;
   postItem: (item: T | T[], repo: GenericRepository<T>, formData?: boolean, fetchData?: boolean) => Promise<void>;
   handleChangeItem: (item: T) => void;
   removeItemData: (item: T, repo: GenericRepository<T>) => Promise<void>;
   request: (
      options: {
         open?: boolean;

         data?: Partial<T>;
         url: string;
         method: "POST" | "PUT" | "GET" | "DELETE";
         formData?: boolean;
         getData?: boolean;
      },
      repo: GenericRepository<T>,
      callback?: {
         then?: () => void;
         error?: () => void;
      }
   ) => Promise<T | T[] | undefined>;
}

// store/generic/generic.store.ts
export const useGenericStore = <T extends { id?: number }>(initialValues: T) => {
   return create<GenericStore<T>>((set, get) => ({
      open: false,
      setOpen: () => set({ open: !get().open, initialValues }),
      prefix: "",
      initialValues,
      constants: initialValues,
      items: [],
      loading: false,
      error: null,
      setConstant: async <T extends Record<string, any>>(key: keyof T, value: T[keyof T]) => {
         set((state: any) => ({
            constants: {
               ...state.constants,
               [key]: value
            }
         }));
      },
      setPrefix: async (prefix) => {
         set({ prefix: prefix });
      },

      fetchDynamic: async (repo: GenericRepository<any>, prefix: string) => {
         set({ loading: true });

         try {
            const data = await repo.getAll(prefix);
            //   console.log("aqui", data);
            if (data.ok) {
               set({ items: data.data });
               return data.data; // ✅ regresa esto
            } else {
               return []; // opcional
            }
         } catch (error) {
            const msg = error instanceof Error ? error.message : "Error desconocido";

            set({ error: msg });
            showToast(msg, "error");

            return []; // evitar undefined
         } finally {
            set({ loading: false });
         }
      },
      request: async (
         options: {
            open?:boolean,
            data: Partial<T>;
            url: string;
            method: "POST" | "PUT" | "GET" | "DELETE";
            formData?: boolean;
            getData?: boolean;
         },
         repo: GenericRepository<T>,
         callback?: {
            then?: () => void;
            error?: () => void;
         }
      ) => {
         set({ loading: true });
         try {
            const result = await repo.request({
               data: options.data,
               prefix: options.url,
               method: options.method,
               formData: options.formData
            });

            if (result.ok) {
               if (options.method !== "GET") {
                  showToast(result.message || "Operación exitosa", "success");
               }
               // Si es GET, actualizar items y devolver array
               if (options.method === "GET") {
                  // Asegúrate de que result.data sea un array
                  const dataArray = Array.isArray(result.data) ? result.data : [result.data];
                  set({ items: dataArray, prefix: get().prefix });
                  return dataArray;
               } else {
                  if (options.getData) {
                     // console.log("aqui es",options.getData)
                     await get().fetchData(repo);
                  }
               }

               // Para POST/PUT, devolver el dato individual (no array)
               return result.data;
            } else {
               showToast(result.message || "Error en la operación", "error");

               set({ error: result.message });
               throw new Error(result.message);
            }
         } catch (error) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            if (callback?.error) {
               console.log("aqui e", error);
               return msg;
            } else {
               showToast(msg, "error");
               set({ error: msg });
            }

            throw error;
         } finally {
            set({ loading: false });
         }
      },

      fetchData: async (repo: GenericRepository<T>) => {
         set({ loading: true });

         try {
            const data = await repo.getAll(get().prefix);
            if (data.ok) {
               set({ items: data.data });
               return data.data; // ✅ regresa esto
            } else {
               return []; // opcional
            }
         } catch (error) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            set({ error: msg,items:[] });
            // showToast(msg, "error");

            return []; // evitar undefined
         } finally {
            set({ loading: false });
         }
      },

      postItem: async (item: T | T[], repo: GenericRepository<T>, formData?: boolean, fetchData = true) => {
         set({ loading: true });
         try {
            const currentPrefix = get().prefix;
            console.log("Posting with prefix:", currentPrefix); // Para debug

            const data = await repo.create(item, currentPrefix, formData);
            if (data.message) {
            }
            if (data.ok) {
               showToast(data.message, "success");
               get().setOpen();
               if (!fetchData) {
                  return;
               }
               await get().fetchData(repo);
            } else {
               showToast(data.message, "error");
            }
         } catch (error) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            set({ open: true });

            showToast(msg, "error");
            set({ error: msg });
         } finally {
            set({
               loading: false,
               initialValues: { ...get().initialValues, id: 0 }
            });
         }
      },

      handleChangeItem: (item: T) => {
         set({ initialValues: item });
      },

      removeItemData: async (item: T, repo: GenericRepository<T>) => {
         set({ loading: true });
         try {
            const data = await repo.delete(item, get().prefix);
            if (data.ok) {
               showToast(data.message, "success");
               await get().fetchData(repo);
            } else {
               showToast(data.message, "error");
            }
         } catch (error) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            showToast(msg, "error");
            set({ error: msg });
         } finally {
            set({
               loading: false,
               initialValues: { ...get().initialValues, id: 0 }
            });
         }
      }
   }));
};
