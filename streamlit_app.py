from pathlib import Path
import base64
import json
import re

import streamlit as st
import streamlit.components.v1 as components


ROOT_DIR = Path(__file__).resolve().parent
BUILD_DIR = ROOT_DIR / "dist"
INDEX_FILE = BUILD_DIR / "index.html"
DATA_FILE = BUILD_DIR / "data" / "indi_makanan_minuman_20260507_110017.xlsx"


st.set_page_config(
    page_title="Dashboard Monitoring SA INDI 4.0 IMHLP",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .block-container {
        padding: 0;
        max-width: 100%;
      }
      header[data-testid="stHeader"],
      div[data-testid="stToolbar"],
      div[data-testid="stDecoration"],
      footer {
        display: none;
      }
      iframe {
        border: 0;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

def _read_asset(relative_path: str) -> str:
    asset_path = (BUILD_DIR / relative_path.replace("./", "", 1)).resolve()
    if not asset_path.is_file() or BUILD_DIR not in asset_path.parents:
        raise FileNotFoundError(relative_path)
    return asset_path.read_text(encoding="utf-8")


def _inline_dashboard_html() -> str:
    html = INDEX_FILE.read_text(encoding="utf-8")

    if not DATA_FILE.exists():
        raise FileNotFoundError(DATA_FILE.name)

    excel_b64 = base64.b64encode(DATA_FILE.read_bytes()).decode("ascii")
    excel_data_url = (
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"
        + excel_b64
    )
    data_script = (
        "<script>"
        f"window.__INDI_EXCEL_DATA_URL__ = {json.dumps(excel_data_url)};"
        "</script>"
    )

    def replace_css(match: re.Match[str]) -> str:
        css = _read_asset(match.group("href")).replace("</style", "<\\/style")
        return f"<style>{css}</style>"

    def replace_js(match: re.Match[str]) -> str:
        js = _read_asset(match.group("src")).replace("</script", "<\\/script")
        return f"{data_script}<script type=\"module\">{js}</script>"

    html = re.sub(
        r'<link rel="stylesheet" crossorigin href="(?P<href>[^"]+)">',
        replace_css,
        html,
    )
    html = re.sub(
        r'<script type="module" crossorigin src="(?P<src>[^"]+)"></script>',
        replace_js,
        html,
    )
    return html


if not INDEX_FILE.exists():
    st.error("Build React belum ditemukan. Jalankan `pnpm run build`, lalu commit folder `dist/` ke Git.")
    st.stop()

try:
    components.html(_inline_dashboard_html(), height=2600, scrolling=True)
except FileNotFoundError as exc:
    st.error(f"Asset build tidak ditemukan: {exc}. Jalankan `pnpm run build`, lalu commit folder `dist/` ke Git.")
