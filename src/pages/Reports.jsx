import { loadDB, rp } from '../lib/store.js'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  if (hasError) return fallback || <div className="card p-6 text-center text-muted-foreground">Terjadi kesalahan saat menampilkan laporan: {errorMsg}</div>
  return children
}

export default function Reports() {
  let db = null;
  try { db = loadDB(); } catch(e) { return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-display text-lg md:text-xl font-extrabold mb-5">Laporan</h1>
      <div className="card p-6 text-center text-muted-foreground">{e.message}</div>
    </div>
  )}
  try {
    const income = (db.txs||[]).reduce((s,t)=>s+(t.total||0),0)
    const expense = (db.expenses||[]).reduce((s,x)=>s+(x.amount||0),0)
    const unpaid = (db.invoices||[]).filter(i=>i.status!=='Dibayar').reduce((s,i)=>s+(i.total||0),0)
    // produk terjual
    const sold = {}
    (db.txs||[]).forEach(t=>(t.items||[]).forEach(i=>{ sold[i.name]=(sold[i.name]||0)+(i.qty||0) }))
    const best = Object.entries(sold).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,qty])=>({name:name.split(' ')[0], qty}))
    // hadir hari ini
    const today = new Date().toDateString()
    const present = (db.attendance||[]).filter(a=>a.in && new Date(a.in).toDateString()===today).length
    return (
      <div className="p-4 md:p-7 max-w-6xl mx-auto">
        <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Laporan</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="card p-4"><div className="text-muted-foreground text-[11.5px] font-semibold uppercase">Pendapatan</div><div className="font-disp font-extrabold text-emerald-600 text-lg mt-1">{rp(income)}</div></div>
          <div className="card p-4"><div className="text-muted-foreground text-[11.5px] font-semibold uppercase">Pengeluaran</div><div className="font-disp font-extrabold text-red-600 text-lg mt-1">{rp(expense)}</div></div>
          <div className="card p-4"><div className="text-muted-foreground text-[11.5px] font-semibold uppercase">Laba kas</div><div className="font-disp font-extrabold text-lg mt-1">{rp(income-expense)}</div></div>
          <div className="card p-4"><div className="text-muted-foreground text-[11.5px] font-semibold uppercase">Piutang</div><div className="font-disp font-extrabold text-amber-600 text-lg mt-1">{rp(unpaid)}</div></div>
        </div>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5">
          <div className="card p-5">
            <h3 className="font-disp font-bold text-[14.5px] mb-3">Produk terlaris</h3>
            {best.length===0 ? <p className="text-muted-foreground text-[13px]">Belum ada penjualan.</p> :
            <ErrorBoundary fallback={<div className="h-[210px] grid place-items-center text-muted-foreground text-[12px]">Grafik tidak tersedia</div>}>\
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={best}><CartesianGrid strokeDasharray="3 3" stroke="#E3EAF3"/><XAxis dataKey="name" fontSize={11} stroke="#94A3B8"/><Tooltip/><Bar dataKey="qty" fill="#0891C2" radius={[6,6,0,0]}/></BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>}
          </div>
          <div className="card p-5">
            <h3 className="font-disp font-bold text-[14.5px] mb-3">Kehadiran hari ini</h3>
            <div className="font-disp font-extrabold text-3xl">{present}<span className="text-muted-foreground text-base font-semibold"> / {(db.employees||[]).length} pegawai</span></div>
            <div className="mt-3">
              {(db.employees||[]).map(e=>{
                const a = (db.attendance||[]).find(x=>x.empId===e.id && x.in && new Date(x.in).toDateString()===today)
                return <div key={e.id} className="flex items-center gap-2.5 py-1.5 text-[13px]">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-[10px] font-bold">{(e.name||'').slice(0,2).toUpperCase()}</span>
                  {e.name}{a ? <span className="ml-auto pill bg-green-100 text-green-700">Hadir</span> : <span className="ml-auto pill bg-yellow-100 text-yellow-700">Absen</span>}
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    )
  } catch(err) {
    console.error('Reports error:', err)
    return <div className="p-4 md:p-7 max-w-6xl mx-auto"><div className="card p-6 text-center text-muted-foreground">Terjadi kesalahan saat memuat data laporan: {err.message}</div></div>
  }
}