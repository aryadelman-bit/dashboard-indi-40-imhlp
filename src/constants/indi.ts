export const PILLARS = [
  {
    name: "Manajemen dan Organisasi",
    color: "#1d4ed8",
    fields: ["Strategi dan kepemimpinan", "Investasi untuk I4.0", "Kebijakan inovasi"]
  },
  {
    name: "Orang dan Budaya",
    color: "#059669",
    fields: ["Budaya", "Keterbukaan terhadap perubahan", "Pengembangan kompetensi"]
  },
  {
    name: "Produk dan Layanan",
    color: "#ca8a04",
    fields: ["Kustomisasi produk", "Layanan berbasis data", "Produk cerdas"]
  },
  {
    name: "Teknologi",
    color: "#7c3aed",
    fields: ["Keamanan cyber", "Konektivitas", "Mesin cerdas", "Digitalisasi"]
  },
  {
    name: "Operasi Pabrik",
    color: "#dc2626",
    fields: [
      "Penyimpanan dan sharing data",
      "Rantai pasok dan logistik cerdas",
      "Proses yang otonom",
      "Sistem perawatan cerdas"
    ]
  }
] as const;

export const FIELD_TO_PILLAR = PILLARS.reduce<Record<string, string>>((acc, pillar) => {
  pillar.fields.forEach((field) => {
    acc[field] = pillar.name;
  });
  return acc;
}, {});

export const SCORE_BUCKETS = [
  { key: "0-<1", label: "0 - <1", min: 0, max: 1, color: "#dc2626" },
  { key: "1-<2", label: "1 - <2", min: 1, max: 2, color: "#f97316" },
  { key: "2-<3", label: "2 - <3", min: 2, max: 3, color: "#eab308" },
  { key: ">=3", label: ">=3", min: 3, max: Infinity, color: "#16a34a" }
] as const;

export const CLASSIFICATION_COLORS: Record<string, string> = {
  "Sektor Makanan": "#0f766e",
  "Multi KBLI Agro": "#2563eb",
  "Di Luar KBLI IMHLP": "#ea580c",
  "Tidak Ada KBLI": "#64748b"
};

export const ANOMALY_TYPES = [
  "Anomali Data",
  "Tanggal Invalid",
  "Skor Nol",
  "Duplikasi Potensial"
] as const;

export const INDONESIAN_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Barat Daya"
];
