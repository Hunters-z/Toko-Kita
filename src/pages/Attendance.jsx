// Absensi Pegawai v2 — login pegawai per-orang, selfie kamera, cek lokasi kantor.
// Data: localStorage key tk_attendance; rekaman: {id, employeeId, date, checkIn,
// checkOut, status, note, lateMinutes, photoIn, photoOut, latIn, lngIn, distIn, distOut}
// Sesi: tk_session (lihat lib/session.js). Tanpa sesi = mode admin (lihat semua).
import { useMemo, useState } from 'react'
import { loadDB, saveDB, uid } from '../lib/store.js'
import { getSession, loginPegawai, logout } from '../lib/session.js'
import { ambilLokasi, jarakMeter, fmtJarak, linkMaps, kompresFoto } from '../lib/absen.js'
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
  Camera, MapPin, CircleAlert, ScanFace, Upload, RefreshCw,
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
const jamFmt = iso => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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
const RadiusBadge = ({ dist, radius }) => {
  if (dist == null) return <Badge variant="outline" className="text-inksoft text-[10px]">tanpa lokasi</Badge>
  return dist <= radius
    ? <Badge variant="success" className="text-[10px] gap-1"><Icon as={MapPin} size="sm" strokeWidth={1.5}/> dalam radius · {fmtJarak(dist)}</Badge>
    : <Badge className="bg-coral/15 text-coral border-0 text-[10px] gap-1"><Icon as={CircleAlert} size="sm" strokeWidth={1.5}/> luar radius · {fmtJarak(dist)}</Badge>
}

