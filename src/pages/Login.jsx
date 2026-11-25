// Halaman login publik — dua kartu peran: ADMIN & KARYAWAN.
// Gaya Penna: sapaan 'Anda', pesan spesifik, error bahasa awam + saran.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadDB } from '../lib/store.js'
import { loginAdmin, loginPegawai, getSession } from '../lib/session.js'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import { ShieldCheck, Fingerprint, CircleAlert } from 'lucide-react'

export default function Login() {
  const [adminPin, setAdminPin] = useState('')
  const [empForm, setEmpForm] = useState({ username: '', pin: '' })
  const [adminErr, setAdminErr] = useState('')
  const [empErr, setEmpErr] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  const db = loadDB()

  const arahkan = peran => {
    const ada = getSession(db)
    const dari = loc.state?.dari
    if (peran === 'admin') nav(dari && !dari.startsWith('/karyawan') ? dari : '/', { replace: true })
    else nav(dari && dari.startsWith('/karyawan') ? dari : '/karyawan/absen', { replace: true })
  }

  const doAdmin = e => {
    e.preventDefault()
    if (!adminPin.trim()) { setAdminErr('PIN masih kosong. Isi PIN admin terlebih dahulu.'); return }
    if (!loginAdmin(adminPin, db)) {
      setAdminErr('PIN admin salah. Periksa kembali PIN Anda, atau ubah PIN di Pengaturan bila lupa.')
      return
    }
    setAdminErr('')
    toast({ title: 'Selamat datang kembali, Admin!' })
    arahkan('admin')
  }

  const doPegawai = e => {
    e.preventDefault()
    if (!empForm.username.trim() || !empForm.pin.trim()) {
      setEmpErr('Username dan PIN harus diisi keduanya.'); return
    }
    const emp = loginPegawai(empForm.username, empForm.pin, db)
    if (!emp) {
      setEmpErr('Username atau PIN tidak cocok dengan data pegawai. Coba lagi, atau minta admin mengatur akses login di menu Pegawai.')
      return
    }
    setEmpErr('')
    toast({ title: `Selamat datang, ${emp.name.split(' ')[0]}!` })
    arahkan('pegawai')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 grid place-items-center text-xl text-white font-bold mx-auto mb-3 shadow-lg">T</div>
        <h1 className="font-disp text-2xl font-extrabold text-slate-900">Toko<span className="text-blue-600">Kita</span></h1>
        <p className="text-[13px] text-slate-500 mt-1">Silakan pilih peran Anda untuk masuk.</p>
      </div>

      <Tabs defaultValue="admin">
        <TabsList className="w-full grid grid-cols-2 mb-1">
          <TabsTrigger value="admin" className="gap-1.5"><Icon as={ShieldCheck} size="sm"/> Admin</TabsTrigger>
          <TabsTrigger value="karyawan" className="gap-1.5"><Icon as={Fingerprint} size="sm"/> Karyawan</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <form onSubmit={doAdmin} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-disp font-bold text-[15px] mb-1 text-slate-900">Masuk sebagai Admin</h2>
            <p className="text-[12.5px] text-slate-500 mb-4">Akses penuh: kasir, inventori, laporan, pegawai, dan pengaturan toko.</p>
            {adminErr && <p className="text-[12.5px] text-red-600 font-semibold mb-3 flex items-start gap-1.5"><Icon as={CircleAlert} size="sm" className="mt-0.5 shrink-0"/>{adminErr}</p>}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700">PIN Admin</Label>
                <Input type="password" inputMode="numeric" value={adminPin} onChange={e => { setAdminPin(e.target.value); setAdminErr('') }} placeholder="PIN admin" autoFocus autoComplete="current-password"/>
              </div>
              <Button type="submit" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Icon as={ShieldCheck} size="md"/> Masuk ke aplikasi</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="karyawan">
          <form onSubmit={doPegawai} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-disp font-bold text-[15px] mb-1 text-slate-900">Masuk sebagai Karyawan</h2>
            <p className="text-[12.5px] text-slate-500 mb-4">Anda bisa absen, lihat riwayat absensi sendiri, dan data profil Anda.</p>
            {empErr && <p className="text-[12.5px] text-red-600 font-semibold mb-3 flex items-start gap-1.5"><Icon as={CircleAlert} size="sm" className="mt-0.5 shrink-0"/>{empErr}</p>}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Username</Label>
                <Input value={empForm.username} onChange={e => { setEmpForm({ ...empForm, username: e.target.value }); setEmpErr('') }} placeholder="cth. rina" autoComplete="username"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">PIN</Label>
                <Input type="password" inputMode="numeric" value={empForm.pin} onChange={e => { setEmpForm({ ...empForm, pin: e.target.value }); setEmpErr('') }} placeholder="PIN 4–6 angka" autoComplete="current-password"/>
              </div>
              <Button type="submit" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Icon as={Fingerprint} size="md"/> Masuk untuk absen</Button>
            </div>
            <p className="text-[11.5px] text-slate-400 mt-3">Belum punya akses login? Minta admin mengaturnya di menu Pegawai.</p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
