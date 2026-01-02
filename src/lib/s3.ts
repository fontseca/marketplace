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

