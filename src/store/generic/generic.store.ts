import { create, StoreApi, UseBoundStore } from "zustand";
import { showToast } from "../../sweetalert/Sweetalert";
import { GenericRepository } from "../../domain/repositories/generic/generic.repositories";
import { genericConfig } from "../../generic.config";

// ─── Hooks de ciclo de vida ────────────────────────────────────────────────
export interface StoreLifecycleHooks<T> {
   beforeFetch?: () => boolean;
   afterFetch?: (items: T[]) => T[];
   beforePost?: (item: T) => T;
   afterPost?: (item: T | T[]) => void;
   beforeDelete?: (item: T) => boolean;
   afterDelete?: (item: T) => void;
   onError?: (msg: string) => void;
}

// ─── API de Persistencia tipada ───────────────────────────────────────────
export interface PersistAPI<P extends Record<string, any>> {
   get: <K extends keyof P>(key: K) => P[K] | undefined;
   set: <K extends keyof P>(key: K, value: P[K]) => void;
   readonly state: P;
}

// ─── Extensión del store ─────────────────────────────────────────────────
export type StoreExtension<T extends { id?: number }, E = {}, P extends Record<string, any> = {}, S extends Record<string, any> = {}> = (
   set: (partial: Partial<GenericStore<T> & E & S & { _persist: P }>) => void,
   get: () => GenericStore<T> & E & S & { _persist: P },
   persist: PersistAPI<P> | undefined
) => E;

// ─── Estado base ──────────────────────────────────────────────────────────
export interface GenericStore<T extends object> {
   initialValues: T;
   items: T[];
   loading: boolean;
   error: string | null;
   prefix: string;
   open: boolean;
   selectedItem: T | null;
   isDirty: boolean;
   meta: { page: number; total: number; limit: number };
   _repo: GenericRepository<T> | null;
   _autoFetched: boolean;
   _debugEnabled: boolean;

   setOpen: (open?:boolean) => void;
   setPrefix: (prefix: string) => void;
   setRepo: (repo: GenericRepository<T>) => void;
   setSelectedItem: (item: T | null) => void;
   handleChangeItem: (item: T) => void;
   setField: <K extends keyof T>(key: K, value: T[K]) => void;
   setItems: (items: T[] | ((prev: T[]) => T[])) => void;
   setDebug: (enabled: boolean) => void;

   ensureData: (hooks?: StoreLifecycleHooks<T>) => Promise<T[]>;
   fetchData: (hooks?: StoreLifecycleHooks<T>) => Promise<T[]>;
   fetchDynamic: (repo: GenericRepository<any>, prefix: string) => Promise<any>;
   postItem: (item: T | T[], formData?: boolean, fetchAfter?: boolean, hooks?: StoreLifecycleHooks<T>) => Promise<void>;
   removeItemData: (item: T, hooks?: StoreLifecycleHooks<T>) => Promise<void>;
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

   reset: () => void;
}

// ─── Caché LRU ────────────────────────────────────────────────────────────
interface CacheEntry<V> {
   value: V;
   lastAccess: number;
}

class LRUCache<K, V> {
   private cache = new Map<K, CacheEntry<V>>();
   private maxSize: number;

   constructor(maxSize: number = 50) {
      this.maxSize = maxSize;
   }

   get(key: K): V | undefined {
      const entry = this.cache.get(key);
      if (!entry) return undefined;
      entry.lastAccess = Date.now();
      return entry.value;
   }

   set(key: K, value: V): void {
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
         // Eliminar la entrada más antigua (LRU)
         let oldestKey: K | null = null;
         let oldestTime = Infinity;
         for (const [k, entry] of this.cache.entries()) {
            if (entry.lastAccess < oldestTime) {
               oldestTime = entry.lastAccess;
               oldestKey = k;
            }
         }
         if (oldestKey) this.cache.delete(oldestKey);
      }
      this.cache.set(key, { value, lastAccess: Date.now() });
   }

   delete(key: K): boolean {
      return this.cache.delete(key);
   }

   clear(): void {
      this.cache.clear();
   }

   has(key: K): boolean {
      return this.cache.has(key);
   }
}

const storeCache = new LRUCache<string, UseBoundStore<StoreApi<any>>>(50);

export const clearStoreCache = (prefix?: string) => {
   if (prefix) storeCache.delete(prefix);
   else storeCache.clear();
};

