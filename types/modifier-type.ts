export enum ModifierSelectionType {
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export enum ModifierOptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum ModifierGroupStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  status: ModifierOptionStatus;
  groupId: string;
  createdAt: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  status: ModifierGroupStatus;
  modifierOptions: ModifierOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierGroupFilter {
  search?: string;
  status?: ModifierGroupStatus;
  selectionType?: ModifierSelectionType;
  sortBy?: "name" | "displayOrder" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Re-export schemas as types
export type {
  CreateModifierGroupForm,
  UpdateModifierGroupForm,
  CreateModifierOptionForm,
  UpdateModifierOptionForm,
  ModifierGroupFilterForm,
  AttachModifierGroupsForm,
} from "@/schema/modifier-schema";
