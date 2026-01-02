import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = join(process.cwd(), "public", "uploads", ...path);

    // Security: Ensure the path is within the uploads directory
    const resolvedPath = join(process.cwd(), "public", "uploads");
    const requestedPath = join(process.cwd(), "public", "uploads", ...path);
    
    if (!requestedPath.startsWith(resolvedPath)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path[path.length - 1]?.split(".").pop()?.toLowerCase() || "";

    // Determine content type
    const contentTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    const contentType = contentTypes[fileExtension] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving upload file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

