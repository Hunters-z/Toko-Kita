# Spesifikasi UI shadcn/ui — Toko Kita (Nusa ERP)

> Spec desain untuk migrasi UI ke shadcn/ui + Tailwind. Selera user: dark premium "FinPoint" — hitam #111, kartu radius 20px, accent oranye, badge hijau, nav pill aktif putih.

## 1. Keputusan tema

- **Mode: gelap (dark) sebagai default.** Terang tetap tersedia via CSS variables (`.dark` class di `<html>`), toggle di header. Data `theme` disimpan di localStorage key `toko_kita_theme`.
- **Kenapa dark:** selera user eksplisit (FinPoint dark premium), POS dipakai lama di malam hari, kontras tinggi untuk angka.
- Font: **Sora** (display/angka besar) + **Plus Jakarta Sans** (body). Sudah dipakai app; tidak ganti.
- Radius: **20px kartu, 12px kontrol (button/input), pill penuh untuk nav/badge** — bukan default shadcn 8px. Set `--radius: 12px` di theme + utility `rounded-[20px]` untuk Card, atau override `--radius-card`.

## 2. Token warna (HSL untuk shadcn, dark mode)

Tulis di `src/index.css` dalam format CSS variables shadcn (class `.dark`). JANGAN hardcode hex di JSX.

```css
.dark {
  --background: 0 0% 7%;        /* #111111 — hitam FinPoint */
  --foreground: 0 0% 96%;       /* putih hangat */
  --card: 220 14% 12%;          /* #1A1D24 — kartu, beda tipis dari bg */
  --card-foreground: 0 0% 96%;
  --popover: 220 14% 12%;
  --popover-foreground: 0 0% 96%;
  --primary: 24 94% 55%;        /* oranye #F97316 — accent utama */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 10% 18%;     /* abu gelap untuk kontrol sekunder */
  --secondary-foreground: 0 0% 96%;
  --muted: 220 10% 16%;
  --muted-foreground: 220 8% 62%;   /* teks sekunder abu terang */
  --accent: 220 10% 18%;        /* hover bg */
  --accent-foreground: 0 0% 96%;
  --destructive: 0 72% 51%;     /* #DC2626 */
  --border: 220 10% 20%;        /* garis kartu tipis */
  --input: 220 10% 20%;
  --ring: 24 94% 55%;           /* focus ring oranye */
  --radius: 12px;
}
```

Token tambahan (Tailwind `extend.colors`):
- `success: #16A34A` — badge hijau (lunas, in-stock, sukses), gradient sparkline naik.
- `warning: #D97706` — stok menipis, invoice jatuh tempo.
- `danger: #DC2626` — habis, batal, gagal.
- `info: #3B82F6` — draft, info.

Terang mode (opsional): bg `#F4F6FA`, card putih, primary oranye tetap `#F97316`, border `#E6E9F0`.

## 3. Typografi & spacing

- Display/angka hero: Sora 600–700, tabular-nums untuk angka uang (`font-feature-settings: 'tnum'`).
- Body: Plus Jakarta Sans 400/500.
- Scale: hero angka 32–40px; judul kartu 16px/600; body 14px; label form 13px/500; caption 12px `text-muted-foreground`.
- Uang selalu `rp()` helper, rata kanan di tabel.
- Spacing: card padding 20px (`p-5`), gap grid 16px, section gap 24px.

## 4. Setup shadcn/ui

- `npx shadcn@latest init` — style `new-york`, base color slate, cssVariables yes. Path alias `@/` → `src/`.
- Komponen diambil perlu saja: button, card, input, label, table, dialog, sheet, badge, dropdown-menu, select, tabs, toast (sonner), separator, skeleton, avatar, command, checkbox, popover, tooltip, textarea, switch, sonner.
- Tabel data: **TanStack Table v8** (`@tanstack/react-table`) di dalam `<Table>` shadcn — pattern sorting + pagination + filter kolom standar shadcn docs.

## 5. Struktur folder

```
src/
  components/
    ui/            ← output CLI shadcn, jangan edit manual
      button.jsx card.jsx input.jsx table.jsx dialog.jsx badge.jsx ...
    layout/
      app-shell.jsx     ← sidebar desktop + bottom nav mobile
      header-pill.jsx   ← pill header: logo, nav, search, bell, avatar
      page-header.jsx   ← judul halaman + aksi utama
    pos/
      product-grid.jsx  ← grid kartu produk, tap = masuk keranjang
      cart-panel.jsx    ← panel kanan: item, qty stepper, total, bayar
      payment-dialog.jsx← pilih metode, uang diterima, kembalian
      receipt-toast.jsx
    data/
      data-table.jsx    ← wrapper TanStack Table + shadcn Table (sort, filter, pagination)
      row-actions.jsx   ← dropdown menu per baris (Lihat/Edit/Hapus)
    forms/
      form-field.jsx    ← Label + Input/Select + pesan error konsisten
    charts/             ← wrapper recharts, warna dari token
```

