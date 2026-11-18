// Scanner Barcode menggunakan Kamera HP (Real Camera Video Stream via getUserMedia + Canvas/BarcodeDetector)
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { ScanBarcode, Camera, X, RefreshCw, AlertCircle } from 'lucide-react'

export function BarcodeScannerModal({ onScan, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const [facingMode, setFacingMode] = useState('environment') // kamera belakang HP
  const streamRef = useRef(null)
  const activeRef = useRef(true)

  const startCamera = async () => {
    setError('')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Kamera tidak didukung pada browser ini.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Deteksi Barcode jika didukung
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        })
        const scanFrame = async () => {
          if (!activeRef.current || !videoRef.current) return
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue
                onScan(code)
                stopCamera()
                onClose()
                return
              }
            }
          } catch (err) {
            // ignore frame error
          }
          if (activeRef.current) {
            requestAnimationFrame(scanFrame)
          }
        }
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      console.error("Camera access error:", err)
      setError('Izin kamera ditolak atau kamera tidak ditemukan. Gunakan input manual di bawah.')
    }
  }

  const stopCamera = () => {
    activeRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    activeRef.current = true
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manual.trim()) {
      onScan(manual.trim())
      stopCamera()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="card max-w-sm w-full p-5 space-y-4 bg-white relative rounded-2xl shadow-pop">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <h3 className="font-disp font-bold text-sm flex items-center gap-2 text-ink">
            <Icon as={ScanBarcode} size="md" className="text-hero"/> Scan Barcode Kamera
          </h3>
          <button onClick={() => { stopCamera(); onClose() }} className="p-1 rounded-full hover:bg-card2 text-inksoft hover:text-ink">
            <Icon as={X} size="sm"/>
          </button>
        </div>

        {/* Camera Preview Area */}
        <div className="aspect-square bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-center text-white border border-line">
          {error ? (
            <div className="p-4 text-center space-y-2">
              <Icon as={AlertCircle} size="xl" className="text-coral mx-auto"/>
              <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-6 border-2 border-dashed border-hero rounded-lg flex flex-col items-center justify-between p-3 pointer-events-none">
                <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-medium">Arahkan Barcode ke Kotak Ini</span>
                <div className="w-full h-0.5 bg-hero/80 animate-pulse shadow-glow"/>
                <span className="text-[9px] text-slate-300">Auto Scan Aktif</span>
              </div>
              <button 
                onClick={flipCamera} 
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"
                title="Ganti Kamera"
              >
                <Icon as={RefreshCw} size="xs"/>
              </button>
            </>
          )}
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Atau ketik/scan manual..." 
              value={manual}
              onChange={e => setManual(e.target.value)}
              className="flex-1 px-3 py-2 border border-line rounded-xl text-xs bg-card2 focus:outline-none focus:border-hero"
              autoFocus
            />
            <Button type="submit" size="sm" className="rounded-xl text-xs px-3">OK</Button>
          </div>
          <p className="text-[10.5px] text-dim text-center">Mendukung kamera HP Android/iOS & scanner fisik USB/Bluetooth.</p>
        </form>
      </div>
    </div>
  )
}
