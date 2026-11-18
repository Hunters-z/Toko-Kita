// Halaman Stock Opname (Vercel) — input stok fisik & koreksi otomatis + scan barcode.
import { useState, useMemo } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Icon } from '../components/ui/icon.jsx'
import { ClipboardList, Check, Scale, AlertTriangle, ScanBarcode, X, Smartphone, Layers, Plus, Trash2, Search } from 'lucide-react'
import { toast } from '../components/ui/use-toast.jsx'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.jsx'

// ZONA: kosong saat baru masuk; hanya muncul bila user membuat zona
const DEFAULT_ZONES = []

export default function StockOpname() {
  const [db, setDb] = useState(loadDB())
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState({})
  const [zones, setZones] = useState(DEFAULT_ZONES)
  const [activeZone, setActiveZone] = useState('')
  const [customZone, setCustomZone] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanCode, setScanCode] = useState('')

  const addZone = () => {
    const z = customZone.trim()
    if (z && !zones.includes(z)) {
      setZones(prev => [...prev, z])
      setActiveZone(z)
      setCustomZone('')
    }
  }

  const handleEntry = (productId, physicalStock, zone = activeZone) => {
    setEntries(prev => ({ ...prev, [productId]: { physicalStock, zone } }))
  }

  const handleScan = (code) => {
    const p = db.products.find(x => x.barcode === code || x.code === code || x.sku === code)
    if (p) {
      handleEntry(p.id, '', activeZone)
      toast({ title: 'Produk ditemukan', description: `${p.name} — masukkan stok fisik` })
    } else {
      toast({ title: 'Produk tidak ditemukan', description: `Kode: ${code}`, variant: 'destructive' })
    }
    setScanning(false)
  }

  // Filter produk: hanya yang ada di zon aktif atau semua
  const filteredProducts = useMemo(() => {
    if (!activeZone) return db.products
    // jika zon ada, tampilkan produk yang masih belum diinput / sudah diinput
    return db.products.filter(p => !entries[p.id] || entries[p.id]?.zone === activeZone || Object.keys(entries).length === 0 || !entries[p.id]?.zone)
  }, [db.products, activeZone, entries])

  const searchFiltered = useMemo(() => {
    if (!search) return filteredProducts
    const q = search.toLowerCase()
    return filteredProducts.filter(p => p.name.toLowerCase().includes(q) || p.barcode?.includes(q) || p.code?.includes(q))
  }, [filteredProducts, search])

  const calculateDiff = (productId, physicalStock) => {
    const product = db.products.find(p => p.id === productId)
    if (!product) return 0
    const physical = parseInt(physicalStock) || 0
    return physical - product.stock
  }

  const saveOpname = () => {
    setSaving(true)
    const opnameRecords = Object.entries(entries).map(([productId, data]) => {
      const product = db.products.find(p => p.id === productId)
      if (!product) return null
      const physicalStock = parseInt(data.physicalStock) || 0
      return {
        id: 'op' + Date.now() + Math.random().toString(36).slice(2,6),
        date: opnameDate,
        productId,
        productName: product.name,
        systemStock: product.stock,
        physicalStock,
        diff: physicalStock - product.stock,
        zone: data.zone || 'Tanpa Zon',
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
      if (!entry) return p
      return { ...p, stock: parseInt(entry.physicalStock) || 0 }
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
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <Icon as={ClipboardList} size="lg" className="text-hero" />
        <div>
          <h1 className="font-disp text-lg md:text-xl font-extrabold">Stock Opname</h1>
          <p className="text-[12px] text-muted">Hitung fisik stok & koreksi selisihnya per zona.</p>
        </div>
        <Button size="sm" variant="outline" onClick={()=>setScanning(true)} className="ml-auto flex items-center gap-2">
          <Icon as={ScanBarcode} size="md"/> Scan Barcode
        </Button>
      </div>

      {scanning && (
        <BarcodeScannerModal onScan={handleScan} onClose={()=>setScanning(false)}/>
      )}

      <Card className="card mb-4">
        <CardHeader>
          <CardTitle>Tanggal & Zona Opname</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="date" value={opnameDate} onChange={e => setOpnameDate(e.target.value)} className="bg-white border border-line rounded-xl px-3.5 py-2 text-[14px] w-full sm:w-48" />
          
          {/* Zona sism rack */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={()=>setActiveZone('')} className={`pill px-3 py-1.5 text-[12px] font-medium transition-colors ${activeZone===''?'bg-hero text-white':'bg-card2 text-inksoft'}`}>Semua Zona</button>
            {zones.map(z => (
              <button key={z} onClick={()=>setActiveZone(z)} className={`pill px-3 py-1.5 text-[12px] font-medium transition-colors ${activeZone===z?'bg-hero text-white':'bg-card2 text-inksoft'}`}>{z}</button>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <input 
                type="text" 
                placeholder="Zona baru…" 
                value={customZone}
                onChange={e=>setCustomZone(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addZone()}
                className="bg-white border border-line rounded-lg px-2.5 py-1 text-[12px] w-32"
              />
              <Button size="sm" variant="ghost" onClick={addZone} className="h-8 w-8 p-0"><Icon as={Plus} size="xs"/></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeZone && (
        <div className="card p-3 mb-4 flex items-center justify-between">
          <div className="text-[13px] font-medium text-inksoft flex items-center gap-1.5">
            <Icon as={Layers} size="sm" className="text-hero"/> Menampilkan zona: <b className="text-ink">{activeZone}</b>
          </div>
          <button onClick={()=>setActiveZone('')} className="text-[11.5px] text-coral font-medium flex items-center gap-1">
            <Icon as={X} size="xs"/> Reset zon
          </button>
        </div>
      )}

      <Card className="card mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Input Stok Fisik</CardTitle>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-inksoft"><Icon as={Search} size="xs"/></span>
              <input 
                type="text" 
                placeholder="Cari produk…" 
                value={search}
                onChange={e=>setSearch(e.target.value)}
                className="bg-card2 border border-line rounded-lg pl-7 pr-3 py-1.5 text-[12px] w-44"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {searchFiltered.length===0 ? <p className="text-inksoft text-[13px]">Produk tidak ditemukan.</p> :
            searchFiltered.map(p => {
              const entry = entries[p.id]
              const physicalStock = entry?.physicalStock ?? ''
              const diff = entry ? calculateDiff(p.id, entry.physicalStock) : null
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <div className="flex-1 min-w-0">
                    <b className="text-[14px] truncate block">{p.name}</b>
                    <div className="text-[12px] text-muted">Sistem: {p.stock} {p.barcode ? ` · ${p.barcode}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="number"
                      min="0"
                      placeholder="Fisik"
                      value={physicalStock}
                      onChange={e => handleEntry(p.id, e.target.value, activeZone)}
                      className="w-20 bg-white border border-line rounded-xl px-3 py-1.5 text-right text-[13px]"
                    />
                    {diff !== null && (
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
          Simpan & Koreksi Stok ({Object.keys(entries).length} item)
        </Button>
        {Object.keys(entries).length>0 && (
          <Button variant="ghost" size="sm" onClick={()=>setEntries({})} className="text-coral">
            <Icon as={Trash2} size="sm"/> Hapus input
          </Button>
        )}
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
                    <span className="text-[11px] text-muted block">
                      {r.zone} · Sistem: {r.systemStock} → Fisik: {r.physicalStock}
                    </span>
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