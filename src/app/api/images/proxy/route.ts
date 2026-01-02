import { NextRequest, NextResponse } from "next/server";
import { resolveCdnUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // If it's already a full URL, use it; otherwise resolve it
    const imageUrl = url.startsWith("http") ? url : resolveCdnUrl(url);
    
    if (!imageUrl) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // Fetch the image from S3 or the URL
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status },
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*", // Allow CORS
      },
    });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to proxy image", details: error.message },
      { status: 500 },
    );
  }
}

