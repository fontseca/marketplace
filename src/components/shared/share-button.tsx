"use client";

import { useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { url: string };

export function ShareButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
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

