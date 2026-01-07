import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";
import { s3Client, resolveCdnUrl } from "@/lib/s3";
import { requireVendorProfile } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

async function saveToLocal(
  file: File,
  profileId: string,
  buffer: Buffer,
): Promise<{ key: string; url: string }> {
  const uploadsDir = join(process.cwd(), "public", "uploads", profileId);
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileExtension = file.name.split(".").pop() || "bin";
  const fileName = `${randomUUID()}.${fileExtension}`;
  const filePath = join(uploadsDir, fileName);

  await fs.writeFile(filePath, buffer);

  const key = `uploads/${profileId}/${fileName}`;
  const url = `/uploads/${profileId}/${fileName}`;

  return { key, url };
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireVendorProfile();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split(".").pop() || "bin";
    const fileName = `${randomUUID()}.${fileExtension}`;
    const key = `${profile.id}/${fileName}`;
    const buffer = Buffer.from(arrayBuffer);

    // Intentar subir a S3 primero
    if (s3Client && process.env.AWS_S3_BUCKET_NAME) {
      try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        console.log("Intentando subir archivo a S3:", {
          bucket: bucketName,
          key,
          contentType: file.type,
          size: file.size,
        });

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: file.type,
          }),
        );

        const url = resolveCdnUrl(key) ?? "";
        console.log("Archivo subido exitosamente a S3");
        return NextResponse.json({ key, url });
      } catch (s3Error: any) {
        console.warn("Error al subir a S3, usando fallback local:", {
          message: s3Error.message,
          code: s3Error.Code,
          name: s3Error.name,
        });
        // Continuar con el fallback local
      }
    } else {
      console.warn("S3 no configurado, usando almacenamiento local");
    }

    // Fallback: guardar localmente
    console.log("Guardando archivo localmente:", {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });

    const { key: localKey, url: localUrl } = await saveToLocal(file, profile.id, buffer);
    console.log("Archivo guardado localmente:", { key: localKey, url: localUrl });

    return NextResponse.json({ key: localKey, url: localUrl });
  } catch (error: any) {
    console.error("Error al subir archivo:", {
      message: error.message,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: "Error al subir archivo",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}

