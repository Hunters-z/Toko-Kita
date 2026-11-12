# Spec 3 Fitur Baru — Toko Kita

Desain saja (tidak termasuk implementasi). Semua komponen shadcn yang disebut sudah ada di `src/components/ui/`. Tema: hitam `#111`, kartu radius 20px, aksen oranye `#F97316`, hijau sukses. Icon dari Lucide sesuai `docs/icon-spec.md`.

---

## Fitur 1 — Absensi Pegawai

### Tujuan
Check-in/check-out harian per pegawai, status Hadir / Terlambat / Izin, riwayat per pegawai.

### Layout — halaman `/absensi` (`Attendance.jsx`, sudah ada stub)
```
┌──────────────────────────────────────────────────────┐
│ [CalendarCheck] Absensi            [Plus] Catat Izin │  ← header halaman
├──────────────────────────────────────────────────────┤
│ Kartu absen cepat (radius 20px, border oranye saat   │
│ sesi terbuka) — satu kartu per pegawai:              │
│ ┌────────────────────────────────────┐               │
│ │ [Avatar fallback inisial] Budi     │               │
│ │ Kasir · Masuk 08:02                │               │
│ │ [BadgeCheck Hijau] Hadir           │               │
│ │ [CheckCircle2 Check-out]  ← klik   │               │
│ └────────────────────────────────────┘               │
│ Grid 2 kolom (1 di mobile). Pegawai belum check-in:  │
│ tombol oranye "Check-in". Sudah checkout: tampil     │
│ jam kerja "8j 15m" muted.                            │
├──────────────────────────────────────────────────────┤
│ Tabs: [Hari Ini] [Riwayat]                           │
│ Riwayat = filter Select pegawai + Select bulan,      │
│ lalu Table: Tanggal | Pegawai | Masuk | Keluar |     │
│ Durasi | Status(badge + icon)                        │
└──────────────────────────────────────────────────────┘
```
- Dialog "Catat Izin" (`Dialog`): pilih pegawai (`Select`), tanggal (Input date), keterangan (`Textarea`), tombol `Save`.
- Terlambat otomatis: check-in > jam mulai shift (default 08:00, bisa diubah di Pengaturan) → badge `Clock` amber "Terlambat", dengan selisih "17 mnt".
- Toast konfirmasi (sonner): "Budi check-in 08:02" ikon `CheckCircle2`.

### Komponen shadcn
`Card`, `Badge`, `Button`, `Tabs`, `Table`, `Dialog`, `Select`, `Input`, `Textarea`, `Label`, `Avatar` (fallback inisial, jika belum ada pakai div inisial), toast via `sonner`.

### Struktur data localStorage
```
key: tk_attendance
value: [
  {
    id: "att_1699...",          // unik
    employeeId: "emp_01",
    date: "2026-11-12",          // YYYY-MM-DD lokal
    checkIn: "2026-11-12T08:02:00" | null,
    checkOut: "2026-11-12T16:30:00" | null,
    status: "hadir" | "terlambat" | "izin",
    note: "",                    // keterangan izin
    lateMinutes: 0
  }
]
key: tk_settings (diperluas) → { shiftStart: "08:00", shiftEnd: "17:00" }
```
Aturan: satu record per employeeId+date (dedupe saat check-in). Check-out menutup record; durasi dihitung saat render, tidak disimpan.

---

## Fitur 2 — Notifikasi Stok Menipis

### Tujuan
Produk di bawah stok minimum muncul di Dashboard + badge, dan POS memberi toast saat stok habis.

### A. Dashboard
```
┌──────────────────────────────────────────────────┐
│ Kartu stat baru (satu dari deret stat):          │
│ [TriangleAlert amber] Stok Menipis   [Badge "7"] │
├──────────────────────────────────────────────────┤
│ Kartu "Stok Menipis" (radius 20px):              │
│ header: [PackageX] Stok Menipis  [Button Lihat →]│
│ tiap baris:                                      │
│  [Package] Indomie Goreng                        │
│  ▓▓▓▓▓░░░░░  3 / min 10        [Badge amber]     │
│  [Button sm] [Plus] Restock  → buka Inventori    │
│ Bar: sisa stok / stokMinimum. Warna: hijau >min, │
│ amber ≤min, merah = 0. Max 5 baris + "Lihat      │
│ semua (7)" → /inventori?filter=low               │
└──────────────────────────────────────────────────┘
```
- Ikon bel di header Layout: `Bell` dengan badge count angka stok menipis (Badge, oranye). Klik → Sheet berisi daftar sama.
- Semua produk stok = 0 tampil di atas, badge merah "Habis" (icon `XCircle`).

