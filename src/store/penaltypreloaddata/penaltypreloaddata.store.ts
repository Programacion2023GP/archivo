import { create } from "zustand";

import { showToast } from "../../sweetalert/Sweetalert";
import { PenaltyPreloadData } from "../../domain/models/penaltypreloaddata/penaltypreloaddata.model";
import { PenaltyPreloadDataRepository } from "../../domain/repositories/penaltypreloaddata/penaltypreloaddata.repositores";

interface PenaltyPreloadDataStore {
   initialValues: PenaltyPreloadData;
   penaltypreloaddata: PenaltyPreloadData;

   loading: boolean;
   error: string | null;
   postPenaltyPreloadData: (penaltie: PenaltyPreloadData, repo: PenaltyPreloadDataRepository) => Promise<void>;
   // fetchPenaltyPreloadData: (repo: PenaltyPreloadDataRepository) => Promise<void>;

   open: boolean;
   setOpen: () => void;
}
const now = new Date();

export const usePenaltyPreloadDataStore = create<PenaltyPreloadDataStore>((set, get) => ({
   open: false,
   setOpen: () => {
      set({ open: !get().open });
   },

   initialValues: {
      id: 0,
      person_contraloria: "",
      person_oficial: "",
      group: 0,
      doctor_id: 0,
      civil_protection: "",
      command_vehicle: "",
      command_troops: "",
      command_details: "",
      filter_supervisor: "",
      init_date: undefined,
      final_date: undefined,
      user_id: 0
   },

   penaltypreloaddata: {
      id: 0,
      person_contraloria: "",
      person_oficial: "",
      group: 0,
      doctor_id: 0,
      civil_protection: "",
      command_vehicle: "",
      command_troops: "",
      command_details: "",
      filter_supervisor: "",
      init_date: undefined,
      final_date: undefined,
      user_id: 0
   },
   loading: false,
   error: null,

   // fetchPenaltyPreloadData: async (repo: PenaltyPreloadDataRepository) => {
   //    set({ loading: true });
   //    try {
   //       const data = await repo.getAll();
   //       if (data.ok == true) {
   //          set({ penaltypreloaddata: data.data, loading: false });
   //       }
   //       set({ loading: false });
   //    } catch (error: unknown) {
   //       let message = "";
   //       if (error instanceof Error) {
   //          message = error.message;
   //       }
   //       set({ error: message, loading: false });
   //       get().resetInitialValues();
   //    }
   // },

   postPenaltyPreloadData: async (penaltie: PenaltyPreloadData, repo: PenaltyPreloadDataRepository) => {
      set({ loading: true, open: false });

      try {
         const data = await repo.create(penaltie);

         if (!data.ok) {
            throw new Error(data.message || "Error al crear multa");
         }

         showToast(data.message, "success");
         get().setOpen();
         // get().fetchPenaltyPreloadData(repo);
      } catch (error: unknown) {
         const message = error instanceof Error ? error.message : "Error desconocido";
         showToast(message, "error");
         set({ error: message });
         get().setOpen();
         set({
            loading: false,
            initialValues: { ...get().initialValues, id: 0 }
         });
      } finally {
      }
   }
}));
