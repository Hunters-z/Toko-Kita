// Helper absensi v2: jarak lokasi, kompres foto, format Indonesia.

// Jarak dua titik koordinat dalam meter (rumus haversine).
export function jarakMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const rad = d => d * Math.PI / 180
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 +
    Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLng/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}

// Format jarak gaya Indonesia: "230 m", "1,2 km".
export function fmtJarak(m) {
  if (m == null) return '—'
  if (m < 1000) return `${m} m`
  return `${(m/1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`
}

export function linkMaps(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// Ambil posisi saat ini. Promise: {lat, lng, accuracy} atau lempar Error berbahasa awam.
export function ambilLokasi() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Perangkat ini tidak mendukung pencarian lokasi (GPS). Aktifkan layanan lokasi atau gunakan perangkat lain.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0) }),
      err => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error('Izin lokasi ditolak. Izinkan akses lokasi di pengaturan browser, lalu coba lagi.'))
        else if (err.code === err.POSITION_UNAVAILABLE) reject(new Error('Lokasi tidak bisa dideteksi. Pastikan GPS/Wi-Fi aktif, lalu coba lagi.'))
        else reject(new Error('Pencarian lokasi lama merespons. Coba lagi di tempat terbuka.'))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  })
}

// Kompres sumber gambar (blob/dataURL) ke JPEG berukuran ~150KB.
// Sumber: File/Blob (upload fallback) atau dataURL (kamera canvas).
async function sumberKeDataUrl(sumber) {
  if (typeof sumber === 'string') return sumber
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Foto tidak bisa dibaca. Coba ambil ulang.'))
    r.readAsDataURL(sumber)
  })
}

export async function kompresFoto(sumber, targetBytes = 150 * 1024) {
  const dataUrl = await sumberKeDataUrl(sumber)
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Foto tidak valid. Ambil selfie ulang atau pilih file lain.'))
    i.src = dataUrl
  })
  const w0 = img.width, h0 = img.height
  const maksSisi = 1024
  let skala = Math.min(1, maksSisi / Math.max(w0, h0))
  // Turunkan kualitas bertahap sampai muat target atau batas bawah kualitas.
  for (let q = 0.8; q >= 0.3; q -= 0.1) {
    const c = document.createElement('canvas')
    c.width = Math.round(w0 * skala)
    c.height = Math.round(h0 * skala)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    const out = c.toDataURL('image/jpeg', q)
    if (out.length * 0.75 <= targetBytes) return out
    if (q <= 0.4 && skala > 0.6) { skala *= 0.75; q = 0.75 } // kecilkan dimensi, ulangi kualitas
  }
  const c = document.createElement('canvas')
  c.width = Math.round(w0 * skala); c.height = Math.round(h0 * skala)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.3)
}
