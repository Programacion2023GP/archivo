import { LogsHistorial } from "../../models/logs/logs.model";
import type { Result } from "../../models/users/users.domain";

export interface LogsRepository {
   getAll(): Promise<Result<LogsHistorial[]>>;
}