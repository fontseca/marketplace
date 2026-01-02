"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { productSchema } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader, ImageItem } from "@/components/products/image-uploader";

type Option = { id: string; name: string };

type VariantInput = {
  size?: string;
  color?: string;
  model?: string;
  stock?: number;
  price?: number | null;
  sku?: string;
};

type FormValues = {
  name: string;
  description: string;
  brandName?: string | null;
  categoryId?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  saleExpiresAt?: string | null;
  stock: number;
  status: "draft" | "published" | "archived";
  images: ImageItem[];
  variants: VariantInput[];
  isFeatured?: boolean;
};

type Props = {
  initialData?: Partial<FormValues> & { id?: string };
  categories: Option[];
};

export function ProductForm({ initialData, categories }: Props) {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>(initialData?.images ?? []);
  const [variants, setVariants] = useState<VariantInput[]>(
    initialData?.variants ?? [],
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    trigger,
    getValues,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      brandName: initialData?.brandName ?? undefined,
      categoryId: initialData?.categoryId ?? undefined,
      regularPrice: initialData?.regularPrice ?? 0,
      salePrice: initialData?.salePrice ?? undefined,
      saleExpiresAt: initialData?.saleExpiresAt ?? undefined,
      stock: initialData?.stock ?? 0,
      status: (initialData?.status as any) ?? "published",
      images: initialData?.images ?? [],
      variants: initialData?.variants ?? [],
      isFeatured: initialData?.isFeatured ?? false,
    },
  });

  const uploadImages = async (items: ImageItem[]) => {
    const uploaded: ImageItem[] = [];
    for (const [idx, img] of items.entries()) {
      // Only upload if it's a new file (has file property) AND doesn't already have a storageKey/URL
      // Existing images that were loaded as blobs for preview should not be re-uploaded
      if (img.file && !img.storageKey && !img.url) {
        console.log(`Uploading new image ${idx}:`, img.file.name);
        const form = new FormData();
        form.append("file", img.file);
        const res = await fetch("/api/uploads/direct", { method: "POST", body: form });
        if (!res.ok) throw new Error("No se pudo subir la imagen");
        const { url, key } = await res.json();
        uploaded.push({ url, storageKey: key, position: idx, alt: img.alt });
      } else {
        // Existing image - keep it as is
        console.log(`Keeping existing image ${idx}:`, img.url || img.storageKey);
        uploaded.push({ 
          url: img.url, 
          storageKey: img.storageKey, 
          position: idx, 
          alt: img.alt 
        });
      }
    }
    return uploaded;
  };

  const onSubmit = async (values: FormValues) => {
    console.log("onSubmit llamado con valores:", values);
    console.log("Imágenes:", images);
    console.log("Errores actuales:", errors);
    
    // Ensure images are set in form values before proceeding
    setValue("images", images, { shouldValidate: true });
    
    // Double-check images since they're managed in state separately
    if (images.length === 0) {
      // Trigger validation to show the error in the error box
      await trigger("images");
      return;
    }
    
    try {
      // STEP 1: Create product in database FIRST (without images)
      // This ensures we don't waste S3 uploads if product creation fails
      const payload = {
        ...values,
        description: values.description || "",
        images: [], // Send empty array - images will be uploaded after product is created
        variants: variants.map((v) => ({
          ...v,
          stock: Number(v.stock ?? 0),
          price: v.price === null || v.price === undefined ? null : Number(v.price),
        })),
        salePrice:
          values.salePrice === null ||
          values.salePrice === undefined ||
          values.salePrice === "" ||
          Number.isNaN(Number(values.salePrice))
            ? null
            : Number(values.salePrice),
        saleExpiresAt: values.saleExpiresAt && values.saleExpiresAt.trim() !== "" ? values.saleExpiresAt : null,
      };
      
      console.log("Creating product in database first (without images)...");
      const res = await fetch(initialData?.id ? `/api/products/${initialData.id}` : "/api/products", {
        method: initialData?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        let errorData: any;
        try {
          errorData = await res.json();
        } catch {
          const errorText = await res.text();
          errorData = { error: errorText };
        }
        console.error("Error creating product:", errorData);
        
        // Format error message better
        let errorMessage = "Error al guardar el producto";
        if (errorData.error) {
          if (typeof errorData.error === "string") {
            errorMessage = errorData.error;
          } else if (errorData.error._errors) {
            errorMessage = errorData.error._errors.join(", ");
          }
        } else if (errorData.details) {
          // Try to extract meaningful error messages from details
          const details = errorData.details;
          const errorMessages: string[] = [];
          Object.keys(details).forEach((key) => {
            if (details[key]?._errors) {
              errorMessages.push(`${key}: ${details[key]._errors.join(", ")}`);
            }
          });
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("; ");
          }
        }
        
        alert(errorMessage);
        // Product creation failed - images were NOT uploaded, so no cleanup needed
        return;
      }
      
      const createdProduct = await res.json();
      console.log("Product created successfully:", createdProduct.id);
      
      // STEP 2: Only if product creation succeeded, upload images to S3
      console.log("Uploading images to S3...");
      const uploadedImages = await uploadImages(images);
      console.log("Imágenes subidas:", uploadedImages);
      
      // STEP 3: Update product with uploaded images
      const updateRes = await fetch(`/api/products/${createdProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: uploadedImages,
        }),
      });
      
      if (!updateRes.ok) {
        console.error("Error updating product with images");
        // Product exists but images failed - user can retry or edit manually
        alert("Producto creado pero hubo un error al subir las imágenes. Puedes editarlo más tarde.");
      }
      
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert(`Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: "", color: "", model: "", stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    setVariants(next);
    setValue("variants", next);
  };

  const onError = (validationErrors: any) => {
    console.error("Errores de validación:", validationErrors);
    console.error("Errores detallados:", JSON.stringify(validationErrors, null, 2));
    console.error("Errores del formState:", errors);
    
    // Collect all error messages from validationErrors (the callback parameter)
    const errorMessages: string[] = [];
    
    // Check validationErrors first (from the callback)
    if (validationErrors.name) {
      errorMessages.push(`• Nombre: ${validationErrors.name.message || "Requerido"}`);
    }
    if (validationErrors.brandName) {
      errorMessages.push(`• Marca: ${validationErrors.brandName.message || "Requerido"}`);
    }
    if (validationErrors.regularPrice) {
      errorMessages.push(`• Precio regular: ${validationErrors.regularPrice.message || "Requerido"}`);
    }
    if (validationErrors.stock !== undefined && validationErrors.stock) {
      errorMessages.push(`• Stock: ${validationErrors.stock.message || "Requerido"}`);
    }
    if (validationErrors.images) {
      errorMessages.push(`• Imágenes: ${validationErrors.images.message || "Al menos una imagen es requerida"}`);
    }
    if (validationErrors.description) {
      errorMessages.push(`• Descripción: ${validationErrors.description.message || "Requerido"}`);
    }
    if (validationErrors.variants) {
      errorMessages.push(`• Variantes: ${validationErrors.variants.message || "Error en variantes"}`);
    }
    if (validationErrors.salePrice) {
      errorMessages.push(`• Precio oferta: ${validationErrors.salePrice.message || "Error en precio de oferta"}`);
    }
    if (validationErrors.saleExpiresAt) {
      errorMessages.push(`• Expira oferta: ${validationErrors.saleExpiresAt.message || "Error en fecha de expiración"}`);
    }
    if (validationErrors.categoryId) {
      errorMessages.push(`• Categoría: ${validationErrors.categoryId.message || "Error en categoría"}`);
    }
    
    // If no errors found in validationErrors, check formState errors
    if (errorMessages.length === 0) {
      if (errors.name) errorMessages.push(`• Nombre: ${errors.name.message || "Requerido"}`);
      if (errors.brandName) errorMessages.push(`• Marca: ${errors.brandName.message || "Requerido"}`);
      if (errors.regularPrice) errorMessages.push(`• Precio regular: ${errors.regularPrice.message || "Requerido"}`);
      if (errors.stock !== undefined && errors.stock) errorMessages.push(`• Stock: ${errors.stock.message || "Requerido"}`);
      if (errors.images) errorMessages.push(`• Imágenes: ${errors.images.message || "Al menos una imagen es requerida"}`);
    }
    
    // Errors will be displayed in the error box at the top of the form
    // No need for alert - the red error box will show all errors
    console.log("Validation errors:", errorMessages);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Form submit triggered");
    
    // Manually validate before submitting
    const currentValues = getValues();
    console.log("Current form values:", currentValues);
    console.log("Images:", images);
    
    const validationErrors: string[] = [];
    
    // Validate name
    if (!currentValues.name || currentValues.name.trim().length < 3) {
      validationErrors.push("• Nombre: El nombre debe tener al menos 3 caracteres");
    }
    
    // Validate brand
    if (!currentValues.brandName || currentValues.brandName.trim().length === 0) {
      validationErrors.push("• Marca: Marca requerida");
    }
    
    // Validate regular price
    const regularPriceNum = Number(currentValues.regularPrice);
    if (!currentValues.regularPrice || isNaN(regularPriceNum) || regularPriceNum <= 0) {
      validationErrors.push("• Precio regular: El precio regular debe ser mayor a 0");
    }
    
    // Validate stock
    const stockNum = Number(currentValues.stock);
    if (currentValues.stock === undefined || isNaN(stockNum) || stockNum < 0) {
      validationErrors.push("• Stock: El stock debe ser mayor o igual a 0");
    }
    
    // Validate images
    if (images.length === 0) {
      validationErrors.push("• Imágenes: Al menos una imagen es requerida");
    }
    
    console.log("Validation errors:", validationErrors);
    
    // If there are validation errors, show them and stop
    if (validationErrors.length > 0) {
      console.log("Validation errors found:", validationErrors);
      // Trigger react-hook-form validation to show field-level errors and error box
      await trigger();
      return;
    }
    
    console.log("Validation passed, proceeding with submit");
    // If validation passes, proceed with react-hook-form's handleSubmit
    const submitHandler = handleSubmit(onSubmit, onError);
    submitHandler(e);
  };

  return (
    <form className="space-y-6" onSubmit={handleFormSubmit}>
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Por favor corrige los siguientes errores:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.name && <li>Nombre: {errors.name.message as string}</li>}
            {errors.description && <li>Descripción: {errors.description.message as string}</li>}
            {errors.brandName && <li>Marca: {errors.brandName.message as string}</li>}
            {errors.regularPrice && <li>Precio regular: {errors.regularPrice.message as string}</li>}
            {errors.stock !== undefined && errors.stock && <li>Stock: {errors.stock.message as string}</li>}
            {errors.images && <li>Imágenes: {errors.images.message as string}</li>}
            {errors.variants && <li>Variantes: {errors.variants.message as string}</li>}
            {errors.salePrice && <li>Precio oferta: {errors.salePrice.message as string}</li>}
            {errors.saleExpiresAt && <li>Expira oferta: {errors.saleExpiresAt.message as string}</li>}
            {errors.categoryId && <li>Categoría: {errors.categoryId.message as string}</li>}
          </ul>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Nombre *</label>
          <Input placeholder="Nombre del producto" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message as string}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Precio regular *</label>
          <Input type="number" step="0.01" {...register("regularPrice", { valueAsNumber: true })} />
          {errors.regularPrice && <p className="text-xs text-red-600">{errors.regularPrice.message as string}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Precio oferta</label>
          <Input
            type="number"
            step="0.01"
            {...register("salePrice", {
              valueAsNumber: true,
              setValueAs: (v) => (v === "" || isNaN(Number(v)) ? undefined : Number(v)),
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Expira oferta</label>
          <Input
            type="datetime-local"
            {...register("saleExpiresAt", {
              setValueAs: (v) => (v === "" ? undefined : v),
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Stock *</label>
          <Input type="number" {...register("stock", { valueAsNumber: true })} />
          {errors.stock && <p className="text-xs text-red-600">{errors.stock.message as string}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Marca *</label>
          <Input
            placeholder="Ingresa la marca"
            {...register("brandName")}
          />
          {errors.brandName && <p className="text-xs text-red-600">{errors.brandName.message as string}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Categoría</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            {...register("categoryId")}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Descripción</label>
        <Textarea 
          rows={4} 
          placeholder="Ej: Producto nuevo en su empaque original. Incluye garantía de 1 año. Perfecto para uso diario. Disponible para entrega inmediata." 
          {...register("description")} 
        />
        {errors.description && <p className="text-xs text-red-600">{errors.description.message as string}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800">Imágenes *</label>
          <span className="text-xs text-slate-500">Se suben al guardar el producto</span>
        </div>
        <ImageUploader
          value={images}
          onChange={(items) => {
            setImages(items);
            setValue("images", items);
          }}
        />
        {errors.images && <p className="text-xs text-red-600">{errors.images.message as string}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800">Variantes</label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            Agregar variante
          </Button>
        </div>
        <div className="space-y-3">
          {variants.length === 0 && (
            <p className="text-sm text-slate-500">Sin variantes. Agrega tallas o colores.</p>
          )}
          {variants.map((variant, idx) => (
            <div
              key={idx}
              className="flex gap-2 rounded-2xl border border-slate-200 p-3"
            >
              <div className="grid flex-1 gap-2 md:grid-cols-5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Talla</label>
                  <Input
                    placeholder="Ej: M, L, XL"
                    value={variant.size ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].size = e.target.value;
                      setVariants(next);
                      setValue("variants", next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Color</label>
                  <Input
                    placeholder="Ej: Rojo, Azul"
                    value={variant.color ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].color = e.target.value;
                      setVariants(next);
                      setValue("variants", next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Modelo</label>
                  <Input
                    placeholder="Ej: 2024, A1"
                    value={variant.model ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].model = e.target.value;
                      setVariants(next);
                      setValue("variants", next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Stock</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Cantidad"
                    value={variant.stock ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].stock = e.target.value === "" ? 0 : Number(e.target.value);
                      setVariants(next);
                      setValue("variants", next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Precio</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Opcional"
                    value={variant.price ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx].price = e.target.value === "" ? null : Number(e.target.value);
                      setVariants(next);
                      setValue("variants", next);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(idx)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={(e) => {
            console.log("Botón clickeado");
            console.log("Estado del formulario:", { errors, isSubmitting, images });
          }}
        >
          {isSubmitting ? "Guardando..." : "Guardar producto"}
        </Button>
      </div>
    </form>
  );
}

