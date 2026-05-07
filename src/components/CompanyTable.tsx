import { useMemo, useState } from "react";
import { ArrowUpDown, Download, FileSpreadsheet, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { exportAssessmentsToCsv, exportAssessmentsToExcel } from "@/lib/export";
import { getClassificationBadgeVariant, getMaturityBadgeVariant, normalizeInternalKeyPart } from "@/lib/indi";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { KbliClassificationEdit, ParsedAssessment } from "@/types/indi";

type SortKey = "companyName" | "score" | "year" | "workforce";
type SortDirection = "asc" | "desc";

interface CompanyTableProps {
  records: ParsedAssessment[];
  allRecords: ParsedAssessment[];
  onKbliClassificationEditChange: (recordId: string, edit: KbliClassificationEdit | null) => void;
}

export function CompanyTable({ records, allRecords, onKbliClassificationEditChange }: CompanyTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 15;

  const sortedRecords = useMemo(() => {
    const normalizedQuery = normalizeInternalKeyPart(query);
    const searched = normalizedQuery
      ? records.filter((record) =>
          normalizeInternalKeyPart(`${record.companyName} ${record.location} ${record.kbli.codes.join(" ")}`).includes(
            normalizedQuery
          )
        )
      : records;

    return [...searched].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === "string" || typeof bValue === "string") {
        return String(aValue ?? "").localeCompare(String(bValue ?? "")) * direction;
      }
      return ((aValue ?? -Infinity) - (bValue ?? -Infinity)) * direction;
    });
  }, [query, records, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = selectedId ? allRecords.find((record) => record.id === selectedId) ?? null : null;

  const sort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "companyName" ? "asc" : "desc");
    }
    setPage(1);
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Tabel Detail Perusahaan</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => exportAssessmentsToCsv(sortedRecords, "data-terfilter-indi.csv")}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportAssessmentsToExcel(sortedRecords, "data-terfilter-indi.xlsx")}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search nama perusahaan, lokasi, atau KBLI"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <Th label="Nama Perusahaan" onClick={() => sort("companyName")} />
                <Th label="Tahun SA" onClick={() => sort("year")} />
                <th className="px-3 py-3">Tgl. Kirim</th>
                <th className="px-3 py-3">Lokasi</th>
                <Th label="Nilai INDI" align="right" onClick={() => sort("score")} />
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Klasifikasi KBLI</th>
                <th className="px-3 py-3 text-right">KBLI</th>
                <th className="px-3 py-3 text-right">IMHLP</th>
                <th className="px-3 py-3 text-right">Non-IMHLP</th>
                <th className="px-3 py-3">Pilar terlemah</th>
                <th className="px-3 py-3">Pilar terkuat</th>
                <Th label="Tenaga kerja" align="right" onClick={() => sort("workforce")} />
                <th className="px-3 py-3">Status Data</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record) => (
                <tr
                  key={record.id}
                  className="cursor-pointer border-t bg-white hover:bg-blue-50/50"
                  onClick={() => setSelectedId(record.id)}
                >
                  <td className="px-3 py-3 font-medium text-slate-950">{record.companyName || "-"}</td>
                  <td className="px-3 py-3">{record.year ?? "-"}</td>
                  <td className="px-3 py-3">{record.submittedAt || "-"}</td>
                  <td className="px-3 py-3">
                    <div>{record.location || "-"}</div>
                    {record.province ? <div className="text-xs text-muted-foreground">{record.province}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{formatNumber(record.score)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={getMaturityBadgeVariant(record.maturityStatus)}>{record.maturityStatus}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={getClassificationBadgeVariant(record.kbli.classification)}>
                        {record.kbli.classification}
                      </Badge>
                      {record.kbliClassificationEdited ? <Badge variant="blue">Diedit</Badge> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{formatInteger(record.kbli.codes.length)}</td>
                  <td className="px-3 py-3 text-right">{formatInteger(record.kbli.imhlpCodes.length)}</td>
                  <td className="px-3 py-3 text-right">{formatInteger(record.kbli.outsideCodes.length)}</td>
                  <td className="px-3 py-3">{record.weakestPillar}</td>
                  <td className="px-3 py-3">{record.strongestPillar}</td>
                  <td className="px-3 py-3 text-right">{record.workforce === null ? "-" : formatInteger(record.workforce)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.anomalyFlags.length ? (
                        record.anomalyFlags.map((flag) => (
                          <Badge key={flag} variant={flag === "Anomali Data" ? "red" : "orange"}>
                            {flag}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="green">Valid</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageRecords.length ? (
            <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
              Tidak ada data pada filter ini.
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {formatInteger(pageRecords.length)} dari {formatInteger(sortedRecords.length)} record
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>
              Sebelumnya
            </Button>
            <span className="text-sm">
              Halaman {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage >= totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </CardContent>
      <CompanyDetailDialog
        record={selected}
        allRecords={allRecords}
        onClose={() => setSelectedId(null)}
        onKbliClassificationEditChange={onKbliClassificationEditChange}
      />
    </Card>
  );
}

function Th({ label, onClick, align = "left" }: { label: string; onClick: () => void; align?: "left" | "right" }) {
  return (
    <th className={`px-3 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button type="button" className="inline-flex items-center gap-1 font-semibold uppercase" onClick={onClick}>
        {label}
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}
