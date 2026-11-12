# Icon Spec — Toko Kita

Sistem icon resmi. Ganti SEMUA emoji di UI dengan Lucide React (`lucide-react`, sudah terinstall).

## 1. Aturan global

| Aturan | Nilai |
|---|---|
| Library | `lucide-react` (import per-icon, tree-shaken) |
| Stroke width | `1.75` default; `1.5` untuk icon kecil (≤16px) agar tetap terbaca |
| Ukuran | `16px` di teks/badge/table, `20px` di menu sidebar & button utama, `24px` di header halaman/kartu stat |
| Warna | Selalu ikuti teks: pakai `className` `text-*`, JANGAN `color` prop hardcode. Icon di dalam Button mewarisi warna Button otomatis |
| Spasi | Icon + label: `gap-2` (icon 16) / `gap-2.5` (icon 20). Icon di button label selalu di kiri |
| Icon-only button | WAJIB punya `aria-label` + `title` (tooltips). Minimum hit area 32×32px |
| Dilarang | Emoji (`📦`, `✅`, `⚠` dll), icon import dari paket lain, stroke <1.5 atau >1.75, icon warna berbeda dari teks tanpa alasan semantik |

## 2. Komponen pembantu (satu file: `src/components/ui/icon.jsx`)

```jsx
// src/components/ui/icon.jsx
import { cn } from "@/lib/utils";

export const ICON_SIZE = { sm: 16, md: 20, lg: 24 };

export function Icon({ as: Cmp, size = "md", strokeWidth, className, ...p }) {
  return (
    <Cmp
      size={ICON_SIZE[size]}
      strokeWidth={strokeWidth ?? (ICON_SIZE[size] <= 16 ? 1.5 : 1.75)}
      className={cn("shrink-0", className)}
      {...p}
    />
  );
}
```

Pakai `<Icon as={Package} size="sm" className="text-muted-foreground" />`. Warna default: ikuti `currentColor`.

## 3. Mapping — menu sidebar (`Layout.jsx`)

| Menu | Icon Lucide |
|---|---|
| Dashboard | `LayoutDashboard` |
| POS (Kasir) | `ShoppingCart` |
| Inventori | `Package` |
| Invoice | `ReceiptText` |
| Pelanggan | `Users` |
| Pegawai | `Briefcase` |
| Absensi | `CalendarCheck` |
| Pemasok | `Building2` |
| Pembelian | `Truck` |
| Pengeluaran | `Wallet` |
| Laporan | `BarChart3` |
| Pengaturan | `Settings` |

## 4. Mapping — header halaman & kartu stat

| Lokasi | Icon |
|---|---|
| Judul halaman (kiri judul) | icon menu yang sama, size `lg` |
| Stat Omzet | `Banknote` |
| Stat Laba | `TrendingUp` |
| Stat Transaksi | `ReceiptText` |
| Stat Stok Menipis | `PackageX` / `TriangleAlert` |
| Stat Pelanggan | `Users` |
| Stat Pegawai | `Briefcase` |

## 5. Mapping — button umum

| Aksi | Icon |
|---|---|
| Tambah / Baru | `Plus` |
| Simpan | `Save` |
| Edit | `Pencil` |
| Hapus | `Trash2` |
| Detail / Lihat | `Eye` |
| Cetak / PDF | `Printer` |
| Download / Export | `Download` |
| Import / Upload | `Upload` |
| Cari | `Search` |
| Filter | `SlidersHorizontal` |
| Refresh | `RefreshCw` |
| Tutup dialog | `X` (bukan `✕`) |
| Kembali | `ArrowLeft` |
| Lanjut / Berikutnya | `ArrowRight` |
| Tambah ke keranjang (POS) | `ShoppingCart` |
| Bayar (POS) | `CreditCard` |
| Scan barcode | `ScanBarcode` |
| WhatsApp | `MessageCircle` |
| Telepon | `Phone` |
| Login/Logout sesi | `LogIn` / `LogOut` |

## 6. Mapping — status (badge & table)

| Status | Icon | Warna |
|---|---|---|
| Sukses / Hadir | `CheckCircle2` | hijau (badge sukses现有) |
| Gagal / Habis | `XCircle` | merah |
| Peringatan / Menipis | `TriangleAlert` | amber |
| Terlambat | `Clock` | amber |
| Izin | `CalendarOff` | muted |
| Info | `Info` | muted |
| Pending | `Clock` | muted |
| Lunas | `BadgeCheck` | hijau |
| Notification bell | `Bell` | mengikuti teks; badge count pakai `Badge` |

## 7. Empty state & feedback

- Empty state: icon size `lg`, `text-muted-foreground`, di atas teks ("Belum ada data — tambah sekarang").
- Toast (sonner): selalu sertakan icon di `description` atau pakai `icon` option; sukses `CheckCircle2`, error `XCircle`, stok habis `TriangleAlert`.
- Loading: `Loader2` dengan `className="animate-spin"`.

## 8. Emoji yang ada sekarang → pengganti (hasil audit)

| Emoji | Lokasi | Ganti dengan |
|---|---|---|
| ☰ | Layout (mobile menu) | `Menu` |
| 🔍 | POS, search input | `Search` |
| 👆 🧑 👥 🏢 🏦 | Layout nav, Pegawai, Suppliers | mapping sidebar §3 |
| 📦 🎁 | Inventory, Bundles | `Package`, `PackagePlus`/`Gift` |
| 🛒 💵 💳 📥 | POS | `ShoppingCart`, `Banknote`, `CreditCard`, `Download` |
| 🔢 ✕ ⬆ ⬇ | POS qty | `Hash`, `X`, `ArrowUp`, `ArrowDown` |
| 🔔 | Dashboard | `Bell` |
| 📊 💼 💸 | Dashboard, Expenses | `BarChart3`, `Briefcase`, `Wallet` |
| ✅ ⚠ 👍 👆 | status & hint | §6 mapping |
| 🧾 📱 📞 | Invoice, Settings | `ReceiptText`, `Smartphone`, `Phone` |

Aturan verifikasi: `grep -rnoP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src --include='*.jsx'` harus 0 hasil.

## 9. Token visual (dipatuhi semua icon)

- Latar hitam `#111111`, kartu radius 20px, aksen oranye `#F97316`, hijau sukses badge现有.
- Icon tidak pernah jadi dekorasi: setiap icon di layar harus menyampaikan aksi/status, bukan hiasan.
- Satu bahasa icon: kalau satu tempat pakai outline icon, semua tempat outline (Lucide memang outline — tidak campur emoji/filled).
