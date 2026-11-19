import { useState, useMemo, useRef } from 'react'
import { loadDB, saveDB, rp, effPrice, uid } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { toast } from '@/components/ui/use-toast.jsx'
import {
  ShoppingCart, Package, Banknote, CreditCard, Smartphone, Landmark, Search,
  CheckCircle2, TriangleAlert, Ban, Plus, Minus, ScanBarcode, X
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
  const [scanning, setScanning] = useState(false)
  // cooldown toast stok (sekali per item per sesi / debounce 5 detik)
  const warnedLow = useRef({})
  const warnedOut = useRef({})

  const handleScan = (code) => {
    // Cari produk berdasarkan kode/barcode
    const p = db.products.find(x => x.barcode === code || x.code === code)
    if (p) {
      addP(p)
      toast({ title: `Ditambahkan: ${p.name}`, description: 'Scan berhasil' })
    } else {
      toast({ title: 'Produk tidak ditemukan', description: `Kode: ${code}`, variant: 'destructive' })
    }
    setScanning(false)
  }

  const [splitOn, setSplitOn] = useState(false)
  const [splitMethod, setSplitMethod] = useState('qris')
  const [splitAmount, setSplitAmount] = useState('')
  const ppnOn = db.settings?.ppnOn
  const sub = cart.reduce((s,l)=>s + effPrice(l.p)*l.qty, 0)
  const disc = cart.reduce((s,l)=>s + (l.p.price-effPrice(l.p))*l.qty, 0)
  const tax = ppnOn ? Math.round(sub*0.11) : 0
  const total = sub + tax
  // Split: metode 1 (method) + metode 2 (splitMethod). Sisa = total - splitAmount
  const splitRest = Math.max(0, total - (Number(splitAmount)||0))
  const change = !splitOn
    ? Math.max(0, (Number(paid)||0) - total)
    : (splitMethod === 'cash' ? Math.max(0, (Number(paid)||0) - splitRest) : 0)
  const paidValid = splitOn
    ? splitRest >= 0 && (splitMethod !== 'cash' || method !== 'cash' || (Number(paid)||0) >= splitRest)
    : (method === 'cash' ? (Number(paid)||0) >= total : true)

  const list = useMemo(() =>
    [...db.products, ...db.bundles?.map(b=>({...b, isBundle:true}))].filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
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
      return f ? c?.map(l=>l.p.id===p.id?{...l,qty:l.qty+1}:l) : [...c, {p, qty:1}]
    })
  }
  const setQty = (id,qty) => {
    if (qty <= 0) return setCart(c => c.filter(l=>l.p.id!==id))
    setCart(c => {
      const line = c.find(l=>l.p.id===id)
      if (line && qty > line.qty && !line.p.isBundle) notifyStock(line.p)
      return c?.map(l=>l.p.id===id?{...l,qty}:l)
    })
  }

  const checkout = () => {
    if (!cart.length) return
    if (splitOn && !Number(splitAmount)) { toast({ title: 'Isi nominal split dulu', variant: 'destructive' }); return }
    if (splitOn && Number(splitAmount) > total) { toast({ title: 'Nominal split melebihi total', variant: 'destructive' }); return }
    // kurangi stok
    const products = db.products?.map(p => {
      const line = cart.find(l=>l.p.id===p.id)
      return line ? {...p, stock: p.stock - line.qty} : p
    })
    // bundle: kurangi stok komponen
    let prods = products
    cart.filter(l=>l.p.isBundle).forEach(l => {
      prods = prods?.map(p => {
        const comp = l.p.items?.find(i=>i.productId===p.id)
        return comp ? {...p, stock: p.stock - comp.qty*l.qty} : p
      })
    })
    // toast stok habis setelah checkout
    prods.filter(p => p.stock === 0 && db.products.find(x=>x.id===p.id)?.stock > 0).forEach(p => {
      toast({ title: `Stok ${p.name} habis`, variant: 'destructive' })
    })
    const tx = {
      id: uid('t'), date: new Date().toISOString(),
      items: cart?.map(l=>({name:l.p.name, qty:l.qty, price:effPrice(l.p), disc:l.p.discount||0})),
      sub, disc, tax, total, method: splitOn ? 'split' : method,
    }
    // split: catat 2 baris pembayaran; selain itu 1 baris
    let pays
    if (splitOn) {
      const sAmt = Number(splitAmount)
      const rest = total - sAmt
      pays = [
        { txId: tx.id, method: method, paid: sAmt, split: true },
        { txId: tx.id, method: splitMethod, paid: rest, split: true },
      ]
      if (method === 'cash') pays[0].change = Math.max(0, (Number(paid)||0) - sAmt)
      if (splitMethod === 'cash') pays[1].change = Math.max(0, (Number(paid)||0) - rest)
    } else {
      pays = [{ txId: tx.id, method, paid: Number(paid)||total, change: method==='cash' ? change : 0 }]
    }
    const db2 = {...db, products: prods, txs: [...db.txs, tx], payments: [...db.payments, ...pays]}
    saveDB(db2); setDb(db2)
    setDone({tx, change, paid: splitOn ? total : (Number(paid)||total), split: splitOn ? {method: splitMethod, amount: Number(splitAmount), rest: total - Number(splitAmount)} : null})
    setCart([]); setPaid(''); setSplitAmount(''); setSplitOn(false)
    toast({ title: 'Transaksi berhasil', description: splitOn ? `${rp(total)} · split ${method} + ${splitMethod}` : `${tx.items.length} item · ${rp(total)}` })
  }
  const newSale = () => setDone(null)

  if (done) return (
    <div className="p-4 md:p-7 max-w-lg mx-auto text-center">
      <div className="card p-8">
        <Icon as={CheckCircle2} size="lg" className="text-lime mx-auto mb-3" strokeWidth={1.5} style={{width:40, height:40}} />
        <h1 className="font-disp text-xl font-extrabold mb-1">Transaksi berhasil</h1>
        <p className="text-inksoft text-[13px] mb-5">{done.tx.items.length} item · {done.split ? 'SPLIT' : done.tx.method.toUpperCase()}</p>
        <div className="card2 p-4 text-left text-[13.5px] space-y-1.5 mb-5">
          {done.tx.items?.map((i,idx)=>(
            <div key={idx} className="flex justify-between"><span>{i.qty}× {i.name}{i.disc?` (-${i.disc}%)`:''}</span><b>{rp(i.price*i.qty)}</b></div>
          ))}
          <div className="flex justify-between border-t border-line pt-2"><span>Subtotal</span><span>{rp(done.tx.sub)}</span></div>
          {done.tx.tax>0 && <div className="flex justify-between"><span>PPN 11%</span><span>{rp(done.tx.tax)}</span></div>}
          <div className="flex justify-between font-bold text-[15px]"><span>Total</span><span className="text-hero">{rp(done.tx.total)}</span></div>
          {done.split ? (
            <>
              <div className="border-t border-line mt-2 pt-2 space-y-1">
                <div className="flex justify-between text-inksoft"><span>{METHODS.find(([k])=>k===done.split.baseMethod)?.[1] || done.tx.method}</span><b>{rp(done.split.amount)}</b></div>
                <div className="flex justify-between text-inksoft"><span>{METHODS.find(([k])=>k===done.split.method)?.[1] || done.split.method}</span><b>{rp(done.split.rest)}</b></div>
              </div>
              {(done.split.baseMethod === 'cash' || done.split.method === 'cash') && (<>
                <div className="flex justify-between text-inksoft mt-2"><span>Bayar tunai</span><b>{rp(done.paid)}</b></div>
                {done.change > 0 && <div className="flex justify-between"><span>Kembalian</span><b className="text-lime">{rp(done.change)}</b></div>}
              </>)}
            </>
          ) : (
            <>
              <div className="flex justify-between text-inksoft"><span>Bayar ({done.tx.method})</span><span>{rp(done.paid)}</span></div>
              {done.tx.method==='cash' && <div className="flex justify-between"><span>Kembalian</span><b className="text-lime">{rp(done.change)}</b></div>}
            </>
          )}
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
            <Input className="mb-0 h-10 pl-9" placeholder="Cari produk… atau scan" value={q} onChange={e=>setQ(e.target.value)}/>
            <button onClick={()=>setScanning(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded" title="Scan Barcode">
              <Icon as={ScanBarcode} size="sm"/>
            </button>
          </div>
          {scanning && (
            <BarcodeScannerModal onScan={handleScan} onClose={()=>setScanning(false)}/>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {list?.map(p => {
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
          {cart?.map(l => (
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
              {METHODS?.map(([k,label,Ic])=>(
                <button key={k} onClick={()=>setMethod(k)}
                  className={'rounded-xl py-2 flex flex-col items-center gap-1 text-[10.5px] font-semibold '+(method===k?'bg-hero text-white':'bg-card2 text-inksoft')}>
                  <Icon as={Ic} size="sm" strokeWidth={1.5}/>{label}
                </button>
              ))}
            </div>
            {method==='cash' && !splitOn && <>
              <Input className="mt-2.5" type="number" placeholder="Uang diterima" value={paid} onChange={e=>setPaid(e.target.value)}/>
              {Number(paid)>0 && <div className="text-right text-[12.5px] mt-1">Kembalian: <b className={(change>=0?'text-lime':'text-coral')}>{rp(Math.abs(change))}{change<0?' kurang':''}</b></div>}
            </>}
            {/* Split payment */}
            <div className="mt-2.5 p-3 card2 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-inksoft flex items-center gap-1.5">
                  <input type="checkbox" checked={splitOn} onChange={e=>setSplitOn(e.target.checked)} className="accent-[#2563EB] w-4 h-4"/>
                  Split pembayaran (2 metode)
                </label>
                <span className="text-[11px] text-dim">sisa {rp(splitRest)}</span>
              </div>
              {splitOn && <>
                <div className="grid grid-cols-2 gap-2">
                  <select value={splitMethod} onChange={e=>setSplitMethod(e.target.value)}
                    className="w-full p-2 border border-line rounded-lg text-[12.5px] bg-white">
                    {METHODS.filter(([k])=>k!==method)?.map(([k,label])=>
                      <option key={k} value={k}>{label}</option>)}
                  </select>
                  <Input type="number" placeholder="Nominal " value={splitAmount} onChange={e=>setSplitAmount(e.target.value)} className="text-[12.5px]"/>
                </div>
                <div className="text-[11.5px] text-inksoft space-y-0.5">
                  <div className="flex justify-between"><span>Metode 1: {METHODS.find(([k])=>k===method)?.[1]}</span><b>{rp(splitAmount||0)}</b></div>
                  <div className="flex justify-between"><span>Metode 2: {METHODS.find(([k])=>k===splitMethod)?.[1]}</span><b>{rp(splitRest)}</b></div>
                </div>
                {(method==='cash' || splitMethod==='cash') && (
                  <Input type="number" placeholder="Uang tunai diterima" value={paid} onChange={e=>setPaid(e.target.value)}/>
                )}
              </>}
            </div>
            <Button onClick={checkout} disabled={!paidValid}
              className="w-full h-12 mt-3 text-[14px] gap-2">
              <Icon as={CreditCard} size="md" /> Bayar {rp(total)}
            </Button>
          </>}
        </div>
      </div>
    </div>
  )
}
