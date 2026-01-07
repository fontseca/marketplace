"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Trash2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  status: string;
  images: Array<{ url: string }>;
};

type Props = {
  products: Product[];
};

export function VendorProductsTable({ products: initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleDeleteClick = (productId: string) => {
    setSelectedProductId(productId);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProductId) return;

    setDeleting(selectedProductId);
    try {
      const res = await fetch(`/api/products/${selectedProductId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar el producto");
      }

      // Remove product from local state
      setProducts(products.filter((p) => p.id !== selectedProductId));
      setModalOpen(false);
      setSelectedProductId(null);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el producto");
      setModalOpen(false);
      setSelectedProductId(null);
    } finally {
      setDeleting(null);
    }
  };

  if (products.length === 0) {
    return <p className="text-slate-600">Aún no hay productos. Crea tu primera publicación.</p>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(p.salePrice ?? p.regularPrice))}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(p.id)}
                      disabled={deleting === p.id}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedProductId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar producto"
        message="¿Estás seguro de que quieres eliminar este producto permanentemente? Esta acción no se puede deshacer."
      />
    </>
  );
}

