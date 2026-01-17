"use client";

import type { GuestCategory, GuestMenuItem } from "@/types/guest-menu-type";
import { MenuItemCard } from "./menu-item-card";

interface CategorySectionProps {
  category: GuestCategory;
  onItemClick: (item: GuestMenuItem) => void;
}

export function CategorySection({
  category,
  onItemClick,
}: CategorySectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
        {category.description && (
          <p className="text-gray-600 mt-1">{category.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-start">
        {category.menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onItemClick={onItemClick} />
        ))}
      </div>
    </section>
  );
}
