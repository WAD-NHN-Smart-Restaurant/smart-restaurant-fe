import { z } from "zod";
import {
  ModifierSelectionType,
  ModifierOptionStatus,
  ModifierGroupStatus,
} from "@/types/modifier-type";

export const modifierGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Modifier group name is required")
    .max(100, "Name must be less than 100 characters"),
  selectionType: z.nativeEnum(ModifierSelectionType),
  isRequired: z.boolean(),
  minSelections: z.number().min(0, "Minimum selections must be at least 0"),
  maxSelections: z.number().min(1, "Maximum selections must be at least 1"),
  displayOrder: z
    .number()
    .min(1, "Display order must be at least 1")
    .max(9999, "Display order must be less than 10000"),
  status: z.nativeEnum(ModifierGroupStatus),
});

export const modifierOptionSchema = z.object({
  name: z
    .string()
    .min(1, "Option name is required")
    .max(100, "Name must be less than 100 characters"),
  priceAdjustment: z
    .number()
    .min(-999, "Price adjustment must be at least -999")
    .max(999, "Price adjustment must be less than 999"),
  status: z.nativeEnum(ModifierOptionStatus),
});

export const modifierGroupFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(ModifierGroupStatus).optional(),
  selectionType: z.nativeEnum(ModifierSelectionType).optional(),
  sortBy: z.enum(["name", "displayOrder", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const attachModifierGroupsSchema = z.object({
  modifierGroupIds: z.array(z.string()).min(0, "Invalid modifier group IDs"),
});

export const createModifierGroupSchema = modifierGroupSchema;

export const updateModifierGroupSchema = modifierGroupSchema.extend({
  id: z.string().min(1, "Modifier group ID is required"),
});

export const createModifierOptionSchema = modifierOptionSchema.extend({
  groupId: z.string().min(1, "Group ID is required"),
});

export const updateModifierOptionSchema = modifierOptionSchema.extend({
  id: z.string().min(1, "Modifier option ID is required"),
});

export type ModifierGroupForm = z.infer<typeof modifierGroupSchema>;
export type ModifierOptionForm = z.infer<typeof modifierOptionSchema>;
export type ModifierGroupFilterForm = z.infer<typeof modifierGroupFilterSchema>;
export type CreateModifierGroupForm = z.infer<typeof createModifierGroupSchema>;
export type UpdateModifierGroupForm = z.infer<typeof updateModifierGroupSchema>;
export type CreateModifierOptionForm = z.infer<
  typeof createModifierOptionSchema
>;
export type UpdateModifierOptionForm = z.infer<
  typeof updateModifierOptionSchema
>;
export type AttachModifierGroupsForm = z.infer<
  typeof attachModifierGroupsSchema
>;
