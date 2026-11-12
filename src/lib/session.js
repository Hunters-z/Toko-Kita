// Sesi login per peran: admin (PIN admin) & pegawai (username + PIN).
// localStorage: tk_admin_session = {role:'admin', loginAt}
//               tk_session       = {role:'pegawai', employeeId, loginAt}
// Sesi lama tanpa role dianggap pegawai (kompatibel data lama).

const ADMIN_KEY = 'tk_admin_session'
const EMP_KEY = 'tk_session'
const DEFAULT_ADMIN_PIN = '1234'

function readKey(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

export function getAdminSession() {
  const s = readKey(ADMIN_KEY)
  return s?.role === 'admin' ? s : null
}

// Sesi pegawai valid hanya jika pegawainya masih ada di database.
// Sesi korup/kedaluwarsa dihapus otomatis (dianggap habis).
export function getPegawaiSession(db) {
  const s = readKey(EMP_KEY)
  if (!s) return null
  const role = s.role || 'pegawai'
  if (role !== 'pegawai') return null
  const emp = db?.employees?.find(e => e.id === s.employeeId)
  if (!emp) { localStorage.removeItem(EMP_KEY); return null }
  return { ...s, role: 'pegawai', employeeId: emp.id }
}

// Sesi gabungan apa pun yang aktif (untuk cek "sudah login" di /login).
export function getSession(db) {
  return getAdminSession() || getPegawaiSession(db)
}

export function loginAdmin(pin, db) {
  const saved = db.settings?.adminPin || DEFAULT_ADMIN_PIN
  if (String(pin).trim() !== String(saved)) return false
  localStorage.setItem(ADMIN_KEY, JSON.stringify({ role: 'admin', loginAt: new Date().toISOString() }))
  return true
}

export function loginPegawai(username, pin, db) {
  const emp = db.employees.find(
    e => e.username && e.username.toLowerCase() === String(username).trim().toLowerCase()
  )
  if (!emp || String(emp.pin || '') !== String(pin).trim()) return null
  localStorage.setItem(EMP_KEY, JSON.stringify({ role: 'pegawai', employeeId: emp.id, loginAt: new Date().toISOString() }))
  return emp
}

export function logoutAdmin() { localStorage.removeItem(ADMIN_KEY) }
export function logoutPegawai() { localStorage.removeItem(EMP_KEY) }
// Keluar dari semua peran (dipakai tombol logout di kedua layout).
export function logout() { logoutAdmin(); logoutPegawai() }
