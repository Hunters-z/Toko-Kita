import { useState } from 'react'
import { loadDB, saveDB, rp } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from './Inventory.jsx'

const CATS = ['Gaji','Sewa','Listrik & Air','Transport','Bahan baku','Lain-lain']
export default function Expenses() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({desc:'', cat:'Lain-lain', amount:''})
  const add = e => {
    e.preventDefault()
    const next = {...db, expenses:[{...form, amount:+form.amount, id:'x'+Date.now(), at:new Date().toISOString()}, ...db.expenses]}
    saveDB(next); setDb(next); setForm({desc:'', cat:'Lain-lain', amount:''})
  }
  const total = db.expenses.reduce((s,x)=>s+x.amount,0)
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Pengeluaran</h1>
      <Card title="Catat pengeluaran">
        <form onSubmit={add} className="flex flex-wrap gap-2.5 items-end">
          <Input label="Keterangan" value={form.desc} onChange={v=>setForm({...form,desc:v})} required/>
          <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-inksoft">Kategori
            <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} className="border border-line rounded-[9px] px-3 py-2 text-[13px] font-normal text-ink bg-white">
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select></label>
          <Input label="Jumlah (Rp)" type="number" value={form.amount} onChange={v=>setForm({...form,amount:v})} required/>
          <Button size="sm" type="submit">Catat</Button>
        </form>
      </Card>
      <div className="card p-5 mt-4">
        <div className="flex justify-between font-disp font-extrabold mb-2"><span>Total pengeluaran</span><span className="text-red-600">{rp(total)}</span></div>
        {db.expenses.length===0 && <p className="text-inksoft text-[13px]">Belum ada pengeluaran tercatat.</p>}
        {db.expenses.map(x => (
          <div key={x.id} className="flex gap-3 py-2.5 text-[13px] border-b border-line last:border-0">
            <b>{x.desc}</b>
            <span className="pill bg-ocean-soft text-ocean-ink">{x.cat}</span>
            <span className="ml-auto font-bold text-red-600">-{rp(x.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}