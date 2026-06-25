import { Award, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PILLARS } from "@/constants/indi";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, ParsedAssessment, RankedItem } from "@/types/indi";

export function PillarAnalysisTab({ aggregate }: { aggregate: AggregateResult }) {
  const rankedPillars = [...aggregate.pillarAverages]
    .filter((item) => item.value !== null)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
  const rankedFields = aggregate.fieldAverages.filter((item) => item.value !== null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <RankingCard title="Ranking rata-rata 5 pilar" items={rankedPillars} />
        <RankingCard title="Ranking rata-rata 17 bidang" items={rankedFields} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MatrixCard title="Matriks pilar vs tahun" rows={aggregate.pillarYearMatrix} />
        <MatrixCard title="Matriks bidang vs tahun" rows={aggregate.fieldYearMatrix} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CompanyListCard title="Perusahaan dengan pilar Teknologi terendah" records={aggregate.technologyWeakestCompanies} mode="technology" />
        <CompanyListCard title="Perusahaan potensial verifikasi INDI 4.0 lanjutan" records={aggregate.verificationCandidates} mode="score" />
      </div>
    </div>
  );
}

function RankingCard({ title, items }: { title: string; items: RankedItem[] }) {
  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[440px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Rank</th>
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Pilar</th>
                <th className="px-2 py-2 text-right">Rata-rata</th>
                <th className="px-2 py-2 text-right">n</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.name} className="border-t">
                  <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-2 py-2 font-medium">{item.name}</td>
                  <td className="px-2 py-2">
                    {item.pillar ? <Badge variant="outline">{item.pillar}</Badge> : <ColorBadge color={item.color} />}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{formatNumber(item.value)}</td>
                  <td className="px-2 py-2 text-right">{formatInteger(item.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length ? (
            <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">Tidak ada data.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function MatrixCard({ title, rows }: { title: string; rows: Array<Record<string, string | number | null>> }) {
  const years = rows.length ? Object.keys(rows[0]).filter((key) => key !== "name") : [];
  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[520px] overflow-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Dimensi</th>
                {years.map((year) => (
                  <th key={year} className="px-3 py-2 text-right">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.name)} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  {years.map((year) => (
                    <td key={`${row.name}-${year}`} className="px-3 py-2 text-right">
                      <HeatCell value={typeof row[year] === "number" ? Number(row[year]) : null} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">Tidak ada data.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyListCard({
  title,
  records,
  mode
}: {
  title: string;
  records: ParsedAssessment[];
  mode: "technology" | "score";
}) {
  return (
    <Card className="bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-700" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Perusahaan</th>
                <th className="px-2 py-2">Tahun</th>
                <th className="px-2 py-2 text-right">{mode === "technology" ? "Teknologi" : "Nilai INDI"}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={`${title}-${record.id}`} className="border-t">
                  <td className="px-2 py-2">
                    <div className="font-medium">{record.companyName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{record.location || "-"}</div>
                  </td>
                  <td className="px-2 py-2">{record.year ?? "-"}</td>
                  <td className="px-2 py-2 text-right font-semibold">
                    {mode === "technology" ? formatNumber(record.pillarScores.Teknologi) : formatNumber(record.score)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length ? (
            <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">Tidak ada data.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HeatCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  const tone =
    value < 1 ? "bg-red-50 text-red-700" : value < 2 ? "bg-orange-50 text-orange-700" : value < 3 ? "bg-yellow-50 text-yellow-700" : "bg-emerald-50 text-emerald-700";
  return <span className={`inline-flex min-w-14 justify-center rounded-md px-2 py-1 font-medium ${tone}`}>{formatNumber(value)}</span>;
}

function ColorBadge({ color }: { color?: string }) {
  const pillar = PILLARS.find((item) => item.color === color);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color ?? "#64748b" }} />
      {pillar?.name ?? "Pilar"}
    </span>
  );
}
