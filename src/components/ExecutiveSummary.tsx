import { AlertTriangle, CheckCircle2, ClipboardList, Gauge, Target, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMaturityBadgeVariant, getMaturityStatus } from "@/lib/indi";
import { cn, formatInteger, formatNumber } from "@/lib/utils";
import type { ActionQueue, AggregateResult, RankedItem } from "@/types/indi";

const QUEUE_ICON = {
  "Bersihkan data agregasi": AlertTriangle,
  "Cek klasifikasi KBLI": ClipboardList,
  "Pendampingan teknologi": Wrench,
  "Kandidat verifikasi": Target
};

const TONE_CLASS: Record<ActionQueue["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  gray: "border-slate-200 bg-slate-50 text-slate-700"
};

export function ExecutiveSummary({ aggregate }: { aggregate: AggregateResult }) {
  const weakestPillar = firstRanked(aggregate.pillarAverages, "asc");
  const strongestPillar = firstRanked(aggregate.pillarAverages, "desc");
  const weakestFields = aggregate.fieldAverages.filter((item) => item.value !== null).slice(0, 4);
  const maturityTotal = aggregate.maturityComposition.reduce((sum, item) => sum + item.value, 0);
  const validShare = aggregate.dataQuality.validShare;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Ringkasan Eksekutif
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Narasi cepat untuk membaca kesiapan, kualitas data, dan area intervensi utama.
              </p>
            </div>
            <Badge variant={getMaturityBadgeVariant(getMaturityStatus(aggregate.kpi.averageScore))}>
              Rata-rata {formatNumber(aggregate.kpi.averageScore)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Signal
              label="Kualitas data agregasi"
              value={`${formatNumber(validShare, 1)}%`}
              hint={`${formatInteger(aggregate.dataQuality.aggregationAnomalies)} data dipisahkan`}
              tone={validShare >= 98 ? "green" : validShare >= 95 ? "yellow" : "red"}
            />
            <Signal
              label="Pilar terlemah"
              value={weakestPillar?.name ?? "-"}
              hint={formatNumber(weakestPillar?.value)}
              tone="orange"
            />
            <Signal
              label="Pilar terkuat"
              value={strongestPillar?.name ?? "-"}
              hint={formatNumber(strongestPillar?.value)}
              tone="green"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Komposisi kematangan</h3>
              <div className="mt-4 space-y-3">
                {aggregate.maturityComposition.map((item) => (
                  <ProgressRow
                    key={item.name}
                    label={item.name}
                    value={item.value}
                    total={maturityTotal}
                    tone={item.name}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Bidang prioritas pendampingan</h3>
              <div className="mt-3 space-y-2">
                {weakestFields.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">
                        {index + 1}. {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.pillar}</div>
                    </div>
                    <span className="font-semibold">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            Agenda Tindak Lanjut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aggregate.actionQueues.map((queue) => (
            <ActionItem key={queue.name} queue={queue} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function firstRanked(items: RankedItem[], direction: "asc" | "desc") {
  return [...items]
    .filter((item) => item.value !== null)
    .sort((a, b) => {
      const delta = (a.value ?? 0) - (b.value ?? 0);
      return direction === "asc" ? delta : -delta;
    })[0];
}

function Signal({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  tone: "green" | "yellow" | "orange" | "red";
}) {
  const toneClass = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    red: "border-red-200 bg-red-50 text-red-800"
  }[tone];

  return (
    <div className={cn("rounded-lg border p-4", toneClass)}>
      <div className="text-xs font-medium uppercase">{label}</div>
      <div className="mt-2 line-clamp-2 min-h-12 text-lg font-semibold leading-6">{value}</div>
      <div className="mt-1 text-xs opacity-80">{hint}</div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  tone
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const percent = total ? (value / total) * 100 : 0;
  const color = {
    "Sangat Awal": "bg-red-500",
    Dasar: "bg-orange-500",
    Berkembang: "bg-yellow-500",
    Matang: "bg-emerald-600"
  }[tone] ?? "bg-slate-400";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-muted-foreground">
          {formatInteger(value)} ({formatNumber(percent, 1)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function ActionItem({ queue }: { queue: ActionQueue }) {
  const Icon = QUEUE_ICON[queue.name as keyof typeof QUEUE_ICON] ?? ClipboardList;

  return (
    <div className={cn("rounded-lg border p-3", TONE_CLASS[queue.tone])}>
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white/70 p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{queue.name}</h3>
            <span className="text-lg font-semibold">{formatInteger(queue.count)}</span>
          </div>
          <p className="mt-1 text-xs leading-5 opacity-80">{queue.description}</p>
        </div>
      </div>
    </div>
  );
}
