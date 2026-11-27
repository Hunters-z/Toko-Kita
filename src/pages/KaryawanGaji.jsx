// Slip Gaji — dihitung otomatis dari absensi (hadir/terlambat/izin) × gaji harian per jabatan.
// Data: localStorage 'tk_salaries' opsional override; default rate per role.
import { useState, useMemo } from 'react'
import { loadDB, rp } from '../lib/store.js'
import { getAdminSession, getPegawaiSession } from '../lib/session.js'
import { Icon } from '@/components/ui/icon.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import { Banknote, CalendarCheck, Clock, Plane, Download } from 'lucide-react'

const KEY = 'tk_salaries'
const loadRates = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
const saveRates = r => localStorage.setItem(KEY, JSON.stringify(r))

// gaji harian default per jabatan (rupiah)
const DEFAULT_RATE = { Kasir: 120000, Gudang: 110000, Manager: 220000 }
const rateOf = (emp, rates) => Number(rates[emp.role] ?? DEFAULT_RATE[emp.role] ?? 100000)

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const now = new Date()
const CUR = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export default function SlipGaji() {
  const db = loadDB()
  const admin = getAdminSession()
  const pegawai = getPegawaiSession(db)
  const me = admin ? null : db.employees.find(e => e.id === pegawai?.employeeId)

  const [rates, setRates] = useState(loadRates)
  const [month, setMonth] = useState(CUR)
  const [edits, setEdits] = useState({}) // {empId: {bonus, potongan}}

  const att = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('tk_attendance')) || [] } catch { return [] }
  }, [month])

  const employees = admin ? db.employees : (me ? [me] : [])

  const calc = emp => {
    const monthAtt = att.filter(a => a.employeeId === emp.id && (a.date || '').startsWith(month))
    const hadir = monthAtt.filter(a => a.status === 'hadir' || a.status === 'terlambat').length
    const telat = monthAtt.filter(a => a.status === 'terlambat').length
    const izin = monthAtt.filter(a => a.status === 'izin').length
    const rate = rateOf(emp, rates)
    const bonus = Number(edits[emp.id]?.bonus || 0)
    const potongan = Number(edits[emp.id]?.potongan || 0) + telat * 10000 // denda telat Rp10rb
    const total = hadir * rate + bonus - potongan
    return { hadir, telat, izin, rate, bonus, potongan, total }
  }

  const setRate = (role, val) => {
    const next = { ...rates, [role]: Number(val || 0) }
    setRates(next); saveRates(next)
  }

  const downloadSlip = emp => {
    const c = calc(emp)
    const txt = [
      `SLIP GAJI — ${db.settings?.shopName || 'Toko Kita'}`,
      `Periode: ${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`,
      `Karyawan: ${emp.name} (${emp.role})`,
      '',
      `Hadir: ${c.hadir} hari × ${rp(c.rate)} = ${rp(c.hadir * c.rate)}`,
      `Terlambat: ${c.telat} kali (denda ${rp(c.telat * 10000)})`,
      `Izin: ${c.izin} hari (unpaid)`,
      `Bonus: ${rp(c.bonus)}`,
      `Potongan lain: ${rp(Number(edits[emp.id]?.potongan || 0))}`,
      '',
      `TOTAL GAJI: ${rp(c.total)}`,
    ].join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slip-gaji-${emp.name.replace(/\s+/g, '-').toLowerCase()}-${month}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Slip diunduh' })
  }

  const monthLabel = `${MONTHS[Number(month.slice(5)) - 1] || ''} ${month.slice(0, 4)}`

  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Icon as={Banknote} size="lg" className="text-blue-600" />
          <h1 className="font-disp text-lg md:text-xl font-extrabold text-slate-900">Slip Gaji</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40 h-9" />
        </div>
      </div>
      <p className="text-[12.5px] text-slate-500 -mt-3">
        Gaji dihitung otomatis dari data absensi bulan <b className="text-slate-700">{monthLabel}</b> · denda keterlambatan Rp10.000/kali · izin tidak dibayar.
      </p>

      {/* Rate per jabatan — admin saja */}
      {admin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-disp font-bold text-[14.5px] mb-3 text-slate-900">Gaji Harian per Jabatan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...new Set([...db.employees.map(e => e.role), ...Object.keys(DEFAULT_RATE)])].filter(Boolean).map(role => (
              <div key={role} className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-600">{role}</label>
                <Input type="number" value={rates[role] ?? DEFAULT_RATE[role] ?? 100000} onChange={e => setRate(role, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slip per karyawan */}
      {employees.length === 0 && <p className="text-slate-500 text-[13px]">Belum ada data pegawai.</p>}
      {employees.map(emp => {
        const c = calc(emp)
        return (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white grid place-items-center font-bold text-xs">{emp.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <b className="text-[14px] text-slate-900 block">{emp.name}</b>
                <span className="text-[12px] text-slate-500">{emp.role} · {rp(c.rate)}/hari</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-disp font-extrabold text-lg text-blue-600">{rp(c.total)}</span>
                <Button size="sm" variant="outline" className="h-8 rounded-full gap-1.5" onClick={() => downloadSlip(emp)}>
                  <Icon as={Download} size="sm" /> Unduh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Icon as={CalendarCheck} size="sm" /> Hadir</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{c.hadir} <span className="text-[11px] font-medium text-slate-400">hari</span></div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Icon as={Clock} size="sm" /> Terlambat</div>
                <div className="text-lg font-extrabold text-gold mt-0.5">{c.telat} <span className="text-[11px] font-medium text-slate-400">kali</span></div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Icon as={Plane} size="sm" /> Izin</div>
                <div className="text-lg font-extrabold text-slate-500 mt-0.5">{c.izin} <span className="text-[11px] font-medium text-slate-400">hari</span></div>
              </div>
            </div>

            {admin && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-600">Bonus (Rp)</label>
                  <Input type="number" placeholder="0" value={edits[emp.id]?.bonus ?? ''} onChange={e => setEdits({ ...edits, [emp.id]: { ...edits[emp.id], bonus: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-600">Potongan lain (Rp)</label>
                  <Input type="number" placeholder="0" value={edits[emp.id]?.potongan ?? ''} onChange={e => setEdits({ ...edits, [emp.id]: { ...edits[emp.id], potongan: e.target.value } })} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
