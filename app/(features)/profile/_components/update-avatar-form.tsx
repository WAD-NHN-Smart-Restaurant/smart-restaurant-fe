"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useUploadAvatar,
  useDeleteAvatar,
  useProfile,
} from "@/app/(features)/profile/_contents/use-profile";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "react-toastify";

interface UpdateAvatarFormProps {
  userId: string;
}

export default function UpdateAvatarForm({ userId }: UpdateAvatarFormProps) {
  const { data: profile } = useProfile(userId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const uploadAvatar = useUploadAvatar(userId);
  const deleteAvatar = useDeleteAvatar(userId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadAvatar.mutateAsync(selectedFile);
      // Toast is shown by useSafeMutation hook
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      // Error toast is shown by useSafeMutation hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar.mutateAsync();
      // Toast is shown by useSafeMutation hook
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      // Error toast is shown by useSafeMutation hook
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#2c3e50",
          marginBottom: "15px",
        }}
      >
        Update Avatar
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Current avatar or preview */}
        {(previewUrl || profile?.avatarUrl) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "12px",
            }}
          >
            <img
              src={previewUrl || profile?.avatarUrl || ""}
              alt="Avatar"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        )}

        {/* File input */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploadAvatar.isPending || deleteAvatar.isPending}
            style={{ display: "none" }}
            id="avatar-input"
          />
          <label
            htmlFor="avatar-input"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              background: "#f8f9fa",
              border: "2px dashed #ddd",
              borderRadius: "8px",
              cursor:
                uploadAvatar.isPending || deleteAvatar.isPending
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              color: "#7f8c8d",
              fontWeight: "500",
            }}
          >
            <ImageIcon style={{ width: "20px", height: "20px" }} />
            {selectedFile ? selectedFile.name : "Choose an image"}
          </label>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
          {selectedFile && (
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                onClick={handleUpload}
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white disabled:opacity-60"
                style={{
                  flex: 1,
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {uploadAvatar.isPending ? (
                  <Loader2
                    style={{
                      width: "16px",
                      height: "16px",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <Upload style={{ width: "16px", height: "16px" }} />
                )}
                {uploadAvatar.isPending ? "Uploading..." : "Upload"}
              </Button>
              <Button
                onClick={handleClearSelection}
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                style={{
                  flex: 1,
                  background: "#95a5a6",
                  color: "white",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor:
                    uploadAvatar.isPending || deleteAvatar.isPending
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Clear
              </Button>
            </div>
          )}

          {!selectedFile && profile?.avatarUrl && (
            <Button
              onClick={handleDelete}
              disabled={uploadAvatar.isPending || deleteAvatar.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white disabled:opacity-60"
              style={{
                width: "100%",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {deleteAvatar.isPending ? (
                <Loader2
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <Trash2 style={{ width: "16px", height: "16px" }} />
              )}
              {deleteAvatar.isPending ? "Removing..." : "Remove Avatar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
