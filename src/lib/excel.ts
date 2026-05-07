import * as XLSX from "xlsx";
import { PILLARS } from "@/constants/indi";
import {
  applyDuplicateFlags,
  classifyKBLI,
  detectAnomalies,
  extractKBLICodes,
  extractProvince,
  getMaturityStatus,
  getStrongestPillar,
  getWeakestPillar,
  isAggregationAnomaly,
  normalizeInternalKeyPart,
  parseAssessmentYear,
  parseIndiScore,
  parseIntegerFlexible,
  toDisplayString
} from "@/lib/indi";
import type { ParsedAssessment, ParsedWorkbook } from "@/types/indi";

type SheetRow = Record<string, unknown>;

const REQUIRED_SHEETS = ["Data", "KBLI IMHLP"];

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._/\-()]/g, "")
    .replace(/\s+/g, "");
}

function rowReader(row: SheetRow) {
  const normalized = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalized.set(normalizeHeader(key), value);
  });

  return (...candidates: string[]) => {
    for (const candidate of candidates) {
      const value = normalized.get(normalizeHeader(candidate));
      if (value !== undefined) return value;
    }
    return "";
  };
}

function worksheetToRows(workbook: XLSX.WorkBook, sheetName: string): SheetRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    defval: "",
    raw: false
  });
}

function parseKbliReference(rows: SheetRow[]) {
  const codes = new Set<string>();

  rows.forEach((row) => {
    const get = rowReader(row);
    const raw = get("KBLI");
    const found = extractKBLICodes(raw);

    if (found.length > 0) {
      found.forEach((code) => codes.add(code));
      return;
    }

    const numeric = parseIntegerFlexible(raw);
    if (numeric !== null) codes.add(String(numeric).padStart(5, "0"));
  });

  return codes;
}

function averageNullable(values: Array<number | null>) {
  const cleaned = values.filter((value): value is number => value !== null);
  if (cleaned.length === 0) return null;
  return cleaned.reduce((sum, value) => sum + value, 0) / cleaned.length;
}

function parseDataRow(row: SheetRow, rowIndex: number, kbliSet: Set<string>): ParsedAssessment | null {
  const get = rowReader(row);
  const companyName = toDisplayString(get("Nama Perusahaan"));
  const location = toDisplayString(get("Lokasi"));
  const score = parseIndiScore(get("Nilai INDI"));
  const submittedAt = toDisplayString(get("Tgl. Kirim", "Tanggal Kirim"));

  if (!companyName && score === null && !submittedAt && !location) return null;

  const parsedDate = parseAssessmentYear(submittedAt);
  const businessField = toDisplayString(get("Bidang Usaha"));
  const kbli = classifyKBLI(extractKBLICodes(businessField), kbliSet);

  const fieldScores: Record<string, number | null> = {};
  PILLARS.forEach((pillar) => {
    pillar.fields.forEach((field) => {
      fieldScores[field] = parseIndiScore(get(field));
    });
  });

  const pillarScores: Record<string, number | null> = {};
  PILLARS.forEach((pillar) => {
    const explicitPillarScore = parseIndiScore(get(pillar.name));
    // Nilai pilar memakai kolom pilar jika tersedia; rata-rata bidang hanya fallback visual.
    pillarScores[pillar.name] =
      explicitPillarScore ?? averageNullable(pillar.fields.map((field) => fieldScores[field]));
  });

  const establishmentKey = `${normalizeInternalKeyPart(companyName)}::${normalizeInternalKeyPart(location)}`;
  const assessmentKey =
    parsedDate.year === null ? null : `${establishmentKey}::${String(parsedDate.year)}`;
  const anomaly = detectAnomalies(score, parsedDate.invalid);

  return {
    id: `${rowIndex + 2}-${establishmentKey}-${parsedDate.year ?? "tahun-invalid"}`,
    rowNumber: rowIndex + 2,
    no: toDisplayString(get("No")),
    companyName,
    sector: toDisplayString(get("Sektor")),
    score,
    submittedAt,
    year: parsedDate.year,
    location,
    province: extractProvince(location),
    workforce: parseIntegerFlexible(get("Jumlah Tenaga Kerja")),
    businessField,
    picName: toDisplayString(get("Nama PIC")),
    position: toDisplayString(get("Jabatan")),
    email: toDisplayString(get("e-Mail", "Email", "E-mail")),
    challenges: toDisplayString(get("Tantangan")),
    hopes: toDisplayString(get("Harapan")),
    pillarScores,
    fieldScores,
    weakestPillar: getWeakestPillar(pillarScores),
    strongestPillar: getStrongestPillar(pillarScores),
    maturityStatus: getMaturityStatus(score),
    establishmentKey,
    assessmentKey,
    kbli,
    anomalyData: anomaly.anomalyData,
    tanggalInvalid: anomaly.tanggalInvalid,
    skorNol: anomaly.skorNol,
    duplikasiPotensial: anomaly.duplikasiPotensial,
    anomalyFlags: anomaly.flags,
    raw: row
  };
}

function parseWorkbook(workbook: XLSX.WorkBook, fileName: string): ParsedWorkbook {
  const sheetNames = workbook.SheetNames;

  const missingSheets = REQUIRED_SHEETS.filter((sheet) => !sheetNames.includes(sheet));
  if (missingSheets.length > 0) {
    throw new Error(`Sheet wajib tidak ditemukan: ${missingSheets.join(", ")}`);
  }

  const dataRows = worksheetToRows(workbook, "Data");
  const kbliRows = worksheetToRows(workbook, "KBLI IMHLP");
  const kbliSet = parseKbliReference(kbliRows);

  const parsedRows = dataRows
    .map((row, index) => parseDataRow(row, index, kbliSet))
    .filter((row): row is ParsedAssessment => row !== null);

  const assessments = applyDuplicateFlags(parsedRows);
  const years = Array.from(new Set(assessments.map((row) => row.year).filter((year): year is number => year !== null))).sort(
    (a, b) => a - b
  );
  const warnings: string[] = [];

  if (dataRows.length < 1) warnings.push("Sheet Data kosong atau header tidak terbaca.");
  if (kbliSet.size < 1) warnings.push("Sheet KBLI IMHLP tidak menghasilkan referensi KBLI.");
  if (dataRows.length > 0 && dataRows.length < 2000) {
    warnings.push("Jumlah baris Data lebih kecil dari sanity check file contoh; pastikan file sumber benar.");
  }
  if (kbliSet.size > 0 && (kbliSet.size < 50 || kbliSet.size > 90)) {
    warnings.push("Jumlah referensi KBLI IMHLP berbeda cukup jauh dari file contoh; cek kembali sheet referensi.");
  }

  return {
    assessments,
    kbliSet,
    summary: {
      fileName,
      sheetNames,
      totalDataRows: assessments.length,
      dataColumnCount: dataRows[0] ? Object.keys(dataRows[0]).length : 0,
      validRows: assessments.filter((row) => !isAggregationAnomaly(row)).length,
      anomalyRows: assessments.filter(isAggregationAnomaly).length,
      kbliReferenceCount: kbliSet.size,
      years,
      warnings
    }
  };
}

export function parseExcelBuffer(buffer: ArrayBuffer, fileName: string): ParsedWorkbook {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  return parseWorkbook(workbook, fileName);
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  return parseExcelBuffer(buffer, file.name);
}
