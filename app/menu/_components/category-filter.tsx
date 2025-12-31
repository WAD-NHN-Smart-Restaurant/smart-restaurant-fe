"use client";

import { Button } from "@/components/ui/button";
import { Category } from "@/types/category-type";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId?: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategoryFilterProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Button
          variant={!selectedCategoryId ? "default" : "outline"}
          size="sm"
          onClick={() => onCategorySelect(undefined)}
          className="whitespace-nowrap"
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategorySelect(category.id)}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
