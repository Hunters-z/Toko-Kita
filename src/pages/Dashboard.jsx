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
  const db = loadDB()

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
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* HERO: Total Laba Bersih */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Laba Bersih</div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-display text-3xl md:text-4xl font-bold text-foreground">{rp(sales)}</span>
              <Badge variant="success"><Icon as={ArrowUp} size="sm" /> {growth}</Badge>
            </div>
          </div>
          <Button asChild className="ml-auto">
            <Link to="/pos" className="flex items-center gap-2"><Icon as={ShoppingCart} size="sm" /> Buka Kasir</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Mini icon={Banknote} label="Penjualan" value={rp(sales)} note={`${db.txs.length} transaksi`} />
          <Mini icon={ReceiptText} label="Belum dibayar" value={rp(unpaid)} note={`${db.invoices.filter(i=>i.status!=='Dibayar').length} invoice`} />
          <Mini icon={PackageX} label="Stok menipis" value={`${lowAll.length} produk`} note={lowAll[0]?.name||'Aman semua'} />
          <Mini icon={Users} label="Pelanggan" value={`${db.customers.length}`} note="terdaftar" />
        </div>
      </div>

      {/* LAPORAN RINGKAS */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-display font-semibold text-[15px]">Laporan Ringkas</h3>
          <span className="ml-auto text-[12px] text-muted-foreground">Minggu ini: <b className="text-foreground">{rpShort(thisWeek.omzet)}</b></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat icon={Banknote} label="Pendapatan hari ini" value={rpShort(today.omzet)} title={rp(today.omzet)}
            note={growthDelta === null ? `${today.jumlahTransaksi} transaksi`
              : <span className={'inline-flex items-center gap-1 font-semibold ' + (growthDelta >= 0 ? 'text-lime' : 'text-coral')}>
                  <Icon as={growthDelta >= 0 ? ArrowUp : ArrowDown} size="sm" /> {Math.abs(growthDelta)}% vs kemarin
                </span>} />
          <Stat icon={TrendingUp} label="Laba kotor hari ini" value={rpShort(today.labaKotor)} title={rp(today.labaKotor)} note={`${rpShort(thisWeek.labaKotor)} minggu ini`} />
          <Stat icon={ReceiptText} label="Transaksi hari ini" value={String(today.jumlahTransaksi)} title={`${today.itemTerjual} item terjual`} note={`${today.itemTerjual} item terjual`} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Icon as={Wallet} size="sm" /> Pengeluaran hari ini: {rp(today.pengeluaran)}</span>
          <span className="font-semibold text-foreground">Laba bersih: {rp(today.labaBersih)}</span>
          <Link to="/laporan" className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">Laporan lengkap <Icon as={ArrowRight} size="sm" /></Link>
        </div>
      </div>

      {/* NOTIFIKASI STOK MENIPIS */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-display font-semibold text-[15px]">Stok Menipis</h3>
          {lowAll.length > 0 && <span className="bg-gold-soft text-gold text-[11px] font-semibold px-2.5 py-0.5 rounded-full">{lowAll.length}</span>}
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/inventori" className="flex items-center gap-1.5"><Icon as={Plus} size="sm" /> Restock</Link>
          </Button>
        </div>
        {lowAll.length === 0 && <p className="text-muted-foreground text-[13px] flex items-center gap-2"><Icon as={TriangleAlert} size="sm" /> Semua stok aman.</p>}
        {lowAll.slice(0,5).map(p => {
          const habis = p.stock === 0
          const pct = Math.min(100, p.minStock ? Math.round((p.stock / p.minStock) * 100) : 100)
          return (
            <div key={p.id} className="py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3 text-[13px]">
                <Icon as={Package} size="sm" className={habis ? 'text-coral' : 'text-gold'} />
                <b className="truncate">{p.name}</b>
                <span className="ml-auto text-muted-foreground text-[11.5px]">{p.stock} / min {p.minStock}</span>
                {habis
                  ? <Badge variant="destructive" className="gap-1"><Icon as={TriangleAlert} size="sm" /> Habis</Badge>
                  : <span className="bg-gold-soft text-gold text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Menipis</span>}
              </div>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <div className={'h-full rounded-full ' + (habis ? 'bg-coral' : 'bg-gold')} style={{width: Math.max(pct, 4) + '%'}} />
              </div>
            </div>
          )
        })}
        {lowAll.length > 5 && <Link to="/inventori" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">Lihat semua ({lowAll.length}) <Icon as={ArrowRight} size="sm" /></Link>}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Grafik area */}
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[15px]">Kinerja penjualan mingguan</h3>
            <div className="hidden md:flex gap-1 bg-secondary rounded-lg p-1">
              {['1H','1Hr','1M','1B'].map((t,i)=>(<button key={t} className={'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors '+(i===3?'bg-primary text-primary-foreground':'text-muted-foreground')}>{t}</button>))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={week}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.4}/><stop offset="100%" stopColor="#171717" stopOpacity={0.02}/>
              </linearGradient></defs>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} stroke="#A3A3A3"/>
              <Tooltip contentStyle={{background:'#fff',border:'1px solid #E5E5E5',borderRadius:8,color:'#171717',fontSize:12}}/>
              <Area type="monotone" dataKey="v" stroke="#171717" strokeWidth={2} fill="url(#g)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Watchlist stok */}
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-display font-semibold text-[15px] mb-4">Stok pantauan</h3>
          {lowAll.length===0 && <p className="text-muted-foreground text-[13px]">Semua stok aman.</p>}
          {lowAll.slice(0,5).map(p => (
            <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <span className="w-10 h-10 rounded-lg bg-secondary grid place-items-center"><Icon as={Package} size="sm" /></span>
              <div className="min-w-0"><b className="text-[13.5px] block truncate">{p.name}</b><div className="text-[11.5px] text-muted-foreground">sisa {p.stock} · min {p.minStock}</div></div>
              <span className="ml-auto text-[11px] font-semibold text-coral bg-coral-soft px-2.5 py-0.5 rounded-full">Restock</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function Mini({icon, color, label, value, note}) {
  return <div className="bg-white rounded-xl p-4 border-l-[3px]" style={{borderColor:color}}>
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold"><Icon as={icon} size="sm" strokeWidth={1.5}/> {label}</div>
    <div className="text-[17px] md:text-[19px] font-extrabold mt-1 leading-tight text-foreground">{value}</div>
    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{note}</div>
  </div>
}
function Stat({icon, label, value, note, title}) {
  return <div className="bg-white rounded-xl p-4">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold"><Icon as={icon} size="sm" strokeWidth={1.5}/> {label}</div>
    <div className="text-[20px] md:text-[22px] font-extrabold mt-1 leading-tight text-foreground" title={title}>{value}</div>
    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{note}</div>
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
