import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function FreeVsPaidDonut({ freePct, paidPct }) {
  const data = [
    { name: "Free", value: freePct || 0 },
    { name: "Paid", value: paidPct || 0 },
  ];
  const COLORS = ["var(--color-accent)", "var(--color-bg-elevated)"];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-panel p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Free vs Paid Users</h3>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-text-primary">{paidPct}%</span>
          <span className="text-xs text-text-muted">Paid</span>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-6 text-xs">
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-accent" /> Free {freePct}%
        </span>
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-bg-elevated ring-1 ring-border-strong" /> Paid {paidPct}%
        </span>
      </div>
    </div>
  );
}
