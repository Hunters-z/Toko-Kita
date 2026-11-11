import { useState } from 'react'
import { loadDB, saveDB, rp } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from './Inventory.jsx'

export default function Suppliers() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({name:'', phone:'', item:''})
  const add = e => {
    e.preventDefault()
    const next = {...db, suppliers:[...db.suppliers, {...form, id:'s'+Date.now()}]}
    saveDB(next); setDb(next); setForm({name:'', phone:'', item:''})
  }
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Pemasok</h1>
      <Card title="Tambah pemasok">
        <form onSubmit={add} className="flex flex-wrap gap-2.5 items-end">
          <Input label="Nama" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
          <Input label="Telepon" value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
          <Input label="Barang utama" value={form.item} onChange={v=>setForm({...form,item:v})}/>
          <Button size="sm" type="submit">Simpan</Button>
        </form>
      </Card>
      <div className="grid md:grid-cols-3 gap-3.5 mt-4">
        {db.suppliers.length===0 && <p className="text-inksoft text-[13px]">Belum ada pemasok.</p>}
        {db.suppliers.map(s => (
          <div key={s.id} className="card p-5">
            <b className="text-[14px]">{s.name}</b>
            <div className="text-inksoft text-[12.5px] mt-0.5">📞 {s.phone||'—'}</div>
            {s.item && <div className="pill bg-ocean-soft text-ocean-ink mt-2">{s.item}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}