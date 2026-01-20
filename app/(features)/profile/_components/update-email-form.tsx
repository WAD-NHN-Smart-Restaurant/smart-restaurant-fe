"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { useAuth } from "@/context/auth-context";

const updateEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type UpdateEmailFormData = z.infer<typeof updateEmailSchema>;

export default function UpdateEmailForm() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdateEmailFormData>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: UpdateEmailFormData) => {
    if (data.email === user?.email) {
      setError("New email must be different from current email");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to update email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Update Email Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter new email address"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A confirmation email will be sent to your new email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Confirmation email sent! Please check both your old and new
                  email addresses to complete the change.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Email
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
