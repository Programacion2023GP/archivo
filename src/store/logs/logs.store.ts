import { create } from "zustand";
import type { Permissions, Users } from "../../domain/models/users/users.domain";
import type { UsersRepository } from "../../domain/repositories/users/users.repositories";
import { showConfirmationAlert, showToast } from "../../sweetalert/Sweetalert";
import { LogsHistorial } from "../../domain/models/logs/logs.model";
import { LogsRepository } from "../../domain/repositories/logs/logs.repositories";

interface LogsState {
   logs: LogsHistorial[];
   loading: boolean;
   error: string | null;
   fetchLogs: (repo: LogsRepository) => Promise<void>;
  
}
export const useLogsState = create<LogsState>((set, get) => ({
   error: null,
   loading: false,
   logs: [],
   fetchLogs: async (repo: LogsRepository) => {
     try {
        const data = await repo.getAll();
        if (data.ok == true) {
           set({ logs: data.data });
        }
     } catch (error: unknown) {
        let message = "";
        if (error instanceof Error) {
           message = error.message;
        }
     }
   }
}));
