import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  if (!query.trim()) {
    return NextResponse.json([]);
  }

  // Escape single quotes for SQL
  const escapedQuery = query.replace(/'/g, "''");
  const searchPattern = `%${escapedQuery}%`;

  try {
    // Try full-text search first (if search_vector column exists)
    const results = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        slug: string;
        description: string;
        regularPrice: string;
        salePrice: string | null;
        saleExpiresAt: Date | null;
        stock: number;
        imageUrl: string | null;
        vendor: { id: string; displayName: string; slug: string };
      }[]
    >(Prisma.sql`
      SELECT 
        p."id",
        p."name",
        p."slug",
        p."description",
        p."regular_price"::text as "regularPrice",
        p."sale_price"::text as "salePrice",
        p."sale_expires_at" as "saleExpiresAt",
        p."stock",
        jsonb_build_object('id', v."id", 'displayName', v."display_name", 'slug', v."slug") as vendor,
        (
          SELECT i."url" FROM "product_image" i 
          WHERE i."product_id" = p."id"
          ORDER BY i."position" ASC
          LIMIT 1
        ) as "imageUrl"
      FROM "product" p
      JOIN "vendor_profile" v ON p."vendor_id" = v."id"
      WHERE p."status" = 'published'
        AND (
          p."search_vector" @@ plainto_tsquery('spanish', ${escapedQuery})
          OR p."name" ILIKE ${searchPattern}
          OR p."description" ILIKE ${searchPattern}
        )
      ORDER BY p."stock" DESC, p."sales_count" DESC
      LIMIT 20
    `);

    return NextResponse.json(results);
  } catch (error: any) {
    // Fallback to simple ILIKE search if search_vector doesn't exist
    if (error?.code === "P2010" || error?.message?.includes("search_vector")) {
      const results = await prisma.$queryRaw<
        {
          id: string;
          name: string;
          slug: string;
          description: string;
          regularPrice: string;
          salePrice: string | null;
          saleExpiresAt: Date | null;
          stock: number;
          imageUrl: string | null;
          vendor: { id: string; displayName: string; slug: string };
        }[]
      >(Prisma.sql`
        SELECT 
          p."id",
          p."name",
          p."slug",
          p."description",
          p."regular_price"::text as "regularPrice",
          p."sale_price"::text as "salePrice",
          p."sale_expires_at" as "saleExpiresAt",
          p."stock",
          jsonb_build_object('id', v."id", 'displayName', v."display_name", 'slug', v."slug") as vendor,
          (
            SELECT i."url" FROM "product_image" i 
            WHERE i."product_id" = p."id"
            ORDER BY i."position" ASC
            LIMIT 1
          ) as "imageUrl"
        FROM "product" p
        JOIN "vendor_profile" v ON p."vendor_id" = v."id"
        WHERE p."status" = 'published'
          AND (
            p."name" ILIKE ${searchPattern}
            OR p."description" ILIKE ${searchPattern}
          )
        ORDER BY p."stock" DESC, p."sales_count" DESC
        LIMIT 20
      `);

      return NextResponse.json(results);
    }
    throw error;
  }
}

