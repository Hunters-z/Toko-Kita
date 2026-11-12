# Spesifikasi UI Google Apps Script — Toko Kita (FinPoint dark premium)

> Versi desain untuk halaman HtmlService Apps Script. Selera sama dengan spec shadcn (`shadcn-ui-spec.md`): hitam #111, kartu radius 20px, accent oranye #F97316, badge hijau #16A34A, font Sora + Plus Jakarta Sans. Bedanya: **tanpa React, tanpa Tailwind, tanpa build step** — semua vanilla HTML/CSS/JS dalam satu file.

## 1. Kendala Apps Script & keputusannya

| Kendala | Keputusan desain |
|---|---|
| Single-file HTML (HtmlService) | Satu file `Index.html`: CSS di `<style>`, JS di `<script>`, tanpa import lokal |
| Tanpa bundler/npm | Tidak ada komponen library; komponen UI ditulis tangan (card, badge, btn, dialog) |
| Font eksternal | Google Fonts via `<link>` CDN (Sora + Plus Jakarta Sans) — diizinkan |
| Data | `google.script.run.withSuccessHandler(...).fn(args)` — semua asinkron |
| Timeout `google.script.run` ~6 menit, tanpa streaming | UI wajib punya **loading state eksplisit**: skeleton card, tombol disabled + label "Memuat…" / "Menyimpan…" |
| Tidak ada router | Navigasi = tab JS murni (show/hide section), bottom-nav di mobile, sidebar pill di desktop |
| localStorage tidak konsisten di sandbox iframe | Preferensi (nama toko, tema) disimpan lewat Sheets via `google.script.run`, bukan localStorage |
| Tidak ada HMR | Terima beres: keep file kecil (<1 file, mudah copy-paste ke editor Apps Script) |

## 2. Token warna (CSS variables, dark saja)

```css
:root {
  --bg: #111111;            /* latar hitam FinPoint */
  --card: #1A1D24;          /* kartu, beda tipis dari bg */
  --card-2: #20242D;        /* hover / nested surface */
  --fg: #F5F5F4;            /* teks utama */
  --muted: #9BA1AC;         /* teks sekunder */
  --border: #2A2F39;        /* garis kartu */
  --primary: #F97316;       /* oranye — tombol utama, angka aktif */
  --primary-soft: rgba(249,115,22,.14);  /* bg chip oranye tipis */
  --success: #16A34A;       /* badge hijau: lunas, tersedia, masuk */
  --success-soft: rgba(22,163,74,.15);
  --warning: #D97706;       /* stok menipis, jatuh tempo */
  --danger: #DC2626;        /* habis, gagal, hapus */
  --info: #3B82F6;          /* draft, info */
  --radius-card: 20px;
  --radius-ctl: 12px;       /* button, input, select */
  --radius-pill: 999px;     /* nav aktif, badge, chip */
}
```

Aturan: **tidak ada hex di JS/HTML selain via class** — semua warna lewat class komponen, supaya re-theme cukup ganti blok `:root`.

## 3. Typografi

- Google Fonts CDN: Sora (600, 700) untuk angka hero & judul; Plus Jakarta Sans (400, 500, 600) body.
- Angka uang: `font-family: Sora; font-variant-numeric: tabular-nums;` rata kanan di tabel.
- Scale: hero stat 32px/700; judul halaman 22px/600; judul kartu 15px/600; body 14px; label form 13px/500; caption 12px `--muted`.
- Uang via helper `rp()` (Intl.NumberFormat 'id-ID', prefix "Rp ").

## 4. Komponen inti (ditulis tangan, class global)

| Class | Keterangan |
|---|---|
| `.card` | bg `--card`, border 1px `--border`, radius 20px, padding 20px |
| `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-danger` | radius 12px; primary oranye solid teks putih; ghost transparan border; disabled opacity .5 |
| `.badge` + `.b-green/.b-orange/.b-red/.b-blue` | pill, teks 12px/600, bg soft masing-masing token |
| `.input` / `.select` | bg `--card-2`, border `--border`, radius 12px, focus outline 2px `--primary` |
| `.nav-item.is-active` | pill putih bg, teks hitam (pola nav FinPoint yang sama) |
| `.skeleton` | shimmer abu, dipakai saat `google.script.run` berjalan |
| `.toast` | fixed bottom, radius 20px, badge status + pesan |
| `.dialog` | overlay rgba(0,0,0,.6) + `.card` terpusat; buka/tutup via class `.open` |

