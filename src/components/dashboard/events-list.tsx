"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { refreshDashboardStats } from "./dashboard-stats";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Event = {
  id: string;
  productId: string;
  status: "pending" | "resolved" | "discarded";
  type: "purchase_intent";
  note: string | null;
  buyerName: string | null;
  buyerContact: string | null;
  createdAt: string;
  resolvedAt: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
  };
};

export function EventsList() {
  const { data: events, mutate } = useSWR<Event[]>("/api/events?status=pending", fetcher);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleMarkSold = async (eventId: string) => {
    setProcessing(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/mark-sold`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al marcar como vendido");
      }
      mutate(); // Refresh events list
      refreshDashboardStats(); // Refresh dashboard stats
    } catch (error) {
      console.error("Error al marcar como vendido:", error);
      alert(error instanceof Error ? error.message : "Error al marcar como vendido");
    } finally {
      setProcessing(null);
    }
  };

  const handleDiscard = async (eventId: string) => {
    setProcessing(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/discard`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al descartar evento");
      }
      mutate(); // Refresh events list
      refreshDashboardStats(); // Refresh dashboard stats
    } catch (error) {
      console.error("Error al descartar:", error);
      alert(error instanceof Error ? error.message : "Error al descartar evento");
    } finally {
      setProcessing(null);
    }
  };

  if (!events) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Eventos pendientes</h3>
        <p className="mt-3 text-sm text-slate-600">Cargando...</p>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Eventos pendientes</h3>
        <p className="mt-3 text-sm text-slate-600">No hay eventos pendientes.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Eventos pendientes</h3>
        <Badge variant="secondary">{events.length}</Badge>
      </div>
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/p/${event.product.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {event.product.name}
                  </Link>
                  <Badge variant={event.product.stock > 0 ? "secondary" : "destructive"}>
                    Stock: {event.product.stock}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {event.type === "purchase_intent" && "Intento de compra"}
                </p>
                {event.buyerName && (
                  <p className="mt-1 text-sm text-slate-700">
                    Cliente: <span className="font-medium">{event.buyerName}</span>
                  </p>
                )}
                {event.buyerContact && (
                  <p className="text-sm text-slate-600">Contacto: {event.buyerContact}</p>
                )}
                {event.note && (
                  <p className="mt-2 text-sm text-slate-600 italic">"{event.note}"</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {formatDistanceToNow(new Date(event.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {event.product.stock > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkSold(event.id)}
                    disabled={processing === event.id}
                  >
                    {processing === event.id ? "Procesando..." : "Marcar como vendido"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDiscard(event.id)}
                  disabled={processing === event.id}
                >
                  {processing === event.id ? "Procesando..." : "Descartar"}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

