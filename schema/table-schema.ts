import { TableLocation } from "@/types/table-type";
import { z } from "zod";

export const tableSchema = z.object({
  tableNumber: z
    .string()
    .min(1, "Table number is required")
    .max(50, "Table number must be less than 50 characters"),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity must be at most 20"),
  location: z.enum(TableLocation),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum(["available", "inactive", "occupied"]),
});

export const updateTableSchema = tableSchema.omit({ status: true }).partial();

export const tableFilterSchema = z.object({
  status: z.enum(["available", "inactive", "occupied"]).optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["tableNumber", "capacity", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
