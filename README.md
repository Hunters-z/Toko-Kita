# Toko Kita 🏪

ERP + kasir lengkap untuk UMKM Indonesia — **ringan, tanpa server, gratis**. Alternatif simpel Odoo, dibuat dengan React + Vite + Tailwind + **shadcn/ui**.

![UI](https://img.shields.io/badge/UI-dark%20premium-F97316) ![bundle](https://img.shields.io/badge/bundle-gzip%20~75KB-16A34A) ![license](https://img.shields.io/badge/license-MIT-black)

> 🎨 **Desain baru**: dark premium ala FinPoint — hitam #111, kartu radius 20px, aksen oranye, badge hijau, font Sora + Plus Jakarta Sans, semua ikon minimalis Lucide (tanpa emoji).

## ✨ Fitur

**Penjualan**
- 🛒 **Kasir (POS)** — katalog + pencarian cepat, keranjang, **diskon per produk otomatis**, **PPN 11% (bisa on/off)**, **4 metode bayar** (Tunai / QRIS / Transfer / Debit), hitung **kembalian**, struk ringkas setelah bayar, **toast peringatan stok menipis/habis real-time**
- 🧾 **Invoice** — terbitkan invoice, status Dibayar / DP / Belum, piutang terlacak
- 📦 **Inventori** — stok real-time, **panel stok menipis di Dashboard**, atur diskon produk
- 🎁 **Produksi & Paket** — gabungkan produk jadi 1 paket (mis. Hampers Kopi+Teh); komponen **otomatis keluar dari stok**; paket langsung muncul di Kasir

**Pembelian & Relasi**
- 📥 **Pembelian** — PO ke pemasok, **stok masuk otomatis**, riwayat pembelian
- 🏢 **Pemasok** — daftar pemasok + kontak + barang utama
- 👥 **Pelanggan** — CRM ringkas

**Keuangan & SDM**
- 💸 **Pengeluaran** — kategori + total
- 📊 **Laporan** — pendapatan vs pengeluaran, laba kas, piutang, produk terlaris (grafik), kehadiran harian; **ringkasan harian/mingguan (omzet, laba kotor, jumlah transaksi) di Dashboard**
- 🧑‍💼 **Pegawai** — akun pegawai dengan **username + PIN** untuk login
- 📅 **Absensi pegawai v2** — login per pegawai, absen masuk/pulang dengan **foto selfie kamera wajib** (fallback upload) + **lokasi GPS**: dicatat dalam/luar radius kantor (koordinat + radius diatur admin), riwayat dengan thumbnail + link Google Maps; fingerprint WebAuthn + fallback PIN tetap tersedia

**Lainnya**
- ⚙️ **Pengaturan** — nama toko, PPN, jam mulai shift, **lokasi & radius absensi**, **backup & pulihkan data (JSON)**, reset
- 📱 **Responsif penuh** — desktop, tablet, HP (bottom-nav mengambang ala aplikasi native)
- 💾 **Tanpa server** — data tersimpan lokal di perangkat (localStorage)

---

## 🚀 Instalasi A — Vercel (dianjurkan)

1. Import repo ini di [vercel.com/new](https://vercel.com/new)
2. Framework terdeteksi otomatis: **Vite** · tidak perlu env var apa pun
3. **Deploy** → URL langsung hidup

**Jalankan lokal:**
```bash
git clone https://github.com/Hunters-z/Toko-Kita
cd Toko-Kita
npm install
npm run dev          # http://localhost:5173
npm run build        # produksi ke dist/
```

---

## 📊 Instalasi B — Google Apps Script (alternatif, 1 project Google)

Cocok kalau kamu **tidak mau deploy apa pun** dan ingin datanya di Google Sheets milikmu sendiri.
Satu project Google = database + backend + API. Semua gratis.

### Langkah demi langkah

**1. Buat spreadsheet database**
- Buka 👉 [sheets.new](https://sheets.new)
- Beri nama: **Toko Kita DB**

**2. Buka editor Apps Script**
- Menu **Ekstensi → Apps Script**
- Hapus semua isi `Code.gs` yang muncul
- Buka file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) di repo ini → **copy seluruh isinya** → tempel ke editor
- Simpan (Ctrl+S), beri nama project: **Toko Kita API**

**3. Deploy sebagai Web App**
- Tombol **Deploy → Deployment baru**
- Klik ikon gerigi → pilih jenis **Aplikasi web**
- Isi:
  - **Deskripsi**: `Toko Kita API v1`
  - **Jalankan sebagai**: **Saya** (akun Google kamu)
  - **Siapa yang punya akses**: **Siapa saja** (Anyone)
- Klik **Deploy** → **Izinkan akses** (Authorize) → pilih akun → *Advanced → Go to Toko Kita API (unsafe)* → **Allow**
- **Salin URL Web App** yang muncul. Bentuknya:
  ```
  https://script.google.com/macros/s/AKfycb..../exec
  ```

**4. Selesai — langsung bisa dipakai**

Buka URL itu di browser dengan tambahan parameter:

| Perintah | Fungsi |
|---|---|
| `<URL>?action=ping` | Cek backend hidup |
| `<URL>?action=all` | Ambil **semua** data (JSON) |
| `<URL>?action=produk` | Ambil satu tabel (produk/transaksi/pelanggan/invoice/pegawai/absen/pemasok/pengeluaran/pembelian) |
| `POST <URL>` body `{"table":"transaksi","row":{...}}` | Tambah satu baris |

**5. Sheet otomatis terbentuk**

Saat pertama diakses, Apps Script membuat 9 sheet dengan header siap pakai:

`Produk` · `Transaksi` · `Pelanggan` · `Invoice` · `Pegawai` · `Absen` · `Pemasok` · `Pengeluaran` · `Pembelian`

Kamu bisa **menambah/mengedit baris langsung di Google Sheets** — API akan membaca data terbaru.

### Cara pakai bersama aplikasi React

Di aplikasi Toko Kita (mode Vercel), buka **Pengaturan → Sinkron Google Sheets** dan tempel URL `/exec` tadi.
Untuk saat ini kamu juga bisa memakai Sheet sebagai sumber data untuk:
- **Looker Studio** (dashboard gratis dari Google) → Data source: URL `?action=all`
- **Google Form** untuk input cepat dari HP (Form → Responses → Spreadsheet yang sama)
- **Add-on / script lain** yang memanggil API yang sama

### Tips & catatan
- **Update kode**: setelah mengubah `Code.gs`, deploy ulang lewat **Deploy → Kelola deployment → ✏️ → Versi baru**. URL tetap sama.
- **Jangan bagikan URL publik** kalau data sensitif — akses "Anyone" berarti siapa pun yang punya URL bisa membaca. Untuk internal, ganti akses ke **Saya** lalu pakai dengan login Google.
- Kuota gratis Apps Script: ±20.000 request/hari — lebih dari cukup untuk toko kecil.
- Butuh mode **sepenuhnya spreadsheet tanpa React**? Cukup pakai sheet `Produk` + `Transaksi` dan buat form input lewat **Data → Buat formulir**.

---

## 🔒 Privasi
- **Mode Vercel**: data tinggal di perangkat (localStorage), tidak pernah dikirim ke mana pun.
- **Mode Apps Script**: data tinggal di Google Sheets milikmu sendiri, di akun Google-mu.

---

## 🗺️ Roadmap
- [x] POS + PPN 11% + multi-metode bayar + kembalian
- [x] Pembelian (stok masuk) & produksi paket
- [x] Diskon per produk
- [x] Absen WebAuthn (fingerprint) + PIN
- [x] Backup/pulihkan JSON
- [x] **UI shadcn/ui dark premium + ikon minimalis Lucide**
- [x] **Absensi v2: login per pegawai (username+PIN), selfie kamera wajib, cek radius lokasi GPS, riwayat foto + Google Maps**
- [x] **Halaman login terpisah Admin vs Karyawan**
- [x] **Role Access: role Kasir dapat POS/Kasir, Karyawan non-kasir dapat Absen, Izin/Cuti, Slip Gaji, Profil**
- [ ] Approval Izin/Cuti & slip gaji PDF otomatis — roadmap Q4
- [x] **Ekstensi Odoo-style Modular: Keuangan, Penjualan CRM, Website Builder, Supply Chain, HR, Pemasaran**
- [x] **Apps Script dashboard (index.html) terintegrasi role-based: Admin / Kasir / Karyawan**
- [x] **Audit Hallmark Design System (Anti-AI-Slop): Floor rules diterapkan (CSS tokens, fokus-visible, reduced-motion, overflow-x:clip)**
- [x] **Halaman web Apps Script (dashboard `?page=ui`)**
- [x] Notifikasi stok menipis (Dashboard + toast POS)
- [x] Ringkasan harian/mingguan di Dashboard
- [ ] **Pisah halaman login & akses Admin vs Karyawan** (sedang dikerjakan)
- [ ] Sinkron dua arah Google Sheets dari UI
- [ ] Cetak struk thermal (ESC/POS)
- [ ] Multi-outlet & multi-kasir
- [ ] Supabase adapter (multi-device realtime)

---

## 🧱 Teknologi
React 18 · Vite · Tailwind CSS · **shadcn/ui (Radix)** · Recharts · Lucide Icons · WebAuthn API · localStorage / Google Sheets · Google Apps Script

## 📄 Lisensi
MIT — bebas dipakai, dimodifikasi, dan dijual kembali. Kontribusi terbuka.
