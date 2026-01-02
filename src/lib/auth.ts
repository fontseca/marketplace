import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { slugify } from "./utils";
import type { Prisma } from "@prisma/client";

async function ensureRoles() {
  try {
    // Check if roles exist first to avoid unique constraint errors
    const [vendorRole, rootRole] = await Promise.all([
      prisma.role.findUnique({ where: { name: "vendor" } }),
      prisma.role.findUnique({ where: { name: "root" } }),
    ]);

    if (!vendorRole) {
      await prisma.role.create({ data: { name: "vendor" } });
    }
    if (!rootRole) {
      await prisma.role.create({ data: { name: "root" } });
    }
  } catch (error) {
    // Silently fail during build/static generation - roles will be created on first request
    // This prevents build errors when database isn't available or roles already exist
    console.warn("Could not ensure roles (this is OK during build):", error);
  }
}

function buildVendorSlug(base: string) {
  const slug = slugify(base);
  if (slug.length > 0) return slug;
  return `vendedor-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getSessionUser() {
  await ensureRoles();
  const authUser = await currentUser();
  if (!authUser) return null;

  const email =
    authUser.emailAddresses.find((e) => e.id === authUser.primaryEmailAddressId)?.emailAddress ??
    authUser.emailAddresses[0]?.emailAddress ??
    "";

  const vendorRole = await prisma.role.findUnique({ where: { name: "vendor" } });

  // Check if user exists first
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: authUser.id },
    include: { role: true },
  });

  type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;
  
  const dbUser: UserWithRole = existingUser
    ? await prisma.user.update({
        where: { clerkId: authUser.id },
        data: {
          email,
          updatedAt: new Date(),
          // Don't update role if user already exists - preserve manual role changes
        },
        include: { role: true },
      })
    : await prisma.user.create({
        data: {
          clerkId: authUser.id,
          email,
          role: vendorRole ? { connect: { id: vendorRole.id } } : undefined,
        },
        include: { role: true },
      });

  return { authUser, dbUser };
}

/**
 * Checks if the user has a phone number. If missing, redirects to complete-profile page.
 * Should be used in pages that require phone number.
 */
export async function requirePhoneNumber() {
  const { dbUser } = await requireSessionUser();
  if (!dbUser.phone) {
    redirect("/complete-profile");
  }
  return dbUser.phone;
}

export async function requireSessionUser() {
  const session = await getSessionUser();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireVendorProfile() {
  const { authUser, dbUser } = await requireSessionUser();

  let profile = await prisma.vendorProfile.findUnique({
    where: { userId: dbUser.id },
  });

  if (!profile) {
    const displayName =
      authUser.fullName ||
      authUser.username ||
      authUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "Vendedor";

    const baseSlug = buildVendorSlug(displayName);
    const existingCount = await prisma.vendorProfile.count({
      where: { slug: baseSlug },
    });

    profile = await prisma.vendorProfile.create({
      data: {
        userId: dbUser.id,
        displayName,
        slug: existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug,
        whatsapp: "",
      },
    });
  }

  return { authUser, dbUser, profile };
}

export async function requireRootUser() {
  const { authUser, dbUser } = await requireSessionUser();
  if (dbUser.role.name !== "root") {
    redirect("/dashboard");
  }
  return { authUser, dbUser };
}

