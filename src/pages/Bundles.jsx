import { useState } from 'react'
import { loadDB, saveDB, rp, uid } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from './Inventory.jsx'
import { Gift, PackagePlus, X } from 'lucide-react'

export default function Bundles() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({name:'', price:''})
  const [items, setItems] = useState([]) // {productId, qty}
  const [stock, setStock] = useState(10)
  const add = () => {
    if (!form.name || !items.length) return
    const b = { id:uid('b'), name:form.name, price:+form.price||0, items, stock:+stock }
    // produksi: komponen keluar dari stok
    const products = db.products.map(p => {
      const c = items.find(i=>i.productId===p.id)
      return c ? {...p, stock: p.stock - c.qty*b.stock} : p
    })
    const db2 = {...db, products, bundles:[...db.bundles, b]}
    saveDB(db2); setDb(db2); setForm({name:'', price:''}); setItems([]); setStock(10)
  }
  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon as={Gift} size="lg" className="text-hero" />
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Produksi & Paket</h1>
      </div>
      <Card title="Buat paket / produksi (komponen otomatis keluar dari stok)">
        <div className="flex flex-wrap gap-2.5 items-end mb-3">
          <Input label="Nama paket" value={form.name} onChange={v=>setForm({...form,name:v})}/>
          <Input label="Harga jual" value={form.price} onChange={v=>setForm({...form,price:v})} type="number"/>
          <Input label="Jumlah buat" value={stock} onChange={setStock} type="number"/>
        </div>
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <select className="inp w-48" onChange={e=>{if(e.target.value) setItems(i=>[...i,{productId:e.target.value, qty:1}])}} defaultValue="">
            <option value="">+ Tambah komponen…</option>
            {db.products.map(p=><option key={p.id} value={p.id}>{p.name} (stok {p.stock})</option>)}
          </select>
          {items.map((it,i)=>(
            <span key={i} className="pill bg-card2 text-inksoft flex items-center gap-1.5">
              {db.products.find(p=>p.id===it.productId)?.name}
              <input type="number" min="1" value={it.qty} onChange={e=>setItems(items.map((x,j)=>j===i?{...x,qty:+e.target.value}:x))}
                className="w-12 bg-transparent text-center outline-none"/>
              <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} aria-label="Hapus komponen" className="text-coral"><Icon as={X} size="sm" strokeWidth={1.5}/></button>
            </span>
          ))}
        </div>
        <Button size="sm" onClick={add} className="gap-1.5"><Icon as={PackagePlus} size="sm" strokeWidth={1.5}/> Produksi</Button>
      </Card>
      <Card title="Paket aktif (muncul di Kasir)">
        {!db.bundles.length && <p className="text-inksoft text-[13px]">Belum ada paket.</p>}
        <div className="grid md:grid-cols-3 gap-3">
          {db.bundles.map(b=>(
            <div key={b.id} className="card2 p-4">
              <div className="mb-1 text-inksoft"><Icon as={Gift} size="md" /></div>
              <b className="text-[13.5px]">{b.name}</b>
              <div className="text-hero font-bold text-[13px]">{rp(b.price)}</div>
              <div className="text-[11px] text-inksoft mt-1">{b.items.map(i=>`${i.qty}× ${db.products.find(p=>p.id===i.productId)?.name}`).join(' + ')}</div>
              <div className="text-[11px] text-dim">stok {b.stock}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
