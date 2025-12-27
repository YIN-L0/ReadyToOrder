'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui';

export interface UploadCardProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Upload card component for taking/uploading menu photos
 * Mobile-first design with camera and gallery access
 */
export function UploadCard({
  onImageSelect,
  selectedImage,
  onClear,
  disabled = false,
}: UploadCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('Image is too large. Please use an image under 20MB.');
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      {!selectedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative
            bg-white rounded-2xl
            border-2 border-dashed
            transition-all duration-300 ease-out
            ${isDragging
              ? 'border-neutral-400 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="p-8 sm:p-12 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="
                w-16 h-16 rounded-full
                bg-neutral-100
                flex items-center justify-center
              ">
                <ImageIcon className="w-8 h-8 text-neutral-400" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="primary"
                size="md"
                disabled={disabled}
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="md"
                disabled={disabled}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Button>
            </div>

            {/* Helper text */}
            <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
              For best results, ensure the menu text is clear and well-lit.
              Avoid shadows and blurry images.
            </p>
          </div>
        </div>
      ) : (
        /* Preview area */
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-soft">
          {/* Preview image */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-neutral-100">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Menu preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={disabled}
            className="
              absolute top-3 right-3
              w-10 h-10 rounded-full
              bg-black/50 hover:bg-black/70
              text-white
              flex items-center justify-center
              transition-colors duration-200
              backdrop-blur-sm
              disabled:opacity-50
            "
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>

          {/* File info */}
          <div className="p-4 border-t border-neutral-100">
            <p className="text-sm text-neutral-600 truncate">
              {selectedImage.name}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