### B. POS
- Saat item dikurangkan keranjang hingga stok 0: toast `TriangleAlert` "Stok [nama] habis" (sekali per item per sesi, jangan spam).
- Saat menambah item yang stoknya ≤ minimum: toast info muted "Stok [nama] tinggal 3 (min 10)" — debounce 5 detik.
- Item stok 0: tombol tambah disabled + icon `Ban`, label "Habis" pada kartu produk.

### Komponen shadcn
`Card`, `Badge`, `Button`, `Sheet` (panel notifikasi bel), `Progress` (bar stok, warna via className), `Table` (opsional daftar penuh di Inventori), `Separator`, toast via `sonner`.

### Struktur data localStorage
Tidak ada struktur baru — pakai data produk existing:
```
key: tk_products
{ id, name, stock: number, minStock: number }   // minStock wajib ada, default 5 saat migrasi
key: tk_lowstock_seen (opsional) → { [productId]: timestamp }  // cooldown toast, TTL sesi
```
Definisi: menipis = `stock <= minStock && stock > 0`; habis = `stock === 0`. Hitung di helper `lib/stock.js`: `getLowStock(products)`, `getOutOfStock(products)` — dipakai Dashboard, Sheet bel, dan POS agar konsisten.

---

## Fitur 3 — Laporan Ringkas di Dashboard

### Tujuan
Kartu laba kotor + ringkasan harian/mingguan tanpa membuka halaman Laporan.

### Layout — bagian atas Dashboard
```
┌────────────────────────────────────────────────────────┐
│ Baris kartu stat (radius 20px):                        │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│ │[Banknote]  │ │[TrendingUp]│ │[ReceiptText]│          │
│ │ Omzet      │ │ Laba Kotor │ │ Transaksi   │         │
│ │ Rp 1,2jt   │ │ Rp 480rb   │ │ 34          │         │
│ │ ↑12% vs    │ │ margin 40% │ │ item 96     │         │
│ │ kemarin    │ │ (muted)    │ │             │         │
│ └────────────┘ └────────────┘ └────────────┘           │
├────────────────────────────────────────────────────────┤
│ Tabs: [Hari Ini] [Minggu Ini]     (default Hari Ini)   │
│ Isi sama untuk kedua tab, angka berbeda:               │
│  · 4 kartu stat di atas (omzet, laba kotor, jumlah     │
│    transaksi, item terjual)                            │
│  · Baris kecil "Pengeluaran hari ini: Rp 150rb         │
│    [Wallet]" + "Laba bersih: Rp 330rb" (oranye,        │
│    bold — satu-satunya angka berwarna)                 │
│  · Link muted "Laporan lengkap [ArrowRight]" → /laporan│
└────────────────────────────────────────────────────────┘
```
- Laba kotor = Σ(jual − harga beli modal) per item transaksi. Periode: hari = transaksi tanggal hari ini; minggu = Senin–Minggu berjalan.
- Angka format Rupiah singkat (`Rp 1,2jt`) dengan nilai penuh di `title` tooltip.
- Perbandingan "↑12% vs kemarin" hanya di tab Hari Ini (hijau naik, merah turun, icon `ArrowUp`/`ArrowDown`).
- Tidak ada grafik di sini — grafik tetap di halaman Laporan.

### Komponen shadcn
`Card`, `Badge`, `Tabs`, `Button` (ghost untuk link), `Separator`, tooltip via `title` attr (tanpa dep baru).

### Struktur data localStorage
Pakai data transaksi & pengeluaran existing, tanpa struktur baru:
```
key: tk_transactions
{ id, date: "2026-11-12T14:05:00", items: [{ productId, name, qty, price, cost }], total }
key: tk_expenses
{ id, date, amount, category, note }
```
Helper baru `lib/report.js`: `summarize(transactions, expenses, period: "day" | "week")` → `{ omzet, labaKotor, labaBersih, jumlahTransaksi, itemTerjual, pengeluaran, deltaVsKemarin }`. Dihitung on-render dari localStorage; tidak ada cache agar tidak sinkron.

---

## Prioritas implementasi (untuk developer)
1. Icon spec (fondasi semua halaman) → 2. Laporan Ringkas (paling kecil, murni render) → 3. Stok Menipis (helper + POS toast + Dashboard) → 4. Absensi (halaman baru + dialog + riwayat).
