import { AlertTriangle, CheckCircle2, Lightbulb, MapPinned, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/types/indi";

const TONE_CLASS: Record<InsightItem["tone"], string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  red: "border-red-200 bg-red-50 text-red-800",
  gray: "border-slate-200 bg-slate-50 text-slate-700"
};

const INSIGHT_ICON: Record<string, typeof Lightbulb> = {
  "Kesiapan umum": TrendingUp,
  "Kelemahan transformasi": Target,
  "Kandidat verifikasi": CheckCircle2,
  "Kualitas data": AlertTriangle,
  "Pola KBLI": Lightbulb,
  "Momentum tahunan": TrendingUp,
  "Sebaran wilayah": MapPinned,
  "Prioritas intervensi": AlertTriangle
};

export function InsightPanel({ insights }: { insights: InsightItem[] }) {
  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Insight Otomatis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {insights.map((insight) => (
              <InsightCard key={`${insight.title}-${insight.body}`} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Insight akan muncul setelah data berhasil dibaca.</p>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: InsightItem }) {
  const Icon = INSIGHT_ICON[insight.title] ?? Lightbulb;

  return (
    <div className={cn("rounded-lg border p-4", TONE_CLASS[insight.tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-md bg-white/70 p-2">
          <Icon className="h-4 w-4" />
        </div>
        {insight.metric ? (
          <Badge variant="outline" className="max-w-[140px] justify-center truncate bg-white/70">
            {insight.metric}
          </Badge>
        ) : null}
      </div>
      <h3 className="mt-3 text-sm font-semibold">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-85">{insight.body}</p>
    </div>
  );
}