Tidak ada shadow berlebihan; kedalaman dari perbedaan bg (bg → card → card-2), bukan drop-shadow.

## 5. Layout

```
Desktop ≥ 900px                    Mobile < 900px
┌──────────┬──────────────────┐    ┌──────────────────────┐
│ sidebar  │ header (judul +  │    │ header ringkas       │
│ (pill    │  tombol utama)   │    │ konten 1 kolom       │
│  aktif   │ grid kartu stat  │    │ kartu stat scroll-x  │
│  putih)  │ tabel / panel    │    │ tabel → card list    │
└──────────┴──────────────────┘    │ bottom-nav mengambang│
                                   └──────────────────────┘
```

- Sidebar 220px, item pill radius, aktif = bg putih teks #111.
- Bottom-nav mobile: mengambang, radius 20px, bg `--card`, item aktif ikon+label oranye.
- Konten max-width 1080px center.

## 6. Halaman utama (dashboard) — isi mockup

1. **Header**: "Halo, {nama toko}" + tanggal; tombol "+ Transaksi" oranye.
2. **Baris stat** (4 kartu): Pendapatan hari ini, Transaksi hari ini, Piutang, Stok menipis — angka Sora besar + badge perubahan (hijau naik / merah turun).
3. **Transaksi terakhir**: tabel 5 baris — No., Waktu, Pelanggan, Total (kanan), Status badge (Lunas hijau / DP oranye / Belum merah).
4. **Stok menipis**: kartu list produk + badge "Sisa N".
5. **Laba kas bulan ini**: satu kartu angka besar + bar mini 7 hari (div bar oranye, tinggi proporsional, tanpa chart library).
6. **Aksi cepat**: grid 4 tombol — Kasir, Invoice Baru, Tambah Produk, Catat Pengeluaran.

Semua kartu punya state kosong ("Belum ada transaksi hari ini · buka Kasir") dan state loading (skeleton) — wajib karena `google.script.run` asinkron.

## 7. Pola data (google.script.run)

```js
function loadDashboard() {
  ui.loading(true); // skeleton on, tombol disabled
  google.script.run
    .withSuccessHandler(renderDashboard)
    .withFailureHandler(showToastError) // .toast merah, tidak pakai alert()
    .getDashboard();
}
```

- Satu fungsi backend per layar (`getDashboard`, `getProduk`, `simpanInvoice`, …), kembalikan objek JSON penuh — hindari banyak round-trip kecil.
- Tombol submit: disable + teks "Menyimpan…" sampai handler balas; sukses = `.toast` badge hijau; gagal = toast merah + tombol aktif lagi.
- Tidak pakai `alert()`/`confirm()` native — konfirmasi hapus pakai `.dialog` destructive.

## 8. Aksesibilitas & kualitas

- Kontras teks di bg #111 minimal 4.5:1 (teks utama #F5F5F4, sekunder #9BA1AC — jangan lebih redup).
- Focus-visible outline 2px oranye di semua elemen interaktif.
- Bottom-nav & sidebar: `<button>`/`<a>` asli, `aria-current="page"` untuk aktif.
- Tabel punya `<th scope>`; dialog pakai `role="dialog"` + `aria-modal`.
- `prefers-reduced-motion`: matikan animasi shimmer/transisi.
- Responsif: uji 360px lebar minimum; tabel panjang digulir horizontal, bukan hancur.

## 9. Penerapan ke Apps Script

1. Copy isi `gas-mockup.html` ke file `Index.html` di project Apps Script.
2. `doGet` → `HtmlService.createHtmlOutputFromFile('Index').setTitle('Toko Kita').addMetaTag('viewport','width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`.
3. Tambah fungsi data di `Code.gs` sesuai §7; mockup sudah punya fallback data dummy saat `google.script.run` tidak ada (dibuka lokal di browser).
