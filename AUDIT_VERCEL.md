# Audit Migrasi Vercel Dashboard INDI 4.0

## Temuan Utama

1. Sebelum migrasi, repo masih berisi artefak Streamlit: `streamlit_app.py`, `.streamlit/`, `requirements.txt`, panduan deploy Streamlit, dan folder `dist/` yang ikut commit.
2. Vite sebelumnya memakai `base: "./"` agar cocok di iframe Streamlit. Untuk Vercel, konfigurasi ini tidak diperlukan.
3. Kode aplikasi masih punya fallback `window.__INDI_EXCEL_DATA_URL__` khusus wrapper Streamlit.
4. Build dashboard tetap berbasis data Excel asli di `public/data/`, sehingga tidak perlu upload file dan tidak memakai data dummy.
5. Agregasi anomali sudah memisahkan `Anomali Data`, `Skor Nol`, dan `Tanggal Invalid` dari rata-rata default.
6. Klasifikasi KBLI sudah memakai aturan baru: label tanpa "Perlu Verifikasi" dan multi KBLI dengan komposisi IMHLP lebih dari 50% masuk `Sektor Makanan`.

## Perubahan Arah Sistem

- Streamlit dihentikan sebagai target deploy.
- Vercel menjadi target utama dengan build Vite standar.
- Folder `dist/` dikeluarkan dari Git karena menjadi hasil build, bukan source.
- Header dashboard diperkuat dengan ringkasan data: record SA, rentang tahun, dan referensi KBLI.
- Dashboard mendapat blok `Ringkasan Eksekutif` dan `Agenda Tindak Lanjut` agar analis lebih cepat membaca isu prioritas.

## Risiko Tersisa

1. File Excel dipaketkan ke aplikasi statis. Jika ukuran data makin besar, waktu unduh awal akan naik.
2. Edit klasifikasi KBLI masih tersimpan per browser, belum tersinkron antar pengguna.
3. Belum ada autentikasi atau audit trail reviewer.
4. Belum ada test otomatis khusus parser Excel dan agregasi.

## Rekomendasi Lanjutan

1. Tambahkan database untuk review KBLI bersama dan audit trail perubahan.
2. Tambahkan halaman metodologi agar definisi agregasi, anomali, dan klasifikasi transparan.
3. Tambahkan unit test untuk `parseIndiScore`, `parseAssessmentYear`, `classifyKBLI`, dan `calculateAggregates`.
4. Pertimbangkan pemrosesan data prabuild jika ukuran Excel menjadi terlalu berat untuk browser.
