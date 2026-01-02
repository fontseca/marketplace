import { Card } from "@/components/ui/card";

type Stat = {
  label: string;
  value: string | number;
  helper?: string;
};

type Props = {
  stats: Stat[];
};

export function StatsGrid({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
          {stat.helper && <p className="text-xs text-slate-500">{stat.helper}</p>}
        </Card>
      ))}
    </div>
  );
}

