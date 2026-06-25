import { useMemo, useState } from "react";
import { ArrowRightLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PILLARS } from "@/constants/indi";
import { applyDashboardFilters, calculateAggregates } from "@/lib/indi";
import { cn, formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, DashboardFilters, ParsedAssessment } from "@/types/indi";

type ComparisonMode = "year" | "classification";

interface ComparisonPanelProps {
  records: ParsedAssessment[];
  filters: DashboardFilters;
  includeAnomalies: boolean;
}

export function ComparisonPanel({ records, filters, includeAnomalies }: ComparisonPanelProps) {
  const [mode, setMode] = useState<ComparisonMode>("year");
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(applyDashboardFilters(records, { ...filters, year: "all" }).map((record) => record.year)))
        .filter((year): year is number => year !== null)
        .sort((a, b) => a - b)
        .map(String),
    [filters, records]
  );
  const classificationOptions = useMemo(
    () =>
      Array.from(
        new Set(applyDashboardFilters(records, { ...filters, classification: "all" }).map((record) => record.kbli.classification))
      ).sort(),
    [filters, records]
  );
  const options = mode === "year" ? yearOptions : classificationOptions;
  const [leftFallback, rightFallback] = defaultPair(options);
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const left = options.includes(leftValue) ? leftValue : leftFallback;
  const right = options.includes(rightValue) ? rightValue : rightFallback;

  const comparison = useMemo(() => {
    if (!left || !right) return null;
    const baseFilters = mode === "year" ? { ...filters, year: "all" } : { ...filters, classification: "all" };
    const baseRecords = applyDashboardFilters(records, baseFilters);
    const leftRecords = baseRecords.filter((record) =>
      mode === "year" ? record.year === Number(left) : record.kbli.classification === left
    );
    const rightRecords = baseRecords.filter((record) =>
      mode === "year" ? record.year === Number(right) : record.kbli.classification === right
    );

    return {
      left: calculateAggregates(leftRecords, includeAnomalies),
      right: calculateAggregates(rightRecords, includeAnomalies)
    };
  }, [filters, includeAnomalies, left, mode, records, right]);

  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Mode Perbandingan
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Bandingkan performa skor, kualitas data, pilar, dan kandidat verifikasi.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Select value={mode} onValueChange={(value) => setMode(value as ComparisonMode)}>
              <SelectTrigger className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Tahun SA</SelectItem>
                <SelectItem value="classification">Klasifikasi KBLI</SelectItem>
              </SelectContent>
            </Select>
            <Select value={left ?? ""} onValueChange={setLeftValue}>
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="Pembanding A" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={right ?? ""} onValueChange={setRightValue}>
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="Pembanding B" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {comparison && left && right ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DeltaMetric
                label="Rata-rata Nilai INDI"
                left={comparison.left.kpi.averageScore}
                right={comparison.right.kpi.averageScore}
                leftLabel={left}
                rightLabel={right}
              />
              <DeltaMetric
                label="Total SA valid"
                left={comparison.left.kpi.validAssessments}
                right={comparison.right.kpi.validAssessments}
                leftLabel={left}
                rightLabel={right}
                integer
              />
              <DeltaMetric
                label="INDI >= 3,00"
                left={comparison.left.kpi.countAboveThree}
                right={comparison.right.kpi.countAboveThree}
                leftLabel={left}
                rightLabel={right}
                integer
              />
              <DeltaMetric
                label="Anomali agregasi"
                left={comparison.left.kpi.anomalyData}
                right={comparison.right.kpi.anomalyData}
                leftLabel={left}
                rightLabel={right}
                integer
                inverseTone
              />
            </div>
            <PillarComparison left={comparison.left} right={comparison.right} leftLabel={left} rightLabel={right} />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed bg-slate-50 text-sm text-muted-foreground">
            Data pembanding belum cukup pada filter aktif.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function defaultPair(options: string[]) {
  if (options.length >= 2) return [options[options.length - 2], options[options.length - 1]];
  if (options.length === 1) return [options[0], options[0]];
  return ["", ""];
}

function DeltaMetric({
  label,
  left,
  right,
  leftLabel,
  rightLabel,
  integer = false,
  inverseTone = false
}: {
  label: string;
  left: number | null;
  right: number | null;
  leftLabel: string;
  rightLabel: string;
  integer?: boolean;
  inverseTone?: boolean;
}) {
  const delta = left === null || right === null ? null : right - left;
  const isPositive = (delta ?? 0) > 0;
  const isNegative = (delta ?? 0) < 0;
  const good = inverseTone ? isNegative : isPositive;
  const bad = inverseTone ? isPositive : isNegative;
  const valueFormat = integer ? formatInteger : formatNumber;

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MetricValue label={leftLabel} value={valueFormat(left)} />
        <span className="text-xs text-muted-foreground">vs</span>
        <MetricValue label={rightLabel} value={valueFormat(right)} align="right" />
      </div>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
          good ? "bg-emerald-50 text-emerald-700" : bad ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
        )}
      >
        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : isNegative ? <TrendingDown className="h-3.5 w-3.5" /> : null}
        Delta {delta === null ? "-" : integer ? formatInteger(delta) : formatNumber(delta)}
      </div>
    </div>
  );
}

function MetricValue({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="line-clamp-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function PillarComparison({
  left,
  right,
  leftLabel,
  rightLabel
}: {
  left: AggregateResult;
  right: AggregateResult;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Perbandingan 5 pilar</h3>
      </div>
      <div className="divide-y">
        {PILLARS.map((pillar) => {
          const leftValue = left.pillarAverages.find((item) => item.name === pillar.name)?.value ?? null;
          const rightValue = right.pillarAverages.find((item) => item.name === pillar.name)?.value ?? null;
          return (
            <div key={pillar.name} className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[190px_1fr_1fr_90px] lg:items-center 2xl:grid-cols-[240px_1fr_1fr_110px]">
              <div className="font-medium text-slate-900">{pillar.name}</div>
              <PillarBar label={leftLabel} value={leftValue} color={pillar.color} />
              <PillarBar label={rightLabel} value={rightValue} color={pillar.color} />
              <Badge variant="outline" className="justify-center">
                {leftValue === null || rightValue === null ? "-" : formatNumber(rightValue - leftValue)}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PillarBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const percent = value === null ? 0 : Math.min((value / 4) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="line-clamp-1">{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
