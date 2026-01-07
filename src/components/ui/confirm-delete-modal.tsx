"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  confirmText?: string;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message = "Esta acción no se puede deshacer. Escribe 'eliminar' para confirmar.",
  confirmText = "eliminar",
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (inputValue !== confirmText) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      setInputValue("");
      onClose();
    } catch (error) {
      console.error("Error during deletion:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setInputValue("");
    onClose();
  };

  const isMatch = inputValue === confirmText;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={handleClose}
      />
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">
            Escribe <span className="font-mono font-semibold text-red-600">{confirmText}</span> para confirmar:
          </label>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isMatch && !isDeleting) {
                handleConfirm();
              }
              if (e.key === "Escape") {
                handleClose();
              }
            }}
            disabled={isDeleting}
            className="mt-2"
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!isMatch || isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </>
  );
}

