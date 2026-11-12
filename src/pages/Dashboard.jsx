import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadDB, rp } from '../lib/store.js'
import { getLowStock, getOutOfStock } from '../lib/stock.js'
import { summarize, rpShort } from '../lib/report.js'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Banknote, TrendingUp, ReceiptText, PackageX, Package, Users, ShoppingCart,
  TriangleAlert, Plus, ArrowRight, ArrowUp, ArrowDown, Wallet, BarChart3,
} from 'lucide-react'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'

export default function Dashboard() {
  const [db, setDb] = useState(null)
  useEffect(() => { setDb(loadDB()) }, [])
  if (!db) return null

  const sales = db.txs.reduce((s,t)=>s+t.total,0)
  const unpaid = db.invoices.filter(i=>i.status!=='Dibayar').reduce((s,i)=>s+i.total,0)
  const low = getLowStock(db.products)
  const out = getOutOfStock(db.products)
  const lowAll = [...out, ...low]
  const week = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d,i)=>({d, v: [4.2,6.1,3.8,8.0,9.5,7.0,5.2][i]}))
  const growth = '+12,4%'

  // Laporan ringkas — periode hari & minggu, dihitung on-render
  const today = summarize(db.txs, db.expenses, 'day')
  const thisWeek = summarize(db.txs, db.expenses, 'week')
  const growthDelta = today.deltaVsKemarin

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* HERO: kartu portfolio ala FinPoint */}
      <div className="bg-white border border-line rounded-3xl p-5 md:p-7 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div>
            <div className="text-[12px] text-inksoft font-semibold uppercase tracking-wider">Total Laba Bersih</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-disp text-3xl md:text-4xl font-extrabold text-ink">{rp(sales)}</span>
              <Badge variant="success"><Icon as={ArrowUp} size="sm" strokeWidth={1.5}/> {growth}</Badge>
            </div>
          </div>
          <Button asChild className="ml-auto">
            <Link to="/pos" className="flex items-center gap-2"><Icon as={ShoppingCart} size="md" /> Buka Kasir</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Mini icon={Banknote} color="#2563EB" label="Penjualan" value={rp(sales)} note={`${db.txs.length} transaksi`} />
          <Mini icon={ReceiptText} color="#EAB308" label="Belum dibayar" value={rp(unpaid)} note={`${db.invoices.filter(i=>i.status!=='Dibayar').length} invoice`} />
          <Mini icon={PackageX} color="#EF4444" label="Stok menipis" value={`${lowAll.length} produk`} note={lowAll[0]?.name||'Aman semua'} />
          <Mini icon={Users} color="#22C55E" label="Pelanggan" value={`${db.customers.length}`} note="terdaftar" />
        </div>
      </div>

      {/* LAPORAN RINGKAS: omzet / laba kotor / transaksi hari & minggu ini */}
      <div className="bg-white border border-line rounded-3xl p-5 md:p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Icon as={BarChart3} size="lg" className="text-hero" />
            <h3 className="font-disp font-bold text-[15px]">Laporan Ringkas</h3>
          </div>
          <span className="ml-auto text-[12px] text-inksoft">Minggu ini: <b className="text-ink">{rpShort(thisWeek.omzet)}</b></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat icon={Banknote} label="Pendapatan hari ini" value={rpShort(today.omzet)} title={rp(today.omzet)}
            note={growthDelta === null ? `${today.jumlahTransaksi} transaksi`
              : <span className={'inline-flex items-center gap-1 font-semibold ' + (growthDelta >= 0 ? 'text-lime' : 'text-coral')}>
                  <Icon as={growthDelta >= 0 ? ArrowUp : ArrowDown} size="sm" strokeWidth={1.5}/> {Math.abs(growthDelta)}% vs kemarin
                </span>} />
          <Stat icon={TrendingUp} label="Laba kotor hari ini" value={rpShort(today.labaKotor)} title={rp(today.labaKotor)} note={`${rpShort(thisWeek.labaKotor)} minggu ini`} />
          <Stat icon={ReceiptText} label="Transaksi hari ini" value={String(today.jumlahTransaksi)} title={`${today.itemTerjual} item terjual`} note={`${today.itemTerjual} item terjual`} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-inksoft">
          <span className="inline-flex items-center gap-1.5"><Icon as={Wallet} size="sm" strokeWidth={1.5}/> Pengeluaran hari ini: {rp(today.pengeluaran)}</span>
          <span className="font-bold text-hero">Laba bersih: {rp(today.labaBersih)}</span>
          <Link to="/laporan" className="ml-auto inline-flex items-center gap-1.5 text-inksoft hover:text-ink">Laporan lengkap <Icon as={ArrowRight} size="sm" strokeWidth={1.5}/></Link>
        </div>
      </div>

      {/* NOTIFIKASI STOK MENIPIS */}
      <div className="bg-white border border-line rounded-3xl p-5 md:p-6 shadow-soft">
        <div className="flex items-center gap-2.5 mb-3">
          <Icon as={PackageX} size="lg" className="text-coral" />
          <h3 className="font-disp font-bold text-[15px]">Stok Menipis</h3>
          {lowAll.length > 0 && <span className="bg-gold-soft text-gold text-[11px] font-bold px-2 py-0.5 rounded-full">{lowAll.length}</span>}
          <Button asChild size="sm" variant="outline" className="ml-auto rounded-full">
            <Link to="/inventori" className="flex items-center gap-1.5"><Icon as={Plus} size="sm" strokeWidth={1.5}/> Restock</Link>
          </Button>
        </div>
        {lowAll.length === 0 && <p className="text-inksoft text-[13px] flex items-center gap-2"><Icon as={TriangleAlert} size="md" strokeWidth={1.5}/> Semua stok aman.</p>}
        {lowAll.slice(0,5).map(p => {
          const habis = p.stock === 0
          const pct = Math.min(100, p.minStock ? Math.round((p.stock / p.minStock) * 100) : 100)
          return (
            <div key={p.id} className="py-2.5 border-b border-line last:border-0">
              <div className="flex items-center gap-2.5 text-[13px]">
                <Icon as={Package} size="md" className={habis ? 'text-coral' : 'text-gold'} />
                <b className="truncate">{p.name}</b>
                <span className="ml-auto text-inksoft text-[11.5px]">{p.stock} / min {p.minStock}</span>
                {habis
                  ? <Badge variant="destructive" className="gap-1"><Icon as={TriangleAlert} size="sm" strokeWidth={1.5}/> Habis</Badge>
                  : <span className="bg-gold-soft text-gold text-[11px] font-semibold px-2 py-0.5 rounded-full">Menipis</span>}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-card2 overflow-hidden">
                <div className={'h-full rounded-full ' + (habis ? 'bg-coral' : 'bg-gold')} style={{width: Math.max(pct, 4) + '%'}} />
              </div>
            </div>
          )
        })}
        {lowAll.length > 5 && <Link to="/inventori" className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-inksoft hover:text-ink">Lihat semua ({lowAll.length}) <Icon as={ArrowRight} size="sm" strokeWidth={1.5}/></Link>}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Grafik area oranye */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-disp font-bold text-[15px]">Kinerja penjualan mingguan</h3>
            <div className="hidden md:flex gap-1 bg-card2 rounded-full p-1">
              {['1H','1Hr','1M','1B'].map((t,i)=>(<button key={t} className={'px-3 py-1 rounded-full text-[11px] font-semibold '+(i===3?'bg-hero text-white':'text-inksoft')}>{t}</button>))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={week}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4}/><stop offset="100%" stopColor="#2563EB" stopOpacity={0.02}/>
              </linearGradient></defs>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} stroke="#9AA1AD"/>
              <Tooltip contentStyle={{background:'#fff',border:'1px solid #E6E9F0',borderRadius:12,color:'#10131A',fontSize:12}}/>
              <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2.5} fill="url(#g)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Watchlist stok ala FinPoint */}
        <div className="card p-5 md:p-6">
          <h3 className="font-disp font-bold text-[15px] mb-3">Stok pantauan</h3>
          {lowAll.length===0 && <p className="text-inksoft text-[13px]">Semua stok aman.</p>}
          {lowAll.slice(0,5).map(p => (
            <div key={p.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
              <span className="w-10 h-10 rounded-full bg-card2 grid place-items-center"><Icon as={Package} size="md" /></span>
              <div className="min-w-0"><b className="text-[13.5px] block truncate">{p.name}</b><div className="text-[11.5px] text-inksoft">sisa {p.stock} · min {p.minStock}</div></div>
              <span className="ml-auto pill bg-coral-soft text-coral">Restock</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function Mini({icon, color, label, value, note}) {
  return <div className="bg-card2 rounded-2xl p-4 border-l-[3px]" style={{borderColor:color}}>
    <div className="flex items-center gap-1.5 text-[11px] text-inksoft font-semibold"><Icon as={icon} size="sm" strokeWidth={1.5}/> {label}</div>
    <div className="font-disp text-[17px] md:text-[19px] font-extrabold mt-1 leading-tight">{value}</div>
    <div className="text-[11px] text-dim truncate mt-0.5">{note}</div>
  </div>
}
function Stat({icon, label, value, note, title}) {
  return <div className="bg-card2 rounded-2xl p-4">
    <div className="flex items-center gap-1.5 text-[11px] text-inksoft font-semibold"><Icon as={icon} size="sm" strokeWidth={1.5}/> {label}</div>
    <div className="font-disp text-[20px] md:text-[22px] font-extrabold mt-1 leading-tight" title={title}>{value}</div>
    <div className="text-[11px] text-dim truncate mt-0.5">{note}</div>
  </div>
}
export function Card({title, children}) {
  return (
    <ShadCard>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </ShadCard>
  )
}
