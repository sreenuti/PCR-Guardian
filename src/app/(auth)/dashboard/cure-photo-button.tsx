"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { recordCurePhotoUpload } from "./actions";
import { createClient } from "@/lib/supabase/client";

export function CurePhotoButton({ violationId }: { violationId: string }) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(e.target.files ?? []);
    const imageFiles = fileList.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setFiles([]);
      setPreviewUrls([]);
      setError("Please select image files only.");
      return;
    }

    const limitedImages =
      imageFiles.length > 10 ? imageFiles.slice(0, 10) : imageFiles;

    setFiles(limitedImages);
    setError(
      imageFiles.length > 10
        ? "You can upload a maximum of 10 images. Only the first 10 were selected."
        : null
    );
  }

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleClick() {
    if (files.length === 0 || loading) return;

    setLoading(true);
    setError(null);

    // Upload each selected image to Supabase Storage (bucket: cure-photos)
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const path = `${violationId}/${Date.now()}-${index}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("cure-photos")
        .upload(path, file);

      if (uploadError) {
        console.error("Cure photo upload failed", uploadError);
        setLoading(false);
        setError(
          `Failed to upload photos. Please try again. (${uploadError.message})`
        );
        return;
      }
    }

    const result = await recordCurePhotoUpload(violationId);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setFiles([]);
    setPreviewUrls([]);
    router.refresh();
  }

  const hasSelectedImages = files.length > 0;

  return (
    <div className="space-y-2 rounded-md border border-dashed border-primary/30 bg-secondary/40 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-900">
            Cure photos
          </p>
          <p className="text-xs text-muted-foreground">
            Upload before/after photos (up to 10 images).
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={loading || !hasSelectedImages}
          >
            {loading ? "Recording cure…" : "Record cure photo"}
          </Button>
        </div>
      </div>
      {files.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {files.length} image{files.length === 1 ? "" : "s"} selected. Review
            the previews below before submitting.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
            {previewUrls.map((url, index) => (
              <div
                key={url}
                className="overflow-hidden rounded-md border border-primary/30 bg-background"
              >
                <img
                  src={url}
                  alt={files[index]?.name ?? `Selected image ${index + 1}`}
                  className="h-32 w-full object-cover md:h-40"
                />
              </div>
            ))}
          </div>
        </>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
