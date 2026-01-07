"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Trash2 } from "lucide-react";

type User = {
  id: string;
  email: string;
  phone: string | null;
  role: {
    name: string;
  };
  vendorProfile: {
    id: string;
    displayName: string;
    slug: string;
  } | null;
};

type Props = {
  users: User[];
};

export function UsersTable({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;

    try {
      const res = await fetch(`/api/users/${selectedUserId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar el usuario");
      }

      // Remove user from local state
      setUsers(users.filter((u) => u.id !== selectedUserId));
      setModalOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el usuario");
      setModalOpen(false);
      setSelectedUserId(null);
    }
  };

  if (users.length === 0) {
    return <p className="text-slate-600">No hay usuarios registrados.</p>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Perfil de vendedor</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{user.email}</p>
                </td>
                <td className="px-4 py-3">{user.phone || "N/A"}</td>
                <td className="px-4 py-3 capitalize">{user.role.name}</td>
                <td className="px-4 py-3">
                  {user.vendorProfile ? (
                    <Link
                      href={`/v/${user.vendorProfile.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {user.vendorProfile.displayName}
                    </Link>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(user.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
          setSelectedUserId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        message="Esta acción eliminará permanentemente el usuario, su perfil de vendedor (si existe), todos sus productos e imágenes. Esta acción no se puede deshacer."
      />
    </>
  );
}

