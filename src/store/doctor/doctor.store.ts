import { create } from "zustand";

import type { Dependence } from "../../domain/models/dependence/dependence";
import type { DependenceRepository } from "../../domain/repositories/dependence/dependence.repositories";
import { showToast } from "../../sweetalert/Sweetalert";
import { Doctor } from "../../domain/models/doctor/dependence";
import { DoctorRepository } from "../../domain/repositories/doctor/doctor.repositories";


interface DoctorStore {
   initialValues: Doctor;
   doctor: Doctor[];
   loading: boolean;
   error: string | null;
   fetchDoctor: (repo: DoctorRepository) => Promise<void>;
   postDoctor: (doctor: Doctor, repo: DoctorRepository) => Promise<void>;
   handleChangeDoctor: (doctor: Doctor) => void;
   removeDoctor: (doctor: Doctor, repo: DoctorRepository) => void;
   resetDoctor: () => void;

   open: boolean;
   setOpen: () => void;
}

export const useDoctorStore = create<DoctorStore>((set, get) => ({
    open: false,
    setOpen: () => {
        set({ open: !get().open })
    },
    initialValues: {
        id: 0,
        name: "",
        certificate:"",
        active: true
    },
    doctor: [],
    loading: false,
    error: null,
    resetDoctor:async()=>{
        set({initialValues: {
        id: 0,
        name: "",
        certificate:"",
        active: true
    }})
    },
    fetchDoctor: async (repo: DoctorRepository) => {
        set({ loading: true })
        try {
            const data = await repo.getAll()
            if (data.ok == true) {
                set({ doctor: data.data, loading: false })


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
    postDoctor: async (doctor: Doctor, repo: DoctorRepository) => {
        set({ loading: true })
        try {
            const data = await repo.create(doctor)
            if (data.ok == true) {
               showToast(data.message, "success");
               set({ loading: false });
               get().setOpen();
               get().fetchDoctor(repo);
            } else {
               showToast(data.message, "error");
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

    handleChangeDoctor: async (doctor: Doctor) => {
        set({ initialValues: doctor })
    },
    removeDoctor: async (doctor: Doctor, repo: DoctorRepository) => {
        set({ loading: true });

        try {
            const data = await repo.delete(doctor);

            if (data.ok) {
                showToast(data.message, "success");
                await get().fetchDoctor(repo);
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