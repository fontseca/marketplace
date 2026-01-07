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

    // Create roles if they don't exist, handling race conditions
    const createPromises: Promise<any>[] = [];
    
    if (!vendorRole) {
      createPromises.push(
        prisma.role.create({ data: { name: "vendor" } }).catch((error: any) => {
          // Ignore unique constraint errors (race condition - another request created it)
          if (error.code !== "P2002") {
            throw error;
          }
        })
      );
    }
    if (!rootRole) {
      createPromises.push(
        prisma.role.create({ data: { name: "root" } }).catch((error: any) => {
          // Ignore unique constraint errors (race condition - another request created it)
          if (error.code !== "P2002") {
            throw error;
          }
        })
      );
    }

    if (createPromises.length > 0) {
      await Promise.all(createPromises);
    }
  } catch (error: any) {
    // Silently fail during build/static generation - roles will be created on first request
    // This prevents build errors when database isn't available or roles already exist
    // Also ignore unique constraint errors (P2002) which indicate race conditions
    if (error.code !== "P2002") {
      console.warn("Could not ensure roles (this is OK during build):", error);
    }
  }
}

function buildVendorSlug(base: string) {
  const slug = slugify(base);
  if (slug.length > 0) return slug;
  return `vendedor-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getSessionUser() {
  try {
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
    
    let dbUser: UserWithRole;
    try {
      dbUser = existingUser
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
    } catch (dbError: any) {
      // Handle race conditions or duplicate key errors
      // If create failed, try to fetch the user (might have been created by another request)
      if (!existingUser && (dbError.code === "P2002" || dbError.code === "P2003")) {
        const fetchedUser = await prisma.user.findUnique({
          where: { clerkId: authUser.id },
          include: { role: true },
        });
        if (fetchedUser) {
          dbUser = fetchedUser;
        } else {
          // If we still can't get the user, log and return null
          console.error("Failed to create or fetch user:", dbError);
          return null;
        }
      } else {
        // For other errors, log and return null
        console.error("Database error in getSessionUser:", dbError);
        return null;
      }
    }

    return { authUser, dbUser };
  } catch (error) {
    // Catch any other unexpected errors
    console.error("Unexpected error in getSessionUser:", error);
    return null;
  }
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
    try {
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
    } catch (error: any) {
      // Handle race condition - profile might have been created by another request
      if (error.code === "P2002") {
        profile = await prisma.vendorProfile.findUnique({
          where: { userId: dbUser.id },
        });
        if (!profile) {
          console.error("Failed to create or fetch vendor profile:", error);
          throw new Error("No se pudo crear el perfil de vendedor");
        }
      } else {
        console.error("Error creating vendor profile:", error);
        throw error;
      }
    }
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

