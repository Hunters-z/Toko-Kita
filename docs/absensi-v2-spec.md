# Spec: Absensi Pegawai v2 — Akun Pegawai + Foto Selfie + Lokasi GPS

Dokumen desain (bukan kode). Menggantikan/extends `docs/fitur-baru-spec.md` Fitur 1.
Target: `src/pages/Attendance.jsx`, `src/lib/auth.js`, `src/pages/Settings.jsx`, `src/pages/Employees.jsx`.
UI bahasa Indonesia, shadcn dark premium FinPoint yang sudah ada (radius 20px, `text-hero`, `bg-hero-soft`, token ink/inksoft/dim).

---

## Fitur 0 — Login Pegawai Per-Orang

### Tujuan
Tiap pegawai absen dari akunnya sendiri. Admin melihat semua; pegawai hanya melihat miliknya. Sesi lokal, tanpa backend.

### Skema login
- Kredensial sederhana: **username + PIN 4 digit**. Username default di-generate dari nama saat pegawai dibuat (`Employees.jsx`), contoh `rina` — bisa diedit admin.
- Migrasi: pegawai lama tanpa `username` → fallback `slug(nama.toLowerCase())`; jika bentrok, tambah angka (`rina2`). PIN sudah ada di seed (`pin:'1234'`), pegawai tanpa PIN → wajib diisi admin di Pegawai sebelum bisa login.
- Biometrik WebAuthn (`auth.js` yang sudah ada) tetap opsional sebagai jalur cepat; PIN adalah fallback. Login flow: pilih/isi username → PIN (atau fingerprint jika `credId` ada dan perangkat mendukung).
- **Admin login**: username `admin` + PIN admin (disimpan di `tk_settings.adminPin`, default `0000`, wajib diganti di Pengaturan). Tidak ada pegawai bernama `admin`.

### Sesi lokal
```
key: tk_session
value: { employeeId: "e1"| "admin", role: "pegawai"|"admin", loginAt: ISO, expiresAt: ISO }
```
- TTL sesi: 12 jam atau sampai klik "Keluar". `expiresAt` dicek saat load; kadaluarsa → hapus, tampil halaman login.
- `tk_session` dipegang helper baru `src/lib/session.js`: `getSession()`, `setSession(s)`, `clearSession()`, `isAdmin()`.
- Keamanan diakui lemah (localStorage bisa dibuka devtools) — cukup untuk toko kecil; sebutkan di UI: bukan keamanan enterprise.

### Halaman login (route `/absen` tanpa sesi)
```
┌──────────────────────────────────────┐
│  [Icon CalendarCheck hero]           │
│  Absen Pegawai                       │
│  Masuk dengan akun Anda              │
│                                      │
│  Username  [___________]             │
│  PIN       [•••• input password]     │
│  [Button w-full] Masuk               │
│  — atau —                            │
│  [Button outline w-full] Fingerprint │ (jika credId + WebAuthn ok)
│                                      │
│  [link kecil] Masuk sebagai Admin    │
└──────────────────────────────────────┘
```
- Komponen: `Card`, `Input`, `Label`, `Button`, `Icon`. Error inline merah: "Username atau PIN salah" (pesan generik, jangan bocorkan mana yang salah).
- Percobaan gagal 5× → kunci input 30 detik dengan countdown di tombol.

### Peran & visibilitas data
- `role: admin` → Attendance.jsx tampil seperti sekarang (semua pegawai, catat izin, riwayat semua).
- `role: pegawai` → hanya record `employeeId` miliknya; tombol "Catat Izin" hanya untuk diri sendiri; tidak ada aksi check-in/out atas nama orang lain.
- Semua aksi absen (check-in/out/izin) selalu menulis `employeeId` dari sesi, bukan dari pilihan UI.

---

## Fitur 1 — Foto Selfie Wajib

