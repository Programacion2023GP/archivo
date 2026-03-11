import { create } from "zustand";

import type { Dependence } from "../../domain/models/dependence/dependence";
import type { DependenceRepository } from "../../domain/repositories/dependence/dependence.repositories";
import { showToast } from "../../sweetalert/Sweetalert";


interface DependenceStore {
   initialValues: Dependence;
   dependence: Dependence[];
   loading: boolean;
   error: string | null;
   fetchDependence: (repo: DependenceRepository) => Promise<void>;
   postDependence: (dependence: Dependence, repo: DependenceRepository) => Promise<void>;
   handleChangeDependence: (dependence: Dependence) => void;
   resetValues: () => void;

   removeDependence: (dependence: Dependence, repo: DependenceRepository) => void;

   open: boolean;
   setOpen: () => void;
}

export const useDependenceStore = create<DependenceStore>((set, get) => ({
    open: false,
    setOpen: () => {
        set({ open: !get().open })
    },
    initialValues: {
        id: 0,
        name: "",
        color:"",
        active: true
    },
    dependence: [],
    loading: false,
    error: null,
    fetchDependence: async (repo: DependenceRepository) => {
        set({ loading: true })
        try {
            const data = await repo.getAll()
            if (data.ok == true) {
                set({ dependence: data.data, loading: false })


            }
            set({ loading: false })
        } catch (error: unknown) {
            let message = "";
            if (error instanceof Error) {
                message = error.message
            }
            set({ error: message, loading: false })
        }
    },
    resetValues:async()=>{
        set({initialValues: {
        id: 0,
        name: "",
        color:"",
        active: true
    },});
    },
    postDependence: async (dependence: Dependence, repo: DependenceRepository) => {
        set({ loading: true })
        try {
            const data = await repo.create(dependence)
            if (data.ok == true) {
                showToast(data.message, "success")
                set({ loading: false })
                get().setOpen()
                get().fetchDependence(repo);
            }
            set({ loading: false, initialValues: { ...get().initialValues, id: 0 } })
        } catch (error: unknown) {
            let message = "";
            if (error instanceof Error) {
                message = error.message
                showToast(message, "error")

            }
            set({ error: message, loading: false })
            get().setOpen()
            set({ loading: false, initialValues: { ...get().initialValues, id: 0 } })

        }
    },

    handleChangeDependence: async (dependence: Dependence) => {
        set({ initialValues: dependence })
    },
    removeDependence: async (dependence: Dependence, repo: DependenceRepository) => {
        set({ loading: true });

        try {
            const data = await repo.delete(dependence);

            if (data.ok) {
                showToast(data.message, "success");
                await get().fetchDependence(repo);
            } else {
                showToast(data.message || "Error al eliminar dependencia.", "error");
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Error desconocido al eliminar la dependencia.";
            showToast(message, "error");
            set({ error: message });
        } finally {
            set({
                loading: false,
                initialValues: { ...get().initialValues, id: 0 },
            });
        
        }
    },

}))