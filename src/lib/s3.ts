import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_S3_REGION;

export const s3Client =
  bucket && region && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

export async function createPresignedUpload({
  key,
  contentType,
}: {
  key: string;
  contentType: string;
}) {
  if (!s3Client || !bucket) {
    throw new Error("S3 client is not configured");
  }
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
  return url;
}

export function resolveCdnUrl(key: string) {
  // Use direct S3 URL if bucket and region are configured
  if (bucket && region) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
  
  // Fallback: return empty string if S3 is not configured
  return "";
}

export async function deleteS3Object(key: string): Promise<void> {
  if (!s3Client || !bucket) {
    throw new Error("S3 client is not configured");
  }
  
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Extracts S3 key from a URL if it's an S3 URL
 * @param url - The URL to extract the key from
 * @returns The S3 key if it's an S3 URL, null otherwise
 */
export function extractS3KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Check if it's an S3 URL
  if (!url.includes("s3.") && !url.includes("amazonaws.com")) {
    return null;
  }
  
  // Skip local uploads
  if (url.startsWith("/uploads/")) {
    return null;
  }
  
  try {
    // Parse S3 URL format: https://bucket.s3.region.amazonaws.com/key
    // or https://s3.region.amazonaws.com/bucket/key
    const urlObj = new URL(url);
    
    // Format: https://bucket.s3.region.amazonaws.com/key
    if (urlObj.hostname.includes(".s3.")) {
      // Extract key from pathname (remove leading slash)
      const key = urlObj.pathname.substring(1);
      return key || null;
    }
    
    // Format: https://s3.region.amazonaws.com/bucket/key
    if (urlObj.hostname.startsWith("s3.")) {
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        // Skip bucket name, return the rest as key
        return pathParts.slice(1).join("/");
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
}

