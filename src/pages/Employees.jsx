import { useEffect, useState } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from './Inventory.jsx'
import { registerFingerprint } from '../lib/auth.js'

export default function Employees() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({name:'', role:'', pin:''})
  const [msg, setMsg] = useState('')
  const add = e => {
    e.preventDefault()
    const next = {...db, employees:[...db.employees, {...form, id:'e'+Date.now(), credId:null}]}
    saveDB(next); setDb(next); setForm({name:'', role:'', pin:''})
  }
  const del = id => { const next={...db, employees:db.employees.filter(x=>x.id!==id)}; saveDB(next); setDb(next) }
  const enroll = async emp => {
    try {
      const credId = await registerFingerprint(emp)
      const next={...db, employees:db.employees.map(x=>x.id===emp.id?{...x,credId}:x)}
      saveDB(next); setDb(next); setMsg(`✓ Fingerprint terdaftar untuk ${emp.name}`)
    } catch(err) { setMsg('⚠ ' + (err.name==='NotAllowedError' ? 'Registrasi dibatalkan' : err.message)) }
    setTimeout(()=>setMsg(''),4000)
  }
  // rekap hari ini
  const today = new Date().toDateString()
  const todayAtt = db.attendance.filter(a=>new Date(a.in).toDateString()===today)
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Pegawai</h1>
      {msg && <div className="card p-3.5 mb-4 text-[13px] font-semibold">{msg}</div>}
      <Card title="Daftar pegawai">
        {db.employees.map(emp => {
          const att = todayAtt.find(a=>a.empId===emp.id)
          return (
            <div key={emp.id} className="flex flex-wrap items-center gap-3 py-3 border-b border-line last:border-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-blue-600 text-white grid place-items-center font-bold text-xs">{emp.name.slice(0,2).toUpperCase()}</div>
              <div><b className="text-[14px]">{emp.name}</b><div className="text-[12px] text-inksoft">{emp.role}</div></div>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {att ? <span className="pill bg-mint-soft text-emerald-700">Hadir {new Date(att.in).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
                     : <span className="pill bg-amber-soft text-amber-700">Belum absen</span>}
                {emp.credId ? <span className="pill bg-ocean-soft text-ocean-ink">👆 Biometrik aktif</span>
                     : <Button size="sm" variant="outline" className="rounded-full text-[11px] h-7" onClick={()=>enroll(emp)}>Daftar fingerprint</Button>}
                <Button size="sm" variant="destructive" className="rounded-full text-[11px] h-7" onClick={()=>del(emp.id)}>Hapus</Button>
              </div>
            </div>
          )
        })}
      </Card>
      <form onSubmit={add} className="mt-4 card p-5 flex flex-wrap gap-2.5 items-end">
        <Input label="Nama" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
        <Input label="Jabatan" value={form.role} onChange={v=>setForm({...form,role:v})}/>
        <Input label="PIN absen" value={form.pin} onChange={v=>setForm({...form,pin:v})} required/>
        <Button size="sm" type="submit">Tambah pegawai</Button>
      </form>
      <div className="mt-4 card p-5">
        <h3 className="font-disp font-bold text-[14.5px] mb-3">Riwayat absensi terbaru</h3>
        {db.attendance.length===0 && <p className="text-inksoft text-[13px]">Belum ada absensi. Pegawai absen lewat menu Absen.</p>}
        {[...db.attendance].reverse().slice(0,15).map((a,i) => (
          <div key={i} className="flex gap-3 py-2 text-[13px] border-b border-line last:border-0">
            <b>{db.employees.find(e=>e.id===a.empId)?.name||'?'}</b>
            <span className="text-inksoft">masuk {new Date(a.in).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
            {a.out && <span className="text-inksoft">· pulang {new Date(a.out).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>}
            <span className="ml-auto text-[11px] pill bg-ocean-soft text-ocean-ink">{a.method==='fingerprint'?'👆':'🔢 PIN'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}