// Halaman Stock Opname (Vercel) — input stok fisik & koreksi otomatis.
import { useState } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Icon } from '../components/ui/icon.jsx'
import { ClipboardList, Check, Scale, AlertTriangle } from 'lucide-react'
import { toast } from '../components/ui/use-toast.jsx'

export default function StockOpname() {
  const [db, setDb] = useState(loadDB())
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState({})
  const [saving, setSaving] = useState(false)

  const handleEntry = (productId, physicalStock) => {
    setEntries(prev => ({ ...prev, [productId]: physicalStock }))
  }

  const calculateDiff = (productId) => {
    const product = db.products.find(p => p.id === productId)
    if (!product) return 0
    const physical = parseInt(entries[productId]) || 0
    return physical - product.stock
  }

  const saveOpname = () => {
    setSaving(true)
    const opnameRecords = Object.entries(entries).map(([productId, physicalStock]) => {
      const product = db.products.find(p => p.id === productId)
      if (!product) return null
      return {
        id: 'op' + Date.now() + Math.random().toString(36).slice(2,6),
        date: opnameDate,
        productId,
        productName: product.name,
        systemStock: product.stock,
        physicalStock: parseInt(physicalStock) || 0,
        diff: (parseInt(physicalStock) || 0) - product.stock,
        status: 'applied'
      }
    }).filter(r => r)

    if (opnameRecords.length === 0) {
      toast({ title: 'Tidak ada item yang diinput' })
      setSaving(false)
      return
    }

    const updatedProducts = db.products.map(p => {
      const entry = entries[p.id]
      if (entry === undefined || entry === null) return p
      return { ...p, stock: parseInt(entry) || 0 }
    })

    const nextDb = {
      ...db,
      products: updatedProducts,
      opname: [...(db.opname || []), ...opnameRecords]
    }
    saveDB(nextDb)
    setDb(nextDb)
    setEntries({})
    setSaving(false)
    toast({ title: `Stock opname berhasil disimpan! ${opnameRecords.length} item terkoreksi.` })
  }

  return (
    <div className="p-4 md:p-7 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon as={ClipboardList} size="lg" className="text-hero" />
        <div>
          <h1 className="font-disp text-lg md:text-xl font-extrabold">Stock Opname</h1>
          <p className="text-[12px] text-muted">Hitung fisik stok & koreksi selisihnya secara manual.</p>
        </div>
      </div>

      <Card className="card mb-4">
        <CardHeader>
          <CardTitle>Tanggal Opname</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="date" value={opnameDate} onChange={e => setOpnameDate(e.target.value)} className="bg-white border border-line rounded-xl px-3.5 py-2 text-[14px]" />
        </CardContent>
      </Card>

      <Card className="card mb-4">
        <CardHeader>
          <CardTitle>Input Stok Fisik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {db.products.map(p => {
              const diff = calculateDiff(p.id)
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <div className="flex-1">
                    <b className="text-[14px]">{p.name}</b>
                    <div className="text-[12px] text-muted">Sistem: {p.stock}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Fisik"
                      value={entries[p.id] ?? ''}
                      onChange={e => handleEntry(p.id, e.target.value)}
                      className="w-24 bg-white border border-line rounded-xl px-3 py-1.5 text-right text-[13px]"
                    />
                    {entries[p.id] !== undefined && (
                      <span className={`pill text-[11px] font-bold px-2.5 py-1 ${diff === 0 ? 'bg-emerald-50 text-emerald-700' : diff > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 mb-6">
        <Button onClick={saveOpname} disabled={saving} className="gap-2">
          <Icon as={saving ? 'RefreshCw' : Check} size="md" className={saving ? 'animate-spin' : ''} />
          Simpan & Koreksi Stok
        </Button>
      </div>

      <Card className="card">
        <CardHeader>
          <CardTitle>Riwayat Opname Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {(!db.opname || db.opname.length === 0) ? (
            <p className="text-[13px] text-muted">Belum ada riwayat stock opname.</p>
          ) : (
            <div className="space-y-2">
              {[...(db.opname || [])].reverse().slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <div>
                    <b className="text-[13px]">{r.productName}</b>
                    <span className="text-[11px] text-muted block">Sistem: {r.systemStock} → Fisik: {r.physicalStock}</span>
                  </div>
                  <span className={`text-[12px] font-bold ${r.diff === 0 ? 'text-muted' : r.diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {r.diff > 0 ? '+' : ''}{r.diff}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}