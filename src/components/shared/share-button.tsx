"use client";

import { useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/utils";

type Props = { path: string };

export function ShareButton({ path }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Generate URL client-side to use the actual browser URL
    const url = buildShareUrl(path);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Share className="h-4 w-4" />
      {copied ? "Copiado" : "Compartir"}
    </Button>
  );
}

