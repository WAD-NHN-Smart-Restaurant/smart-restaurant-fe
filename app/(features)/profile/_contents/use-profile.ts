import { useSafeQuery } from "../../../../hooks/use-safe-query";
import { useSafeMutation } from "../../../../hooks/use-safe-mutation";
import { useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updatePhoneNumber,
  Profile,
  UpdateProfileDto,
} from "@/api/profile-api";
import { createClient } from "@/libs/supabase/client";

const PROFILE_QUERY_KEY = (userId: string) => ["profile", userId];

/**
 * Hook to fetch user profile
 */
export const useProfile = (userId: string | undefined) => {
  return useSafeQuery(
    PROFILE_QUERY_KEY(userId || ""),
    () => getProfile(userId!),
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );
};

/**
 * Hook to update user profile (full name)
 */
export const useUpdateProfile = (userId: string) => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useSafeMutation(
    async (data: UpdateProfileDto) => {
      // Update profile via API
      const profile = await updateProfile(userId, data);

      // Also update Supabase auth metadata to keep it in sync
      if (data.fullName) {
        await supabase.auth.updateUser({
          data: { full_name: data.fullName },
        });
      }

      return profile;
    },
    {
      successMessage: "Profile updated successfully!",
      errorMessage: "Failed to update profile",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      },
    },
  );
};

/**
 * Hook to upload avatar
 */
export const useUploadAvatar = (userId: string) => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useSafeMutation(
    async (file: File) => {
      // Upload avatar via API
      const profile = await uploadAvatar(userId, file);

      // Also update Supabase auth metadata to keep avatar URL in sync
      if (profile.avatarUrl) {
        await supabase.auth.updateUser({
          data: { avatar_url: profile.avatarUrl },
        });
      }

      return profile;
    },
    {
      successMessage: "Avatar uploaded successfully!",
      errorMessage: "Failed to upload avatar",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      },
    },
  );
};

/**
 * Hook to delete avatar
 */
export const useDeleteAvatar = (userId: string) => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useSafeMutation(
    async () => {
      // Delete avatar via API
      const profile = await deleteAvatar(userId);

      // Also update Supabase auth metadata to remove avatar URL
      await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      return profile;
    },
    {
      successMessage: "Avatar removed successfully!",
      errorMessage: "Failed to remove avatar",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      },
    },
  );
};

/**
 * Hook to update phone number
 */
export const useUpdatePhoneNumber = (userId: string) => {
  const queryClient = useQueryClient();

  return useSafeMutation(
    async (phoneNumber: string) => {
      // Update phone number via API
      const profile = await updatePhoneNumber(userId, phoneNumber);
      return profile;
    },
    {
      successMessage: "Phone number updated successfully!",
      errorMessage: "Failed to update phone number",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      },
    },
  );
};
