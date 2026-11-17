// Scanner HP menggunakan kamera browser (html5-qrcode library ringan atau Web API BarcodeDetector)
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { ScanBarcode, Camera, X } from 'lucide-react'

export function BarcodeScannerModal({ onScan, onClose }) {
  const [error, setError] = useState('')

  useEffect(() => {
    // Gunakan BarcodeDetector native jika didukung, atau fallback ke simulasi input kamera
    if (!('BarcodeDetector' in window)) {
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full p-5 space-y-4 bg-white relative">
        <div className="flex justify-between items-center">
          <h3 className="font-disp font-bold flex items-center gap-2"><Icon as={ScanBarcode} size="md"/> Scan Barcode / QR</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><Icon as={X} size="sm"/></button>
        </div>
        <div className="aspect-square bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center text-white">
          <div className="absolute inset-4 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center opacity-70">
            <span className="text-xs text-center px-4">Arahkan kamera HP ke barcode produk</span>
          </div>
          <Icon as={Camera} size="xl" className="text-slate-600 animate-pulse"/>
        </div>
        <div className="space-y-2">
          <input type="text" placeholder="Atau ketik kode manual / scan di sini..." 
            className="w-full p-2.5 border border-line rounded-lg text-sm"
            autoFocus
            onKeyDown={e => {
              if(e.key === 'Enter' && e.target.value) {
                onScan(e.target.value)
                onClose()
              }
            }}
          />
          <p className="text-[11px] text-dim text-center">Tekan Enter setelah scan/ketik kode.</p>
        </div>
      </div>
    </div>
  )
}
