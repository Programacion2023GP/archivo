import type { Permissions, Result, Users } from "../../models/users/users.domain";

export interface UsersRepository {
   getAll(): Promise<Result<Users[]>>;
   getPermissions(): Promise<Result<Permissions[]>>;
   register(user: Users): Promise<Result<Users>>;
   login(user: { payroll: string; password: string }): Promise<Result<void>>;
   delete(user: Users): Promise<Result<void>>;
   logout(): Promise<Result<void>>;
}     