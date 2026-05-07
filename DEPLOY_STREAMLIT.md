# Deploy Dashboard INDI 4.0 ke Streamlit Community Cloud

Project ini tetap memakai React + Vite untuk dashboard utama. Streamlit menjadi wrapper yang menampilkan hasil build statis di folder `dist/` melalui iframe HTML.

## File penting

- `streamlit_app.py`: entry point untuk Streamlit Cloud. File ini meng-inline asset React dan Excel dari `dist/`.
- `requirements.txt`: dependency Python Streamlit.
- `.streamlit/config.toml`: tema Streamlit.
- `dist/`: hasil build React yang perlu ikut dipush ke Git.
- `public/data/indi_makanan_minuman_20260507_110017.xlsx`: sumber data Excel yang ikut dibundel saat build.

## Sebelum push ke Git

Jalankan build dengan double-click:

```text
BUILD Streamlit Dist.bat
```

Atau dari PowerShell:

```powershell
$nodeDir='C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$env:Path="$nodeDir;$env:Path"
$node=Join-Path $nodeDir 'node.exe'
$pnpm='C:\Users\Admin\Documents\Project Dashboard INDI 4.0\.codex-tools\pnpm\package\bin\pnpm.cjs'
& $node $pnpm run build
```

Pastikan folder `dist/` masuk commit. Folder ini sengaja tidak di-ignore karena Streamlit Cloud tidak menjalankan build Node secara otomatis.

## Push ke GitHub

```powershell
git init
git add .
git commit -m "Deploy dashboard INDI 4.0 via Streamlit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Setting di Streamlit Cloud

Saat membuat app baru:

- Repository: repo GitHub yang sudah dipush.
- Branch: `main`.
- Main file path: `streamlit_app.py`.
- Python requirements: otomatis membaca `requirements.txt`.

Jika data Excel berubah, ganti file di `public/data/`, jalankan `pnpm run build`, commit ulang `public/data/` dan `dist/`, lalu push.
