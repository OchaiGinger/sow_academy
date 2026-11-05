"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/components/ui/uploadthing";

interface UploadButtonProps {
  route: "studentPassport";
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  disabled?: boolean;
}

export function UploadButton({ route, onUploadComplete, currentUrl, disabled }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  
  const { startUpload, isUploading: utIsUploading } = useUploadThing(route, {
    onClientUploadComplete: (data) => {
      const url = data[0]?.url;
      if (url) {
        setPreviewUrl(url);
        onUploadComplete(url);
        toast.success("Photo uploaded successfully!");
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo. Please try again.");
      setIsUploading(false);
    },
  });

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (4MB max)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("File size must be less than 4MB");
        return;
      }

      setIsUploading(true);
      try {
        await startUpload([file]);
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload photo. Please try again.");
        setIsUploading(false);
      }
    },
    [startUpload]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onUploadComplete("");
  }, [onUploadComplete]);

  const isLoading = isUploading || utIsUploading;

  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="relative w-32 h-32 mx-auto md:mx-0 rounded-lg border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-muted/30">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Student passport"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="absolute top-1 right-1 z-10 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60">
            <Upload className="h-8 w-8 mb-2" />
            <span className="text-xs text-center px-2">Passport Photo</span>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full md:w-auto"
        onClick={() => document.getElementById("passport-upload")?.click()}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <>
            <Upload className="animate-spin mr-2 h-4 w-4" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? "Change Photo" : "Upload Photo"}
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        id="passport-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading || disabled}
      />
    </div>
  );
}