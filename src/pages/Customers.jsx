import { useState } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from './Inventory.jsx'

export default function Customers() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({name:'', phone:'', note:''})
  const add = e => {
    e.preventDefault()
    const next = {...db, customers:[...db.customers, {...form, id:'c'+Date.now()}]}
    saveDB(next); setDb(next); setForm({name:'', phone:'', note:''})
  }
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-6">Pelanggan</h1>
      <Card title="Tambah pelanggan">
        <form onSubmit={add} className="flex flex-wrap gap-2.5 items-end">
          <Input label="Nama" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
          <Input label="Telepon" value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
          <Input label="Catatan" value={form.note} onChange={v=>setForm({...form,note:v})}/>
          <Button size="sm" type="submit">Simpan</Button>
        </form>
      </Card>
      <div className="grid md:grid-cols-3 gap-3.5 mt-4">
        {db.customers.map(c => (
          <div key={c.id} className="bg-white border border-line rounded-2xl p-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-blue-600 text-white grid place-items-center font-bold text-xs shadow-soft">{c.name.slice(0,2).toUpperCase()}</div>
            <b className="block mt-2.5 text-[14px]">{c.name}</b>
            <div className="text-inksoft text-[12.5px]">{c.phone||'—'}</div>
            {c.note && <div className="text-[11.5px] mt-1.5 pill bg-ocean-soft text-ocean-ink">{c.note}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}