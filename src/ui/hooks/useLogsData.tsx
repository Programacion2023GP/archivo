// hooks/useLogsData.ts
import { useMemo } from "react";
import { GenericDataReturn, useGenericData } from "../../hooks/usegenericdata";

export interface LogEntry {
  id: number;
  event: "created" | "updated" | "deleted";
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_name: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
  loggable_type: string;
  loggable_id: number;
}

export interface LogsPersistState {
  filterEvent?: string;
}

export interface LogsExtraState {
  modelType: string;
  modelId: number;
}

export type LogsDataReturn = GenericDataReturn<LogEntry, any, LogsPersistState, LogsExtraState>;

const useLogsData = (modelType: string, modelId: number): LogsDataReturn => {
  const initialState = useMemo<LogEntry>(
    () => ({
      id: 0,
      event: "created",
      old_values: null,
      new_values: null,
      user_name: "",
      created_at: "",
      ip_address: "",
      user_agent: "",
      loggable_type: "",
      loggable_id: 0,
    }),
    []
  );

  // 🔥 Construir URL según el tipo
  const getPrefix = () => {
    if (modelType === "all") {
      return "logs/all"; // Endpoint que trae todos los logs
    }
    return `logs/${modelType}/${modelId}`;
  };

  return useGenericData<LogEntry, any, LogsPersistState, LogsExtraState>({
    initialState,
    prefix: getPrefix(),
    autoFetch: true,
    persistKey: `logs-${modelType}-${modelId}`,
    extraState: { modelType, modelId },
    extension: () => ({}),
    hooks: {
      onError: (msg) => console.error("[Logs]", msg)
    }
  });
};

export default useLogsData;