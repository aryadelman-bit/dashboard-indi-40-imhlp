import { Download, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportValidationWorkbook } from "@/lib/export";
import { getClassificationBadgeVariant, isAggregationAnomaly } from "@/lib/indi";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { ParsedAssessment } from "@/types/indi";

export function ValidationTab({ records }: { records: ParsedAssessment[] }) {
  const aggregationAnomalies = records.filter(isAggregationAnomaly);
  const anomalyData = records.filter((record) => record.anomalyData);
  const invalidDates = records.filter((record) => record.tanggalInvalid);
  const zeroScores = records.filter((record) => record.skorNol);
  const duplicates = records.filter((record) => record.duplikasiPotensial);
  const noKbli = records.filter((record) => record.kbli.codes.length === 0);
  const multiAgro = records.filter((record) => record.kbli.classification === "Multi KBLI Agro");
  const issueCount = records.filter((record) => record.anomalyFlags.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ValidationMetric title="Anomali agregasi" value={aggregationAnomalies.length} tone="red" />
        <ValidationMetric title="Anomali Data" value={anomalyData.length} tone="red" />
        <ValidationMetric title="Tanggal invalid" value={invalidDates.length} tone="orange" />
        <ValidationMetric title="Skor nol" value={zeroScores.length} tone="orange" />
        <ValidationMetric title="Duplikasi potensial" value={duplicates.length} tone="yellow" />
        <ValidationMetric title="Data tanpa KBLI" value={noKbli.length} tone="gray" />
        <ValidationMetric title="Multi KBLI Agro" value={multiAgro.length} tone="blue" />
        <ValidationMetric title="Semua flag data" value={issueCount} tone="red" />
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Validasi Data
            </CardTitle>
            <Button variant="outline" onClick={() => exportValidationWorkbook(records, "validasi-data-indi.xlsx")}>
              <Download className="h-4 w-4" />
              Export hasil validasi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <IssueTable title="Nilai INDI = 0 dan tanggal invalid" records={anomalyData} />
          <IssueTable title="Daftar tanggal invalid" records={invalidDates} />
          <IssueTable title="Daftar skor nol" records={zeroScores} />
          <IssueTable title="Duplikasi potensial Nama + Lokasi + Tahun" records={duplicates} />
          <IssueTable title="Data tanpa KBLI" records={noKbli} />
          <IssueTable title="Data Multi KBLI Agro" records={multiAgro} showKbli />
        </CardContent>
      </Card>
    </div>
  );
}

function ValidationMetric({
  title,
  value,
  tone
}: {
  title: string;
  value: number;
  tone: "red" | "orange" | "yellow" | "blue" | "gray";
}) {
  const toneClass = {
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
    yellow: "bg-yellow-50 text-yellow-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-slate-50 text-slate-700"
  }[tone];

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{formatInteger(value)}</p>
        </div>
        <div className={`rounded-md p-2 ${toneClass}`}>
          <ShieldAlert className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function IssueTable({
  title,
  records,
  showKbli = false
}: {
  title: string;
  records: ParsedAssessment[];
  showKbli?: boolean;
}) {
  const visible = records.slice(0, 80);
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant={records.length ? "red" : "secondary"}>{formatInteger(records.length)}</Badge>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Perusahaan</th>
              <th className="px-3 py-2">Tahun</th>
              <th className="px-3 py-2 text-right">Nilai</th>
              {showKbli ? <th className="px-3 py-2">KBLI</th> : null}
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => (
              <tr key={`${title}-${record.id}`} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{record.companyName || "-"}</div>
                  <div className="text-xs text-muted-foreground">{record.location || "-"}</div>
                </td>
                <td className="px-3 py-2">{record.year ?? "-"}</td>
                <td className="px-3 py-2 text-right">{formatNumber(record.score)}</td>
                {showKbli ? <td className="px-3 py-2">{record.kbli.codes.join(", ") || "-"}</td> : null}
                <td className="px-3 py-2">
                  <Badge variant={getClassificationBadgeVariant(record.kbli.classification)}>
                    {record.kbli.classification}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Tidak ada data.</div>
        ) : null}
      </div>
      {records.length > visible.length ? (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          Menampilkan 80 baris pertama. Gunakan export untuk daftar lengkap.
        </div>
      ) : null}
    </div>
  );
}
