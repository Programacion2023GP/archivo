export  type SuccessData<T> = { type: "success"; data: T; status: 200 };
export type SuccessMessage = { type: "successMessage"; message: string; status: 201 };
export type ErrorResponse = { type: "error"; error: string | null };

