import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Download, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASSIFICATION_COLORS } from "@/constants/indi";
import { exportKbliRowsToExcel } from "@/lib/export";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { AggregateResult, KbliAnalysisRow } from "@/types/indi";

export function KbliAnalysisTab({ aggregate }: { aggregate: AggregateResult }) {
  const topCodes = aggregate.kbliRows.slice(0, 15);
  const highestAverage = [...aggregate.kbliRows]
    .filter((row) => row.averageScore !== null)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
    .slice(0, 10);
  const lowestAverage = [...aggregate.kbliRows]
    .filter((row) => row.averageScore !== null)
    .sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0))
    .slice(0, 10);
  const classificationData = aggregate.classificationDistribution.map((item) => ({
    ...item,
    color: CLASSIFICATION_COLORS[item.name] ?? "#64748b"
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Jumlah KBLI unik" value={aggregate.kbliRows.length} />
        <Metric title="KBLI terbanyak" value={topCodes[0]?.totalRecords ?? 0} hint={topCodes[0]?.code ?? "-"} />
        <Metric title="KBLI rata-rata tertinggi" value={highestAverage[0]?.averageScore ?? null} hint={highestAverage[0]?.code ?? "-"} score />
        <Metric title="KBLI rata-rata terendah" value={lowestAverage[0]?.averageScore ?? null} hint={lowestAverage[0]?.code ?? "-"} score />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Jumlah perusahaan berdasarkan KBLI</CardTitle>
          </CardHeader>
          <CardContent>
            {topCodes.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCodes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="code" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => formatInteger(Number(value))} />
                    <Bar dataKey="totalCompanies" name="Perusahaan/lokasi" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyBox />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Komposisi klasifikasi KBLI</CardTitle>
          </CardHeader>
          <CardContent>
            {classificationData.some((item) => item.value > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => formatInteger(Number(value))} />
                    <Legend />
                    <Pie data={classificationData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96}>
                      {classificationData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyBox />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <KbliRankCard title="KBLI dengan rata-rata skor INDI tertinggi" rows={highestAverage} />
        <KbliRankCard title="KBLI dengan rata-rata skor INDI terendah" rows={lowestAverage} />
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Tabel Detail per KBLI
            </CardTitle>
            <Button variant="outline" onClick={() => exportKbliRowsToExcel(aggregate.kbliRows, "analisis-kbli-indi.xlsx")}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <KbliTable rows={aggregate.kbliRows} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  title,
  value,
  hint,
  score = false
}: {
  title: string;
  value: number | null;
  hint?: string;
  score?: boolean;
}) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{score ? formatNumber(value) : formatInteger(value ?? 0)}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function KbliRankCard({ title, rows }: { title: string; rows: KbliAnalysisRow[] }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <KbliTable rows={rows} compact />
      </CardContent>
    </Card>
  );
}

function KbliTable({ rows, compact = false }: { rows: KbliAnalysisRow[]; compact?: boolean }) {
  return (
    <div className="max-h-[520px] overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">KBLI</th>
            <th className="px-3 py-2 text-right">Record</th>
            {!compact ? <th className="px-3 py-2 text-right">Perusahaan/lokasi</th> : null}
            <th className="px-3 py-2 text-right">Rata-rata INDI</th>
            <th className="px-3 py-2">IMHLP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${compact ? "compact" : "full"}-${row.code}`} className="border-t">
              <td className="px-3 py-2 font-semibold">{row.code}</td>
              <td className="px-3 py-2 text-right">{formatInteger(row.totalRecords)}</td>
              {!compact ? <td className="px-3 py-2 text-right">{formatInteger(row.totalCompanies)}</td> : null}
              <td className="px-3 py-2 text-right">{formatNumber(row.averageScore)}</td>
              <td className="px-3 py-2">
                <Badge variant={row.inIMHLP ? "green" : "orange"}>{row.inIMHLP ? "Ya" : "Tidak"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <EmptyBox /> : null}
    </div>
  );
}

function EmptyBox() {
  return <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">Tidak ada data.</div>;
}
