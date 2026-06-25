import { useEffect, useMemo, useState } from "react";
import { Database, FileSpreadsheet, Loader2 } from "lucide-react";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DecisionVisuals } from "@/components/DecisionVisuals";
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

  function applyQuickFilters(nextFilters: Partial<DashboardFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="dashboard-container py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="blue">INDI 4.0 Self Assessment</Badge>
                <Badge variant="outline">IMHLP</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="max-w-6xl text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl xl:text-4xl">
                  Dashboard Monitoring Self Assessment INDI 4.0 Industri Makanan, Hasil Laut dan Perikanan
                </h1>
                <p className="max-w-5xl text-sm leading-6 text-muted-foreground md:text-base">
                  Monitoring agregat skor INDI 4.0, sebaran perusahaan, klasifikasi KBLI, anomali data, serta
                  kekuatan dan kelemahan pilar transformasi industri 4.0.
                </p>
              </div>
            </div>
            <div className="grid min-w-full grid-cols-3 gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 p-2 text-center text-xs text-slate-600 shadow-inner lg:min-w-[520px]">
              <div className="rounded-md border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <div className="text-base font-semibold text-slate-950">
                  {workbook?.summary.totalDataRows.toLocaleString("id-ID") ?? "-"}
                </div>
                <div>Record SA</div>
              </div>
              <div className="rounded-md border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <div className="text-base font-semibold text-slate-950">{yearRange}</div>
                <div>Tahun data</div>
              </div>
              <div className="rounded-md border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <div className="text-base font-semibold text-slate-950">
                  {workbook?.summary.kbliReferenceCount.toLocaleString("id-ID") ?? "-"}
                </div>
                <div>KBLI referensi</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-container space-y-7 py-7">
        {loadStatus === "loading" ? (
          <LoadingState />
        ) : loadStatus === "error" || !workbook ? (
          <ErrorState error={loadError} />
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-7">
            <TabsList className="w-full gap-1 overflow-x-auto">
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
              <ComparisonPanel records={records} filters={filters} includeAnomalies={includeAnomalies} />
              <DecisionVisuals aggregate={aggregate} onQuickFilter={applyQuickFilters} />
              <DashboardCharts aggregate={aggregate} onQuickFilter={applyQuickFilters} />
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
    <Card className="bg-white/95">
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
    <Card className="bg-white/95">
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
