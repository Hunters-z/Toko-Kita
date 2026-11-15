// Toko Kita — Database Adapter: localStorage <-> Google Apps Script (Sheets)
// -----------------------------------------------------------------------
// 1. Konfigurasi di halaman Pengaturan → aktifkan "Hubungkan ke Google Sheets".
// 2. Deploy ulang Google Apps Script Anda, lalu salin URL Web App-nya ke kolom URL.
// 3. Pilih cara sinkronisasi (manual atau otomatis saat aplikasi dibuka).
//
// CATATAN KEAMANAN & KEPERCAYAAN DATA:
// - Data yang di-push ke Google Sheets akan ditimpa oleh pull jika pull dilakukan lebih dari satu perangkat.
// - Disarankan untuk selalu melakukan backup lokal sebelum mengaktifkan fitur ini.