// ─── Factory con sistema de debug y LRU ──────────────────────────────────
export function createGenericStore<T extends { id?: number }, E = {}, P extends Record<string, any> = {}, S extends Record<string, any> = {}>(
   initialValues: T,
   extension?: StoreExtension<T, E, P, S>,
   persistKey?: string,
   initialExtraState?: S,
   debug: boolean = false
): UseBoundStore<StoreApi<GenericStore<T> & E & S & { _persist: P }>> {
   const cfg = genericConfig;
   const _original = { ...initialValues };

   // Cargar persistencia
   const loadPersistState = (): P => {
      if (!persistKey) return {} as P;
      try {
         const stored = localStorage.getItem(persistKey);
         return stored ? JSON.parse(stored) : ({} as P);
      } catch {
         return {} as P;
      }
   };

   const savePersistState = (state: P) => {
      if (!persistKey) return;
      try {
         localStorage.setItem(persistKey, JSON.stringify(state));
      } catch (e) {
         console.error("Error guardando en localStorage", e);
      }
   };

   const makeStore = (set: any, get: any) => {
      const persistAPI: PersistAPI<P> | undefined = persistKey
         ? {
              get: (key) => get()._persist?.[key],
              set: (key, value) => {
                 set((state: any) => {
                    const newPersist = { ...state._persist, [key]: value };
                    savePersistState(newPersist);
                    return { _persist: newPersist };
                 });
              },
              get state() {
                 return get()._persist;
              }
           }
         : undefined;

      const log = (action: string, stage: string, data?: any, duration?: number) => {
         if (!get()._debugEnabled) return;
         const storeName = get().prefix || "generic";
         const color = stage === "start" ? "🔵" : stage === "success" ? "🟢" : stage === "error" ? "🔴" : "⚪";
         console.groupCollapsed(`${color} [${storeName}] ${action} - ${stage}`);
         console.log("⏱️ Tiempo:", duration ? `${duration}ms` : "inicio");
         if (data) console.log("📦 Datos:", data);
         console.trace("Traza");
         console.groupEnd();
      };

      const baseState: GenericStore<T> & S & { _persist: P } = {
         open: false,
         prefix: "",
         initialValues,
         items: [],
         loading: false,
         error: null,
         selectedItem: null,
         isDirty: false,
         meta: { page: 1, total: 0, limit: 20 },
         _repo: null,
         _autoFetched: false,
         _debugEnabled: debug,
         _persist: loadPersistState(),
         ...(initialExtraState || ({} as S)),

         setField: (key, value) => set((s: any) => ({ initialValues: { ...s.initialValues, [key]: value } })),
         setExtra: (key, value) => set({ [key]: value }),
         setItems: (items) => set((s: any) => ({ items: typeof items === "function" ? items(s.items) : items })),
         setOpen: (open?:boolean) => set((s: any) => ({ open: open? open:!s.open, initialValues: _original })),
         setPrefix: (prefix) => set({ prefix }),
         setRepo: (repo) => set({ _repo: repo }),
         setSelectedItem: (item) => set({ selectedItem: item }),
         handleChangeItem: (item) =>
            set((s: any) => ({
               initialValues: item,
               isDirty: JSON.stringify(item) !== JSON.stringify(s.constants)
            })),
         reset: () => set({ initialValues: _original, selectedItem: null, isDirty: false, error: null }),
         setDebug: (enabled) => set({ _debugEnabled: enabled }),

         ensureData: async (hooks) => {
            const state = get();
            if (state.items.length > 0 || state._autoFetched) return state.items;
            set({ _autoFetched: true });
            return await state.fetchData(hooks);
         },

         fetchDynamic: async (repo, prefix) => {
            const start = performance.now();
            log("fetchDynamic", "start", { prefix });
            set({ loading: true });
            try {
               const result = await repo.getAll(prefix);
               const duration = performance.now() - start;
               if (result.ok) {
                  set({ items: result.data });
                  log("fetchDynamic", "success", result.data, duration);
                  return result.data;
               }
               log("fetchDynamic", "error", { message: result.message }, duration);
               return [];
            } catch (error: any) {
               const duration = performance.now() - start;
               log("fetchDynamic", "error", error, duration);
               set({ error: error?.message ?? cfg.messages.unknownError });
               return [];
            } finally {
               set({ loading: false });
            }
         },

         fetchData: async (hooks) => {
            const repo = get()._repo;
            if (!repo) return [];
            if (hooks?.beforeFetch?.() === false) return get().items;

            const start = performance.now();
            const url = get().prefix;
            log("fetchData", "start", { url });

            set({ loading: true });
            try {
               const data = await repo.getAll(url);
               const duration = performance.now() - start;
               if (data.ok) {
                  const raw = data.data ?? [];
                  const items = hooks?.afterFetch ? hooks.afterFetch(raw) : (cfg.middlewares.afterResponse?.(raw) ?? raw);
                  set({ items });
                  log("fetchData", "success", { count: items.length, sample: items[0] }, duration);
                  return items;
               } else {
                  log("fetchData", "error", { message: data.message }, duration);
                  return [];
               }
            } catch (error: any) {
               const duration = performance.now() - start;
               const msg = error?.message ?? cfg.messages.fetchError;
               log("fetchData", "error", error, duration);
               (hooks?.onError ?? cfg.middlewares.onError)?.(msg);
               set({ error: msg, items: [] });
               return [];
            } finally {
               set({ loading: false });
            }
         },

         postItem: async (item, formData, fetchAfter = true, hooks) => {
            const repo = get()._repo;
            if (!repo) return;

            const start = performance.now();
            const payload = hooks?.beforePost ? hooks.beforePost(item as T) : (cfg.middlewares.beforeRequest?.(item) ?? item);
            log("postItem", "start", { payload, formData });

            set({ loading: true });
            try {
               const data = await repo.create(payload, get().prefix, formData);
               const duration = performance.now() - start;
               if (data.ok) {
                  showToast(data.message || cfg.messages.createSuccess, "success");
                  hooks?.afterPost?.(item);
                  get().setOpen();
                  if (fetchAfter) await get().fetchData(hooks);
                  log("postItem", "success", { response: data.data }, duration);
               } else {
                  showToast(data.message, "error");
                  log("postItem", "error", { message: data.message }, duration);
               }
            } catch (error: any) {
               const duration = performance.now() - start;
               const msg = error?.message ?? cfg.messages.unknownError;
               log("postItem", "error", error, duration);
               (hooks?.onError ?? cfg.middlewares.onError)?.(msg);
               showToast(msg, "error");
               set({ error: msg, open: true });
            } finally {
               set({ loading: false, initialValues: _original });
            }
         },

         removeItemData: async (item, hooks) => {
            const repo = get()._repo;
            if (!repo) return;
            if (hooks?.beforeDelete?.(item) === false) return;

            const start = performance.now();
            log("removeItemData", "start", { item });

            const previous = get().items;
            set({ items: previous.filter((i: any) => i.id !== (item as any).id), loading: true });
            try {
               const data = await repo.delete(item, get().prefix);
               const duration = performance.now() - start;
               if (data.ok) {
                  showToast(data.message || cfg.messages.deleteSuccess, "success");
                  hooks?.afterDelete?.(item);
                  await get().fetchData(hooks);
                  log("removeItemData", "success", { message: data.message }, duration);
               } else {
                  set({ items: previous });
                  showToast(data.message, "error");
                  log("removeItemData", "error", { message: data.message }, duration);
               }
            } catch (error: any) {
               const duration = performance.now() - start;
               set({ items: previous });
               const msg = error?.message ?? cfg.messages.unknownError;
               log("removeItemData", "error", error, duration);
               (hooks?.onError ?? cfg.middlewares.onError)?.(msg);
               showToast(msg, "error");
               set({ error: msg });
            } finally {
               set({ loading: false, initialValues: _original });
            }
         },

         request: async (options, callback) => {
            const repo = get()._repo;
            if (!repo) {
               callback?.error?.();
               return undefined;
            }

            const start = performance.now();
            log("request", "start", { method: options.method, url: options.url, data: options.data });

            set({ loading: true });
            try {
               const result = await repo.request({
                  data: options.data,
                  prefix: options.url,
                  method: options.method,
                  formData: options.formData,
               
                  signal: options.signal
               });
               const duration = performance.now() - start;
               if (result.ok) {
                  if (options.method !== "GET" && result.message) showToast(result.message, "success");
                  if (options.method === "GET") {
                     const dataArray = Array.isArray(result.data) ? result.data : [result.data];
                     set({ items: dataArray });
                     log("request", "success", { data: dataArray }, duration);
                     callback?.then?.();
                     return dataArray;
                  } else {
                     if (options.getData === true) {
                        console.log("aqui mer", options.getData);
                        await get().fetchData();
                     }
                     log("request", "success", { data: result.data }, duration);
                     callback?.then?.();
                     return result.data as T | T[];
                  }
               } else {
                  log("request", "error", { message: result.message }, duration);
                  showToast(result.message || "Error en la operación", "error");
                  set({ error: result.message });
                  callback?.error?.();
               }
            } catch (error: any) {
               const duration = performance.now() - start;
               const msg = error?.message ?? cfg.messages.unknownError;
               log("request", "error", error, duration);
               set({ error: msg });
               callback?.error?.();
               if (!callback?.error) showToast(msg, "error");
            } finally {
               set({ loading: false });
            }
         }
      };

      const extensionState = extension ? extension(set as any, get as any, persistAPI) : ({} as E);

      return {
         ...baseState,
         ...extensionState
      };
   };

   return create<GenericStore<T> & E & S & { _persist: P }>(makeStore);
}
