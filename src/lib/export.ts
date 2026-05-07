import * as XLSX from "xlsx";
import type { KbliAnalysisRow, ParsedAssessment } from "@/types/indi";

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName(fileName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function assessmentToExportRow(record: ParsedAssessment) {
  return {
    "Nama Perusahaan": record.companyName,
    "Tahun SA": record.year ?? "",
    "Tgl. Kirim": record.submittedAt,
    Lokasi: record.location,
    Provinsi: record.province,
    "Nilai INDI": record.score ?? "",
    "Status Kematangan": record.maturityStatus,
    "Klasifikasi KBLI": record.kbli.classification,
    "Klasifikasi KBLI Awal": record.originalKbliClassification ?? record.kbli.classification,
    "Klasifikasi KBLI Diedit": record.kbliClassificationEdited ? "Ya" : "Tidak",
    "Catatan Edit Klasifikasi": record.kbliClassificationEditNote ?? "",
    "Waktu Edit Klasifikasi": record.kbliClassificationEditedAt ?? "",
    "KBLI Ditemukan": record.kbli.codes.join(", "),
    "Jumlah KBLI": record.kbli.codes.length,
    "Jumlah KBLI IMHLP": record.kbli.imhlpCodes.length,
    "Jumlah KBLI non-IMHLP": record.kbli.outsideCodes.length,
    "Pilar Terlemah": record.weakestPillar,
    "Pilar Terkuat": record.strongestPillar,
    "Jumlah Tenaga Kerja": record.workforce ?? "",
    "Status Data": record.anomalyFlags.length ? record.anomalyFlags.join(", ") : "Valid",
    "Nama PIC": record.picName,
    Jabatan: record.position,
    "e-Mail": record.email,
    Tantangan: record.challenges,
    Harapan: record.hopes
  };
}

export function exportAssessmentsToCsv(records: ParsedAssessment[], fileName: string) {
  const rows = records.map(assessmentToExportRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), fileName);
}

export function exportAssessmentsToExcel(records: ParsedAssessment[], fileName: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(records.map(assessmentToExportRow));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Terfilter");
  const output = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

export function exportValidationWorkbook(records: ParsedAssessment[], fileName: string) {
  const workbook = XLSX.utils.book_new();
  const addSheet = (name: string, subset: ParsedAssessment[]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subset.map(assessmentToExportRow)), name);
  };

  addSheet("Semua Isu", records.filter((record) => record.anomalyFlags.length > 0));
  addSheet("Anomali Data", records.filter((record) => record.anomalyData));
  addSheet("Tanggal Invalid", records.filter((record) => record.tanggalInvalid));
  addSheet("Skor Nol", records.filter((record) => record.skorNol));
  addSheet("Duplikasi Potensial", records.filter((record) => record.duplikasiPotensial));
  addSheet("Tanpa KBLI", records.filter((record) => record.kbli.codes.length === 0));
  addSheet("Multi KBLI Agro", records.filter((record) => record.kbli.classification === "Multi KBLI Agro"));

  const output = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}

export function exportKbliRowsToExcel(rows: KbliAnalysisRow[], fileName: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      KBLI: row.code,
      "Jumlah Record": row.totalRecords,
      "Jumlah Perusahaan/Lokasi": row.totalCompanies,
      "Rata-rata Nilai INDI": row.averageScore ?? "",
      "Masuk IMHLP": row.inIMHLP ? "Ya" : "Tidak"
    }))
  );
  XLSX.utils.book_append_sheet(workbook, worksheet, "Analisis KBLI");
  const output = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
}
