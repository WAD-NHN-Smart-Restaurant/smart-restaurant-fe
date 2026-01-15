"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, ChevronDown } from "lucide-react";
import { Category } from "@/types/category-type";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface MenuFilters {
  search?: string;
  categoryId?: string;
  sortBy?: "name" | "price" | "popularity";
  sortOrder?: "asc" | "desc";
  chefRecommended?: boolean;
}

interface MenuFiltersProps {
  filters: MenuFilters;
  categories: Category[];
  onFiltersChange: (filters: MenuFilters) => void;
}

export function MenuFiltersSection({
  filters,
  categories,
  onFiltersChange,
}: MenuFiltersProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Filter & Search
          </h3>
        </div>
        <div className="flex w-full justify-between gap-4 flex-wrap">
          <div className="flex-1 flex gap-4 min-w-[300px]">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      search: e.target.value || undefined,
                    })
                  }
                  className="pl-9 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    categoryId: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-y-1">
              <label className="text-sm font-medium">Sort By</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] justify-between"
                  >
                    <div className="flex gap-1 items-center font-normal">
                      {filters.sortBy === "name" && "Name"}
                      {filters.sortBy === "price" && "Price"}
                      {filters.sortBy === "popularity" && "Popularity"}
                      {!filters.sortBy && "Default"}
                      {filters.sortOrder && (
                        <span>{filters.sortOrder === "desc" ? "↓" : "↑"}</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuItem
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        sortBy: undefined,
                        sortOrder: undefined,
                      })
                    }
                  >
                    Default
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Name</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "name",
                            sortOrder: "asc",
                          })
                        }
                      >
                        ↑ A to Z
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "name",
                            sortOrder: "desc",
                          })
                        }
                      >
                        ↓ Z to A
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Price</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "price",
                            sortOrder: "asc",
                          })
                        }
                      >
                        ↑ Low to High
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "price",
                            sortOrder: "desc",
                          })
                        }
                      >
                        ↓ High to Low
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Popularity</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "popularity",
                            sortOrder: "asc",
                          })
                        }
                      >
                        ↑ Low to High
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sortBy: "popularity",
                            sortOrder: "desc",
                          })
                        }
                      >
                        ↓ High to Low
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Label htmlFor="chef-recommended" className="text-sm font-medium">
                Chef&apos;s Pick
              </Label>
              <div className="flex items-center h-10 px-3 border rounded-md">
                <Switch
                  id="chef-recommended"
                  checked={filters.chefRecommended || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      chefRecommended: checked || undefined,
                    })
                  }
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {filters.chefRecommended ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
