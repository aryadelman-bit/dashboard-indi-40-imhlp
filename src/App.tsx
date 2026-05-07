import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, Loader2 } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FiltersPanel } from "@/components/FiltersPanel";
import { InsightPanel } from "@/components/InsightPanel";
import { KbliAnalysisTab } from "@/components/KbliAnalysisTab";
import { KpiCards } from "@/components/KpiCards";
import { PillarAnalysisTab } from "@/components/PillarAnalysisTab";
import { ValidationTab } from "@/components/ValidationTab";
import { CompanyTable } from "@/components/CompanyTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseExcelBuffer } from "@/lib/excel";
import { applyDashboardFilters, calculateAggregates, DEFAULT_FILTERS } from "@/lib/indi";
import {
  applyKbliClassificationEdits,
  loadKbliClassificationEdits,
  saveKbliClassificationEdits
} from "@/lib/kbliEdits";
import { formatInteger } from "@/lib/utils";
import type { DashboardFilters, KbliClassificationEdit, ParsedWorkbook, WorkbookSummary } from "@/types/indi";

const DATASET_FILE_NAME = "indi_makanan_minuman_20260507_110017.xlsx";
declare global {
  interface Window {
    __INDI_EXCEL_DATA_URL__?: string;
  }
}

const DATASET_URL = window.__INDI_EXCEL_DATA_URL__ ?? `${import.meta.env.BASE_URL}data/${DATASET_FILE_NAME}`;

