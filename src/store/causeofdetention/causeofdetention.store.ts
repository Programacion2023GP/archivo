import { create } from "zustand";

import { showToast } from "../../sweetalert/Sweetalert";
import { causeOfDetention } from "../../domain/models/causeofdetention/cause_of_detention";
import { CauseOfDetentionRepository } from "../../domain/repositories/causeofdetention/cause_of_detention.repositories";


interface CauseDetentionStore {
   initialValues: causeOfDetention;
   causesofdetention: causeOfDetention[];
   loading: boolean;
   error: string | null;
   fetchCauseOfDetention: (repo: CauseOfDetentionRepository) => Promise<void>;
   postCauseOfDetention: (doctor: causeOfDetention, repo: CauseOfDetentionRepository) => Promise<void>;
   handleCauseOfDetention: (doctor: causeOfDetention) => void;
   removeCauseOfDetention: (doctor: causeOfDetention, repo: CauseOfDetentionRepository) => void;

   open: boolean;
   setOpen: () => void;
}

export const useCauseOfDetentionStore = create<CauseDetentionStore>((set, get) => ({
   open: false,
   setOpen: () => {
      set({ open: !get().open });
   },
   initialValues: {
      id: 0,
      name: "",
      active: true
   },
   causesofdetention: [],
   loading: false,
   error: null,
   fetchCauseOfDetention: async (repo: CauseOfDetentionRepository) => {
      set({ loading: true });
      try {
         const data = await repo.getAll();
         if (data.ok == true) {
            set({ causesofdetention: data.data, loading: false });
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
   postCauseOfDetention: async (doctor: causeOfDetention, repo: CauseOfDetentionRepository) => {
      set({ loading: true });
      try {
         const data = await repo.create(doctor);
         if (data.ok == true) {
            showToast(data.message, "success");
            set({ loading: false });
            get().setOpen();
            get().fetchCauseOfDetention(repo);
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

   handleCauseOfDetention: async (causeofdetention: causeOfDetention) => {
      set({ initialValues: causeofdetention });
   },
   removeCauseOfDetention: async (causeofdetention: causeOfDetention, repo: CauseOfDetentionRepository) => {
      set({ loading: true });

      try {
         const data = await repo.delete(causeofdetention);

         if (data.ok) {
            showToast(data.message, "success");
            await get().fetchCauseOfDetention(repo);
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