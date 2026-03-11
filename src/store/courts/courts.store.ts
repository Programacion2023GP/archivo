import { create } from "zustand";

import { showToast } from "../../sweetalert/Sweetalert";
import { CourtsRepository } from "../../domain/repositories/courts/courts.repositories";
import { Penalties } from "../../domain/models/penalties/penalties.model";
import { Court } from "../../domain/models/courts/courts.model";

interface CourtStore {
   initialValues: Court;
   disabled: boolean;
   courts: Court[];
   loading: boolean;
   error: string | null;
   fetchCourts: (repo: CourtsRepository) => Promise<void>;
   handleCourtValues: (penaltie: Penalties) => Promise<void>;
   handleResetValues: () => Promise<void>;

   postCourt: (courts: Court, repo: CourtsRepository,formData:boolean) => Promise<void>;
   handleChangeCourt: (courts: Court) => void;
   removeCourt: (courts: Court, repo: CourtsRepository) => void;

   open: boolean;
   setOpen: () => void;
}
const getLocalDateTime = () => {
   const now = new Date();

   // Ajustar por la diferencia de zona horaria
   const timezoneOffset = now.getTimezoneOffset() * 60000; // en milisegundos
   const localTime = new Date(now.getTime() - timezoneOffset);

   return localTime.toISOString().slice(0, 16);
};
const now = new Date();

export const useCourtStore = create<CourtStore>((set, get) => ({
   open: false,
   setOpen: () => {
      set({ open: !get().open, disabled: false });
   },
   handleResetValues: async () => {
      set({
         initialValues: {
            id: 0,
            date: new Date().toISOString().split("T")[0], // "2024-01-15"
            referring_agency: "",
            detainee_name: "",
            detention_reason: "",
            entry_time: now.toLocaleTimeString("en-US", {
               hour: "2-digit",
               minute: "2-digit",
               hour12: false
            }),
            exit_datetime: getLocalDateTime(),
            exit_reason: "",
            fine_amount: null,
            created_at: "",
            updated_at: "",
            image_court: ""
         }
      });
   },
   disabled: false,
   initialValues: {
      id: 0,
      date: new Date().toISOString().split("T")[0], // "2024-01-15"
      referring_agency: "",
      detainee_name: "",
      detention_reason: "",
      entry_time: now.toLocaleTimeString("en-US", {
         hour: "2-digit",
         minute: "2-digit",
         hour12: false
      }),
      exit_datetime: getLocalDateTime(),
      exit_reason: "",
      fine_amount: null,
      created_at: "",
      updated_at: "",
      image_court: ""
   },
   courts: [],
   loading: false,
   error: null,

   handleCourtValues: async (penaltie: Penalties) => {
      const now = new Date();

      set({
         disabled: true,
         initialValues: {
            id: 0,
            date: new Date().toISOString().split("T")[0], // "2024-01-15"
            referring_agency: "Alcoholimetros",
            detainee_name: penaltie.name,
            detention_reason: "Alcoholimetros",
            entry_time: now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0"),
            exit_datetime: getLocalDateTime(),
            exit_reason: "",
            fine_amount: null,
            created_at: "",
            updated_at: "",
            image_court: ""
         }
      });
   },
   fetchCourts: async (repo: CourtsRepository) => {
      set({ loading: true });
      try {
         const data = await repo.getAll();
         if (data.ok == true) {
            set({ courts: data.data, loading: false });
         }
         set({ loading: false });
      } catch (error: unknown) {
         let message = "";
         if (error instanceof Error) {
            message = error.message;
         }
         set({ error: message, loading: false });
      }
   },
   postCourt: async (court: Court, repo: CourtsRepository, formData: boolean) => {
      set({ loading: true });
      try {
         const data = await repo.create(court,formData);
         if (data.ok == true) {
            showToast(data.message, "success");
            set({ loading: false });
            get().setOpen();
            get().fetchCourts(repo);
         } else {
            showToast(data.message, "error");
         }
         set({ loading: false, initialValues: { ...get().initialValues, id: 0 } });
      } catch (error: unknown) {
         let message = "";
         if (error instanceof Error) {
            message = error.message;
            showToast(message, "error");
         }
         set({ error: message, loading: false });
         get().setOpen();
         set({ loading: false, initialValues: { ...get().initialValues, id: 0 } });
      }
   },

   handleChangeCourt: async (court: Court) => {
      set({ open: true, initialValues: court });
   },
   removeCourt: async (court: Court, repo: CourtsRepository) => {
      set({ loading: true });

      try {
         const data = await repo.delete(court);

         if (data.ok) {
            showToast(data.message, "success");
            await get().fetchCourts(repo);
         } else {
            showToast(data.message || "Error al eliminar dependencia.", "error");
         }
      } catch (error: unknown) {
         const message = error instanceof Error ? error.message : "Error desconocido al eliminar la dependencia.";
         showToast(message, "error");
         set({ error: message });
      } finally {
         set({
            loading: false,
            initialValues: { ...get().initialValues, id: 0 }
         });
      }
   }
}));
