import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
