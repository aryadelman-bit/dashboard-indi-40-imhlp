import { useEffect, useMemo, useState } from "react";
import { Database, FileSpreadsheet, Loader2 } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
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
import type { DashboardFilters, KbliClassificationEdit, ParsedWorkbook } from "@/types/indi";

const DATASET_FILE_NAME = "indi_makanan_minuman_20260507_110017.xlsx";
const DATASET_URL = `${import.meta.env.BASE_URL}data/${DATASET_FILE_NAME}`;

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
  const yearRange = workbook?.summary.years.length
    ? `${workbook.summary.years[0]}-${workbook.summary.years[workbook.summary.years.length - 1]}`
    : "-";

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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="blue">INDI 4.0 Self Assessment</Badge>
                <Badge variant="outline">IMHLP</Badge>
              </div>
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
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-slate-50 p-2 text-center text-xs text-slate-600">
              <div className="rounded-md bg-white px-3 py-2 shadow-sm">
                <div className="font-semibold text-slate-950">{workbook?.summary.totalDataRows.toLocaleString("id-ID") ?? "-"}</div>
                <div>Record SA</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2 shadow-sm">
                <div className="font-semibold text-slate-950">{yearRange}</div>
                <div>Tahun data</div>
              </div>
              <div className="rounded-md bg-white px-3 py-2 shadow-sm">
                <div className="font-semibold text-slate-950">
                  {workbook?.summary.kbliReferenceCount.toLocaleString("id-ID") ?? "-"}
                </div>
                <div>KBLI referensi</div>
              </div>
            </div>
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
              <ExecutiveSummary aggregate={aggregate} />
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