### Alur pengambilan
1. Saat pegawai menekan **Check-in** (atau check-out): buka `Dialog` "Verifikasi Diri".
2. Langkah 1 — Kamera: `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640 } })` ke `<video>` di dialog, tampilan square `aspect-square rounded-2xl overflow-hidden` + ring `text-hero`.
3. Langkah 2 — tombol `Icon Camera` "Ambil Foto": frame digambar ke `<canvas>` 320×320 (crop tengah square), hasil `canvas.toDataURL('image/jpeg', 0.6)`.
4. Preview foto + tombol "Ulangi" dan "Kirim Absen".
5. **Fallback** (kamera ditolak / tidak ada, error `NotAllowedError`/`NotFoundError`): tampil `Input type="file" accept="image/*" capture="user"`. File dibaca via `FileReader` → `<img>` → canvas 320×320 → JPEG 0.6, sama dengan jalur kamera. Fallback tetap diterima tapi record ditandai `photoSource: 'upload'` (admin bisa melihat bukan live capture).
6. Kamera stream dihentikan (`track.stop()`) saat dialog ditutup — selalu, termasuk batal.

### Kompresi & batas ukuran
- Target ≤ **40 KB** per foto: output 320×320 JPEG quality 0.6 (≈15–30 KB). Kalau > 40 KB, turunkan quality bertahap (0.5 → 0.4 → 0.3) hingga lolos.
- Hard cap **60 KB**: jika masih lebih besar, gagal dengan toast "Foto terlalu besar, coba lagi".
- Tolak foto dengan sisi < 100px (gambar korup/terlalu kecil).

### Struktur data (foto terpisah)
Foto base64 besar **tidak disimpan** di record `tk_attendance` — disimpan di key terpisah agar riwayat/table tetap ringan di-parse:

```
key: tk_att_photos            // foto, satu objek terpisah
value: { "att_<id>": "data:image/jpeg;base64,..." }

key: tk_attendance            // record ringan, tambahan field baru:
  {
    id, employeeId, date, checkIn, checkOut, status, note, lateMinutes,   // existing
    photoIn: "att_..." | null,     // id ref ke tk_att_photos (foto check-in)
    photoOut: "att_..." | null,    // foto check-out (opsional, bisa dinonaktifkan)
    photoSource: "camera"|"upload",
    photoAt: ISO
  }
```
- Simpan foto hanya sekali per record per jenis (in/out) — tidak per foto percobaan.
- Foto check-in **wajib**; check-out foto opsional (setelan admin, default off).

### Komponen
`Dialog`, `Button`, `Icon` (Camera, RefreshCw, CameraOff), toast. Video/canvas di-div kustom dengan token FinPoint, bukan komponen baru.

---

## Fitur 2 — Lokasi GPS Wajib

### Alur
1. Setelah foto diambil (di dialog yang sama, langkah 3): ambil `navigator.geolocation.getCurrentPosition` dengan `{ enableHighAccuracy: true, timeout: 10000 }`.
2. UI langkah: indikator "Mencari lokasi…" (spinner `Loader2`), lalu kartu lokasi:
```
┌────────────────────────────────────┐
│ [MapPin] Lokasi terkunci           │
│ Lat -6.2088  Lng 106.8456          │
│ Akurasi ±15 m                      │
│ [Badge success] Di dalam radius    │  / [Badge merah] Di luar radius
│ [link] Lihat di Maps ↗             │
└────────────────────────────────────┘
```
3. Link Maps: `https://maps.google.com/?q=<lat>,<lng>` (`a target="_blank"`).
4. GPS gagal / izin ditolak → status `no-gps`: absen bisa diteruskan tapi record `geoStatus:'ditolak'` + badge amber "Tanpa GPS" di admin. Jangan blokir total (toko kecil, jangan pegawai tak bisa absen karena HP kentang).

### Radius kantor (Pengaturan)
- `tk_settings` diperluas:
```
settings: {
  ..., // existing
  officeLat: null, officeLng: null,   // null = belum diset → GPS tidak divalidasi
  officeRadius: 150                    // meter, default 150
}
```
- Di `Settings.jsx` tambah kartu "Lokasi Kantor": tombol "Ambil lokasi kantor di sini" (getCurrentPosition → isi lat/lng), `Input` number radius (25–2000 m), tombol Simpan. Tampilkan alamat kasar via link Maps agar admin bisa cek.
- **Haversine** (bukan euclid) dihitung di helper `lib/geo.js`: `haversineM(a, b)`, `inRadius(pos, settings)`.
- Status: `dalam` (≤ radius), `luar` (> radius), `tanpa-gps` (izin ditolak/error), `belum-diset` (admin belum set lokasi kantor — GPS tetap dicatat, tidak divalidasi).

