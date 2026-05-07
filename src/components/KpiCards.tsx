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
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-yellow-50 text-yellow-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-slate-50 text-slate-700"
  }[tone];

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex min-h-28 items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn("rounded-md p-2", toneClass)}>{icon}</div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const avgStatus = getMaturityStatus(kpi.averageScore);
  const avgTone = getMaturityBadgeVariant(avgStatus);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Total record SA" value={formatInteger(kpi.totalRecords)} icon={<Sigma className="h-5 w-5" />} />
      <KpiCard
        title="Perusahaan/lokasi unik"
        value={formatInteger(kpi.uniqueEstablishments)}
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
