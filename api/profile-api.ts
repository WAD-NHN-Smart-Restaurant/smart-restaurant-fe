import api from "@/libs/api-request";

// Types
export interface Profile {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string | null;
  restaurantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  fullName: string;
}

export interface ProfileResponse {
  success: boolean;
  data: Profile;
  message?: string;
}

/**
 * Get user profile by ID
 */
export const getProfile = async (userId: string): Promise<Profile> => {
  const response = await api.get<ProfileResponse>(`/profiles/${userId}`);
  return response.data.data;
};

/**
 * Update user profile (full name only)
 */
export const updateProfile = async (
  userId: string,
  data: UpdateProfileDto,
): Promise<Profile> => {
  const response = await api.put<UpdateProfileDto, ProfileResponse>(
    `/profiles/${userId}`,
    data,
  );
  return response.data.data;
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  userId: string,
  file: File,
): Promise<Profile> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await api.post<FormData, ProfileResponse>(
    `/profiles/${userId}/avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data.data;
};

/**
 * Delete user avatar
 */
export const deleteAvatar = async (userId: string): Promise<Profile> => {
  const response = await api.delete<ProfileResponse>(
    `/profiles/${userId}/avatar`,
  );
  return response.data.data;
};

/**
 * Update user phone number
 */
export const updatePhoneNumber = async (
  userId: string,
  phoneNumber: string,
): Promise<Profile> => {
  const response = await api.put<{ phone_number: string }, ProfileResponse>(
    `/profiles/${userId}/phone`,
    { phone_number: phoneNumber },
  );
  return response.data.data;
};
