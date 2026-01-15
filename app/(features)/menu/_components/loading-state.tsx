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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, itemIndex) => (
              <Card
                key={itemIndex}
                className="overflow-hidden h-full flex flex-col"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="mb-3 h-5">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
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
