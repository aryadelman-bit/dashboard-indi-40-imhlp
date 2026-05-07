import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASSIFICATION_COLORS } from "@/constants/indi";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, ChartDatum, ParsedAssessment } from "@/types/indi";

const MATURITY_COLORS: Record<string, string> = {
  "Sangat Awal": "#dc2626",
  Dasar: "#f97316",
  Berkembang: "#eab308",
  Matang: "#16a34a"
};

function ChartCard({
  title,
  children,
  className
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed bg-slate-50 text-sm text-muted-foreground">
      Tidak ada data untuk filter ini.
    </div>
  );
}

function RankingTable({ records, direction }: { records: ParsedAssessment[]; direction: "top" | "bottom" }) {
  if (!records.length) return <EmptyChart />;
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Perusahaan</th>
            <th className="px-2 py-2">Tahun</th>
            <th className="px-2 py-2 text-right">Nilai</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={`${direction}-${record.id}`} className="border-t">
              <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
              <td className="px-2 py-2">
                <div className="font-medium text-slate-900">{record.companyName || "-"}</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">{record.location || "-"}</div>
              </td>
              <td className="px-2 py-2">{record.year ?? "-"}</td>
              <td className="px-2 py-2 text-right font-semibold">{formatNumber(record.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function coloredPieData(data: ChartDatum[], colorMap: Record<string, string>) {
  return data.map((item) => ({ ...item, color: colorMap[item.name] ?? "#64748b" }));
}

function YearlyAverageTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ payload: { average: number | null; count: number } }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-white p-3 text-sm shadow-lg">
      <div className="font-semibold">Tahun {label}</div>
      <div>Rata-rata: {formatNumber(data.average)}</div>
      <div>Jumlah perusahaan: {formatInteger(data.count)}</div>
    </div>
  );
}

export function DashboardCharts({ aggregate }: { aggregate: AggregateResult }) {
  const hasRecords = aggregate.sourceRecords.length > 0;
  const fieldData = aggregate.fieldAverages.map((item) => ({
    name: item.name,
    value: item.value ?? 0,
    color: item.color ?? "#64748b"
  }));
  const pillarRadar = aggregate.pillarAverages.map((item) => ({
    name: item.name,
    value: Number((item.value ?? 0).toFixed(2))
  }));
  const maturityData = coloredPieData(aggregate.maturityComposition, MATURITY_COLORS);
  const classificationData = coloredPieData(aggregate.classificationDistribution, CLASSIFICATION_COLORS);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Tren jumlah SA per tahun">
        {hasRecords ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregate.yearCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => formatInteger(Number(value))} />
                <Legend />
                <Bar dataKey="valid" name="Valid agregasi" stackId="a" fill="#2563eb" />
                <Bar dataKey="anomaly" name="Anomali Data" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Tren rata-rata Nilai INDI per tahun">
        {aggregate.yearlyAverage.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregate.yearlyAverage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 4]} />
                <Tooltip content={<YearlyAverageTooltip />} />
                <Line type="monotone" dataKey="average" name="Rata-rata" stroke="#0f766e" strokeWidth={2.5} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Distribusi skor INDI">
        {hasRecords ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregate.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => formatInteger(Number(value))} />
                <Bar dataKey="value" name="Jumlah">
                  {aggregate.scoreDistribution.map((entry) => (
                    <Cell key={entry.name} fill={String(entry.color ?? "#2563eb")} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Komposisi status kematangan INDI">
        {maturityData.some((item) => item.value > 0) ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => formatInteger(Number(value))} />
                <Legend />
                <Pie data={maturityData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={2}>
                  {maturityData.map((entry) => (
                    <Cell key={entry.name} fill={String(entry.color)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Rata-rata skor 5 pilar">
        {aggregate.pillarAverages.some((item) => item.value !== null) ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={pillarRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Radar name="Rata-rata" dataKey="value" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.18} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Klasifikasi KBLI">
        {classificationData.some((item) => item.value > 0) ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => formatInteger(Number(value))} />
                <Legend />
                <Pie data={classificationData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92}>
                  {classificationData.map((entry) => (
                    <Cell key={entry.name} fill={String(entry.color)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Rata-rata skor 17 bidang" className="xl:col-span-2">
        {fieldData.length ? (
          <div className="h-[520px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldData} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Bar dataKey="value" name="Rata-rata">
                  {fieldData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Top 10 Nilai INDI tertinggi">
        <RankingTable records={aggregate.topCompanies} direction="top" />
      </ChartCard>

      <ChartCard title="Bottom 10 Nilai INDI valid terendah">
        <RankingTable records={aggregate.bottomCompanies} direction="bottom" />
      </ChartCard>

      <ChartCard title="Grafik anomali berdasarkan jenis" className="xl:col-span-2">
        {aggregate.anomalyByType.some((item) => item.value > 0) ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregate.anomalyByType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => formatInteger(Number(value))} />
                  <Bar dataKey="value" fill="#dc2626" name="Jumlah" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-2">
              {aggregate.anomalyByType.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <Badge variant={item.value > 0 ? "red" : "secondary"}>{formatInteger(item.value)}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </section>
  );
}
