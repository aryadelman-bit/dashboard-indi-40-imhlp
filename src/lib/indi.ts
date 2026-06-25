import { ANOMALY_TYPES, FIELD_TO_PILLAR, INDONESIAN_PROVINCES, PILLARS, SCORE_BUCKETS } from "@/constants/indi";
import type {
  AggregateResult,
  AnomalyType,
  ChartDatum,
  DashboardFilters,
  KbliAnalysisRow,
  KbliClassification,
  KbliStats,
  InterventionPriorityBand,
  MaturityStatus,
  ParsedAssessment,
  ProvinceAnalysisRow,
  RankedItem
} from "@/types/indi";

export const DEFAULT_FILTERS: DashboardFilters = {
  year: "all",
  classification: "all",
  scoreMin: "",
  scoreMax: "",
  maturity: "all",
  weakestPillar: "all",
  kbli: "",
  company: "",
  location: ""
};

export function normalizeInternalKeyPart(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function toDisplayString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseIndiScore(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const raw = toDisplayString(value);
  if (!raw) return null;

  // Nilai Excel bisa berupa "1,67", "3,00", "1.88", atau angka panjang.
  // Jika koma dan titik muncul bersamaan, pemisah terakhir dianggap desimal.
  let normalized = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.replace(new RegExp(`\\${thousandsSeparator}`, "g"), "");
    normalized = normalized.replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    normalized = normalized.replace(/,/g, ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseIntegerFlexible(value: unknown): number | null {
  const parsed = parseIndiScore(value);
  if (parsed === null) return null;
  return Math.round(parsed);
}

export function parseAssessmentYear(value: unknown): { year: number | null; invalid: boolean } {
  const raw = toDisplayString(value);
  if (!raw) return { year: null, invalid: true };

  // Tanggal invalid di data contoh bisa berbentuk "0 0000, 00:00 WIB".
  // Karena variasinya mungkin berubah, semua string yang mengandung 0000 ditandai invalid.
  if (raw.includes("0000")) return { year: null, invalid: true };

  const match = raw.match(/\b(20\d{2})\b/);
  if (!match) return { year: null, invalid: true };

  const year = Number(match[1]);
  return Number.isFinite(year) ? { year, invalid: false } : { year: null, invalid: true };
}

export function extractKBLICodes(value: unknown): string[] {
  const raw = toDisplayString(value);
  if (!raw) return [];

  // Aturan bisnis: semua KBLI 5 digit diekstrak dari satu sel Bidang Usaha.
  const matches = raw.match(/\b\d{5}\b/g) ?? [];
  return Array.from(new Set(matches));
}

export function classifyKBLI(codes: string[], kbliIMHLPSet: Set<string>): KbliStats {
  const uniqueCodes = Array.from(new Set(codes));
  if (uniqueCodes.length === 0) {
    return {
      codes: [],
      imhlpCodes: [],
      outsideCodes: [],
      classification: "Tidak Ada KBLI"
    };
  }

  const imhlpCodes = uniqueCodes.filter((code) => kbliIMHLPSet.has(code));
  const outsideCodes = uniqueCodes.filter((code) => !kbliIMHLPSet.has(code));
  const imhlpRatio = imhlpCodes.length / uniqueCodes.length;

  // Klasifikasi mengikuti proporsi kode yang masuk daftar KBLI IMHLP, bukan teks sektor manual.
  // Jika mayoritas kode (>50%) masuk binaan IMHLP, record tetap diklasifikasikan sebagai Sektor Makanan.
  let classification: KbliClassification;
  if (imhlpRatio > 0.5) {
    classification = "Sektor Makanan";
  } else if (imhlpCodes.length > 0 && outsideCodes.length > 0) {
    classification = "Multi KBLI Agro";
  } else {
    classification = "Di Luar KBLI IMHLP";
  }

  return { codes: uniqueCodes, imhlpCodes, outsideCodes, classification };
}

export function getMaturityStatus(score: number | null): MaturityStatus {
  if (score === null || !Number.isFinite(score)) return "Tidak Valid";
  if (score < 1) return "Sangat Awal";
  if (score < 2) return "Dasar";
  if (score < 3) return "Berkembang";
  return "Matang";
}

export function getMaturityBadgeVariant(status: MaturityStatus) {
  if (status === "Sangat Awal") return "red" as const;
  if (status === "Dasar") return "orange" as const;
  if (status === "Berkembang") return "yellow" as const;
  if (status === "Matang") return "green" as const;
  return "gray" as const;
}

export function getClassificationBadgeVariant(classification: string) {
  if (classification === "Sektor Makanan") return "green" as const;
  if (classification === "Multi KBLI Agro") return "blue" as const;
  if (classification.includes("Di Luar")) return "orange" as const;
  return "gray" as const;
}

export function getWeakestPillar(pillarScores: Record<string, number | null>): string {
  const entries = Object.entries(pillarScores).filter(([, value]) => value !== null) as Array<[string, number]>;
  if (entries.length === 0) return "-";
  return entries.reduce((weakest, current) => (current[1] < weakest[1] ? current : weakest))[0];
}

export function getStrongestPillar(pillarScores: Record<string, number | null>): string {
  const entries = Object.entries(pillarScores).filter(([, value]) => value !== null) as Array<[string, number]>;
  if (entries.length === 0) return "-";
  return entries.reduce((strongest, current) => (current[1] > strongest[1] ? current : strongest))[0];
}

export function detectAnomalies(score: number | null, tanggalInvalid: boolean, duplikasiPotensial = false) {
  const skorNol = score === 0;
  const anomalyData = skorNol && tanggalInvalid;
  const flags: AnomalyType[] = [];

  // Flag detail tetap dipisah agar dashboard bisa menjelaskan sumber masalah data.
  if (anomalyData) flags.push("Anomali Data");
  if (tanggalInvalid) flags.push("Tanggal Invalid");
  if (skorNol) flags.push("Skor Nol");
  if (duplikasiPotensial) flags.push("Duplikasi Potensial");

  return { anomalyData, tanggalInvalid, skorNol, duplikasiPotensial, flags };
}

export function isAggregationAnomaly(record: ParsedAssessment) {
  // Pemisah agregasi dashboard: keluarkan Anomali Data utama, Skor Nol, dan Tanggal Invalid.
  // Duplikasi potensial tetap ditampilkan sebagai isu validasi, tetapi tidak otomatis dikeluarkan dari rata-rata.
  return record.anomalyData || record.tanggalInvalid || record.skorNol;
}

export function applyDuplicateFlags(records: ParsedAssessment[]) {
  const grouped = new Map<string, ParsedAssessment[]>();

  records.forEach((record) => {
    if (!record.assessmentKey) return;
    const existing = grouped.get(record.assessmentKey) ?? [];
    existing.push(record);
    grouped.set(record.assessmentKey, existing);
  });

  grouped.forEach((group) => {
    if (group.length <= 1) return;
    group.forEach((record) => {
      record.duplikasiPotensial = true;
      if (!record.anomalyFlags.includes("Duplikasi Potensial")) {
        record.anomalyFlags.push("Duplikasi Potensial");
      }
    });
  });

  return records;
}

export function extractProvince(location: unknown) {
  const normalized = normalizeInternalKeyPart(location);
  if (!normalized) return "";
  const found = INDONESIAN_PROVINCES.find((province) => normalized.includes(normalizeInternalKeyPart(province)));
  return found ?? "";
}

export function applyDashboardFilters(records: ParsedAssessment[], filters: DashboardFilters) {
  const scoreMin = filters.scoreMin === "" ? null : Number(filters.scoreMin);
  const scoreMax = filters.scoreMax === "" ? null : Number(filters.scoreMax);
  const companyQuery = normalizeInternalKeyPart(filters.company);
  const locationQuery = normalizeInternalKeyPart(filters.location);
  const kbliQuery = normalizeInternalKeyPart(filters.kbli);

  return records.filter((record) => {
    if (filters.year !== "all" && record.year !== Number(filters.year)) return false;
    if (filters.classification !== "all" && record.kbli.classification !== filters.classification) return false;
    if (filters.maturity !== "all" && record.maturityStatus !== filters.maturity) return false;
    if (filters.weakestPillar !== "all" && record.weakestPillar !== filters.weakestPillar) return false;

    if (scoreMin !== null && (record.score === null || record.score < scoreMin)) return false;
    if (scoreMax !== null && (record.score === null || record.score > scoreMax)) return false;

    if (companyQuery && !normalizeInternalKeyPart(record.companyName).includes(companyQuery)) return false;
    if (
      locationQuery &&
      !normalizeInternalKeyPart(`${record.location} ${record.province}`).includes(locationQuery)
    ) {
      return false;
    }
    if (
      kbliQuery &&
      !record.kbli.codes.some((code) => normalizeInternalKeyPart(code).includes(kbliQuery))
    ) {
      return false;
    }

    return true;
  });
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function toScoreValues(records: ParsedAssessment[]) {
  return records.map((record) => record.score).filter((score): score is number => score !== null);
}

function groupRecordsByYear(records: ParsedAssessment[]) {
  const years = Array.from(new Set(records.map((record) => record.year).filter((year): year is number => year !== null)));
  return years.sort((a, b) => a - b);
}

function averageMetric(records: ParsedAssessment[], metric: string, source: "pillar" | "field") {
  const values = records
    .map((record) => (source === "pillar" ? record.pillarScores[metric] : record.fieldScores[metric]))
    .filter((value): value is number => value !== null);
  return { average: average(values), count: values.length };
}

function buildMatrix(records: ParsedAssessment[], metrics: string[], source: "pillar" | "field") {
  const years = groupRecordsByYear(records);
  return metrics.map((metric) => {
    const row: Record<string, string | number | null> = { name: metric };
    years.forEach((year) => {
      const yearRecords = records.filter((record) => record.year === year);
      row[String(year)] = averageMetric(yearRecords, metric, source).average;
    });
    return row;
  });
}

function buildInsights(result: Omit<AggregateResult, "insights">) {
  const insights: AggregateResult["insights"] = [];
  const avg = result.kpi.averageScore;
  if (avg !== null) {
    insights.push({
      title: "Kesiapan umum",
      metric: avg.toFixed(2),
      tone: getMaturityBadgeVariant(getMaturityStatus(avg)),
      body: `Rata-rata Nilai INDI terfilter berada pada level ${avg.toFixed(2)} (${getMaturityStatus(avg)}).`
    });
  }

  const weakestPillar = [...result.pillarAverages]
    .filter((item) => item.value !== null)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];
  if (weakestPillar?.value !== null && weakestPillar) {
    const weakestFields = result.fieldAverages
      .filter((field) => field.pillar === weakestPillar.name && field.value !== null)
      .slice(0, 2)
      .map((field) => field.name)
      .join(" dan ");
    insights.push({
      title: "Kelemahan transformasi",
      metric: weakestPillar.name,
      tone: "orange",
      body: `Pilar dengan skor rata-rata terendah adalah ${weakestPillar.name}; bidang yang perlu dicermati: ${weakestFields || "belum tersedia"}.`
    });
  }

  insights.push({
    title: "Kandidat verifikasi",
    metric: String(result.kpi.countAboveThree),
    tone: result.kpi.countAboveThree > 0 ? "green" : "gray",
    body: `${result.kpi.countAboveThree} perusahaan/lokasi telah mencapai Nilai INDI >= 3.00 dan dapat diprioritaskan untuk verifikasi atau pendampingan lanjutan.`
  });

  if (result.kpi.anomalyData > 0) {
    insights.push({
      title: "Kualitas data",
      metric: String(result.kpi.anomalyData),
      tone: "red",
      body: `Terdapat ${result.kpi.anomalyData} data yang dipisahkan dari agregasi karena Anomali Data, Skor Nol, atau Tanggal Invalid.`
    });
  }

  const largestClassification = [...result.classificationDistribution].sort((a, b) => b.value - a.value)[0];
  if (largestClassification) {
    insights.push({
      title: "Pola KBLI",
      metric: largestClassification.name,
      tone: "blue",
      body: `Kategori KBLI terbesar pada data terfilter adalah ${largestClassification.name} dengan ${largestClassification.value} record.`
    });
  }

  const busiestYear = [...result.yearCounts].sort((a, b) => b.total - a.total)[0];
  if (busiestYear) {
    insights.push({
      title: "Momentum tahunan",
      metric: String(busiestYear.year),
      tone: "blue",
      body: `Tahun dengan jumlah Self Assessment terbanyak adalah ${busiestYear.year} (${busiestYear.total} record).`
    });
  }

  const topProvince = result.provinceRows[0];
  if (topProvince) {
    insights.push({
      title: "Sebaran wilayah",
      metric: topProvince.province,
      tone: "yellow",
      body: `${topProvince.province} menjadi wilayah dengan record terbanyak (${topProvince.totalRecords} record) dan rata-rata skor ${topProvince.averageScore?.toFixed(2) ?? "-"}.`
    });
  }

  const highPriority = result.interventionPoints.filter((point) => point.priorityBand === "Prioritas tinggi").length;
  if (highPriority > 0) {
    insights.push({
      title: "Prioritas intervensi",
      metric: String(highPriority),
      tone: "red",
      body: `${highPriority} perusahaan/lokasi berada pada kuadran prioritas tinggi karena skor belum kuat dan menyerap tenaga kerja relatif besar.`
    });
  }

  return insights;
}

function buildDataQuality(records: ParsedAssessment[]): AggregateResult["dataQuality"] {
  const aggregationAnomalies = records.filter(isAggregationAnomaly).length;
  return {
    aggregationAnomalies,
    anomalyData: records.filter((record) => record.anomalyData).length,
    invalidDates: records.filter((record) => record.tanggalInvalid).length,
    zeroScores: records.filter((record) => record.skorNol).length,
    duplicates: records.filter((record) => record.duplikasiPotensial).length,
    noKbli: records.filter((record) => record.kbli.codes.length === 0).length,
    outsideKbli: records.filter((record) => record.kbli.classification === "Di Luar KBLI IMHLP").length,
    multiKbliAgro: records.filter((record) => record.kbli.classification === "Multi KBLI Agro").length,
    editedClassifications: records.filter((record) => record.kbliClassificationEdited).length,
    validShare: records.length ? ((records.length - aggregationAnomalies) / records.length) * 100 : 0
  };
}

function buildActionQueues(
  records: ParsedAssessment[],
  scoreRecords: ParsedAssessment[],
  dataQuality: AggregateResult["dataQuality"]
): AggregateResult["actionQueues"] {
  const technologyWeak = scoreRecords.filter((record) => (record.pillarScores.Teknologi ?? 4) < 2).length;
  const verificationReady = scoreRecords.filter((record) => (record.score ?? 0) >= 3).length;
  const kbliNeedsAttention = dataQuality.noKbli + dataQuality.outsideKbli + dataQuality.multiKbliAgro;

  return [
    {
      name: "Bersihkan data agregasi",
      count: dataQuality.aggregationAnomalies,
      description: "Skor nol atau tanggal invalid yang dipisahkan dari rata-rata resmi.",
      tone: dataQuality.aggregationAnomalies > 0 ? "red" : "green"
    },
    {
      name: "Cek klasifikasi KBLI",
      count: kbliNeedsAttention,
      description: "Tanpa KBLI, di luar KBLI IMHLP, atau multi KBLI Agro.",
      tone: kbliNeedsAttention > 0 ? "orange" : "green"
    },
    {
      name: "Pendampingan teknologi",
      count: technologyWeak,
      description: "Perusahaan valid dengan pilar Teknologi di bawah level 2.",
      tone: technologyWeak > 0 ? "yellow" : "green"
    },
    {
      name: "Kandidat verifikasi",
      count: verificationReady,
      description: "Perusahaan valid dengan Nilai INDI minimal 3.00.",
      tone: verificationReady > 0 ? "blue" : "gray"
    }
  ];
}

function buildProvinceRows(
  sourceRecords: ParsedAssessment[],
  scoreRecords: ParsedAssessment[]
): ProvinceAnalysisRow[] {
  const scoreRecordIds = new Set(scoreRecords.map((record) => record.id));
  const provinceMap = new Map<
    string,
    {
      records: ParsedAssessment[];
      scoreRecords: ParsedAssessment[];
      companies: Set<string>;
    }
  >();

  sourceRecords.forEach((record) => {
    const province = record.province || "Tidak terdeteksi";
    const existing = provinceMap.get(province) ?? { records: [], scoreRecords: [], companies: new Set<string>() };
    existing.records.push(record);
    existing.companies.add(record.establishmentKey);
    if (scoreRecordIds.has(record.id)) existing.scoreRecords.push(record);
    provinceMap.set(province, existing);
  });

  return Array.from(provinceMap.entries())
    .map(([province, data]) => {
      const scores = toScoreValues(data.scoreRecords);
      return {
        province,
        totalRecords: data.records.length,
        totalCompanies: data.companies.size,
        averageScore: average(scores),
        anomalyCount: data.records.filter(isAggregationAnomaly).length,
        matureCount: data.scoreRecords.filter((record) => (record.score ?? 0) >= 3).length,
        lowScoreCount: data.scoreRecords.filter((record) => (record.score ?? 0) < 2).length
      };
    })
    .sort((a, b) => b.totalRecords - a.totalRecords);
}

function getInterventionPriorityBand(record: ParsedAssessment): InterventionPriorityBand {
  const score = record.score ?? 0;
  const workforce = record.workforce ?? 0;
  const technology = record.pillarScores.Teknologi;

  if (score < 2 && workforce >= 100) return "Prioritas tinggi";
  if (score < 2.5 || (technology !== null && technology < 2)) return "Pendampingan terarah";
  if (score >= 3) return "Siap verifikasi";
  return "Monitoring rutin";
}

function buildInterventionPoints(scoreRecords: ParsedAssessment[]): AggregateResult["interventionPoints"] {
  return scoreRecords
    .filter((record) => record.score !== null && record.workforce !== null && record.workforce > 0)
    .map((record) => ({
      id: record.id,
      companyName: record.companyName || "-",
      location: record.location || "-",
      province: record.province || "Tidak terdeteksi",
      score: record.score ?? 0,
      workforce: record.workforce ?? 0,
      workforceLog: Math.log10((record.workforce ?? 0) + 1),
      technologyScore: record.pillarScores.Teknologi,
      classification: record.kbli.classification,
      priorityBand: getInterventionPriorityBand(record)
    }));
}

export function calculateAggregates(
  sourceRecords: ParsedAssessment[],
  includeAnomalies: boolean
): AggregateResult {
  // Agregasi skor memakai Nilai INDI resmi dan secara default mengeluarkan skor nol/tanggal invalid.
  const scoreRecords = includeAnomalies
    ? sourceRecords
    : sourceRecords.filter((record) => !isAggregationAnomaly(record));
  const scoreValues = toScoreValues(scoreRecords);
  const years = groupRecordsByYear(sourceRecords);
  const yearCountSource = includeAnomalies ? sourceRecords : scoreRecords;

  const yearCounts: Array<{ year: number | string; valid: number; anomaly: number; total: number }> = years
    .map((year) => {
      const records = yearCountSource.filter((record) => record.year === year);
      const anomaly = includeAnomalies ? records.filter(isAggregationAnomaly).length : 0;
      return { year, valid: records.length - anomaly, anomaly, total: records.length };
    })
    .filter((row) => row.total > 0);
  const invalidYearRecords = includeAnomalies ? sourceRecords.filter((record) => record.year === null) : [];
  if (invalidYearRecords.length > 0) {
    yearCounts.push({
      year: "Tahun invalid",
      valid: invalidYearRecords.filter((record) => !isAggregationAnomaly(record)).length,
      anomaly: invalidYearRecords.filter(isAggregationAnomaly).length,
      total: invalidYearRecords.length
    });
  }

  const yearlyAverage = groupRecordsByYear(scoreRecords).map((year) => {
    const records = scoreRecords.filter((record) => record.year === year);
    const values = toScoreValues(records);
    return { year, average: average(values), count: values.length };
  });

  const scoreDistribution = SCORE_BUCKETS.map((bucket) => ({
    name: bucket.label,
    value: scoreValues.filter((score) => score >= bucket.min && score < bucket.max).length,
    color: bucket.color
  }));

  const maturityComposition = ["Sangat Awal", "Dasar", "Berkembang", "Matang"].map((status) => ({
    name: status,
    value: scoreRecords.filter((record) => record.maturityStatus === status).length
  }));

  const pillarAverages: RankedItem[] = PILLARS.map((pillar) => {
    const metric = averageMetric(scoreRecords, pillar.name, "pillar");
    return { name: pillar.name, value: metric.average, count: metric.count, color: pillar.color };
  });

  const fieldAverages: RankedItem[] = PILLARS.flatMap((pillar) =>
    pillar.fields.map((field) => {
      const metric = averageMetric(scoreRecords, field, "field");
      return { name: field, value: metric.average, count: metric.count, pillar: pillar.name, color: pillar.color };
    })
  ).sort((a, b) => (a.value ?? Infinity) - (b.value ?? Infinity));

  const classificationNames = Array.from(new Set(sourceRecords.map((record) => record.kbli.classification)));
  const classificationDistribution = classificationNames.map((name) => ({
    name,
    value: sourceRecords.filter((record) => record.kbli.classification === name).length
  }));

  const topCompanies = [...scoreRecords]
    .filter((record) => record.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10);

  const bottomCompanies = [...scoreRecords]
    .filter((record) => record.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 10);

  const anomalyByType: ChartDatum[] = ANOMALY_TYPES.map((type) => ({
    name: type,
    value: sourceRecords.filter((record) => record.anomalyFlags.includes(type)).length
  }));

  const establishmentSet = new Set(sourceRecords.map((record) => record.establishmentKey));
  const countAboveThree = scoreValues.filter((score) => score >= 3).length;
  const dataQuality = buildDataQuality(sourceRecords);
  const actionQueues = buildActionQueues(sourceRecords, scoreRecords, dataQuality);
  const provinceRows = buildProvinceRows(sourceRecords, scoreRecords);
  const interventionPoints = buildInterventionPoints(scoreRecords);

  const scoreRecordIds = new Set(scoreRecords.map((record) => record.id));
  const kbliMap = new Map<string, { records: ParsedAssessment[]; scoreRecords: ParsedAssessment[]; companies: Set<string>; inIMHLP: boolean }>();
  sourceRecords.forEach((record) => {
    record.kbli.codes.forEach((code) => {
      const existing =
        kbliMap.get(code) ?? { records: [], scoreRecords: [], companies: new Set<string>(), inIMHLP: false };
      existing.records.push(record);
      existing.companies.add(record.establishmentKey);
      existing.inIMHLP = existing.inIMHLP || record.kbli.imhlpCodes.includes(code);
      if (scoreRecordIds.has(record.id) && record.score !== null) existing.scoreRecords.push(record);
      kbliMap.set(code, existing);
    });
  });

  const kbliRows: KbliAnalysisRow[] = Array.from(kbliMap.entries())
    .map(([code, data]) => ({
      code,
      totalRecords: data.records.length,
      totalCompanies: data.companies.size,
      averageScore: average(toScoreValues(data.scoreRecords)),
      inIMHLP: data.inIMHLP
    }))
    .sort((a, b) => b.totalRecords - a.totalRecords);

  const resultWithoutInsights: Omit<AggregateResult, "insights"> = {
    sourceRecords,
    scoreRecords,
    kpi: {
      totalRecords: sourceRecords.length,
      uniqueEstablishments: establishmentSet.size,
      validAssessments: sourceRecords.filter((record) => !isAggregationAnomaly(record)).length,
      anomalyData: sourceRecords.filter(isAggregationAnomaly).length,
      averageScore: average(scoreValues),
      medianScore: median(scoreValues),
      maxScore: scoreValues.length ? Math.max(...scoreValues) : null,
      minScore: scoreValues.length ? Math.min(...scoreValues) : null,
      countAboveThree,
      percentAboveThree: scoreValues.length ? (countAboveThree / scoreValues.length) * 100 : 0,
      earliestYear: years.length ? Math.min(...years) : null,
      latestYear: years.length ? Math.max(...years) : null
    },
    dataQuality,
    actionQueues,
    yearCounts,
    yearlyAverage,
    scoreDistribution,
    maturityComposition,
    pillarAverages,
    fieldAverages,
    classificationDistribution,
    topCompanies,
    bottomCompanies,
    anomalyByType,
    pillarYearMatrix: buildMatrix(scoreRecords, PILLARS.map((pillar) => pillar.name), "pillar"),
    fieldYearMatrix: buildMatrix(
      scoreRecords,
      PILLARS.flatMap((pillar) => pillar.fields),
      "field"
    ),
    technologyWeakestCompanies: scoreRecords
      .filter((record) => record.weakestPillar === "Teknologi")
      .sort((a, b) => (a.pillarScores.Teknologi ?? Infinity) - (b.pillarScores.Teknologi ?? Infinity))
      .slice(0, 20),
    verificationCandidates: scoreRecords
      .filter((record) => (record.score ?? 0) >= 3)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 50),
    kbliRows,
    provinceRows,
    interventionPoints
  };

  return {
    ...resultWithoutInsights,
    insights: buildInsights(resultWithoutInsights)
  };
}

export function getPillarColor(name: string) {
  return PILLARS.find((pillar) => pillar.name === name)?.color ?? "#64748b";
}

export function getFieldPillar(field: string) {
  return FIELD_TO_PILLAR[field] ?? "-";
}
