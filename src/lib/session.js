// Sesi pegawai: login username + PIN per orang, tersimpan di localStorage.
// Sesi aktif: { employeeId, loginAt } — pegawai melihat data sendiri,
// tanpa sesi = mode admin (melihat semua).

const KEY = 'tk_session'

export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function loginPegawai(username, pin, employees) {
  const emp = employees.find(
    e => e.username && e.username.toLowerCase() === String(username).trim().toLowerCase()
  )
  if (!emp || String(emp.pin || '') !== String(pin).trim()) return null
  const s = { employeeId: emp.id, loginAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(s))
  return emp
}

export function logout() { localStorage.removeItem(KEY) }