### Struktur data record
```
geo: { lat: -6.2088, lng: 106.8456, accuracy: 15, status: "dalam"|"luar"|"tanpa-gps"|"belum-diset", distanceM: 42 }
geoIn: { ...geo }, geoOut: { ...geo }     // di record tk_attendance
```

---

## Fitur 3 — Alur UI Absen

### Halaman pegawai (`/absen`, sesi pegawai)
Satu kartu besar, state-driven (bukan tab):
```
┌────────────────────────────────────────────┐
│ [Avatar inisial] Rina Kasir · Kasir        │
│ [Badge] Hadir 08:02      [Button] Keluar   │
│ ─────────────────────────────────────────  │
│ Sebelum absen:                             │
│ ┌────────┐  ┌──────────────────┐           │
│ │ [foto  │  │ [MapPin] Lokasi  │           │
│ │ preview│  │  Di dalam radius │           │
│ │ square]│  │  ±15 m · Maps ↗  │           │
│ └────────┘  └──────────────────┘           │
│ [Button w-full] Check-in Sekarang          │
└────────────────────────────────────────────┘
```
- **Dialog verifikasi (foto + lokasi satu dialog)**: langkah bernomor alami 1 Kamera → 2 Foto diambil → 3 Lokasi → tombol kirim. Jika lokasi `luar`, tombol berubah jadi dua:
  - `[Button] Tetap Absen` (outline) — masuk dengan `status:'hadir'` tapi tambah flag `outOfRadius:true` + badge merah "Di luar radius" di admin; atau
  - `[Button ghost] Batal` — admin nanti yang menilai.
  - Flag `outOfRadius` hanya penanda; penilaian tetap oleh admin. (Versi ketat bisa dikunci via setelan `strictRadius:true` → tombol "Tetap Absen" hilang; default off.)
- **Riwayat pribadi**: `Table` tanggal | masuk | keluar | durasi | status + thumbnail foto 32px (`img rounded-lg object-cover`) yang bisa diklik → `Dialog` foto besar + koordinat + link Maps.
- Izin: pegawai bisa catat izin untuk diri sendiri saja (dialog existing, tanpa Select pegawai).

### View admin (sesi admin)
- Halaman Attendance existing tetap jadi home admin, tambahan:
  - Kolom baru di tabel Hari Ini: thumbnail foto check-in 40px (klik → dialog foto besar), badge lokasi (`success` "Dalam radius" / `destructive` "Luar radius (42 m)" / amber "Tanpa GPS").
  - Filter riwayat tambah: Select status lokasi + toggle "hanya di luar radius".
  - Aksi admin per record: lihat foto, hapus foto (pegawai diwajibkan absen ulang), batal-kan absen.
- Layout tetap: tabel `Table`, badge `Badge`, dialog `Dialog` — tidak ada komponen baru; konsisten dengan mockup `docs/absensi-mockup.html`.

### Prinsip desain (frontend-design)
- Satu momen berani: **live camera square dengan ring hero + tombol shutter besar** — itu wajah fitur. Sisanya disiplin: kartu radius 20px, satu aksen warna per status (hijau hadir / amber terlambat-atau-tanpa-gps / merah luar radius), tanpa dekorasi tambahan.
- Bukan template: hindari eyebrow ALL-CAPS dan baris meta dengan middle dots berlebihan; label pakai bahasa pegawai ("Ambil Foto", "Lokasi terkunci"), bukan istilah teknis ("getUserMedia", "geolocation").
- Motion hanya pada satu orkestrasi: dialog verifikasi fade-slide sekali saat dibuka; lintakan hover di tiap kartu.
- Error dan kosong: "Kamera tidak bisa diakses — izinkan kamera di browser, atau unggah foto" (arah, bukan permintaan maaf).

