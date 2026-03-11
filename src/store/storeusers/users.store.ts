import { create } from "zustand";
import type { Permissions, Users } from "../../domain/models/users/users.domain";
import type { UsersRepository } from "../../domain/repositories/users/users.repositories";
import { showConfirmationAlert, showToast } from "../../sweetalert/Sweetalert";
import { MODULE_ORDER } from "../../utils/redirect";

interface UsersState {
   initialValues: Users;
   users: Users[];
   total: number;
   loading: boolean;
   error: string | null;
   fetchUsers: (repo: UsersRepository) => Promise<void>;
   logout: (repo: UsersRepository) => Promise<void>;
   login: (user: { payroll: string; password: string }, repo: UsersRepository) => Promise<void>;
   permissions: Permissions[];
   fetchAddUser: (repo: UsersRepository, user: Users) => Promise<void>;
   deleteUser: (repo: UsersRepository, user: Users) => Promise<void>;
   setInitialValues: (user: Users, type: "form" | "permission") => void;
   modalForm: boolean;
   modalPermission: boolean;
   setModalForm: () => void;
   setModalPermission: () => void;
   resetValues: () => void;
   fetchPermissions: (repo: UsersRepository) => Promise<void>;
}
export const useUsersState = create<UsersState>((set, get) => ({
   modalForm: false,
   modalPermission: false,

   initialValues: {
      role: "usuario",
      fullName: "",
      id: 0,
      dependence_id: null,
      maternalSurname: "",
      firstName: "",
      password: "",
      active: false,
      paternalSurname: "",
      payroll: 0,
      permissions: []
   },
   users: [],
   permissions: [],
   fetchPermissions: async (repo: UsersRepository) => {
      try {
         const data = await repo.getPermissions();
         if (data.ok == true) {
            set({ permissions: data.data });
         }
      } catch (error: unknown) {
         let message = "";
         if (error instanceof Error) {
            message = error.message;
         }
      }
   },
   total: 0,
   error: null,
   loading: false,
   resetValues: () => {
      set({
         initialValues: {
            payroll: null,
            dependence_id: null,
            role: "usuario",

            fullName: "",
            id: 0,
            maternalSurname: "",
            firstName: "",
            password: "",
            active: false,
            paternalSurname: "",
            permissions: []
         }
      });
   },
   setModalPermission: () => {
      set({ modalPermission: !get().modalPermission });
   },
   setModalForm: () => {
      set({ modalForm: !get().modalForm });
   },
   setInitialValues: (user: Users, type: "form" | "permission") => {
      set({ initialValues: user });
      if (type == "form") {
         get().setModalForm();
      } else {
         get().setModalPermission();
      }
   },
   fetchUsers: async (repo: UsersRepository) => {
      set({ loading: true });
      try {
         const data = await repo.getAll();
         if (data.ok == true) {
            set({ users: data.data, loading: false, total: data.data.length + 1 });
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
   logout: async (repo: UsersRepository) => {
      try {
         const data = await repo.logout();
         if (data.ok == true) {
            showToast(data.message, "success");
         }
         localStorage.clear();
         window.location.href = "/";
      } catch (error: unknown) {
         let message = "";
         if (error instanceof Error) {
            message = error.message;
         }
         set({ error: message, loading: false });
      }
   },
      login: async (user: { payroll: string; password: string }, repo: UsersRepository) => {
      try {
        

         set({ loading: true });
         const data = await repo.login(user);
         if (data.ok == true) {
            showToast(data.message, "success");
            const token = (data.data as any).token;
            localStorage.setItem("token", token);
            localStorage.setItem("permisos", JSON.stringify((data.data as any).permisos));
            localStorage.setItem("name", (data.data as any).user.fullName);
            localStorage.setItem("auth_id", (data.data as any).user.id);
            
             for (const module of MODULE_ORDER) {
               console.log((data.data as any).permisos,module);
                if ((data.data as any).permisos.includes(module.permission)) {
                   window.location.href = module.route;
                   break; 
                }
             }
         } else {
            showToast("Credenciales incorrectas", "error");
         }
         set({ loading: false });
      } catch (error: unknown) {
         let message = "";
         if (error instanceof Error) {
            message = error.message;
         }
         set({ error: message, loading: false });
      }
      set({ loading: false });
   },
   fetchAddUser: async (repo: UsersRepository, user: Users) => {
      set({ modalForm: false});

      try {
         const result = await repo.register(user);
         if (result.ok) {
            set({ modalForm: false });
            showToast(result.message, "success");
            if (user.id == 0) {
               await showConfirmationAlert("Datos de cuenta", {
                  html: `
    <div style="text-align:left; line-height:1.5;">
      <p>⚠️ <strong>Este usuario iniciará sesión con los siguientes datos:</strong></p>
      <p>📧 <strong>Accesso:</strong> ${user.payroll}</p>
      <p>🔑 <strong>Contraseña temporal:</strong> ${result.data.password}</p>
      <p>Se recomienda <strong>cambiar la contraseña</strong> después del primer inicio de sesión.</p>
    </div>
  `
               }).then(async (isConfirmed) => {
                  // Recargamos los usuarios después de cerrar el modal, confirmando o no
                  await get().fetchUsers(repo);
               });
            } else {
               await get().fetchUsers(repo);
            }
         } else {
            showToast(String(result?.message), "error");
            await get().fetchUsers(repo);
         }
      } catch (err: unknown) {
         let message = "";
         if (err instanceof Error) {
            message = err.message;
            showToast(message, "error");
         }
         set({ error: message, loading: false, modalForm: false });
      }
   },
   deleteUser: async (repo: UsersRepository, user: Users) => {
      try {
         set({ loading: true });

         const result = await repo.delete(user);
         if (result.ok) {
            await get().fetchUsers(repo);
            showToast(result.message, "success");
         }
      } catch (err: unknown) {
         let message = "";
         if (err instanceof Error) {
            message = err.message;
            showToast(message, "error");
         }
         set({ error: message, loading: false });
      }
   }
}));
