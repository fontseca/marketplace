"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/utils";

type Props = {
  vendorSlug?: string;
};

export function ShareCatalogButton({ vendorSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorSlug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(data.error || "No se pudo crear el enlace");
      }
      const link = await res.json();
      const url = buildShareUrl(`/v/${link.slug}/share/${link.weekLabel}`);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Error sharing catalog:", error);
      alert(error instanceof Error ? error.message : "No se pudo crear el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={loading}>
      {copied ? "Copiado" : loading ? "Generando..." : "Compartir catálogo"}
    </Button>
  );
}

