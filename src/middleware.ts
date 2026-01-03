import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Allow public access to uploads and other static assets
  publicRoutes: [
    "/uploads(.*)",
    "/api/products/search",
    "/api/products(.*)",
    "/api/categories(.*)",
    "/api/events",
    "/complete-profile",
  ],
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files - handled by route handler)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)",
    "/(api|trpc)(.*)",
  ],
};

