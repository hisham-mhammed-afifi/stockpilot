export interface ApiResponse<T> {
  total: number;
  skip: number;
  limit: number;
  [key: string]: T[] | number;
}