// ---------- Dialog Selfie: kamera getUserMedia + fallback upload file ----------
function SelfieDialog({ open, onOpenChange, title, onSubmit }) {
  const [stream, setStream] = useState(null)
  const [err, setErr] = useState('')
  const [shot, setShot] = useState(null)
  const [busy, setBusy] = useState(false)
  const videoRef = useState(() => ({ current: null }))[0]

  const startCam = async () => {
    setErr(''); setShot(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('Perangkat ini tidak mendukung kamera browser. Silakan unggah foto selfie sebagai gantinya.')
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setStream(s)
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(()=>{}) }
    } catch (e) {
      if (e.name === 'NotAllowedError') setErr('Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, atau unggah foto selfie.')
      else if (e.name === 'NotFoundError') setErr('Kamera tidak ditemukan di perangkat ini. Silakan unggah foto selfie.')
      else setErr('Kamera tidak bisa dibuka. Tutup aplikasi lain yang memakai kamera, atau unggah foto selfie.')
    }
  }
  const stopCam = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null) }
  const capture = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    setShot(c.toDataURL('image/jpeg', 0.9))
    stopCam()
  }
  const pilihFile = async e => {
    const f = e.target.files?.[0]; if (!f) return
    setErr('')
    try { setShot(await kompresFoto(f)); } catch (err) { setErr(err.message) }
  }
  const ulang = () => { setShot(null); startCam() }
  const kirim = async () => {
    if (!shot) return
    setBusy(true)
    try { await onSubmit(shot) } finally { setBusy(false); setShot(null); setErr(''); onOpenChange(false) }
  }
  const tutup = o => { if (!o) { stopCam(); setShot(null); setErr('') } onOpenChange(o) }

  return (
    <Dialog open={open} onOpenChange={tutup}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Icon as={ScanFace} size="md" className="text-hero"/> {title}</DialogTitle>
          <DialogDescription>Seluruh wajah terlihat jelas di foto — foto tersimpan sebagai bukti kehadiran di perangkat ini.</DialogDescription>
        </DialogHeader>
        {err && <p className="text-[12.5px] text-coral font-semibold">{err}</p>}
        {shot ? (
          <div className="space-y-3">
            <img src={shot} alt="Pratinjau selfie" className="rounded-xl w-full max-h-72 object-cover border border-line"/>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={ulang}><Icon as={RefreshCw} size="md"/> Ambil ulang</Button>
              <Button className="flex-1" onClick={kirim} disabled={busy}>{busy ? 'Menyimpan…' : 'Pakai foto ini'}</Button>
            </div>
          </div>
        ) : stream ? (
          <div className="space-y-3">
            <video ref={videoRef} playsInline muted className="rounded-xl w-full max-h-72 object-cover border border-line bg-black"/>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={capture}><Icon as={Camera} size="md"/> Ambil foto</Button>
              <Button variant="outline" onClick={stopCam}>Matikan kamera</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-40 rounded-xl border-2 border-dashed border-line grid place-items-center text-inksoft text-[13px] text-center px-6">
              Kamera belum menyala. Tekan "Nyalakan kamera", atau unggah foto dari galeri bila kamera tidak tersedia.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1 gap-2" onClick={startCam}><Icon as={Camera} size="md"/> Nyalakan kamera</Button>
              <label className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-semibold cursor-pointer hover:bg-card2">
                <Icon as={Upload} size="md" strokeWidth={1.5}/> Unggah foto
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={pilihFile}/>
              </label>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function Attendance() {
  const [att, setAtt] = useState(loadAtt())
  const [izinOpen, setIzinOpen] = useState(false)
  const [izin, setIzin] = useState({ employeeId: '', date: todayKey(), note: '' })
  const [session, setSession] = useState(getSession())
  const [loginForm, setLoginForm] = useState({ username: '', pin: '' })
  const [loginErr, setLoginErr] = useState('')
  const [selfie, setSelfie] = useState(null) // {mode:'in'|'out', emp}
  const [geoStatus, setGeoStatus] = useState('') // status lokasi saat login
  const db = loadDB()
  const shiftStart = db.settings?.shiftStart || DEFAULT_SHIFT
  const today = todayKey()
  const radius = db.settings?.officeRadius ?? 100
  const office = db.settings?.officeLat != null
    ? { lat: db.settings.officeLat, lng: db.settings.officeLng } : null

  const persist = next => { saveDB2(next); setAtt(next) }
  const saveDB2 = next => localStorage.setItem(KEY, JSON.stringify(next))

  const me = session ? db.employees.find(e => e.id === session.employeeId) : null
  const admin = !session // tanpa sesi login = mode admin

  // Cek jarak saat halaman dibuka (info, validasi ulang saat absen)
  useMemo(() => {
    if (!office) { setGeoStatus(''); return }
    setGeoStatus('Memeriksa lokasi…')
    ambilLokasi()
      .then(({ lat, lng }) => {
        const d = jarakMeter(lat, lng, office.lat, office.lng)
        setGeoStatus(d <= radius
          ? `Lokasi OK — ${fmtJarak(d)} dari toko (radius ${fmtJarak(radius)})`
          : `Anda ${fmtJarak(d)} dari toko — absen akan ditolak (radius ${fmtJarak(radius)})`)
      })
      .catch(() => setGeoStatus('Lokasi belum terdeteksi — pastikan GPS aktif.'))
  }, [office?.lat, office?.lng, radius])

  const doLogin = e => {
    e.preventDefault()
    const emp = loginPegawai(loginForm.username, loginForm.pin, db.employees)
    if (!emp) { setLoginErr('Username atau PIN salah. Coba lagi, atau minta akses di menu Pegawai.'); return }
    setLoginErr(''); setSession(getSession())
    toast({ title: `Selamat datang, ${emp.name.split(' ')[0]}!` })
  }
  const doLogout = () => { logout(); setSession(null); setLoginForm({ username: '', pin: '' }) }

  // Validasi lokasi; kembalikan {lat,lng,dist} atau lempar Error dengan pesan jelas.
  const cekLokasi = async () => {
    if (!office) return { lat: null, lng: null, dist: null }
    const { lat, lng } = await ambilLokasi()
    const dist = jarakMeter(lat, lng, office.lat, office.lng)
    if (dist > radius) {
      throw new Error(`Di luar radius kantor — ${fmtJarak(dist)} dari toko, absen ditolak. Radius maksimal ${fmtJarak(radius)}.`)
    }
    return { lat, lng, dist }
  }

  const simpanAbsen = async (mode, emp, photo) => {
    try {
      const loc = await cekLokasi()
      const nowISO = new Date().toISOString()
      if (mode === 'in') {
        if (att.some(a => a.employeeId === emp.id && a.date === today)) { toast({ title: 'Anda sudah absen masuk hari ini.' }); return }
        const late = lateMinutes(nowISO, shiftStart)
        const rec = {
          id: uid('att_'), employeeId: emp.id, date: today,
          checkIn: nowISO, checkOut: null,
          status: late > 0 ? 'terlambat' : 'hadir',
          note: '', lateMinutes: late,
          photoIn: photo, latIn: loc.lat, lngIn: loc.lng, distIn: loc.dist,
        }
        persist([...att, rec])
        toast({ title: `Absen masuk tercatat ${jamFmt(nowISO)}${late > 0 ? ` — terlambat ${late} menit` : ''}` })
      } else {
        const rec = att.find(a => a.employeeId === emp.id && a.date === today)
        if (!rec || rec.checkOut) { toast({ title: 'Belum ada absen masuk yang bisa ditutup.' }); return }
        persist(att.map(a => a.id === rec.id ? {
          ...a, checkOut: nowISO,
          photoOut: photo, latOut: loc.lat, lngOut: loc.lng, distOut: loc.dist,
        } : a))
        toast({ title: `Absen pulang tercatat ${jamFmt(nowISO)} · total kerja ${durasi({ ...rec, checkOut: nowISO })}` })
      }
    } catch (err) {
      toast({ title: err.message })
    }
  }

  const mintaAbsen = (mode, emp) => {
    if (!office) {
      toast({ title: 'Lokasi toko belum diatur. Minta admin atur di Pengaturan → Lokasi absensi sebelum absen.' })
      return
    }
    setSelfie({ mode, emp })
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
  const history = [...att]
    .filter(a => admin || a.employeeId === session?.employeeId)
    .sort((a, b) => (b.checkIn || b.date) < (a.checkIn || a.date) ? 1 : -1).reverse()
  const recordsToday = useMemo(() => {
    const list = admin ? db.employees : (me ? [me] : [])
    return list.map(e => ({ emp: e, rec: att.find(a => a.employeeId === e.id && a.date === today) }))
  }, [att, db, today, admin, me])

  // ---------- Panel login pegawai ----------
  if (session && !me) {
    return (
      <div className="p-4 md:p-7 max-w-md mx-auto text-center">
        <div className="card p-8">
          <Icon as={CircleAlert} size="xl" className="text-coral mx-auto mb-3"/>
          <h1 className="font-disp text-lg font-extrabold mb-2">Sesi tidak valid</h1>
          <p className="text-[13px] text-inksoft mb-4">Data pegawai untuk sesi ini sudah tidak ada. Silakan keluar lalu masuk kembali.</p>
          <Button onClick={doLogout}>Keluar dari sesi</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Icon as={CalendarCheck} size="lg" className="text-hero" />
          <h1 className="font-disp text-lg md:text-xl font-extrabold">Absensi Pegawai</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {geoStatus && <span className={'text-[11.5px] font-semibold pill ' + (geoStatus.startsWith('Lokasi OK') ? 'bg-mint-soft text-emerald-700' : 'bg-amber-soft text-amber-700')}>{geoStatus}</span>}
          {me && <span className="pill bg-hero-soft text-hero">{me.name}</span>}
          {me && <Button size="sm" variant="outline" className="rounded-full h-8" onClick={doLogout}>Keluar</Button>}
          {admin && (
            <Dialog open={izinOpen} onOpenChange={setIzinOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full gap-2"><Icon as={Plus} size="sm" strokeWidth={1.5}/> Catat Izin</Button>
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
          )}
        </div>
      </div>

      {/* Login pegawai */}
      {admin && (
        <form onSubmit={doLogin} className="card p-6 mb-5 max-w-md">
          <h2 className="font-disp font-bold text-[15px] mb-1 flex items-center gap-2"><Icon as={Fingerprint} size="md" className="text-hero"/> Masuk sebagai pegawai</h2>
          <p className="text-[12.5px] text-inksoft mb-4">Pegawai masuk di sini untuk absen sendiri. Tanpa login, Anda melihat semua data sebagai admin.</p>
          {loginErr && <p className="text-[12.5px] text-coral font-semibold mb-3">{loginErr}</p>}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="cth. rina" autoComplete="username"/>
            </div>
            <div className="space-y-1.5">
              <Label>PIN</Label>
              <Input type="password" inputMode="numeric" value={loginForm.pin} onChange={e => setLoginForm({ ...loginForm, pin: e.target.value })} placeholder="PIN 4–6 angka" autoComplete="current-password"/>
            </div>
            <Button type="submit" className="w-full">Masuk</Button>
          </div>
        </form>
      )}

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
                      {rec?.checkIn && rec.status !== 'izin' && ` · Masuk ${jamFmt(rec.checkIn)}`}
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
                    <Button onClick={() => mintaAbsen('in', emp)} className="flex-1 gap-2"><Icon as={LogIn} size="md" /> Check-in</Button>
                  )}
                  {rec && rec.status !== 'izin' && !rec.checkOut && (
                    <Button onClick={() => mintaAbsen('out', emp)} variant="outline" className="flex-1 gap-2"><Icon as={LogOut} size="md" /> Check-out</Button>
                  )}
                  {rec?.checkOut && <span className="text-[12.5px] text-inksoft">Pulang {jamFmt(rec.checkOut)} · <b className="text-ink">{durasi(rec)}</b></span>}
                  {rec?.status === 'izin' && rec.note && <span className="text-[12px] text-inksoft italic truncate">{rec.note}</span>}
                </div>
              </div>
            ))}
            {!db.employees.length && (
              <p className="text-inksoft text-[13px]">Belum ada pegawai terdaftar. Tambahkan pegawai pertama di menu <b>Pegawai</b> untuk mulai mencatat absensi.</p>
            )}
          </div>
          <p className="text-[11.5px] text-dim mt-4">Terlambat otomatis jika check-in lewat jam mulai shift ({shiftStart}). Setiap absen memerlukan selfie dan posisi di dalam radius toko ({fmtJarak(radius)}{office ? '' : ' — radius belum diatur'}). Shift bisa diubah di Pengaturan.</p>
        </TabsContent>

        <TabsContent value="riwayat">
          <div className="card p-0 overflow-hidden mt-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead><TableHead>Tanggal</TableHead><TableHead>Pegawai</TableHead><TableHead>Masuk</TableHead>
                  <TableHead>Keluar</TableHead><TableHead>Durasi</TableHead><TableHead>Lokasi</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-inksoft py-6">
                    Belum ada riwayat absensi. Absen pertama akan tampil di sini beserta foto dan lokasinya.
                  </TableCell></TableRow>
                )}
                {history.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.photoIn
                        ? <div className="flex gap-1"><img src={a.photoIn} alt={`Selfie masuk ${empName(a.employeeId)}`} className="w-9 h-9 rounded-lg object-cover border border-line" title="Foto masuk"/>
                          {a.photoOut && <img src={a.photoOut} alt={`Selfie pulang ${empName(a.employeeId)}`} className="w-9 h-9 rounded-lg object-cover border border-line" title="Foto pulang"/>}</div>
                        : <span className="text-dim text-[11px]">—</span>}
                    </TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell><b>{empName(a.employeeId)}</b></TableCell>
                    <TableCell>{a.checkIn ? jamFmt(a.checkIn) : '—'}</TableCell>
                    <TableCell>{a.checkOut ? jamFmt(a.checkOut) : '—'}</TableCell>
                    <TableCell>{a.status === 'izin' ? '—' : durasi(a)}</TableCell>
                    <TableCell>
                      {a.distIn != null
                        ? <div className="space-y-1">
                            <div className="flex flex-wrap gap-1"><RadiusBadge dist={a.distIn} radius={radius}/></div>
                            {a.latIn != null && <a href={linkMaps(a.latIn, a.lngIn)} target="_blank" rel="noreferrer" className="text-[10.5px] text-hero underline">Peta masuk</a>}
                            {a.latOut != null && <a href={linkMaps(a.latOut, a.lngOut)} target="_blank" rel="noreferrer" className="text-[10.5px] text-hero underline ml-2">Peta pulang</a>}
                          </div>
                        : <span className="text-dim text-[11px]">—</span>}
                    </TableCell>
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

      {/* Dialog selfie + simpan absen */}
      {selfie && (
        <SelfieDialog
          open
          onOpenChange={o => { if (!o) setSelfie(null) }}
          title={selfie.mode === 'in' ? `Selfie absen masuk — ${selfie.emp.name}` : `Selfie absen pulang — ${selfie.emp.name}`}
          onSubmit={photo => simpanAbsen(selfie.mode, selfie.emp, photo)}
        />
      )}
    </div>
  )
}
