// Absensi Pegawai — check-in/check-out, status Hadir/Terlambat/Izin, riwayat.
// Data: localStorage key tk_attendance (format spec docs/fitur-baru-spec.md),
// terpisah dari db utama agar lama-tetap-jalan; shiftStart dari db.settings.
import { useMemo, useState } from 'react'
import { loadDB, saveDB, uid } from '../lib/store.js'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import {
  CalendarCheck, Plus, CheckCircle2, Clock, CalendarOff, LogIn, LogOut, Fingerprint,
} from 'lucide-react'

const KEY = 'tk_attendance'
const DEFAULT_SHIFT = '08:00'
const lateMinutes = (dateISO, shiftStart) => {
  const [h, m] = (shiftStart || DEFAULT_SHIFT).split(':').map(Number)
  const d = new Date(dateISO)
  const limit = new Date(d); limit.setHours(h, m, 0, 0)
  return Math.max(0, Math.round((d - limit) / 60000))
}
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const loadAtt = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const durasi = (a) => {
  if (!a?.checkIn) return ''
  const t1 = new Date(a.checkIn).getTime()
  const t2 = a.checkOut ? new Date(a.checkOut).getTime() : Date.now()
  const mins = Math.max(0, Math.round((t2 - t1) / 60000))
  return `${Math.floor(mins/60)}j ${mins%60}m`
}
const StatusBadge = ({status, note}) => {
  if (status === 'hadir') return <Badge variant="success" className="gap-1"><Icon as={CheckCircle2} size="sm" strokeWidth={1.5}/> Hadir</Badge>
  if (status === 'terlambat') return <Badge className="gap-1 bg-gold-soft text-gold border-0"><Icon as={Clock} size="sm" strokeWidth={1.5}/> Terlambat{note ? ` ${note}` : ''}</Badge>
  return <Badge variant="outline" className="gap-1 text-inksoft"><Icon as={CalendarOff} size="sm" strokeWidth={1.5}/> Izin</Badge>
}

