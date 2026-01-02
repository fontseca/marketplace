import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/s3";
import { requireVendorProfile } from "@/lib/auth";

export async function POST(request: Request) {
  const { profile } = await requireVendorProfile();
  const body = await request.json();
  const { fileName, contentType } = body as { fileName?: string; contentType?: string };

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const key = `${profile.id}/${randomUUID()}-${fileName}`;
  try {
    const uploadUrl = await createPresignedUpload({ key, contentType });
    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

