'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export type CategoryDatum = { name: string; value: number };

const BAR_COLORS = ['#6366f1', '#22c55e', '#eab308', '#f97316', '#a855f7'];

export default function AnalyticsGraph({
  title = 'Documents by Category',
  data,
}: {
  title?: string;
  data: CategoryDatum[];
}) {
  const hasData = data.some(d => d.value > 0);

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden">
      <h3 className="text-lg md:text-xl font-bold text-white mb-6">{title}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">
          No documents registered yet.
        </div>
      )}
    </div>
  );
}
