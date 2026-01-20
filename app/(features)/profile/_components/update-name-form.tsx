"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/app/(features)/profile/_contents/use-profile";
import { useAuth } from "@/context/auth-context";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { toast } from "react-toastify";

interface UpdateNameFormProps {
  userId: string;
}

export default function UpdateNameForm({ userId }: UpdateNameFormProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const updateProfile = useUpdateProfile(userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      await updateProfile.mutateAsync({ fullName: fullName });
      setIsEditing(false);
      setFullName("");
    } catch (error: any) {
      // Error toast is shown by useSafeMutation hook
    }
  };

  if (!isEditing) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#2c3e50",
                marginBottom: "4px",
              }}
            >
              Full Name
            </h3>
            <p style={{ fontSize: "14px", color: "#7f8c8d" }}>
              {user?.profile?.fullName || "Not set"}
            </p>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white"
            style={{
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Pencil style={{ width: "16px", height: "16px" }} />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <Label
            htmlFor="fullName"
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#2c3e50",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={updateProfile.isPending}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            type="submit"
            disabled={updateProfile.isPending || !fullName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-60"
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
            {updateProfile.isPending ? (
              <Loader2
                style={{
                  width: "16px",
                  height: "16px",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Check style={{ width: "16px", height: "16px" }} />
            )}
            {updateProfile.isPending ? "Updating..." : "Save"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setFullName("");
            }}
            disabled={updateProfile.isPending}
            style={{
              flex: 1,
              background: "#95a5a6",
              color: "white",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "none",
              cursor: updateProfile.isPending ? "not-allowed" : "pointer",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
