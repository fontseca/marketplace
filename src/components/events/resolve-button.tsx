"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { id: string; onResolved?: () => void };

export function ResolveButton({ id, onResolved }: Props) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await fetch(`/api/events/${id}/resolve`, { method: "POST" });
    setLoading(false);
    onResolved?.();
  };
  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={loading}>
      {loading ? "Resolviendo..." : "Marcar resuelto"}
    </Button>
  );
}

