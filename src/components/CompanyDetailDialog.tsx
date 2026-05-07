import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PILLARS } from "@/constants/indi";
import { getClassificationBadgeVariant, getMaturityBadgeVariant, getPillarColor } from "@/lib/indi";
import { KBLI_CLASSIFICATION_OPTIONS } from "@/lib/kbliEdits";
import { formatInteger, formatNumber } from "@/lib/utils";
import type { KbliClassification, KbliClassificationEdit, ParsedAssessment } from "@/types/indi";

interface CompanyDetailDialogProps {
  record: ParsedAssessment | null;
  allRecords: ParsedAssessment[];
  onClose: () => void;
  onKbliClassificationEditChange: (recordId: string, edit: KbliClassificationEdit | null) => void;
}

export function CompanyDetailDialog({
  record,
  allRecords,
  onClose,
  onKbliClassificationEditChange
}: CompanyDetailDialogProps) {
  if (!record) return null;

  const history = allRecords
    .filter((item) => item.establishmentKey === record.establishmentKey)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const pillarData = Object.entries(record.pillarScores).map(([name, value]) => ({
    name,
    value: value ?? 0,
    color: getPillarColor(name)
  }));
  const fieldRows = PILLARS.flatMap((pillar) =>
    pillar.fields.map((field) => ({
      field,
      pillar: pillar.name,
      value: record.fieldScores[field],
      color: pillar.color
    }))
  );
  const originalClassification = record.originalKbliClassification ?? record.kbli.classification;
  const editNote = record.kbliClassificationEditNote ?? "";
  const recordId = record.id;

  function updateKbliClassification(classification: KbliClassification, note = editNote) {
    onKbliClassificationEditChange(recordId, {
      assessmentId: recordId,
      classification,
      note,
      updatedAt: new Date().toISOString()
    });
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{record.companyName || "Detail perusahaan"}</DialogTitle>
          <DialogDescription>
            {record.location || "-"} {record.year ? `- SA ${record.year}` : "- tahun tidak valid"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Nilai INDI" value={formatNumber(record.score)} />
              <Info label="Status kematangan" value={<Badge variant={getMaturityBadgeVariant(record.maturityStatus)}>{record.maturityStatus}</Badge>} />
              <Info label="Tgl. Kirim" value={record.submittedAt || "-"} />
              <Info label="Jumlah tenaga kerja" value={record.workforce === null ? "-" : formatInteger(record.workforce)} />
              <Info label="PIC" value={record.picName || "-"} />
              <Info label="Jabatan" value={record.position || "-"} />
              <Info label="Email" value={record.email || "-"} />
              <Info label="Status data" value={record.anomalyFlags.length ? record.anomalyFlags.join(", ") : "Valid"} />
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Grafik 5 pilar</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillarData} layout="vertical" margin={{ left: 12, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 4]} />
                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    <Bar dataKey="value">
                      {pillarData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Tabel 17 bidang</h4>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2">Bidang</th>
                      <th className="px-2 py-2">Pilar</th>
                      <th className="px-2 py-2 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldRows.map((row) => (
                      <tr key={row.field} className="border-t">
                        <td className="px-2 py-2 font-medium">{row.field}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.pillar}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">KBLI dan klasifikasi</h4>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getClassificationBadgeVariant(record.kbli.classification)}>
                    {record.kbli.classification}
                  </Badge>
                  {record.kbliClassificationEdited ? <Badge variant="blue">Klasifikasi diedit</Badge> : null}
                </div>
                <Info label="Klasifikasi awal" value={originalClassification} />
                <Info label="KBLI ditemukan" value={record.kbli.codes.length ? record.kbli.codes.join(", ") : "-"} />
                <Info label="Jumlah KBLI" value={formatInteger(record.kbli.codes.length)} />
                <Info label="Masuk IMHLP" value={formatInteger(record.kbli.imhlpCodes.length)} />
                <Info label="Di luar IMHLP" value={formatInteger(record.kbli.outsideCodes.length)} />
                <div className="space-y-2 rounded-md border bg-slate-50 p-3">
                  <Label>Edit klasifikasi KBLI</Label>
                  <Select
                    value={record.kbli.classification}
                    onValueChange={(value) => updateKbliClassification(value as KbliClassification)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KBLI_CLASSIFICATION_OPTIONS.map((classification) => (
                        <SelectItem key={classification} value={classification}>
                          {classification}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Catatan edit klasifikasi (opsional)"
                    value={editNote}
                    onChange={(event) =>
                      updateKbliClassification(record.kbli.classification, event.target.value)
                    }
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {record.kbliClassificationEditedAt
                        ? `Update ${new Date(record.kbliClassificationEditedAt).toLocaleString("id-ID")}`
                        : "Belum ada edit manual"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onKbliClassificationEditChange(record.id, null)}
                      disabled={!record.kbliClassificationEdited}
                    >
                      Reset ke klasifikasi awal
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Bidang usaha original</h4>
              <p className="max-h-40 overflow-auto text-sm leading-6 text-slate-700">{record.businessField || "-"}</p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Tantangan</h4>
              <p className="max-h-36 overflow-auto text-sm leading-6 text-slate-700">{record.challenges || "-"}</p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Harapan</h4>
              <p className="max-h-36 overflow-auto text-sm leading-6 text-slate-700">{record.hopes || "-"}</p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Riwayat SA perusahaan/lokasi</h4>
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>{item.year ?? "Tahun invalid"}</span>
                    <span className="font-semibold">{formatNumber(item.score)}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
