import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const VerifyEmailFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full mx-auto bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-6 w-40 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
};
