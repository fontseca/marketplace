"use client";

import useSWR from "swr";
import { ResolveButton } from "@/components/events/resolve-button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EventsPage() {
  const { data, mutate } = useSWR("/api/events?status=pending", fetcher);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-slate-500">Eventos</p>
        <h1 className="text-3xl font-bold text-slate-900">Pendientes</h1>
      </div>

      {!data ? (
        <p className="text-slate-600">Cargando eventos...</p>
      ) : data.length === 0 ? (
        <p className="text-slate-600">No hay eventos pendientes.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((event: any) => (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{event.product.name}</div>
                    <div className="text-xs text-slate-500">{event.note}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{event.buyerName ?? "N/D"}</div>
                    <div className="text-xs text-slate-500">{event.buyerContact ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(event.createdAt), "d MMM, HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ResolveButton id={event.id} onResolved={() => mutate()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