export default function App() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [includeAnomalies, setIncludeAnomalies] = useState(false);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [kbliClassificationEdits, setKbliClassificationEdits] = useState<
    Record<string, KbliClassificationEdit>
  >(() => loadKbliClassificationEdits());

  useEffect(() => {
    let cancelled = false;

    async function loadDataset() {
      setLoadStatus("loading");
      setLoadError("");

      try {
        const response = await fetch(DATASET_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`File sumber tidak dapat dibaca (${response.status} ${response.statusText}).`);
        }

        const buffer = await response.arrayBuffer();
        const parsed = parseExcelBuffer(buffer, DATASET_FILE_NAME);
        if (cancelled) return;

        setWorkbook(parsed);
        setFilters(DEFAULT_FILTERS);
        setIncludeAnomalies(false);
        setLoadStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setWorkbook(null);
        setLoadError(err instanceof Error ? err.message : "File Excel sumber gagal dibaca.");
        setLoadStatus("error");
      }
    }

    void loadDataset();
    return () => {
      cancelled = true;
    };
  }, []);

  const rawRecords = workbook?.assessments ?? [];
  const records = useMemo(
    () => applyKbliClassificationEdits(rawRecords, kbliClassificationEdits),
    [kbliClassificationEdits, rawRecords]
  );
  const filteredRecords = useMemo(() => applyDashboardFilters(records, filters), [filters, records]);
  const aggregate = useMemo(
    () => calculateAggregates(filteredRecords, includeAnomalies),
    [filteredRecords, includeAnomalies]
  );

  function updateKbliClassificationEdit(recordId: string, edit: KbliClassificationEdit | null) {
    const next = { ...kbliClassificationEdits };
    if (edit) {
      next[recordId] = edit;
    } else {
      delete next[recordId];
    }
    setKbliClassificationEdits(next);
    saveKbliClassificationEdits(next);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_460px] lg:items-end">
            <div className="space-y-3">
              <Badge variant="blue">INDI 4.0 Self Assessment</Badge>
              <div className="space-y-2">
                <h1 className="max-w-5xl text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">
                  Dashboard Monitoring Self Assessment INDI 4.0 Industri Makanan, Hasil Laut dan Perikanan
                </h1>
                <p className="max-w-4xl text-sm leading-6 text-muted-foreground md:text-base">
                  Monitoring agregat skor INDI 4.0, sebaran perusahaan, klasifikasi KBLI, anomali data, serta
                  kekuatan dan kelemahan pilar transformasi industri 4.0.
                </p>
              </div>
            </div>
            <DataSourceCard summary={workbook?.summary ?? null} status={loadStatus} error={loadError} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {loadStatus === "loading" ? (
          <LoadingState />
        ) : loadStatus === "error" || !workbook ? (
          <ErrorState error={loadError} />
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="validasi">Validasi Data</TabsTrigger>
              <TabsTrigger value="pilar">Analisis Pilar & Bidang</TabsTrigger>
              <TabsTrigger value="kbli">Analisis KBLI</TabsTrigger>
            </TabsList>

            <FiltersPanel
              records={records}
              filters={filters}
              includeAnomalies={includeAnomalies}
              onFiltersChange={setFilters}
              onIncludeAnomaliesChange={setIncludeAnomalies}
            />

            <TabsContent value="dashboard" className="space-y-6">
              <KpiCards kpi={aggregate.kpi} />
              <InsightPanel insights={aggregate.insights} />
              <DashboardCharts aggregate={aggregate} />
              <CompanyTable
                records={filteredRecords}
                allRecords={records}
                onKbliClassificationEditChange={updateKbliClassificationEdit}
              />
            </TabsContent>

            <TabsContent value="validasi">
              <ValidationTab records={filteredRecords} />
            </TabsContent>

            <TabsContent value="pilar">
              <PillarAnalysisTab aggregate={aggregate} />
            </TabsContent>

            <TabsContent value="kbli">
              <KbliAnalysisTab aggregate={aggregate} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function DataSourceCard({
  summary,
  status,
  error
}: {
  summary: WorkbookSummary | null;
  status: "loading" | "ready" | "error";
  error: string;
}) {
  return (
    <Card className="border-blue-100 bg-white/95 shadow-soft">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            )}
            Sumber data Excel otomatis
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant={status === "error" ? "red" : "blue"}>{DATASET_FILE_NAME}</Badge>
            {summary ? (
              <>
                <Badge variant="outline">Sheet: {summary.sheetNames.join(", ")}</Badge>
                <Badge variant="secondary">{formatInteger(summary.totalDataRows)} baris</Badge>
                <Badge variant="secondary">{formatInteger(summary.dataColumnCount)} kolom Data</Badge>
                <Badge variant="green">{formatInteger(summary.validRows)} valid agregasi</Badge>
                <Badge variant={summary.anomalyRows > 0 ? "red" : "secondary"}>
                  {formatInteger(summary.anomalyRows)} anomali data
                </Badge>
                <Badge variant="outline">
                  Tahun {summary.years.length ? `${summary.years[0]}-${summary.years.at(-1)}` : "-"}
                </Badge>
                <Badge variant="outline">{formatInteger(summary.kbliReferenceCount)} KBLI IMHLP</Badge>
              </>
            ) : status === "loading" ? (
              <span>Membaca file dari folder aplikasi...</span>
            ) : (
              <span>{error}</span>
            )}
          </div>
          {summary?.warnings.length ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{summary.warnings.join(" ")}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-lg bg-blue-50 p-4 text-blue-700">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-semibold">Membaca file Excel sumber</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Aplikasi otomatis memuat file {DATASET_FILE_NAME} dari folder aplikasi dan menghitung dashboard di browser.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <Badge variant="outline" className="gap-1">
            <Database className="h-3.5 w-3.5" />
            Client-side parsing
          </Badge>
          <Badge variant="outline">SheetJS/xlsx</Badge>
          <Badge variant="outline">React + Vite + TypeScript</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <FileSpreadsheet className="h-10 w-10" />
        </div>
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-semibold">File Excel sumber belum bisa dibaca</h2>
          <p className="text-sm leading-6 text-muted-foreground">{error}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Pastikan file tersedia di <span className="font-medium text-slate-800">public/data/{DATASET_FILE_NAME}</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
