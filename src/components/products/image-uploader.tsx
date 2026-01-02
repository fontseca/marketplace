"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import type { FilePondFile, FilePondServerConfig } from "filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import { resolveCdnUrl } from "@/lib/s3";

registerPlugin(FilePondPluginImagePreview);

export type ImageItem = {
  url?: string;
  storageKey?: string | null;
  position?: number;
  alt?: string;
  file?: File;
};

type Props = {
  value: ImageItem[];
  onChange: (items: ImageItem[]) => void;
};

export function ImageUploader({ value, onChange }: Props) {
  const [items, setItems] = useState<ImageItem[]>(value);

  useEffect(() => setItems(value), [value]);

  const server = useMemo<FilePondServerConfig>(
    () => ({
      load: (source, load, error, progress, abort) => {
        // If it's a File object, load it directly
        if (typeof source !== "string") {
          load(source as any);
          return { abort: () => {} };
        }

        const controller = new AbortController();
        
        // Determine the URL to use
        let url: string;
        if (source.startsWith("http://") || source.startsWith("https://")) {
          // If it's already a full URL, check if it's S3 (needs proxy) or local
          if (source.includes("s3.") || source.includes("amazonaws.com")) {
            // Use proxy for S3 URLs to avoid CORS
            url = `/api/images/proxy?url=${encodeURIComponent(source)}`;
          } else if (source.startsWith(window.location.origin)) {
            // Local URL, use directly
            url = source;
          } else {
            // External URL, use proxy
            url = `/api/images/proxy?url=${encodeURIComponent(source)}`;
          }
        } else if (source.startsWith("/")) {
          // Relative URL (local upload), use directly
          url = source;
        } else {
          // Storage key, resolve to S3 URL and use proxy
          const s3Url = resolveCdnUrl(source);
          url = s3Url ? `/api/images/proxy?url=${encodeURIComponent(s3Url)}` : source;
        }

        fetch(url, { signal: controller.signal })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const total = Number(res.headers.get("content-length") ?? 0);
            if (total) progress?.(true, 0, total);
            return res.blob();
          })
          .then((blob) => {
            progress?.(true, blob.size, blob.size);
            load(blob);
          })
          .catch((err) => {
            if (err?.name === "AbortError") return;
            error?.(err?.message ?? "No se pudo cargar la imagen");
          });

        return {
          abort: () => controller.abort(),
        };
      },
    }),
    [],
  );

  const files = useMemo(
    () =>
      items
        .filter((img) => img.file || img.storageKey || img.url)
        .map((img) => {
          // If it's a local file, use it directly
          if (img.file) {
            return {
              source: img.file,
              options: {
                type: "local",
                metadata: {
                  key: img.storageKey ?? img.url ?? img.file.name,
                  url: img.url,
                  alt: img.alt,
                },
              },
            };
          }

          // For existing images, construct the source URL for FilePond
          // FilePond will use the server.load function to fetch it
          let sourceUrl: string;
          const key = img.storageKey ?? img.url ?? "";
          
          if (img.url) {
            // If URL is already absolute (http/https), use it directly
            // If it's relative, FilePond will handle it via server.load
            sourceUrl = img.url.startsWith("http") ? img.url : img.url;
          } else if (img.storageKey) {
            // For S3 storage keys, resolve to S3 URL
            // The server.load will proxy it to avoid CORS
            sourceUrl = resolveCdnUrl(img.storageKey) || img.storageKey;
          } else {
            sourceUrl = key;
          }
          
          return {
            source: sourceUrl,
            options: {
              type: "local", // Use "local" so FilePond uses the server.load function
              metadata: {
                key,
                url: img.url ?? (img.storageKey ? resolveCdnUrl(img.storageKey) : undefined),
                alt: img.alt,
              },
            },
          };
        }),
    [items],
  );

  const syncFiles = (filesToSync: FilePondFile[]) => {
    const mapped = filesToSync.map((file, idx) => {
      const metadataKey = file.getMetadata("key") as string | undefined;
      const metadataUrl = file.getMetadata("url") as string | undefined;
      const sourceString = typeof file.source === "string" ? file.source : undefined;
      
      // Determine if this is an existing image (has storageKey or URL) or a new file
      const existingKey = metadataKey ?? (sourceString && !sourceString.startsWith("http") ? sourceString : undefined);
      const existingUrl = metadataUrl ?? (sourceString && sourceString.startsWith("http") ? sourceString : undefined);
      
      // If this image already has a storageKey or URL, it's an existing image
      // Don't treat the blob from FilePond as a new file - it's just a preview
      const isExistingImage = Boolean(existingKey || existingUrl);
      
      // Only include file if it's truly a new file (not an existing image that was loaded as blob)
      const fileToInclude = file.file && !isExistingImage ? file.file : undefined;
      
      const remoteUrl = existingUrl ?? (existingKey ? resolveCdnUrl(existingKey) : undefined);

      return {
        storageKey: existingKey && !existingKey.startsWith("http") ? existingKey : undefined,
        url: remoteUrl,
        position: idx,
        alt: (file.getMetadata("alt") as string | undefined) ?? undefined,
        file: fileToInclude, // Only include file if it's new, not if it's an existing image
      };
    });
    setItems(mapped);
    onChange(mapped);
  };

  return (
    <FilePond
      allowMultiple
      allowReorder
      allowProcess={false}
      server={server}
      files={files}
      onupdatefiles={syncFiles}
      onreorderfiles={syncFiles}
      labelIdle='Arrastra tus imágenes o <span class="filepond--label-action">explora</span>'
      credits={false}
    />
  );
}

