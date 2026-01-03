"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getWhatsappLink, buildShareUrl, formatPhoneNumber } from "@/lib/utils";

type Props = {
  productId: string;
  vendorWhatsapp?: string | null;
  productName: string;
  vendorName?: string | null;
  productSlug: string;
};

export function PurchaseCta({
  productId,
  vendorWhatsapp,
  productName,
  vendorName,
  productSlug,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const vendorPhone = vendorWhatsapp && vendorWhatsapp.trim().length > 0 ? vendorWhatsapp : null;

  const handleBuy = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          note: "Intento de compra desde CTA",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el evento");
      }

      const eventData = await response.json();
      const buyerPhone = eventData.buyerPhone;

      // Only open WhatsApp if vendor has a WhatsApp number
      if (vendorPhone) {
        let message = `Hola ${vendorName ?? ""}, estoy interesado en el producto: ${productName}. Enlace: ${buildShareUrl(`/p/${productSlug}`)}`;
        
        // Include buyer's phone number in the message if available
        if (buyerPhone) {
          message += `\n\nMi número de contacto: ${formatPhoneNumber(buyerPhone)}`;
        }
        
        const url = getWhatsappLink(vendorPhone, message);
        window.open(url, "_blank");
      } else {
        // If vendor doesn't have WhatsApp, show a message
        alert("Este vendedor no tiene un número de WhatsApp configurado.");
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full md:w-auto" onClick={handleBuy} disabled={loading}>
      {loading ? "Generando..." : "Comprar ahora"}
    </Button>
  );
}

