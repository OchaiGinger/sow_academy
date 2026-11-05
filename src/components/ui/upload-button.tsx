"use client";

import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Crop, RotateCcw, Check, Loader2, Image, Camera } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/components/ui/uploadthing";
import ReactCrop, { type Crop as ReactCropType, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UploadButtonProps {
  route: "studentPassport";
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  disabled?: boolean;
}

export function UploadButton({ route, onUploadComplete, currentUrl, disabled }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<ReactCropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { startUpload, isUploading: utIsUploading } = useUploadThing(route, {
    onClientUploadComplete: (data) => {
      console.log("onClientUploadComplete data:", data);
      const url = data[0]?.url;
      if (url) {
        setPreviewUrl(url);
        onUploadComplete(url);
        toast.success("Photo uploaded successfully!");
      } else {
        console.error("No URL in upload response:", data);
        toast.error("Upload completed but no URL returned");
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

      // Open crop modal
      setCropFile(file);
      setShowCropModal(true);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setCroppedImageUrl(objectUrl);
      
      setCrop(undefined);
      setCompletedCrop(null);
    },
    []
  );

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
      width,
      height,
    );
    setCrop(c);
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!cropFile || !imgRef.current || !completedCrop?.width || !completedCrop?.height) return;
    
    setIsCropping(true);
    
    try {
      // Create canvas for cropping
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Set canvas size to crop size (square)
      const size = 400; // Output size
      canvas.width = size;
      canvas.height = size;
      
      // Calculate scale factor
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      // Draw cropped image
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        size,
        size
      );
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9);
      });
      
      // Create file from blob
      const croppedFile = new File([blob], "passport.jpg", { type: "image/jpeg" });
      
      console.log("Cropped file:", croppedFile.name, croppedFile.size, croppedFile.type);
      
      // Upload the cropped file
      setIsUploading(true);
      await startUpload([croppedFile]);
      
      // Clean up
      setShowCropModal(false);
      setCropFile(null);
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(null);
      
    } catch (error) {
      console.error("Crop/Upload failed:", error);
      toast.error("Failed to process photo. Please try again.");
      setIsUploading(false);
      setIsCropping(false);
    }
  }, [cropFile, completedCrop, startUpload, croppedImageUrl]);

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onUploadComplete("");
  }, [onUploadComplete]);

  const handleCancelCrop = useCallback(() => {
    setShowCropModal(false);
    setCropFile(null);
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    setCroppedImageUrl(null);
  }, [croppedImageUrl]);

  const isLoading = isUploading || utIsUploading || isCropping;

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
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => document.getElementById("passport-upload")?.click()}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              {isCropping ? "Processing..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>

        {/* Camera Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => document.getElementById("passport-camera")?.click()}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              {isCropping ? "Processing..." : "Uploading..."}
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </>
          )}
        </Button>
      </div>

      {/* Hidden file input for file upload */}
      <input
        id="passport-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading || disabled}
      />

      {/* Hidden file input for camera capture */}
      <input
        id="passport-camera"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading || disabled}
      />

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Crop Passport Photo
            </DialogTitle>
            <DialogDescription>
              Adjust the crop area to a square. The photo will be resized to 400x400px.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4">
            {cropFile && croppedImageUrl && (
              <div className="relative max-w-full mx-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                  ruleOfThirds
                >
                  <img
                    ref={imgRef}
                    src={croppedImageUrl}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </ReactCrop>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelCrop} disabled={isCropping}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleCropComplete} disabled={isCropping}>
              {isCropping ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Crop & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}