"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { StatsGrid } from "./stats-grid";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DashboardStats() {
  const { data: stats } = useSWR("/api/dashboard/stats", fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  return <StatsGrid stats={stats} />;
}

// Export a function to refresh stats from other components
export function refreshDashboardStats() {
  return globalMutate("/api/dashboard/stats");
}

