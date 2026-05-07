import type { KbliClassification, KbliClassificationEdit, ParsedAssessment } from "@/types/indi";

export const KBLI_CLASSIFICATION_EDIT_STORAGE_KEY = "indi40.kbliClassificationEdits.v1";

export const KBLI_CLASSIFICATION_OPTIONS: KbliClassification[] = [
  "Sektor Makanan",
  "Multi KBLI Agro",
  "Di Luar KBLI IMHLP",
  "Tidak Ada KBLI"
];

function normalizeSavedClassification(value: string): KbliClassification {
  if (value === "Di Luar KBLI IMHLP / Perlu Verifikasi") return "Di Luar KBLI IMHLP";
  if (value === "Tidak Ada KBLI / Perlu Verifikasi") return "Tidak Ada KBLI";
  if (KBLI_CLASSIFICATION_OPTIONS.includes(value as KbliClassification)) return value as KbliClassification;
  return "Tidak Ada KBLI";
}

export function loadKbliClassificationEdits(): Record<string, KbliClassificationEdit> {
  try {
    const raw = localStorage.getItem(KBLI_CLASSIFICATION_EDIT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, KbliClassificationEdit>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).map(([key, edit]) => [
        key,
        {
          ...edit,
          classification: normalizeSavedClassification(String(edit.classification))
        }
      ])
    );
  } catch {
    return {};
  }
}

export function saveKbliClassificationEdits(state: Record<string, KbliClassificationEdit>) {
  localStorage.setItem(KBLI_CLASSIFICATION_EDIT_STORAGE_KEY, JSON.stringify(state));
}

export function applyKbliClassificationEdits(
  records: ParsedAssessment[],
  edits: Record<string, KbliClassificationEdit>
): ParsedAssessment[] {
  return records.map((record) => {
    const edit = edits[record.id];
    const originalKbliClassification = record.originalKbliClassification ?? record.kbli.classification;

    if (!edit) {
      return {
        ...record,
        originalKbliClassification,
        kbliClassificationEdited: false,
        kbliClassificationEditNote: "",
        kbliClassificationEditedAt: ""
      };
    }

    return {
      ...record,
      originalKbliClassification,
      kbli: {
        ...record.kbli,
        classification: edit.classification
      },
      kbliClassificationEdited: true,
      kbliClassificationEditNote: edit.note,
      kbliClassificationEditedAt: edit.updatedAt
    };
  });
}
