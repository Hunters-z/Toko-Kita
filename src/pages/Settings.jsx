import { useState } from 'react'
import { loadDB, saveDB, resetDB } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Settings as SettingsIcon, Download, Upload } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog.jsx'

export default function Settings() {
  const [db, setDb] = useState(loadDB())
  const [msg, setMsg] = useState('')
  const set = (k,v) => { const s={...db.settings,[k]:v}; const d={...db,settings:s}; saveDB(d); setDb(d) }
  const flash = t => { setMsg(t); setTimeout(()=>setMsg(''),2000) }
  const doReset = () => { resetDB(); location.reload() }
  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}))
    a.download = 'toko-kita-backup.json'; a.click(); flash('Backup terunduh')
  }
  const importJson = e => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { const d = JSON.parse(r.result); saveDB(d); setDb(d); flash('Data dipulihkan') } catch { flash('File tidak valid') } }
    r.readAsText(f)
  }
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon as={SettingsIcon} size="lg" className="text-hero" />
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Pengaturan</h1>
      </div>
      {msg && <Badge variant="success" className="mb-3">{msg}</Badge>}
      <Card title="Toko">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-inksoft font-semibold block mb-1">Nama toko</label>
            <Input value={db.settings?.shopName||''} onChange={e=>set('shopName',e.target.value)}/>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={()=>set('ppnOn',!db.settings?.ppnOn)} className={'sw '+(db.settings?.ppnOn?'on':'')}><i/></div>
            <div><b className="text-[14px]">PPN 11%</b><div className="text-[12px] text-inksoft">Tambahkan pajak di Kasir</div></div>
          </label>
          <div>
            <label className="text-[11px] text-inksoft font-semibold block mb-1">Jam mulai shift (absensi)</label>
            <Input type="time" value={db.settings?.shiftStart||'08:00'} onChange={e=>set('shiftStart',e.target.value)} className="w-32"/>
          </div>
        </div>
      </Card>
      <Card title="Data">
        <div className="flex flex-wrap gap-2.5">
          <button onClick={exportJson} className="btn-primary text-[13px] px-5 py-2.5 flex items-center gap-1.5"><Icon as={Download} size="sm" strokeWidth={1.5}/> Backup data</button>
          <label className="btn-ghost text-[13px] px-5 py-2.5 cursor-pointer flex items-center gap-1.5"><Icon as={Upload} size="sm" strokeWidth={1.5}/> Pulihkan backup<input type="file" accept=".json" onChange={importJson} className="hidden"/></label>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-coral text-[13px] font-semibold px-4 py-2.5">Reset total</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset total?</AlertDialogTitle>
                <AlertDialogDescription>Semua data toko akan dihapus dan diganti dengan data contoh. Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white" onClick={doReset}>Ya, reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-[11.5px] text-dim mt-3">Data tersimpan lokal di perangkat ini (localStorage). Backup rutin disarankan.</p>
      </Card>
    </div>
  )
}
