import { useState, useMemo, useRef } from 'react'
import { loadDB, saveDB, rp, effPrice, uid } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import {
  ShoppingCart, Package, Banknote, CreditCard, Smartphone, Landmark, Search,
  CheckCircle2, TriangleAlert, Ban, Plus, Minus,
} from 'lucide-react'

const METHODS = [
  ['cash', 'Tunai', Banknote],
  ['qris', 'QRIS', Smartphone],
  ['transfer', 'Transfer', Landmark],
  ['debit', 'Debit', CreditCard],
]

export default function POS() {
  const [db, setDb] = useState(loadDB())
  const [cart, setCart] = useState([])
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [done, setDone] = useState(null)
  const [q, setQ] = useState('')
  // cooldown toast stok (sekali per item per sesi / debounce 5 detik)
  const warnedLow = useRef({})
  const warnedOut = useRef({})

  const ppnOn = db.settings?.ppnOn
  const sub = cart.reduce((s,l)=>s + effPrice(l.p)*l.qty, 0)
  const disc = cart.reduce((s,l)=>s + (l.p.price-effPrice(l.p))*l.qty, 0)
  const tax = ppnOn ? Math.round(sub*0.11) : 0
  const total = sub + tax
  const change = Math.max(0, (Number(paid)||0) - total)

  const list = useMemo(() =>
    [...db.products, ...db.bundles.map(b=>({...b, isBundle:true}))].filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  , [db, q])

  const notifyStock = p => {
    if (p.isBundle) return
    const now = Date.now()
    if (p.stock === 0) {
      if (!warnedOut.current[p.id] || now - warnedOut.current[p.id] > 5000) {
        warnedOut.current[p.id] = now
        toast({ title: `Stok ${p.name} habis`, variant: 'destructive' })
      }
    } else if (p.stock <= p.minStock) {
      if (!warnedLow.current[p.id] || now - warnedLow.current[p.id] > 5000) {
        warnedLow.current[p.id] = now
        toast({ title: `Stok ${p.name} tinggal ${p.stock} (min ${p.minStock})` })
      }
    }
  }

  const addP = p => {
    notifyStock(p)
    setCart(c => {
      const f = c.find(l=>l.p.id===p.id)
      return f ? c.map(l=>l.p.id===p.id?{...l,qty:l.qty+1}:l) : [...c, {p, qty:1}]
    })
  }
  const setQty = (id,qty) => {
    if (qty <= 0) return setCart(c => c.filter(l=>l.p.id!==id))
    setCart(c => {
      const line = c.find(l=>l.p.id===id)
      if (line && qty > line.qty && !line.p.isBundle) notifyStock(line.p)
      return c.map(l=>l.p.id===id?{...l,qty}:l)
    })
  }

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
    // toast stok habis setelah checkout
    prods.filter(p => p.stock === 0 && db.products.find(x=>x.id===p.id)?.stock > 0).forEach(p => {
      toast({ title: `Stok ${p.name} habis`, variant: 'destructive' })
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
        <Icon as={CheckCircle2} size="lg" className="text-lime mx-auto mb-3" strokeWidth={1.5} style={{width:40, height:40}} />
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
        <Button onClick={newSale} className="px-6 h-12 text-[14px]">Transaksi baru</Button>
      </div>
    </div>
  )

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Icon as={ShoppingCart} size="lg" className="text-hero" />
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Kasir</h1>
        <button onClick={()=>{const s={...db.settings, ppnOn:!ppnOn}; const d2={...db, settings:s}; saveDB(d2); setDb(d2)}}
          className={'pill ml-auto ' + (ppnOn?'bg-hero-soft text-hero':'bg-card2 text-inksoft')}>
          PPN 11% {ppnOn?'AKTIF':'nonaktif'}
        </button>
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* katalog */}
        <div>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-inksoft"><Icon as={Search} size="sm" strokeWidth={1.5}/></span>
            <Input className="mb-0 h-10 pl-9" placeholder="Cari produk…" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {list.map(p => {
              const habis = !p.isBundle && p.stock === 0
              return (
                <button key={p.id} onClick={()=>addP(p)} disabled={habis}
                  className={'card p-3.5 text-left hover:shadow-pop transition-shadow relative ' + (habis?'opacity-60 cursor-not-allowed':'')}>
                  {p.isBundle && <span className="absolute top-2 right-2 pill bg-bluea-soft text-bluea">PAKET</span>}
                  {(p.discount>0) && <span className="absolute top-2 left-2 pill bg-coral-soft text-coral">-{p.discount}%</span>}
                  <div className="mb-1 text-inksoft"><Icon as={Package} size="md" /></div>
                  <b className="text-[12.5px] block leading-tight truncate">{p.name}</b>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-hero font-bold text-[13px]">{rp(effPrice(p))}</span>
                    {p.discount>0 && <s className="text-dim text-[10.5px]">{rp(p.price)}</s>}
                  </div>
                  {!p.isBundle && <div className={'text-[10.5px] flex items-center gap-1 '+(p.stock<=p.minStock?'text-coral font-semibold':'text-dim')}>
                    {habis && <Icon as={Ban} size="sm" strokeWidth={1.5}/>} {habis ? 'Habis' : `stok ${p.stock}`}
                  </div>}
                </button>
              )
            })}
          </div>
        </div>
        {/* keranjang */}
        <div className="card p-4 h-fit sticky top-24">
          <h3 className="font-disp font-bold text-[14.5px] mb-3">Keranjang ({cart.length})</h3>
          {!cart.length && <p className="text-inksoft text-[13px]">Klik produk untuk menambah.</p>}
          {cart.map(l => (
            <div key={l.p.id} className="flex items-center gap-2 py-2 border-b border-line last:border-0">
              <span className="w-8 h-8 rounded-lg bg-card2 grid place-items-center text-inksoft"><Icon as={Package} size="md" /></span>
              <div className="min-w-0 flex-1"><b className="text-[12.5px] block truncate">{l.p.name}</b><span className="text-[11px] text-inksoft">{rp(effPrice(l.p))}</span></div>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>setQty(l.p.id,l.qty-1)} aria-label="Kurangi" className="w-7 h-7 rounded-lg bg-card2 grid place-items-center"><Icon as={Minus} size="sm" strokeWidth={1.5}/></button>
                <span className="w-6 text-center text-[13px] font-bold">{l.qty}</span>
                <button onClick={()=>setQty(l.p.id,l.qty+1)} aria-label="Tambah" className="w-7 h-7 rounded-lg bg-hero text-white grid place-items-center"><Icon as={Plus} size="sm" strokeWidth={1.5}/></button>
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
              {METHODS.map(([k,label,Ic])=>(
                <button key={k} onClick={()=>setMethod(k)}
                  className={'rounded-xl py-2 flex flex-col items-center gap-1 text-[10.5px] font-semibold '+(method===k?'bg-hero text-white':'bg-card2 text-inksoft')}>
                  <Icon as={Ic} size="sm" strokeWidth={1.5}/>{label}
                </button>
              ))}
            </div>
            {method==='cash' && <>
              <Input className="mt-2.5" type="number" placeholder="Uang diterima" value={paid} onChange={e=>setPaid(e.target.value)}/>
              {Number(paid)>0 && <div className="text-right text-[12.5px] mt-1">Kembalian: <b className={(change>=0?'text-lime':'text-coral')}>{rp(Math.abs(change))}{change<0?' kurang':''}</b></div>}
            </>}
            <Button onClick={checkout} disabled={method==='cash' && (Number(paid)||0)<total}
              className="w-full h-12 mt-3 text-[14px] gap-2">
              <Icon as={CreditCard} size="md" /> Bayar {rp(total)}
            </Button>
          </>}
        </div>
      </div>
    </div>
  )
}