Aturan: semua warna lewat token (2 file re-theme: `index.css` + `tailwind.config.js`). Nama lama (bg-navy dll) jadi alias token. Semua teks UI bahasa Indonesia.

## 6. Mapping komponen per layar

### POS (Toko)
| Elemen | Komponen | Catatan |
|---|---|---|
| Grid produk | Card mini + Button ghost | tap = add ke keranjang; badge hijau "Tersedia", amber "Menipis", merah "Habis" (disabled) |
| Search produk | Command (⌘K style) di popover | filter nama/SKU |
| Kategori | Tabs / ToggleGroup pill | pill aktif = oranye |
| Keranjang | Card sticky kanan (Sheet di mobile) | qty stepper Button ghost sm, Item hapus via X |
| Total & bayar | Button primary besar | oranye, teks "Bayar · rp(total)" |
| Dialog pembayaran | Dialog + RadioGroup metode (Tunai/QRIS/Transfer) | input uang diterima, kembalian auto |
| Sukses | Sonner toast + badge hijau | "Transaksi tersimpan · rp(x)" |

### Inventori
- `DataTable` (TanStack): kolom Nama, SKU, Stok, Harga, Status badge, Aksi dropdown. Sort klik header, filter input di atas, pagination default shadcn.
- Form tambah/edit: Dialog, `form-field` (Nama, SKU, Stok, Harga beli/jual, Kategori Select).
- Hapus: AlertDialog (destructive).

### Invoice
- List: DataTable (No., Pelanggan, Jatuh tempo, Total, Status badge: Lunas hijau / Belum amber / Jatuh tempo merah / Draft info).
- Detail: Card + Separator; aksi "Tandai Lunas" Button primary, "Cetak" outline.
- Buat invoice: Dialog besar atau Sheet — pilih pelanggan (Command), tambah item baris, auto total.

### Pelanggan / Pegawai / Pemasok
- Sama pattern: header pill + page-header + DataTable + Dialog form. Avatar inisial untuk pelanggan/pegawai.

### Pengeluaran
- Form cepat Dialog (kategori Select, jumlah, tanggal Popover+Calendar). List DataTable sederhana.

### Laporan
- Card stat hero (angka besar Sora + badge hijau perubahan %) + wrapper recharts (stroke oranye, grid `--border`).

### Umum
- Toast: Sonner, posisi bawah-tengah mobile / bawah-kanan desktop.
- Loading: Skeleton di card & tabel.
- Dialog konfirmasi hapus: AlertDialog merah.
- Mobile: grid produk `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, keranjang jadi Sheet bawah; bottom nav 5 item pill mengambang.

## 7. Badge status (varian konsisten)

```jsx
<Badge variant="outline" className="bg-success/10 text-success border-success/30">Lunas</Badge>
// hijau: Lunas, Tersedia, Sukses · amber: Belum dibayar, Menipis · merah: Jatuh tempo, Habis, Batal
// info: Draft · outline default abu: tidak aktif
```

Badge selalu rounded-full, teks 12px/500, bukan solid penuh (tint 10% bg + border 30%) agar tidak berisik di dark bg.

## 8. Contoh pemakaian

```jsx
<Card className="rounded-[20px] bg-card border-border/60">
  <CardHeader className="flex-row items-center justify-between">
    <CardTitle className="text-base font-semibold">Ringkasan Hari Ini</CardTitle>
    <Badge className="bg-success/10 text-success">+12,4%</Badge>
  </CardHeader>
  <CardContent className="text-3xl font-semibold tabular-nums">{rp(2450000)}</CardContent>
</Card>

<Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
  Bayar · {rp(total)}
</Button>
```

## 9. Prioritas eksekusi untuk agent coder

1. Setup shadcn init + ambil komponen inti (button, card, input, table, dialog, badge, dropdown-menu, sheet, tabs, select, sonner, command, popover, separator, skeleton, alert-dialog, radio-group, label, textarea, switch, avatar, tooltip, checkbox).
2. Pasang token warna dark + radius di `index.css`/`tailwind.config.js` (langkah 2 & 7).
3. Bangun `layout/` (app-shell, header-pill, page-header) — refactor nav pakai ini.
4. Bangun `data/data-table.jsx` wrapper TanStack; refactor inventori & invoice dulu.
5. POS terakhir (paling kompleks): product-grid → cart-panel → payment-dialog.
6. Verifikasi mobile 390×844 dan build `npm run build`.
