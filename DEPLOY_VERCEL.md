# Deploy Dashboard INDI 4.0 ke Vercel

Dashboard ini sekarang diposisikan sebagai aplikasi React + Vite yang dibuild langsung oleh Vercel. Streamlit tidak lagi dipakai sebagai wrapper.

## Struktur Deploy

- Framework: React + Vite + TypeScript
- Package manager: pnpm
- Build command: `pnpm run build`
- Output directory: `dist`
- File data utama: `public/data/indi_makanan_minuman_20260507_110017.xlsx`

Konfigurasi deploy ada di `vercel.json`.

## Cara Deploy dari GitHub

1. Push repository ke GitHub.
2. Buka Vercel, pilih **Add New Project**.
3. Import repository `dashboard-indi-40-imhlp`.
4. Pastikan preset framework terdeteksi sebagai **Vite**.
5. Deploy.

Vercel akan menjalankan `pnpm install --frozen-lockfile`, lalu `pnpm run build`, dan menyajikan isi folder `dist`.

## Update Data Excel

Jika file data berubah:

1. Ganti file `.xlsx` di `public/data/`.
2. Jalankan `pnpm run build` untuk validasi lokal.
3. Commit dan push perubahan ke GitHub.

Jangan commit folder `dist/`; Vercel akan membuatnya saat deploy.

## Catatan Operasional

- Parsing Excel tetap berjalan di browser dengan SheetJS.
- Edit klasifikasi KBLI disimpan di `localStorage` browser pengguna.
- Tidak ada backend atau database pada versi ini.
- Jika nanti perlu workflow review lintas pengguna, pindahkan penyimpanan edit KBLI ke database seperti Vercel Postgres atau Supabase.
