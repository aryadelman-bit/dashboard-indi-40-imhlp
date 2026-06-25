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
import { cn, formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, ChartDatum, DashboardFilters, ParsedAssessment } from "@/types/indi";

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
    <Card className={cn("bg-white/95", className)}>
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

function getPayload<T>(entry: unknown) {
  if (!entry || typeof entry !== "object" || !("payload" in entry)) return null;
  return (entry as { payload?: T }).payload ?? null;
}

function maturityFromScoreBucket(bucket: string) {
  if (bucket === "0 - <1") return "Sangat Awal";
  if (bucket === "1 - <2") return "Dasar";
  if (bucket === "2 - <3") return "Berkembang";
  if (bucket === ">=3") return "Matang";
  return "";
}

interface DashboardChartsProps {
  aggregate: AggregateResult;
  onQuickFilter?: (filters: Partial<DashboardFilters>) => void;
}

export function DashboardCharts({ aggregate, onQuickFilter }: DashboardChartsProps) {
  const hasRecords = aggregate.sourceRecords.length > 0;
  const showYearAnomalyBar = aggregate.yearCounts.some((item) => item.anomaly > 0);
  const fieldData = aggregate.fieldAverages.map((item) => ({
    name: item.name,
    value: item.value ?? 0,
    pillar: item.pillar ?? "",
    color: item.color ?? "#64748b"
  }));
  const pillarRadar = aggregate.pillarAverages.map((item) => ({
    name: item.name,
    value: Number((item.value ?? 0).toFixed(2))
  }));
  const maturityData = coloredPieData(aggregate.maturityComposition, MATURITY_COLORS);
  const classificationData = coloredPieData(aggregate.classificationDistribution, CLASSIFICATION_COLORS);

  return (
    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
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
                <Bar
                  dataKey="valid"
                  fill="#2563eb"
                  name="Valid agregasi"
                  onClick={(entry) => {
                    const row = getPayload<{ year: number | string }>(entry);
                    if (typeof row?.year === "number") onQuickFilter?.({ year: String(row.year) });
                  }}
                  stackId="a"
                />
                {showYearAnomalyBar ? (
                  <Bar
                    dataKey="anomaly"
                    fill="#dc2626"
                    name="Anomali agregasi"
                    onClick={(entry) => {
                      const row = getPayload<{ year: number | string }>(entry);
                      if (typeof row?.year === "number") onQuickFilter?.({ year: String(row.year) });
                    }}
                    stackId="a"
                  />
                ) : null}
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
                <Line
                  dataKey="average"
                  dot
                  name="Rata-rata"
                  onClick={(entry) => {
                    const row = getPayload<{ year: number }>(entry);
                    if (row?.year) onQuickFilter?.({ year: String(row.year) });
                  }}
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  type="monotone"
                />
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
                <Bar
                  dataKey="value"
                  name="Jumlah"
                  onClick={(entry) => {
                    const row = getPayload<{ name: string }>(entry);
                    const maturity = maturityFromScoreBucket(row?.name ?? "");
                    if (maturity) onQuickFilter?.({ maturity });
                  }}
                >
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
                <Pie
                  data={maturityData}
                  dataKey="value"
                  innerRadius={64}
                  nameKey="name"
                  onClick={(entry) => {
                    const row = getPayload<{ name: string }>(entry) ?? (entry as { name?: string });
                    if (row.name) onQuickFilter?.({ maturity: row.name });
                  }}
                  outerRadius={96}
                  paddingAngle={2}
                >
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
                <Pie
                  data={classificationData}
                  dataKey="value"
                  innerRadius={52}
                  nameKey="name"
                  onClick={(entry) => {
                    const row = getPayload<{ name: string }>(entry) ?? (entry as { name?: string });
                    if (row.name) onQuickFilter?.({ classification: row.name });
                  }}
                  outerRadius={92}
                >
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
                <Bar
                  dataKey="value"
                  name="Rata-rata"
                  onClick={(entry) => {
                    const row = getPayload<{ pillar: string }>(entry);
                    if (row?.pillar) onQuickFilter?.({ weakestPillar: row.pillar });
                  }}
                >
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

      <ChartCard title="Grafik anomali berdasarkan jenis" className="xl:col-span-2 2xl:col-span-3">
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
