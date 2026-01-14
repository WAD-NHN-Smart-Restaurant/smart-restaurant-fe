import api from "@/libs/api-request";

export interface TableInfo {
  id: string;
  table_number?: number | string; // snake_case from database
  tableNumber?: string; // camelCase from API transform
  location?: string;
  capacity?: number;
  status?: string;
}

/**
 * Get table information by table ID (using qr_token auth)
 */
export const getTableInfo = async (tableId: string) => {
  const response = await api.get<{ success: boolean; data: TableInfo }>(
    `/tables/${tableId}`,
  );
  // Handle both snake_case and camelCase formats
  const data = response.data.data;
  return {
    ...data,
    table_number: data.table_number || data.tableNumber,
  };
};
