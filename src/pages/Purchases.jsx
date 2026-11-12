import { useState } from 'react'
import { loadDB, saveDB, rp, uid } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Truck, X, Plus, Download } from 'lucide-react'

export default function Purchases() {
  const [db, setDb] = useState(loadDB())
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines] = useState([]) // {productId, qty, cost}
  const addLine = () => setLines(l=>[...l, {productId: db.products[0]?.id||'', qty:1, cost:0}])
  const setLine = (i,k,v) => setLines(l=>l.map((x,j)=>j===i?{...x,[k]:v}:x))
  const save = () => {
    if (!lines.length) return
    const po = { id:uid('po'), supplierId, date:new Date().toISOString(),
      items: lines.map(l=>({productId:l.productId, qty:+l.qty, cost:+l.cost})),
      total: lines.reduce((s,l)=>s+l.qty*l.cost,0), status:'Diterima' }
    // stok masuk + update harga beli terakhir
    const products = db.products.map(p => {
      const li = po.items.find(i=>i.productId===p.id)
      return li ? {...p, stock: p.stock + li.qty} : p
    })
    const db2 = {...db, products, purchases:[...db.purchases, po]}
    saveDB(db2); setDb(db2); setLines([])
  }
  const sname = id => db.suppliers.find(s=>s.id===id)?.name || 'Umum'
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon as={Truck} size="lg" className="text-hero" />
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Pembelian</h1>
      </div>
      <Card title="Buat pembelian (stok masuk otomatis)">
        <div className="flex flex-wrap gap-2.5 items-end mb-3">
          <div>
            <label className="text-[11px] text-inksoft font-semibold block mb-1">Pemasok</label>
            <select className="inp w-52" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
              <option value="">— Pilih pemasok —</option>
              {db.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Button size="sm" variant="secondary" onClick={addLine} className="gap-1.5"><Icon as={Plus} size="sm" strokeWidth={1.5}/> Barang</Button>
          <Button size="sm" onClick={save} disabled={!lines.length}>Simpan ({rp(lines.reduce((s,l)=>s+l.qty*l.cost,0))})</Button>
        </div>
        {lines.map((l,i)=>(
          <div key={i} className="flex flex-wrap gap-2 items-end mb-2">
            <select className="inp w-48" value={l.productId} onChange={e=>setLine(i,'productId',e.target.value)}>
              {db.products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="inp w-20" type="number" min="1" value={l.qty} onChange={e=>setLine(i,'qty',e.target.value)} placeholder="Qty"/>
            <input className="inp w-32" type="number" value={l.cost} onChange={e=>setLine(i,'cost',e.target.value)} placeholder="Harga beli"/>
            <button onClick={()=>setLines(lines.filter((_,j)=>j!==i))} aria-label="Hapus baris" className="text-coral px-2"><Icon as={X} size="sm" strokeWidth={1.5}/></button>
          </div>
        ))}
      </Card>
      <Card title="Riwayat pembelian">
        {!db.purchases.length && <p className="text-inksoft text-[13px]">Belum ada pembelian.</p>}
        {db.purchases.slice().reverse().map(po=>(
          <div key={po.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
            <span className="w-9 h-9 rounded-full bg-card2 grid place-items-center"><Icon as={Download} size="md" /></span>
            <div><b className="text-[13px]">{sname(po.supplierId)}</b>
              <div className="text-[11.5px] text-inksoft">{new Date(po.date).toLocaleDateString('id-ID')} · {po.items.length} item</div></div>
            <b className="ml-auto text-[13.5px]">{rp(po.total)}</b>
            <span className="pill bg-lime-soft text-lime">{po.status}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