---

## Ringkasan struktur data localStorage

```
tk_session         { employeeId, role:'admin'|'pegawai', loginAt, expiresAt }
tk_attendance      [{ id, employeeId, date, checkIn, checkOut, status, note, lateMinutes,
                      photoIn, photoOut, photoSource, photoAt,
                      geoIn:{lat,lng,accuracy,status,distanceM}, geoOut:{...}, outOfRadius }]
tk_att_photos      { [attId-in/out-ref]: "data:image/jpeg;base64,…" }   // TERPISAH
tk_settings        + { officeLat, officeLng, officeRadius, adminPin,
                       photoOutRequired:false, strictRadius:false }
db.employees       + { username }   // migrasi: slug nama, unik
```

### Strategi ukuran (foto base64 besar)
1. Kompres agresif saat ambil: 320×320 JPEG q0.6, ≤40 KB, cap keras 60 KB.
2. Foto di key terpisah `tk_att_photos` — table/riwayat parse cepat, foto dimuat on-demand per dialog saja.
3. Referensi by-id (`att_...`), bukan inline — satu foto satu slot per jenis per record.
4. Pemetaan batas: ~40 KB × 2 foto/hari/pegawai × 2 pegawai ≈ 160 KB/hari. localStorage ~5 MB → **±30 hari** riwayat berfoto. Pruning otomatis: foto record lebih tua dari 30 hari dihapus (record tetap ada, foto hilang → thumbnail jadi ikon `ImageOff`), dan admin bisa "Bersihkan foto lama" di Pengaturan.
5. Jika suatu saat perlu lebih, jalur migrasi sudah disebut di store.js: adapter GAS/Supabase — foto jadi upload file, localStorage hanya menyimpan URL.

---

## File yang tersentuh (desain, bukan implementasi)
| File | Perubahan |
|---|---|
| `src/lib/session.js` | baru: getSession/setSession/clearSession/isAdmin |
| `src/lib/geo.js` | baru: haversineM, inRadius, getStatus |
| `src/lib/photo.js` | baru: kamera → canvas → JPEG terkompresi, fallback file |
| `src/pages/Attendance.jsx` | split alur pegawai vs admin, dialog verifikasi foto+GPS |
| `src/pages/Settings.jsx` | kartu Lokasi Kantor + PIN admin + setelan foto |
| `src/pages/Employees.jsx` | field username (generate + edit) |
| `src/lib/auth.js` | tambah verifyUsername(username, pin) |
| `src/lib/store.js` | migrasi: employees.username, settings GPS |
---

## Lampiran implementasi (keputusan aktual, 2026-11-12, branch feat/absensi-v2)

Implementasi mengikuti spec di atas dengan penyederhanaan berikut (disetujui scope task):

- **Login**: PIN 4–6 angka, username wajib unik diatur admin (tidak auto-generate, tidak ada adminPin — tanpa sesi = mode admin, sesuai pola repo). Sesi `tk_session` tanpa TTL (keluar manual).
- **Foto**: inline dataURL pada record `tk_attendance` (bukan key terpisah), kompresi target 150 KB (lebih longgar dari 40 KB spec, masih aman localStorage), sisi maks 1024 px. `photoSource` tidak dipakai.
- **Lokasi**: status disederhanakan — di luar radius = absen DITOLAK (tegas, bukan flag `outOfRadius`), tanpa GPS/izin ditolak = absen gagal dengan pesan saran. Koordinat toko wajib diatur dulu (tanpa itu, absen diminta mengatur dulu).
- Helper: `src/lib/session.js` (getSession/loginPegawai/logout), `src/lib/absen.js` (jarakMeter haversine, fmtJarak, linkMaps, ambilLokasi, kompresFoto).
- Copywriting: konsisten "Anda", format id-ID, pesan error teknis diterjemahkan + saran tindakan. Detail di bagian atas dokumen ini pada file `docs/absensi-v2-spec.md` versi implementasi... (lihat commit message dan komentar file).
