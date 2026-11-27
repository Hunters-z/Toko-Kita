// Izin / Cuti — karyawan ajukan, admin approve/reject.
// Data: localStorage 'tk_leaves' = [{id, employeeId, type, startDate, endDate, days, reason, status, createdAt, decidedAt, decidedBy}]
import { useState, useEffect, useMemo } from 'react'
import { loadDB, saveDB, uid, rp } from '../lib/store.js'
import { getAdminSession, getPegawaiSession } from '../lib/session.js'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import { CalendarClock, CheckCircle2, XCircle, Clock, Send, Plane, FileText } from 'lucide-react'

const KEY = 'tk_leaves'
const loadLeaves = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const persist = next => localStorage.setItem(KEY, JSON.stringify(next))

const TYPES = [
  ['izin', 'Izin Pribadi'],
  ['cuti', 'Cuti Tahunan'],
  ['sakit', 'Sakit (wajib surat dokter)'],
  ['dinas', 'Dinas Luar'],
]

const todayStr = () => new Date().toISOString().slice(0, 10)
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

function StatusBadge({ status }) {
  if (status === 'disetujui') return <Badge variant="success" className="gap-1"><Icon as={CheckCircle2} size="sm" /> Disetujui</Badge>
  if (status === 'ditolak') return <Badge variant="destructive" className="gap-1"><Icon as={XCircle} size="sm" /> Ditolak</Badge>
  return <Badge className="gap-1 bg-gold-soft text-gold border-0"><Icon as={Clock} size="sm" /> Menunggu</Badge>
}

export default function IzinCuti() {
  const db = loadDB()
  const admin = getAdminSession()
  const pegawai = getPegawaiSession(db)
  const me = admin ? null : db.employees.find(e => e.id === pegawai?.employeeId)

  const [leaves, setLeaves] = useState(loadLeaves)
  const [form, setForm] = useState({ type: 'izin', startDate: todayStr(), endDate: todayStr(), reason: '' })

  // simpan ke storage bila berubah
  useEffect(() => { persist(leaves) }, [leaves])

  const myLeaves = useMemo(
    () => admin ? [...leaves].sort((a, b) => (b.createdAt || '') < (a.createdAt || '') ? -1 : 1)
      : leaves.filter(l => l.employeeId === me?.id).sort((a, b) => (b.createdAt || '') < (a.createdAt || '') ? -1 : 1),
    [leaves, admin, me]
  )
  const pending = myLeaves.filter(l => l.status === 'menunggu').length

  const days = (() => {
    const s = new Date(form.startDate), e = new Date(form.endDate)
    if (isNaN(s) || isNaN(e) || e < s) return 0
    return Math.round((e - s) / 86400000) + 1
  })()

  const submit = e => {
    e.preventDefault()
    if (!me) return
    if (!form.reason.trim()) { toast({ title: 'Alasan wajib diisi', variant: 'destructive' }); return }
    if (days <= 0) { toast({ title: 'Tanggal tidak valid', description: 'Tanggal selesai harus sama atau setelah tanggal mulai.', variant: 'destructive' }); return }
    // tolak double-apply pada rentang yang sama & masih menunggu
    const clash = leaves.some(l => l.employeeId === me.id && l.status === 'menunggu' &&
      !(new Date(form.endDate) < new Date(l.startDate) || new Date(form.startDate) > new Date(l.endDate)))
    if (clash) { toast({ title: 'Sudah ada ajuan menunggu di rentang tanggal ini', variant: 'destructive' }); return }
    const rec = {
      id: uid('lv_'), employeeId: me.id, type: form.type,
      startDate: form.startDate, endDate: form.endDate, days,
      reason: form.reason.trim(), status: 'menunggu',
      createdAt: new Date().toISOString(),
    }
    setLeaves(prev => [rec, ...prev])
    setForm({ type: 'izin', startDate: todayStr(), endDate: todayStr(), reason: '' })
    toast({ title: 'Ajuan terkirim', description: 'Menunggu persetujuan admin.' })
  }

  const decide = (id, status) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status, decidedAt: new Date().toISOString() } : l))
    toast({ title: status === 'disetujui' ? 'Ajuan disetujui' : 'Ajuan ditolak' })
  }

  const empName = id => db.employees.find(e => e.id === id)?.name || '?'
  const typeLabel = t => TYPES.find(([k]) => k === t)?.[1] || t

  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Icon as={Plane} size="lg" className="text-blue-600" />
          <h1 className="font-disp text-lg md:text-xl font-extrabold text-slate-900">Izin / Cuti</h1>
        </div>
        {pending > 0 && <span className="bg-gold-soft text-gold text-[11px] font-semibold px-2.5 py-0.5 rounded-full">{pending} menunggu</span>}
      </div>

      {/* FORM — hanya karyawan */}
      {!admin && me && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <h3 className="font-disp font-bold text-[14.5px] text-slate-900">Ajukan Izin / Cuti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Jenis</Label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13.5px] outline-none focus:border-blue-500">
                {TYPES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Durasi</Label>
              <div className="text-[13px] text-slate-500 h-10 flex items-center">{days > 0 ? `${days} hari` : '—'}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Mulai</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Selesai</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} min={form.startDate} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700">Alasan</Label>
            <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="cth. acara keluarga / kontrol dokter" />
          </div>
          <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Icon as={Send} size="sm" /> Kirim ajuan</Button>
        </form>
      )}

      {/* RIWAYAT */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-disp font-bold text-[14.5px] mb-3 text-slate-900">{admin ? 'Semua Ajuan Karyawan' : 'Riwayat Ajuan Saya'}</h3>
        {myLeaves.length === 0 && <p className="text-slate-500 text-[13px]">Belum ada ajuan.</p>}
        {myLeaves.map(l => (
          <div key={l.id} className="py-3 border-b border-slate-100 last:border-0">
            <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
              <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0"><Icon as={FileText} size="sm" /></span>
              <div className="min-w-0">
                {admin && <b className="block text-slate-900">{empName(l.employeeId)}</b>}
                <span className="text-slate-600">{typeLabel(l.type)} · {fmtDate(l.startDate)}{l.endDate !== l.startDate ? ` → ${fmtDate(l.endDate)}` : ''} · {l.days} hari</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusBadge status={l.status} />
                {admin && l.status === 'menunggu' && (
                  <span className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 rounded-full text-[11px] gap-1 text-green-700 hover:bg-green-50" onClick={() => decide(l.id, 'disetujui')}><Icon as={CheckCircle2} size="sm" /> Setujui</Button>
                    <Button size="sm" variant="outline" className="h-7 rounded-full text-[11px] gap-1 text-red-600 hover:bg-red-50" onClick={() => decide(l.id, 'ditolak')}><Icon as={XCircle} size="sm" /> Tolak</Button>
                  </span>
                )}
              </div>
              {l.reason && <p className="w-full text-[12px] text-slate-500 pl-[46px]">"{l.reason}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
