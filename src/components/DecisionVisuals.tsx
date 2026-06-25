import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import { AlertTriangle, Building2, MapPinned, Target } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, InterventionPoint, InterventionPriorityBand, ProvinceAnalysisRow } from "@/types/indi";

const PRIORITY_COLORS: Record<InterventionPriorityBand, string> = {
  "Prioritas tinggi": "#dc2626",
  "Pendampingan terarah": "#f97316",
  "Siap verifikasi": "#16a34a",
  "Monitoring rutin": "#2563eb"
};

export function DecisionVisuals({ aggregate }: { aggregate: AggregateResult }) {
  const priorityCounts = aggregate.interventionPoints.reduce(
    (acc, point) => {
      acc[point.priorityBand] = (acc[point.priorityBand] ?? 0) + 1;
      return acc;
    },
    {} as Record<InterventionPriorityBand, number>
  );
  const topProvince = aggregate.provinceRows[0];

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          title="Prioritas tinggi"
          value={priorityCounts["Prioritas tinggi"] ?? 0}
          hint="Skor <2 dan tenaga kerja >=100"
          tone="red"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <SignalCard
          title="Pendampingan terarah"
          value={priorityCounts["Pendampingan terarah"] ?? 0}
          hint="Skor atau pilar Teknologi masih rendah"
          tone="orange"
          icon={<Target className="h-5 w-5" />}
        />
        <SignalCard
          title="Provinsi terbanyak"
          value={topProvince?.totalRecords ?? 0}
          hint={topProvince?.province ?? "-"}
          tone="blue"
          icon={<MapPinned className="h-5 w-5" />}
        />
        <SignalCard
          title="Siap verifikasi"
          value={aggregate.kpi.countAboveThree}
          hint="Nilai INDI >= 3,00"
          tone="green"
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <InterventionMatrix points={aggregate.interventionPoints} />
        <ProvinceOpportunity rows={aggregate.provinceRows} />
      </div>
    </section>
  );
}

function SignalCard({
  title,
  value,
  hint,
  tone,
  icon
}: {
  title: string;
  value: number;
  hint: string;
  tone: "red" | "orange" | "blue" | "green";
  icon: ReactNode;
}) {
  const toneClass = {
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700"
  }[tone];

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex min-h-28 items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{formatInteger(value)}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={cn("rounded-md p-2", toneClass)}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function InterventionMatrix({ points }: { points: InterventionPoint[] }) {
  const grouped = Object.keys(PRIORITY_COLORS).map((band) => ({
    band: band as InterventionPriorityBand,
    points: points.filter((point) => point.priorityBand === band)
  }));

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Matriks Prioritas Intervensi</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Posisi perusahaan berdasarkan skor INDI dan skala tenaga kerja.
            </p>
          </div>
          <Badge variant="outline">{formatInteger(points.length)} titik data</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {points.length ? (
          <div className="h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 18, bottom: 18, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="score"
                  domain={[0, 4]}
                  name="Nilai INDI"
                  tick={{ fontSize: 12 }}
                  type="number"
                />
                <YAxis
                  dataKey="workforceLog"
                  name="Tenaga kerja"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatWorkforceTick}
                  type="number"
                  width={72}
                />
                <ZAxis dataKey="workforceLog" range={[48, 240]} />
                <ReferenceLine x={2} stroke="#f97316" strokeDasharray="4 4" />
                <ReferenceLine x={3} stroke="#16a34a" strokeDasharray="4 4" />
                <Tooltip content={<InterventionTooltip />} />
                {grouped.map((group) => (
                  <Scatter
                    key={group.band}
                    data={group.points}
                    fill={PRIORITY_COLORS[group.band]}
                    name={group.band}
                    opacity={0.76}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyBlock />
        )}
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          {grouped.map((group) => (
            <div key={group.band} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PRIORITY_COLORS[group.band] }} />
                {group.band}
              </span>
              <span className="font-semibold text-slate-900">{formatInteger(group.points.length)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InterventionTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: InterventionPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="max-w-xs rounded-md border bg-white p-3 text-sm shadow-lg">
      <div className="font-semibold text-slate-950">{point.companyName}</div>
      <div className="mt-1 text-xs text-muted-foreground">{point.location}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <TooltipMetric label="Nilai INDI" value={formatNumber(point.score)} />
        <TooltipMetric label="Tenaga kerja" value={formatInteger(point.workforce)} />
        <TooltipMetric label="Teknologi" value={formatNumber(point.technologyScore)} />
        <TooltipMetric label="Provinsi" value={point.province} />
      </div>
      <Badge className="mt-3" variant={point.priorityBand === "Prioritas tinggi" ? "red" : "outline"}>
        {point.priorityBand}
      </Badge>
    </div>
  );
}

function TooltipMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function formatWorkforceTick(value: number) {
  const actual = Math.round(10 ** Number(value) - 1);
  if (actual >= 1_000_000) return `${formatNumber(actual / 1_000_000, 1)} jt`;
  if (actual >= 1_000) return `${formatNumber(actual / 1_000, 0)} rb`;
  return formatInteger(actual);
}

function ProvinceOpportunity({ rows }: { rows: ProvinceAnalysisRow[] }) {
  const topRows = rows.slice(0, 12);
  const tileRows = rows.slice(0, 24);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Sebaran Wilayah & Kualitas Skor</CardTitle>
        <p className="text-sm text-muted-foreground">Provinsi dengan volume SA terbesar dan warna berdasarkan rata-rata skor.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {topRows.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRows} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis allowDecimals={false} type="number" />
                <YAxis dataKey="province" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<ProvinceTooltip />} />
                <Bar dataKey="totalRecords" name="Record SA" radius={[0, 4, 4, 0]}>
                  {topRows.map((row) => (
                    <Cell key={row.province} fill={provinceColor(row.averageScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyBlock />
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tileRows.map((row) => (
            <div key={row.province} className={cn("rounded-md border px-3 py-2", provinceTileClass(row.averageScore))}>
              <div className="line-clamp-1 text-xs font-semibold">{row.province}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span>{formatInteger(row.totalRecords)} SA</span>
                <span>{formatNumber(row.averageScore)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProvinceTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: ProvinceAnalysisRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-white p-3 text-sm shadow-lg">
      <div className="font-semibold">{row.province}</div>
      <div>Record SA: {formatInteger(row.totalRecords)}</div>
      <div>Perusahaan/lokasi: {formatInteger(row.totalCompanies)}</div>
      <div>Rata-rata skor: {formatNumber(row.averageScore)}</div>
      <div>Skor &lt; 2: {formatInteger(row.lowScoreCount)}</div>
      <div>Anomali agregasi: {formatInteger(row.anomalyCount)}</div>
    </div>
  );
}

function provinceColor(value: number | null) {
  if (value === null) return "#94a3b8";
  if (value < 1) return "#dc2626";
  if (value < 2) return "#f97316";
  if (value < 3) return "#eab308";
  return "#16a34a";
}

function provinceTileClass(value: number | null) {
  if (value === null) return "bg-slate-50 text-slate-700";
  if (value < 1) return "border-red-200 bg-red-50 text-red-800";
  if (value < 2) return "border-orange-200 bg-orange-50 text-orange-800";
  if (value < 3) return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function EmptyBlock() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed bg-slate-50 text-sm text-muted-foreground">
      Tidak ada data untuk filter ini.
    </div>
  );
}