export default function Attendance() {
  const [att, setAtt] = useState(loadAtt())
  const [izinOpen, setIzinOpen] = useState(false)
  const [izin, setIzin] = useState({ employeeId: '', date: todayKey(), note: '' })
  const db = loadDB()
  const shiftStart = db.settings?.shiftStart || DEFAULT_SHIFT
  const today = todayKey()

  const persist = next => { saveDB2(next); setAtt(next) }
  const saveDB2 = next => localStorage.setItem(KEY, JSON.stringify(next))

  const recordsToday = useMemo(() =>
    db.employees.map(e => ({ emp: e, rec: att.find(a => a.employeeId === e.id && a.date === today) }))
  , [att, db, today])

  const checkIn = emp => {
    if (att.some(a => a.employeeId === emp.id && a.date === today)) return
    const nowISO = new Date().toISOString()
    const late = lateMinutes(nowISO, shiftStart)
    const rec = {
      id: uid('att_'), employeeId: emp.id, date: today,
      checkIn: nowISO, checkOut: null,
      status: late > 0 ? 'terlambat' : 'hadir',
      note: '', lateMinutes: late,
    }
    persist([...att, rec])
    const jam = new Date(nowISO).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    toast({ title: `${emp.name} check-in ${jam}${late > 0 ? ` (terlambat ${late} mnt)` : ''}` })
  }
  const checkOut = emp => {
    const rec = att.find(a => a.employeeId === emp.id && a.date === today)
    if (!rec || rec.checkOut) return
    persist(att.map(a => a.id === rec.id ? { ...a, checkOut: new Date().toISOString() } : a))
    toast({ title: `${emp.name} check-out ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` })
  }
  const catatIzin = () => {
    if (!izin.employeeId) return
    const rec = {
      id: uid('att_'), employeeId: izin.employeeId, date: izin.date,
      checkIn: null, checkOut: null, status: 'izin', note: izin.note, lateMinutes: 0,
    }
    persist([...att, rec])
    setIzinOpen(false); setIzin({ employeeId: '', date: todayKey(), note: '' })
    toast({ title: 'Izin dicatat' })
  }

  const empName = id => db.employees.find(e => e.id === id)?.name || '?'
  const history = [...att].sort((a, b) => (b.checkIn || b.date) < (a.checkIn || a.date) ? 1 : -1).reverse()

  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Icon as={CalendarCheck} size="lg" className="text-hero" />
          <h1 className="font-disp text-lg md:text-xl font-extrabold">Absensi Pegawai</h1>
        </div>
        <Dialog open={izinOpen} onOpenChange={setIzinOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto rounded-full gap-2"><Icon as={Plus} size="sm" strokeWidth={1.5}/> Catat Izin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Izin</DialogTitle>
              <DialogDescription>Rekam hari izin pegawai (status tidak hadir).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Pegawai</Label>
                <Select value={izin.employeeId} onValueChange={v => setIzin({ ...izin, employeeId: v })}>
                  <SelectTrigger><SelectValue placeholder="— pilih pegawai —" /></SelectTrigger>
                  <SelectContent>
                    {db.employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={izin.date} onChange={e => setIzin({ ...izin, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Keterangan</Label>
                <Textarea placeholder="Alasan izin…" value={izin.note} onChange={e => setIzin({ ...izin, note: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={catatIzin} disabled={!izin.employeeId}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="hari-ini">
        <TabsList>
          <TabsTrigger value="hari-ini">Hari Ini</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="hari-ini">
          <div className="grid sm:grid-cols-2 gap-3 mt-1">
            {recordsToday.map(({ emp, rec }) => (
              <div key={emp.id} className={'card p-5' + (rec && !rec.checkOut && rec.status !== 'izin' ? ' border-hero border-2' : '')}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-hero-soft text-hero grid place-items-center font-bold text-xs">{emp.name.slice(0,2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <b className="text-[14px] block truncate">{emp.name}</b>
                    <div className="text-[12px] text-inksoft">
                      {emp.role}
                      {rec?.checkIn && rec.status !== 'izin' && ` · Masuk ${new Date(rec.checkIn).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`}
                    </div>
                  </div>
                  <div className="ml-auto">
                    {rec?.status === 'terlambat' && <StatusBadge status="terlambat" note={`${rec.lateMinutes} mnt`} />}
                    {rec?.status === 'hadir' && <StatusBadge status="hadir" />}
                    {rec?.status === 'izin' && <StatusBadge status="izin" />}
                    {!rec && <Badge variant="outline" className="text-inksoft">Belum absen</Badge>}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {!rec && (
                    <Button onClick={() => checkIn(emp)} className="flex-1 gap-2"><Icon as={LogIn} size="md" /> Check-in</Button>
                  )}
                  {rec && rec.status !== 'izin' && !rec.checkOut && (
                    <Button onClick={() => checkOut(emp)} variant="outline" className="flex-1 gap-2"><Icon as={LogOut} size="md" /> Check-out</Button>
                  )}
                  {rec?.checkOut && <span className="text-[12.5px] text-inksoft">Pulang {new Date(rec.checkOut).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} · <b className="text-ink">{durasi(rec)}</b></span>}
                  {rec?.status === 'izin' && rec.note && <span className="text-[12px] text-inksoft italic truncate">{rec.note}</span>}
                </div>
              </div>
            ))}
            {!db.employees.length && <p className="text-inksoft text-[13px]">Belum ada pegawai. Tambah di menu Pegawai.</p>}
          </div>
          <p className="text-[11.5px] text-dim mt-4">Terlambat otomatis jika check-in lewat jam mulai shift ({shiftStart}). Shift bisa diubah di Pengaturan.</p>
        </TabsContent>

        <TabsContent value="riwayat">
          <div className="card p-0 overflow-hidden mt-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead><TableHead>Pegawai</TableHead><TableHead>Masuk</TableHead>
                  <TableHead>Keluar</TableHead><TableHead>Durasi</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-inksoft py-6">Belum ada riwayat absensi.</TableCell></TableRow>}
                {history.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.date}</TableCell>
                    <TableCell><b>{empName(a.employeeId)}</b></TableCell>
                    <TableCell>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '—'}</TableCell>
                    <TableCell>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '—'}</TableCell>
                    <TableCell>{a.status === 'izin' ? '—' : durasi(a)}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} note={a.status === 'terlambat' && a.lateMinutes ? `${a.lateMinutes} mnt` : ''} />
                      {a.note && <div className="text-[11px] text-dim mt-0.5">{a.note}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
