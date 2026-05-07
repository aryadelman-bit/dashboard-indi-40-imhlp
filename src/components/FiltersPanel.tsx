import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PILLARS } from "@/constants/indi";
import { DEFAULT_FILTERS } from "@/lib/indi";
import type { DashboardFilters, ParsedAssessment } from "@/types/indi";

interface FiltersPanelProps {
  records: ParsedAssessment[];
  filters: DashboardFilters;
  includeAnomalies: boolean;
  onFiltersChange: (filters: DashboardFilters) => void;
  onIncludeAnomaliesChange: (value: boolean) => void;
}

export function FiltersPanel({
  records,
  filters,
  includeAnomalies,
  onFiltersChange,
  onIncludeAnomaliesChange
}: FiltersPanelProps) {
  const years = Array.from(new Set(records.map((record) => record.year).filter((year): year is number => year !== null))).sort(
    (a, b) => a - b
  );
  const classifications = Array.from(new Set(records.map((record) => record.kbli.classification))).sort();
  const maturityStatuses = ["Sangat Awal", "Dasar", "Berkembang", "Matang", "Tidak Valid"];

  const update = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Filter Dashboard
          </CardTitle>
          <div className="flex items-center gap-3 rounded-md border bg-slate-50 px-3 py-2">
            <Switch checked={includeAnomalies} onCheckedChange={onIncludeAnomaliesChange} />
            <span className="text-sm font-medium">Sertakan anomali dalam agregasi</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Tahun SA</Label>
            <Select value={filters.year} onValueChange={(value) => update("year", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tahun</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Klasifikasi sektor</Label>
            <Select value={filters.classification} onValueChange={(value) => update("classification", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua klasifikasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua klasifikasi</SelectItem>
                {classifications.map((classification) => (
                  <SelectItem key={classification} value={classification}>
                    {classification}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status skor</Label>
            <Select value={filters.maturity} onValueChange={(value) => update("maturity", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {maturityStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pilar terlemah</Label>
            <Select value={filters.weakestPillar} onValueChange={(value) => update("weakestPillar", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua pilar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua pilar</SelectItem>
                {PILLARS.map((pillar) => (
                  <SelectItem key={pillar.name} value={pillar.name}>
                    {pillar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Rentang skor INDI</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Min"
                value={filters.scoreMin}
                onChange={(event) => update("scoreMin", event.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Max"
                value={filters.scoreMax}
                onChange={(event) => update("scoreMax", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>KBLI</Label>
            <Input
              placeholder="Cari kode KBLI"
              value={filters.kbli}
              onChange={(event) => update("kbli", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nama perusahaan</Label>
            <Input
              placeholder="Cari nama perusahaan"
              value={filters.company}
              onChange={(event) => update("company", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Lokasi/provinsi</Label>
            <Input
              placeholder="Cari lokasi atau provinsi"
              value={filters.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onFiltersChange(DEFAULT_FILTERS)}>
            <RotateCcw className="h-4 w-4" />
            Reset filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
