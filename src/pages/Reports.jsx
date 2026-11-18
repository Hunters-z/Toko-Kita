import { loadDB, rp } from '../lib/store.js'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)
  if (hasError) return fallback || <div className="card p-6 text-center text-inksoft">Terjadi kesalahan saat menampilkan laporan.</div>
  return children
}

export default function Reports() {
  const [db, setDb] = useState(null)
  useEffect(() => { 
    try { setDb(loadDB()) } catch(e) { setDb(null) }
  }, [])
  if (!db) return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">Laporan</h1>
      <div className="card p-6 text-center">
        <div className="text-inksoft text-[14px] mb-2">Mengambil data...</div>
      </div>
    </div>
  )
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
          <div className="card p-4"><div className="text-inksoft text-[11.5px] font-semibold uppercase">Pendapatan</div><div className="font-disp font-extrabold text-emerald-600 text-lg mt-1">{rp(income)}</div></div>
          <div className="card p-4"><div className="text-inksoft text-[11.5px] font-semibold uppercase">Pengeluaran</div><div className="font-disp font-extrabold text-red-600 text-lg mt-1">{rp(expense)}</div></div>
          <div className="card p-4"><div className="text-inksoft text-[11.5px] font-semibold uppercase">Laba kas</div><div className="font-disp font-extrabold text-lg mt-1">{rp(income-expense)}</div></div>
          <div className="card p-4"><div className="text-inksoft text-[11.5px] font-semibold uppercase">Piutang</div><div className="font-disp font-extrabold text-amber-600 text-lg mt-1">{rp(unpaid)}</div></div>
        </div>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5">
          <div className="card p-5">
            <h3 className="font-disp font-bold text-[14.5px] mb-3">Produk terlaris</h3>
            {best.length===0 ? <p className="text-inksoft text-[13px]">Belum ada penjualan.</p> :
            <ErrorBoundary fallback={<div className="h-[210px] grid place-items-center text-inksoft text-[12px]">Grafik tidak tersedia</div>}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={best}><CartesianGrid strokeDasharray="3 3" stroke="#E3EAF3"/><XAxis dataKey="name" fontSize={11} stroke="#94A3B8"/><Tooltip/><Bar dataKey="qty" fill="#0891B2" radius={[6,6,0,0]}/></BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>}
          </div>
          <div className="card p-5">
            <h3 className="font-disp font-bold text-[14.5px] mb-3">Kehadiran hari ini</h3>
            <div className="font-disp font-extrabold text-3xl">{present}<span className="text-inksoft text-base font-semibold"> / {(db.employees||[]).length} pegawai</span></div>
            <div className="mt-3">
              {(db.employees||[]).map(e=>{
                const a = (db.attendance||[]).find(x=>x.empId===e.id && x.in && new Date(x.in).toDateString()===today)
                return <div key={e.id} className="flex items-center gap-2.5 py-1.5 text-[13px]">
                  <span className="w-7 h-7 rounded-full bg-ocean-soft text-ocean-ink grid place-items-center text-[10px] font-bold">{(e.name||'').slice(0,2).toUpperCase()}</span>
                  {e.name}{a ? <span className="ml-auto pill bg-mint-soft text-emerald-700">Hadir</span> : <span className="ml-auto pill bg-amber-soft text-amber-700">Absen</span>}
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    )
  } catch(e) {
    console.error('Reports error:', e)
    return <div className="p-4 md:p-7 max-w-6xl mx-auto"><div className="card p-6 text-center text-coral text-[14px]">Terjadi kesalahan saat memuat data laporan.</div></div>
  }
}