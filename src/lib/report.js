// Laporan ringkas: hitung on-render dari data transaksi & pengeluaran existing.
// Periode "day" = hari ini, "week" = Senin-Minggu berjalan (lokal).
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

function startOfWeek(now) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Senin
  return d
}
function endOfWeek(now) {
  const d = startOfWeek(now)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function inPeriod(dateStr, from, to) {
  const d = new Date(dateStr)
  if (isNaN(d)) return false
  return d >= from && d <= to
}

// Laba kotor per item = (price jual - cost modal) * qty. cost opsional, default 0.
export function summarize(transactions = [], expenses = [], period = 'day', now = new Date()) {
  const from = period === 'week' ? startOfWeek(now) : (() => { const d = new Date(now); d.setHours(0,0,0,0); return d })()
  const to = period === 'week' ? endOfWeek(now) : (() => { const d = new Date(now); d.setHours(23,59,59,999); return d })()
  const yFrom = new Date(from); yFrom.setDate(yFrom.getDate() - 1)
  const yTo = new Date(to); yTo.setDate(yTo.getDate() - 1)

  const txs = transactions.filter(t => inPeriod(t.date, from, to))
  const omzet = txs.reduce((s, t) => s + (t.total || 0), 0)
  const labaKotor = txs.reduce((s, t) => s + (t.items || []).reduce((a, i) => a + ((i.price - (i.cost || 0)) * i.qty), 0), 0)
  const itemTerjual = txs.reduce((s, t) => s + (t.items || []).reduce((a, i) => a + i.qty, 0), 0)
  const pengeluaran = expenses
    .filter(x => inPeriod(x.at || x.date, from, to))
    .reduce((s, x) => s + (x.amount || 0), 0)

  // delta omzet vs kemarin (untuk tab "day")
  const yTxs = transactions.filter(t => inPeriod(t.date, yFrom, yTo))
  const omzetKemarin = yTxs.reduce((s, t) => s + (t.total || 0), 0)
  const deltaVsKemarin = omzetKemarin > 0 ? Math.round(((omzet - omzetKemarin) / omzetKemarin) * 100) : null

  return {
    omzet, labaKotor, pengeluaran,
    labaBersih: labaKotor - pengeluaran,
    jumlahTransaksi: txs.length,
    itemTerjual,
    deltaVsKemarin,
  }
}

// Rupiah singkat: Rp 1,2jt / Rp 480rb / Rp 9.500
export function rpShort(n) {
  n = Math.round(n || 0)
  const abs = Math.abs(n)
  if (abs >= 1e9) return 'Rp ' + (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'M'
  if (abs >= 1e6) return 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt'
  if (abs >= 1e3) return 'Rp ' + (n / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'rb'
  return 'Rp ' + n.toLocaleString('id-ID')
}
