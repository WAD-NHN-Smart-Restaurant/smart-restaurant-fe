"use client";

import { Card, CardContent } from "@/components/ui/card";

export function LoadingState() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, categoryIndex) => (
        <section key={categoryIndex} className="animate-pulse">
          <div className="mb-4">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, itemIndex) => (
              <Card key={itemIndex} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gray-200"></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
