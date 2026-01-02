import { endOfWeek, startOfWeek } from "date-fns";
import { prisma } from "./db";
import { getWeekLabel } from "./utils";

export async function getHomeProducts(opts: {
  take?: number;
  search?: string;
  categorySlug?: string;
}) {
  const { take = 20, search, categorySlug } = opts;

  return prisma.product.findMany({
    where: {
      status: "published",
      name: search ? { contains: search, mode: "insensitive" } : undefined,
      category: categorySlug
        ? {
            slug: categorySlug,
          }
        : undefined,
    },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          whatsapp: true,
        },
      },
      brand: true,
    },
    orderBy: [
      { stock: "desc" },
      { salesCount: "desc" },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function getProductDetail(id: string) {
  return prisma.product.findUnique({
    where: { id, status: "published" },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: {
        include: {
          user: {
            select: {
              phone: true,
            },
          },
        },
      },
      brand: true,
      category: true,
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getVendorWithProducts(slug: string) {
  return prisma.vendorProfile.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "published" },
        orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
        include: {
          images: { orderBy: { position: "asc" } },
        },
      },
    },
  });
}

export async function getSimilarProducts(productId: string, vendorId: string) {
  const base = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, brandId: true },
  });

  const filters: any[] = [];
  if (base?.categoryId) filters.push({ categoryId: base.categoryId });
  if (base?.brandId) filters.push({ brandId: base.brandId });

  return prisma.product.findMany({
    where: {
      id: { not: productId },
      status: "published",
      ...(filters.length ? { OR: filters } : {}),
    },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: true,
    },
    orderBy: [{ salesCount: "desc" }],
    take: 8,
  });
}

export async function getMoreFromVendor(vendorId: string, excludeId?: string) {
  return prisma.product.findMany({
    where: {
      vendorId,
      status: "published",
      id: excludeId ? { not: excludeId } : undefined,
    },
    include: {
      images: { orderBy: { position: "asc" } },
    },
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take: 6,
  });
}

export async function getBestSellers() {
  return prisma.product.findMany({
    where: { status: "published" },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: true,
    },
    orderBy: [{ salesCount: "desc" }],
    take: 8,
  });
}

export async function getSharedCatalogProducts(vendorId: string, week?: string) {
  const label = week ?? getWeekLabel();
  const [yearPart, weekPart] = label.split("-W");
  const year = Number(yearPart);
  const weekNumber = Number(weekPart);
  const firstDay = new Date(year, 0, 1);
  const days = (weekNumber - 1) * 7;
  const target = new Date(firstDay.getTime() + days * 86400000);
  const start = startOfWeek(target, { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return prisma.product.findMany({
    where: {
      vendorId,
      status: "published",
      OR: [
        { stock: { gt: 0 } },
        { createdAt: { gte: start, lte: end } },
      ],
    },
    include: {
      images: { orderBy: { position: "asc" } },
    },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
  });
}

