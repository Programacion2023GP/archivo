import { create } from "zustand";

interface PermissionsState {
   permissions: string[];
   loadPermissions: () => void;
   updatePermissions: (newPermissions: string[]) => void;
   hasPermission: (permission: string) => boolean;
   hasPermissionPrefix: (prefix: string) => boolean;
   clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
   permissions: [],

   loadPermissions: () => {
      try {
         const stored = localStorage.getItem("permisos");
         const parsed = stored ? JSON.parse(stored) : [];
         set({ permissions: parsed });
      } catch (error) {
         set({ permissions: [] });
      }
   },

   updatePermissions: (newPermissions: string[]) => {
      set({ permissions: newPermissions });
      localStorage.setItem("permisos", JSON.stringify(newPermissions));
   },

   hasPermission: (permission: string) => {
      return get().permissions.includes(permission);
   },

   hasPermissionPrefix: (prefix: string) => {
      const permissions = get().permissions;
      const hasIt = permissions.some((p) => p.startsWith(prefix));
      return hasIt;
   },

   clearPermissions: () => {
      set({ permissions: [] });
      localStorage.removeItem("permisos");
   }
}));
