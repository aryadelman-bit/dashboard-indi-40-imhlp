import {
  AlertTriangle,
  Building2,
  CalendarRange,
  Gauge,
  Medal,
  Sigma,
  TrendingUp,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getMaturityBadgeVariant, getMaturityStatus } from "@/lib/indi";
import { cn, formatInteger, formatNumber } from "@/lib/utils";
import type { KpiMetrics } from "@/types/indi";

interface KpiCardsProps {
  kpi: KpiMetrics;
}

function KpiCard({
  title,
  value,
  hint,
  tone = "slate",
  icon
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "slate" | "blue" | "green" | "yellow" | "orange" | "red" | "gray";
  icon: ReactNode;
}) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    gray: "bg-slate-50 text-slate-700 ring-slate-200"
  }[tone];
  const accentClass = {
    slate: "from-slate-300",
    blue: "from-blue-500",
    green: "from-emerald-500",
    yellow: "from-yellow-500",
    orange: "from-orange-500",
    red: "from-red-500",
    gray: "from-slate-400"
  }[tone];

  return (
    <Card className="group relative overflow-hidden bg-white/95">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", accentClass)} />
      <CardContent className="flex min-h-28 items-start justify-between gap-3 p-4 pt-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 xl:text-[1.7rem]">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn("rounded-md p-2 ring-1", toneClass)}>{icon}</div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const avgStatus = getMaturityStatus(kpi.averageScore);
  const avgTone = getMaturityBadgeVariant(avgStatus);

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard title="Total record SA" value={formatInteger(kpi.totalRecords)} icon={<Sigma className="h-5 w-5" />} />
      <KpiCard
        title="Perusahaan + lokasi unik"
        value={formatInteger(kpi.uniqueEstablishments)}
        hint="Nama perusahaan dan lokasi yang sama dihitung satu unit"
        icon={<Building2 className="h-5 w-5" />}
        tone="blue"
      />
      <KpiCard
        title="Total SA valid"
        value={formatInteger(kpi.validAssessments)}
        icon={<Users className="h-5 w-5" />}
        tone="green"
      />
      <KpiCard
        title="Total anomali data"
        value={formatInteger(kpi.anomalyData)}
        hint="Anomali Data, Skor Nol, atau Tanggal Invalid"
        icon={<AlertTriangle className="h-5 w-5" />}
        tone={kpi.anomalyData > 0 ? "red" : "slate"}
      />
      <KpiCard
        title="Rata-rata Nilai INDI"
        value={formatNumber(kpi.averageScore)}
        hint={avgStatus}
        icon={<Gauge className="h-5 w-5" />}
        tone={avgTone}
      />
      <KpiCard
        title="Median Nilai INDI"
        value={formatNumber(kpi.medianScore)}
        icon={<Gauge className="h-5 w-5" />}
        tone="blue"
      />
      <KpiCard
        title="Nilai tertinggi / terendah"
        value={`${formatNumber(kpi.maxScore)} / ${formatNumber(kpi.minScore)}`}
        icon={<Medal className="h-5 w-5" />}
        tone="yellow"
      />
      <KpiCard
        title="Perusahaan INDI >= 3.00"
        value={formatInteger(kpi.countAboveThree)}
        hint={`${formatNumber(kpi.percentAboveThree, 1)}% dari data agregasi`}
        icon={<TrendingUp className="h-5 w-5" />}
        tone="green"
      />
      <KpiCard
        title="Tahun paling awal"
        value={kpi.earliestYear ? String(kpi.earliestYear) : "-"}
        icon={<CalendarRange className="h-5 w-5" />}
        tone="slate"
      />
      <KpiCard
        title="Tahun paling akhir"
        value={kpi.latestYear ? String(kpi.latestYear) : "-"}
        icon={<CalendarRange className="h-5 w-5" />}
        tone="blue"
      />
    </section>
  );
}
