import { z } from "zod";

export const productImageSchema = z
  .object({
    url: z
      .string()
      .refine(
        (val) => {
          if (!val) return true; // opcional
          // Acepta URLs absolutas (http/https) o rutas relativas (que empiezan con /)
          return val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://");
        },
        { message: "La URL debe ser absoluta (http/https) o relativa (empieza con /)" },
      )
      .optional(),
    storageKey: z.string().optional(),
    position: z.number().int().min(0).default(0),
    alt: z.string().optional(),
    file: z.any().optional(), // File objects can't be validated directly by Zod
  })
  .refine((data) => data.url || data.file, {
    message: "La imagen debe tener una URL o un archivo",
  });

export const productVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().int().min(0).default(0),
});

export const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().default(""),
  brandName: z.string().min(1, "Marca requerida").max(100),
  categoryId: z.string().optional().nullable(),
  regularPrice: z.number().min(0.01, "El precio regular debe ser mayor a 0"),
  salePrice: z
    .preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      },
      z.union([z.number().min(0), z.null()])
    )
    .optional(),
  saleExpiresAt: z
    .preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        return val;
      },
      z.union([z.string().datetime(), z.null()])
    )
    .optional(),
  stock: z.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  isFeatured: z.boolean().optional(),
  images: z.array(productImageSchema).min(1, "Al menos una imagen es requerida").default([]),
  variants: z.array(productVariantSchema).default([]),
});

export const eventCreateSchema = z.object({
  productId: z.string(),
  buyerName: z.string().optional(),
  buyerContact: z.string().optional(),
  note: z.string().optional(),
});

export const saleSchema = z.object({
  quantity: z.number().int().min(1).default(1),
  amount: z.number().min(0).optional(),
});

