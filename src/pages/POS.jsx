import { useState, useMemo } from 'react'
import { loadDB, saveDB, rp, effPrice, uid } from '../lib/store.js'
import { Card } from './Dashboard.jsx'

const METHODS = [['cash','💵 Tunai'],['qris','📱 QRIS'],['transfer','🏦 Transfer'],['debit','💳 Debit']]

export default function POS() {
  const [db, setDb] = useState(loadDB())
  const [cart, setCart] = useState([])
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [done, setDone] = useState(null)
  const [q, setQ] = useState('')

  const ppnOn = db.settings?.ppnOn
  const sub = cart.reduce((s,l)=>s + effPrice(l.p)*l.qty, 0)
  const disc = cart.reduce((s,l)=>s + (l.p.price-effPrice(l.p))*l.qty, 0)
  const tax = ppnOn ? Math.round(sub*0.11) : 0
  const total = sub + tax
  const change = Math.max(0, (Number(paid)||0) - total)

  const list = useMemo(() =>
    [...db.products, ...db.bundles.map(b=>({...b, isBundle:true}))].filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  , [db, q])

  const addP = p => {
    setCart(c => {
      const f = c.find(l=>l.p.id===p.id)
      return f ? c.map(l=>l.p.id===p.id?{...l,qty:l.qty+1}:l) : [...c, {p, qty:1}]
    })
  }
  const setQty = (id,qty) => setCart(c => qty<=0 ? c.filter(l=>l.p.id!==id) : c.map(l=>l.p.id===id?{...l,qty}:l))

  const checkout = () => {
    if (!cart.length || (Number(paid)||0) < total && method==='cash') return
    // kurangi stok
    const products = db.products.map(p => {
      const line = cart.find(l=>l.p.id===p.id)
      return line ? {...p, stock: p.stock - line.qty} : p
    })
    // bundle: kurangi stok komponen
    let prods = products
    cart.filter(l=>l.p.isBundle).forEach(l => {
      prods = prods.map(p => {
        const comp = l.p.items?.find(i=>i.productId===p.id)
        return comp ? {...p, stock: p.stock - comp.qty*l.qty} : p
      })
    })
    const tx = { id: uid('t'), date: new Date().toISOString(), items: cart.map(l=>({name:l.p.name, qty:l.qty, price:effPrice(l.p), disc:l.p.discount||0})), sub, disc, tax, total, method }
    const db2 = {...db, products: prods, txs: [...db.txs, tx], payments: [...db.payments, {txId:tx.id, method, paid:Number(paid)||total, change}] }
    saveDB(db2); setDb(db2); setDone({tx, change, paid:Number(paid)||total}); setCart([]); setPaid('')
    toast({ title: 'Transaksi berhasil', description: `${tx.items.length} item · ${rp(total)}` })
  }
  const newSale = () => setDone(null)

  if (done) return (
    <div className="p-4 md:p-7 max-w-lg mx-auto text-center">
      <div className="card p-8">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="font-disp text-xl font-extrabold mb-1">Transaksi berhasil</h1>
        <p className="text-inksoft text-[13px] mb-5">{done.tx.items.length} item · {done.tx.method.toUpperCase()}</p>
        <div className="card2 p-4 text-left text-[13.5px] space-y-1.5 mb-5">
          {done.tx.items.map((i,idx)=>(
            <div key={idx} className="flex justify-between"><span>{i.qty}× {i.name}{i.disc?` (-${i.disc}%)`:''}</span><b>{rp(i.price*i.qty)}</b></div>
          ))}
          <div className="flex justify-between border-t border-line pt-2"><span>Subtotal</span><span>{rp(done.tx.sub)}</span></div>
          {done.tx.tax>0 && <div className="flex justify-between"><span>PPN 11%</span><span>{rp(done.tx.tax)}</span></div>}
          <div className="flex justify-between font-bold text-[15px]"><span>Total</span><span className="text-hero">{rp(done.tx.total)}</span></div>
          <div className="flex justify-between text-inksoft"><span>Bayar ({done.tx.method})</span><span>{rp(done.paid)}</span></div>
          {done.tx.method==='cash' && <div className="flex justify-between"><span>Kembalian</span><b className="text-lime">{rp(done.change)}</b></div>}
        </div>
        <button onClick={newSale} className="btn-primary px-6 py-3 text-[14px]">Transaksi baru</button>
      </div>
    </div>
  )

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Kasir</h1>
        <button onClick={()=>{const s={...db.settings, ppnOn:!ppnOn}; const d2={...db, settings:s}; saveDB(d2); setDb(d2)}}
          className={'pill ml-auto ' + (ppnOn?'bg-hero-soft text-hero':'bg-card2 text-inksoft')}>
          PPN 11% {ppnOn?'AKTIF':'nonaktif'}
        </button>
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* katalog */}
        <div>
          <input className="inp mb-3" placeholder="🔍 Cari produk…" value={q} onChange={e=>setQ(e.target.value)}/>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {list.map(p => (
              <button key={p.id} onClick={()=>addP(p)} className="card p-3.5 text-left hover:shadow-pop transition-shadow relative">
                {p.isBundle && <span className="absolute top-2 right-2 pill bg-bluea-soft text-bluea">PAKET</span>}
                {(p.discount>0) && <span className="absolute top-2 left-2 pill bg-coral-soft text-coral">-{p.discount}%</span>}
                <div className="text-2xl mb-1">{p.emoji}</div>
                <b className="text-[12.5px] block leading-tight truncate">{p.name}</b>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-hero font-bold text-[13px]">{rp(effPrice(p))}</span>
                  {p.discount>0 && <s className="text-dim text-[10.5px]">{rp(p.price)}</s>}
                </div>
                {!p.isBundle && <div className={'text-[10.5px] '+(p.stock<=p.minStock?'text-coral font-semibold':'text-dim')}>stok {p.stock}</div>}
              </button>
            ))}
          </div>
        </div>
        {/* keranjang */}
        <div className="card p-4 h-fit sticky top-24">
          <h3 className="font-disp font-bold text-[14.5px] mb-3">Keranjang ({cart.length})</h3>
          {!cart.length && <p className="text-inksoft text-[13px]">Klik produk untuk menambah.</p>}
          {cart.map(l => (
            <div key={l.p.id} className="flex items-center gap-2 py-2 border-b border-line last:border-0">
              <span className="text-lg">{l.p.emoji}</span>
              <div className="min-w-0 flex-1"><b className="text-[12.5px] block truncate">{l.p.name}</b><span className="text-[11px] text-inksoft">{rp(effPrice(l.p))}</span></div>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>setQty(l.p.id,l.qty-1)} className="w-7 h-7 rounded-lg bg-card2 font-bold">−</button>
                <span className="w-6 text-center text-[13px] font-bold">{l.qty}</span>
                <button onClick={()=>setQty(l.p.id,l.qty+1)} className="w-7 h-7 rounded-lg bg-hero text-white font-bold">+</button>
              </div>
            </div>
          ))}
          {cart.length>0 && <>
            <div className="mt-3 space-y-1 text-[13px]">
              <div className="flex justify-between text-inksoft"><span>Subtotal</span><span>{rp(sub)}</span></div>
              {disc>0 && <div className="flex justify-between text-coral"><span>Diskon produk</span><span>−{rp(disc)}</span></div>}
              {ppnOn && <div className="flex justify-between text-inksoft"><span>PPN 11%</span><span>{rp(tax)}</span></div>}
              <div className="flex justify-between font-disp font-extrabold text-[16px] pt-1 border-t border-line"><span>Total</span><span className="text-hero">{rp(total)}</span></div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {METHODS.map(([k,label])=>(
                <button key={k} onClick={()=>setMethod(k)} className={'rounded-xl py-2 text-[10.5px] font-semibold '+(method===k?'bg-hero text-white':'bg-card2 text-inksoft')}>{label.split(' ')[0]}</button>
              ))}
            </div>
            {method==='cash' && <>
              <input className="inp mt-2.5" type="number" placeholder="Uang diterima" value={paid} onChange={e=>setPaid(e.target.value)}/>
              {Number(paid)>0 && <div className="text-right text-[12.5px] mt-1">Kembalian: <b className={(change>=0?'text-lime':'text-coral')}>{rp(Math.abs(change))}{change<0?' kurang':''}</b></div>}
            </>}
            <button onClick={checkout} disabled={method==='cash' && (Number(paid)||0)<total}
              className="btn-primary w-full py-3 mt-3 text-[14px] disabled:opacity-40">
              Bayar {rp(total)}
            </button>
          </>}
        </div>
      </div>
    </div>
  )
}
