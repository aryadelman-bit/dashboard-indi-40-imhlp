export type KbliClassification =
  | "Sektor Makanan"
  | "Multi KBLI Agro"
  | "Di Luar KBLI IMHLP"
  | "Tidak Ada KBLI";

export interface KbliClassificationEdit {
  assessmentId: string;
  classification: KbliClassification;
  note: string;
  updatedAt: string;
}

export type MaturityStatus = "Sangat Awal" | "Dasar" | "Berkembang" | "Matang" | "Tidak Valid";

export type AnomalyType = "Anomali Data" | "Tanggal Invalid" | "Skor Nol" | "Duplikasi Potensial";

export interface KbliStats {
  codes: string[];
  imhlpCodes: string[];
  outsideCodes: string[];
  classification: KbliClassification;
}

export interface ParsedAssessment {
  id: string;
  rowNumber: number;
  no: string;
  companyName: string;
  sector: string;
  score: number | null;
  submittedAt: string;
  year: number | null;
  location: string;
  province: string;
  workforce: number | null;
  businessField: string;
  picName: string;
  position: string;
  email: string;
  challenges: string;
  hopes: string;
  pillarScores: Record<string, number | null>;
  fieldScores: Record<string, number | null>;
  weakestPillar: string;
  strongestPillar: string;
  maturityStatus: MaturityStatus;
  establishmentKey: string;
  assessmentKey: string | null;
  kbli: KbliStats;
  originalKbliClassification?: KbliClassification;
  kbliClassificationEdited?: boolean;
  kbliClassificationEditNote?: string;
  kbliClassificationEditedAt?: string;
  anomalyData: boolean;
  tanggalInvalid: boolean;
  skorNol: boolean;
  duplikasiPotensial: boolean;
  anomalyFlags: AnomalyType[];
  raw: Record<string, unknown>;
}

export interface WorkbookSummary {
  fileName: string;
  sheetNames: string[];
  totalDataRows: number;
  dataColumnCount: number;
  validRows: number;
  anomalyRows: number;
  kbliReferenceCount: number;
  years: number[];
  warnings: string[];
}

export interface ParsedWorkbook {
  assessments: ParsedAssessment[];
  kbliSet: Set<string>;
  summary: WorkbookSummary;
}

export interface DashboardFilters {
  year: string;
  classification: string;
  scoreMin: string;
  scoreMax: string;
  maturity: string;
  weakestPillar: string;
  kbli: string;
  company: string;
  location: string;
}

export interface KpiMetrics {
  totalRecords: number;
  uniqueEstablishments: number;
  validAssessments: number;
  anomalyData: number;
  averageScore: number | null;
  medianScore: number | null;
  maxScore: number | null;
  minScore: number | null;
  countAboveThree: number;
  percentAboveThree: number;
  earliestYear: number | null;
  latestYear: number | null;
}

export interface ChartDatum {
  name: string;
  value: number;
  [key: string]: string | number | null;
}

export interface RankedItem {
  name: string;
  value: number | null;
  count: number;
  pillar?: string;
  color?: string;
}

export interface KbliAnalysisRow {
  code: string;
  totalRecords: number;
  totalCompanies: number;
  averageScore: number | null;
  inIMHLP: boolean;
}

export interface DataQualityMetrics {
  aggregationAnomalies: number;
  anomalyData: number;
  invalidDates: number;
  zeroScores: number;
  duplicates: number;
  noKbli: number;
  outsideKbli: number;
  multiKbliAgro: number;
  editedClassifications: number;
  validShare: number;
}

export interface ActionQueue {
  name: string;
  count: number;
  description: string;
  tone: "red" | "orange" | "yellow" | "blue" | "green" | "gray";
}

export interface AggregateResult {
  sourceRecords: ParsedAssessment[];
  scoreRecords: ParsedAssessment[];
  kpi: KpiMetrics;
  dataQuality: DataQualityMetrics;
  actionQueues: ActionQueue[];
  yearCounts: Array<{ year: number | string; valid: number; anomaly: number; total: number }>;
  yearlyAverage: Array<{ year: number; average: number | null; count: number }>;
  scoreDistribution: ChartDatum[];
  maturityComposition: ChartDatum[];
  pillarAverages: RankedItem[];
  fieldAverages: RankedItem[];
  classificationDistribution: ChartDatum[];
  topCompanies: ParsedAssessment[];
  bottomCompanies: ParsedAssessment[];
  anomalyByType: ChartDatum[];
  insights: string[];
  pillarYearMatrix: Array<Record<string, string | number | null>>;
  fieldYearMatrix: Array<Record<string, string | number | null>>;
  technologyWeakestCompanies: ParsedAssessment[];
  verificationCandidates: ParsedAssessment[];
  kbliRows: KbliAnalysisRow[];
}
