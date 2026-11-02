import { useState } from 'react'
import { loadDB, saveDB, rp } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Input } from './Inventory.jsx'
import { toast } from '../components/ui/use-toast.jsx'

export default function Invoices() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({customer:'', desc:'', total:''})
  const issue = e => {
    e.preventDefault()
    const inv = { id:'INV-'+String(db.invoices.length+1).padStart(4,'0'), ...form, total:+form.total, status:'Menunggu', at:new Date().toLocaleDateString('id-ID') }
    const next = {...db, invoices:[inv, ...db.invoices]}
    saveDB(next); setDb(next); setForm({customer:'', desc:'', total:''})
    toast({ title: `Invoice ${inv.id} diterbitkan`, description: `${inv.customer} · ${rp(inv.total)}` })
  }
  const markPaid = id => { const next={...db, invoices:db.invoices.map(i=>i.id===id?{...i,status:'Dibayar'}:i)}; saveDB(next); setDb(next); toast({ title: `Invoice ${id} ditandai dibayar` }) }
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-6">Invoice</h1>
      <Card title="Terbitkan invoice">
        <form onSubmit={issue} className="flex flex-wrap gap-2.5 items-end">
          <Input label="Pelanggan" value={form.customer} onChange={v=>setForm({...form,customer:v})} required/>
          <Input label="Keterangan" value={form.desc} onChange={v=>setForm({...form,desc:v})}/>
          <Input label="Total (Rp)" type="number" value={form.total} onChange={v=>setForm({...form,total:v})} required/>
          <button className="btn-primary text-[13px] px-4 py-2.5">Terbitkan</button>
        </form>
      </Card>
      <div className="mt-4 bg-white border border-line rounded-2xl p-5">
        {db.invoices.length===0 && <p className="text-inksoft text-[13px]">Belum ada invoice. Buat yang pertama di atas.</p>}
        {db.invoices.map(i => (
          <div key={i.id} className="flex items-center gap-3 py-2.5 border-b border-[#EEF1EB] last:border-0 text-[13px]">
            <b className="font-disp">{i.id}</b>
            <span>{i.customer}</span>
            <span className="text-inksoft text-[12px]">{i.desc}</span>
            <b className="ml-auto">{rp(i.total)}</b>
            {i.status==='Dibayar' ? <span className="pill bg-mint-soft text-emerald-700">Dibayar</span>
              : <button onClick={()=>markPaid(i.id)} className="pill bg-amber-soft text-amber-700 font-bold hover:opacity-80">Tandai dibayar</button>}
          </div>
        ))}
      </div>
    </div>
  )
}