import { useState } from 'react'
import { loadDB, saveDB, resetDB } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'

export default function Settings() {
  const [db, setDb] = useState(loadDB())
  const [msg, setMsg] = useState('')
  const set = (k,v) => { const s={...db.settings,[k]:v}; const d={...db,settings:s}; saveDB(d); setDb(d) }
  const flash = t => { setMsg(t); setTimeout(()=>setMsg(''),2000) }
  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}))
    a.download = 'toko-kita-backup.json'; a.click(); flash('Backup terunduh ✓')
  }
  const importJson = e => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { const d = JSON.parse(r.result); saveDB(d); setDb(d); flash('Data dipulihkan ✓') } catch { flash('File tidak valid ✕') } }
    r.readAsText(f)
  }
  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-4">Pengaturan</h1>
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
        </div>
      </Card>
      <Card title="Data">
        <div className="flex flex-wrap gap-2.5">
          <Button size="sm" onClick={exportJson}>⬇ Backup data</Button>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-full bg-secondary px-3 text-xs font-semibold text-ink">⬆ Pulihkan backup<input type="file" accept=".json" onChange={importJson} className="hidden"/></label>
          <button onClick={()=>{if(confirm('Hapus SEMUA data dan kembali ke contoh?')){resetDB(); location.reload()}}} className="text-coral text-[13px] font-semibold px-4 py-2">Reset total</button>
        </div>
        <p className="text-[11.5px] text-dim mt-3">Data tersimpan lokal di perangkat ini (localStorage). Backup rutin disarankan.</p>
      </Card>
    </div>
  )
}
