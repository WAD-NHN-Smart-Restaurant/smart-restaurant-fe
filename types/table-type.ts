import { z } from "zod";
import {
  tableSchema,
  updateTableSchema,
  tableFilterSchema,
} from "@/schema/table-schema";

export type TableStatus = "available" | "inactive" | "occupied";

export interface Table {
  id: string;
  tableNumber: string;
  restaurantId: string;
  capacity: number;
  location: string;
  description?: string;
  status: TableStatus;
  qrTokenCreatedAt?: string;
  qrUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableSortOptions {
  field: "tableNumber" | "capacity" | "createdAt" | "location";
  order: "asc" | "desc";
}

export interface QRCodeDownloadOptions {
  format: "png" | "pdf";
  tableId?: string;
  includeLogo?: boolean;
  includeWifi?: boolean;
}

export enum TableLocation {
  INDOOR = "Indoor",
  OUTDOOR = "Outdoor",
  PATIO = "Patio",
  VIP_ROOM = "VIP Room",
  MAIN_HALL = "Main Hall",
  BALCONY = "Balcony",
  GARDEN = "Garden",
}

export type CreateTableForm = z.infer<typeof tableSchema>;
export type UpdateTableForm = z.infer<typeof updateTableSchema>;
export type TableFilter = z.infer<typeof tableFilterSchema>;
