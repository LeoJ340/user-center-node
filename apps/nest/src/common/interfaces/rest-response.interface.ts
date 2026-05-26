export interface RestResponse<T> {
  code: number;
  data: T | null;
  message: string;
  requestId?: string;
}
