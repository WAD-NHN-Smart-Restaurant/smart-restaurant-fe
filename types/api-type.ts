export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Pagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface PaginationItems<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: PaginationItems<T>;
  message?: string;
}
