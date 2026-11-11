import { useState } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { verifyFingerprint, verifyPin } from '../lib/auth.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'

export default function Attendance() {
  const [db, setDb] = useState(loadDB())
  const [empId, setEmpId] = useState('')
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState(null) // {ok, text}
  const emp = db.employees.find(e=>e.id===empId)
  const today = new Date().toDateString()
  const record = db.attendance.find(a=>a.empId===empId && new Date(a.in).toDateString()===today)

  const mark = method => {
    if (!emp) return setMsg({ok:false, text:'Pilih pegawai dulu'})
    if (record && record.out) return setMsg({ok:false, text:`${emp.name} sudah lengkap absen hari ini`})
    const now = Date.now()
    let next
    if (!record) {
      next = {...db, attendance:[...db.attendance, {empId, in:now, out:null, method}]}
      setMsg({ok:true, text:`✓ ${emp.name} absen MASUK ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`})
    } else {
      next = {...db, attendance:db.attendance.map(a=>a===record?{...a, out:now}:a)}
      setMsg({ok:true, text:`✓ ${emp.name} absen PULANG ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`})
    }
    saveDB(next); setDb(next); setPin('')
    setTimeout(()=>setMsg(null),3500)
  }
  const withFingerprint = async () => {
    try { await verifyFingerprint(); mark('fingerprint') }
    catch(err) { setMsg({ok:false, text: err.name==='NotAllowedError' ? 'Verifikasi dibatalkan' : err.message}) }
  }
  const withPin = e => {
    e.preventDefault()
    if (!emp) return setMsg({ok:false, text:'Pilih pegawai dulu'})
    if (!verifyPin(emp, pin)) return setMsg({ok:false, text:'PIN salah'})
    mark('pin')
  }
  return (
    <div className="p-4 md:p-7 max-w-md mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Absen</h1>
      <div className="card p-6">
        <label className="block text-[12px] font-bold text-inksoft mb-1.5">Pilih pegawai</label>
        <select value={empId} onChange={e=>{setEmpId(e.target.value); setMsg(null)}} className="w-full border border-line rounded-xl px-3.5 py-2.5 text-[14px] mb-4 bg-white">
          <option value="">— pilih —</option>
          {db.employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
        </select>

        {emp && (
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-ocean to-blue-600 text-white grid place-items-center font-bold text-lg shadow-pop">{emp.name.slice(0,2).toUpperCase()}</div>
            <div className="mt-2 text-[13px] font-semibold">{emp.name}</div>
            <div className="text-[12px] text-inksoft">{record ? (record.out ? 'Absensi hari ini lengkap ✓' : `Sudah masuk ${new Date(record.in).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} — tinggal absen pulang`) : 'Belum absen hari ini'}</div>
          </div>
        )}

        {msg && <div className={`mb-4 text-center text-[13px] font-bold p-3 rounded-xl ${msg.ok?'bg-mint-soft text-emerald-700':'bg-coral-soft text-red-700'}`}>{msg.text}</div>}

        <Button onClick={withFingerprint} disabled={!emp} className="w-full h-12 text-[15px] mb-3">👆 Absen dengan Fingerprint</Button>

        <div className="flex items-center gap-3 text-[11px] text-inksoft mb-3"><div className="flex-1 border-t border-line"/>atau PIN<div className="flex-1 border-t border-line"/></div>

        <form onSubmit={withPin} className="flex gap-2">
          <input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN"
            className="flex-1 h-12 text-center text-lg tracking-widest"/>
          <Button type="submit" className="px-5">Absen</Button>
        </form>
      </div>
      <p className="text-[11.5px] text-inksoft mt-3 text-center">Fingerprint memakai sensor perangkat (WebAuthn) — PIN dicocokkan per pegawai.</p>
    </div>
  )
}