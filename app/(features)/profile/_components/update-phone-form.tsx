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
import { Loader2, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useUpdatePhoneNumber } from "@/app/(features)/profile/_contents/use-profile";

const updatePhoneSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format (e.g., +1234567890)",
    ),
});

type UpdatePhoneFormData = z.infer<typeof updatePhoneSchema>;

export default function UpdatePhoneForm() {
  const { user } = useAuth();
  const updatePhone = useUpdatePhoneNumber(user?.id || "");
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdatePhoneFormData>({
    resolver: zodResolver(updatePhoneSchema),
    defaultValues: {
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: UpdatePhoneFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update phone number via backend API
      await updatePhone.mutateAsync(data.phone);

      // Commented out Supabase direct update - now using backend API
      // const { error: updateError } = await supabase.auth.updateUser({
      //   phone: data.phone,
      // });
      // if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to update phone number");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Update Phone Number
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter phone number in E.164 format (e.g., +1234567890). An
                    SMS verification code will be sent.
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
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Verification code sent! Please check your SMS to complete the
                  change.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Phone Number
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
