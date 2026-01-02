import { NextResponse } from "next/server";
import { endOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { getWeekLabel } from "@/lib/utils";
import { requireVendorProfile } from "@/lib/auth";

export async function POST() {
  const { profile } = await requireVendorProfile();
  const weekLabel = getWeekLabel();

  const existing = await prisma.catalogShareLink.findFirst({
    where: { vendorId: profile.id, weekLabel },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const expiresAt = endOfWeek(new Date(), { weekStartsOn: 1 });
  const slug = `${profile.slug}-${weekLabel}`;

  const link = await prisma.catalogShareLink.create({
    data: {
      vendorId: profile.id,
      slug,
      weekLabel,
      expiresAt,
    },
  });

  return NextResponse.json({ ...link, vendorSlug: profile.slug }, { status: 201 });
}

