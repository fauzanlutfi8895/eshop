"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Check, Loader2 } from "lucide-react";
import Image from "next/image";

interface BannerChangeModalProps {
  currentBanner: string;
  onClose: () => void;
  onConfirm: (newBannerUrl: string, fileId: string) => void;
  onUpload: (file: File) => Promise<{ file_url: string; fileId: string }>;
}

const BannerChangeModal: React.FC<BannerChangeModalProps> = ({
  currentBanner,
  onClose,
  onConfirm,
  onUpload,
}) => {
  const [previewBanner, setPreviewBanner] = useState<string>(currentBanner);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [hasLocalPreview, setHasLocalPreview] = useState(false);

  // Banner size validation (recommended 1920x400 or similar wide banner dimensions)
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
  const RECOMMENDED_WIDTH = 1920;
  const RECOMMENDED_HEIGHT = 400;
  const MIN_WIDTH = 1200;
  const MIN_HEIGHT = 300;

  const validateImage = (
    file: File
  ): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        resolve({ valid: false, error: "Image size must be less than 3MB" });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        resolve({ valid: false, error: "Please select a valid image file" });
        return;
      }

      // Check dimensions
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
          resolve({
            valid: false,
            error: `Image dimensions must be at least ${MIN_WIDTH}x${MIN_HEIGHT}px`,
          });
        } else if (img.width / img.height < 2.5) {
          resolve({
            valid: false,
            error:
              "Banner should have a wide aspect ratio (recommended 1920x400)",
          });
        } else {
          resolve({ valid: true });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: "Failed to load image" });
      };

      img.src = url;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    try {
      // Validate image
      const validation = await validateImage(file);
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid image");
        return;
      }

      // Show LOCAL preview first (don't upload yet to save ImageKit resources)
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewBanner(localPreviewUrl);
      setSelectedFile(file);
      setHasLocalPreview(true);
      setFileId(""); // Clear any previous fileId
      setUploadError("");
    } catch (error: any) {
      console.error("Preview error:", error);
      setUploadError("Failed to preview image. Please try again.");
    }
  };

  const handleConfirm = async () => {
    // Only upload when user confirms (saves ImageKit resources)
    if (selectedFile && hasLocalPreview) {
      setUploading(true);
      setUploadError("");

      try {
        // Upload to ImageKit only when confirmed
        const uploadResult = await onUpload(selectedFile);

        // Now confirm with the uploaded URL
        onConfirm(uploadResult.file_url, uploadResult.fileId);
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage =
          error?.response?.data?.message ||
          "Failed to upload banner. Please try again.";
        setUploadError(errorMessage);
        setUploading(false);
      }
    } else if (previewBanner !== currentBanner && fileId) {
      // Already uploaded banner (shouldn't happen with new flow)
      onConfirm(previewBanner, fileId);
    } else {
      onClose();
    }
  };

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hasLocalPreview && previewBanner.startsWith("blob:")) {
        URL.revokeObjectURL(previewBanner);
      }
    };
  }, [previewBanner, hasLocalPreview]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Create a fake event to reuse handleFileSelect
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(fakeEvent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Change Shop Banner
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Recommended size: {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px (Max:
              3MB)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Banner Preview */}
        <div className="p-6">
          <div
            className="relative rounded-lg overflow-hidden bg-gray-900 border-2 border-gray-700 flex justify-center items-center"
            style={{
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
              height: uploading
                ? "300px"
                : previewBanner.startsWith("bg-")
                ? "300px"
                : "auto",
              minHeight: "175px",
            }}
          >
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm w-full h-full z-20">
                <Loader2
                  className="animate-spin text-blue-500 mb-3"
                  size={48}
                />
                <p className="text-gray-300 text-lg font-medium">
                  Uploading banner...
                </p>
              </div>
            )}
            {previewBanner.startsWith("bg-") ? (
              <div className={`w-full h-[300px] ${previewBanner}`}></div>
            ) : (
              <div className="w-full">
                <Image
                  src={previewBanner}
                  alt="Banner preview"
                  width={1200}
                  height={300}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div
            className="mt-6 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("bannerInput")?.click()}
          >
            <input
              id="bannerInput"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-white font-medium mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-gray-400 text-sm">PNG, JPG, WEBP up to 3MB</p>
            {selectedFile && !uploadError && (
              <p className="text-green-400 text-sm mt-3 flex items-center justify-center gap-2">
                <Check size={16} />
                {selectedFile.name} ready to upload
              </p>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{uploadError}</p>
            </div>
          )}

          {/* Info Messages */}
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> Use wide, high-quality images for best
              results. Images will be displayed at full width across your shop
              page.
            </p>
          </div>

          {selectedFile && !uploading && (
            <div className="mt-3 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ <strong>Note:</strong> Click "Upload & Save" to upload your
                banner. You can upload up to 5 banners per hour.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              uploading || (!selectedFile && previewBanner === currentBanner)
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading to server...
              </>
            ) : (
              <>
                <Check size={18} />
                {selectedFile ? "Upload & Save" : "Confirm Change"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerChangeModal;
